# ChatGPT Pro/Plus Codex OAuth Integration Plan

> 작성일: 2025-02-14
> 참고 레포: https://github.com/anomalyco/opencode (codex.ts 플러그인)
> 참고 PR: https://github.com/lazy-hq/aisdk/pull/80 (커스텀 헤더)

## 개요

ChatGPT Pro/Plus 구독을 활용하여 Codex 모델(gpt-5.3-codex 등)을 API key 종량제가 아닌 **구독 포함 무료**로 사용하는 기능.

OpenAI가 Codex CLI용으로 공개한 공식 OAuth 엔드포인트를 활용한다.

## 핵심 정보

### 엔드포인트 & 인증

| 항목 | 값 |
|---|---|
| OAuth Issuer | `https://auth.openai.com` |
| Client ID | `app_EMoamEEZ73f0CkXaXp7hrann` (Codex CLI 공개 ID) |
| Codex API | `https://chatgpt.com/backend-api/codex/responses` |
| 인증 방식 | OAuth 2.0 Authorization Code + PKCE |

### 사용 가능 모델 (Pro/Plus 구독 포함, 비용 $0)

- gpt-5.3-codex
- gpt-5.2-codex
- gpt-5.2
- gpt-5.1-codex
- gpt-5.1-codex-max
- gpt-5.1-codex-mini

### 최종 HTTP 요청 형태

```http
POST https://chatgpt.com/backend-api/codex/responses
Content-Type: application/json
Authorization: Bearer {access_token}
ChatGPT-Account-Id: {account_id}

{ ...일반 OpenAI Responses API body (스키마 동일) }
```

---

## 사전 조건 (aisdk crate 변경)

### 1. 커스텀 헤더 지원 — PR #80 머지 대기

- PR: https://github.com/lazy-hq/aisdk/pull/80
- `LanguageModelRequest::builder().headers(HashMap)` 메서드 추가
- 상태: Draft, 머지 대기 중

### 2. 커스텀 path 지원 — 추가 필요

현재 OpenAI provider의 path가 `/v1/responses`로 하드코딩되어 있음.
Codex는 `/responses`를 사용하므로 커스터마이징 필요.

```rust
// 현재 (providers/openai/client/mod.rs)
fn path(&self) -> String {
    "/v1/responses".to_string()  // 하드코딩
}

// 필요한 변경
fn path(&self) -> String {
    self.settings.path.clone().unwrap_or_else(|| "/v1/responses".to_string())
}
```

`OpenAIProviderSettings`에 `pub path: Option<String>` 필드 추가.

**참고**: `Url::join()`이 절대 경로(`/`로 시작)일 때 호스트 이후를 통째로 교체하므로,
base_url 트릭으로는 path 문제를 우회할 수 없음.

---

## 구현 계획

### Rust 백엔드 (apps/tauri/src-tauri/src/)

#### 새 모듈: `auth/`

```
src/
  auth/
    mod.rs
    oauth.rs         — PKCE 플로우, 로컬 HTTP 서버(redirect 수신), 토큰 교환
    token_store.rs   — keyring을 이용한 토큰 저장/갱신
```

#### OAuth 플로우 (브라우저 방식)

1. PKCE 코드쌍 생성 (verifier + challenge)
2. localhost:{port} 임시 HTTP 서버 시작 (redirect callback 수신용)
3. authorize URL 구성 → 브라우저 오픈
4. 사용자 로그인 완료 → localhost로 code redirect
5. code + verifier → auth.openai.com/oauth/token 으로 토큰 교환
6. access_token, refresh_token, id_token 수신
7. id_token JWT에서 account_id 추출
8. keyring에 토큰 저장

#### OAuth 플로우 (Headless/Device Code 방식)

1. auth.openai.com/api/accounts/deviceauth/usercode 로 device code 요청
2. 사용자에게 URL + 코드 표시
3. 주기적으로 auth.openai.com/api/accounts/deviceauth/token 폴링
4. 인증 완료 → authorization_code 수신
5. code → token 교환 (이하 동일)

#### 토큰 갱신

```rust
async fn refresh_if_expired(auth: CodexAuth) -> Result<CodexAuth, Error> {
    if auth.expires_at > now() {
        return Ok(auth);  // 아직 유효
    }
    // refresh_token으로 새 access_token 획득
    let tokens = refresh_access_token(&auth.refresh_token).await?;
    // 저장 후 반환
    save_codex_auth(&tokens)?;
    Ok(tokens)
}
```

#### JWT에서 account_id 추출

id_token의 JWT claim에서:
- `chatgpt_account_id`
- `https://api.openai.com/auth.chatgpt_account_id`
- `organizations[0].id`

순서대로 시도.

### Provider 추가 (provider.rs)

```rust
pub enum Provider {
    OpenAI,
    Google,
    Anthropic,
    Vercel,
    Codex,  // ← 추가
}
```

### 채팅 호출 (commands.rs)

```rust
Provider::Codex => {
    let auth = get_codex_auth(&app)?;
    let auth = refresh_if_expired(auth).await?;

    let model = OpenAI::<DynamicModel>::builder()
        .model_name(model_id)
        .base_url("https://chatgpt.com/backend-api/codex")
        // .path("/responses")  ← aisdk 변경 후
        .build()
        .map_err(|e| e.to_string())?;

    let mut headers = HashMap::new();
    headers.insert(
        "Authorization".to_string(),
        format!("Bearer {}", auth.access_token),
    );
    headers.insert(
        "ChatGPT-Account-Id".to_string(),
        auth.account_id,
    );

    let response = LanguageModelRequest::builder()
        .model(model)
        .messages(messages)
        .headers(headers)
        .build()
        .stream_text()
        .await
        .map_err(|e| e.to_string())?;
    // 스트리밍 처리...
}
```

- api_key 설정 불필요 (default 빈 문자열, headers로 Authorization 덮어씀)
- 응답 스키마는 일반 OpenAI Responses API와 동일 → aisdk 파서 그대로 사용

### Tauri 커맨드

| 커맨드 | 용도 |
|---|---|
| `start_codex_oauth` | 브라우저 OAuth 플로우 시작 |
| `get_codex_auth_status` | 인증 상태 조회 (연결됨/만료/미연결) |
| `revoke_codex_auth` | 연결 해제 (토큰 삭제) |

이벤트: `codex_auth_changed` (Rust → FE, 인증 상태 변경 알림)

### 프론트엔드 (apps/tauri/src/)

- 설정 페이지에 "ChatGPT Pro" Provider 섹션 추가
- "ChatGPT로 로그인" 버튼 → `invoke('start_codex_oauth')`
- 인증 상태 표시 (연결됨 🟢 / 미연결 ⚪)
- 모델 선택에 "ChatGPT Pro (구독)" 카테고리 추가, 비용 $0 표시

---

## 의존성 추가 (Cargo.toml)

```toml
# OAuth/HTTP
reqwest = { version = "0.12", features = ["json"] }  # 이미 aisdk 통해 있을 수 있음
open = "5"         # 브라우저 오픈
base64 = "0.22"    # PKCE challenge 인코딩
sha2 = "0.10"      # PKCE SHA-256
rand = "0.8"       # PKCE verifier 생성
jsonwebtoken = "9" # JWT 디코딩 (id_token에서 account_id 추출)
```

---

## 참고: opencode codex.ts 핵심 코드

파일: `packages/opencode/src/plugin/codex.ts`
커밋: b020758446254e6c03b0182247b611ce1e5f2c55

- OAuth PKCE 플로우 구현 (브라우저 + headless 두 가지)
- `CODEX_API_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses"`
- 커스텀 fetch에서 URL 리라이트 + 헤더 교체
- 모든 Codex 모델 cost를 $0으로 설정
- refresh_token으로 자동 갱신

---

## 작업 순서

1. aisdk PR #80 머지 대기 (커스텀 헤더)
2. aisdk에 path 커스터마이징 PR 제출 또는 fork
3. Tauri Rust 백엔드에 OAuth 모듈 구현
4. Provider::Codex 추가 + commands.rs 연동
5. 프론트엔드 설정 UI 추가
6. 모델 선택 UI에 Codex 모델 추가
