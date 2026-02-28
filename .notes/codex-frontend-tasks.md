# ChatGPT Codex — Frontend Tasks

> Rust backend 작업 완료 후 진행

## 1. `packages/ai` — Type System

### 1-1. ProviderIdSchema 확장
- **File**: `packages/ai/src/provider/all-models.ts`
- `ProviderIdSchema`에 `'codex'` 추가
- `MODEL_IDS_PER_PROVIDER`에 codex 항목 추가

### 1-2. Codex 모델 ID 스키마
- **File**: `packages/ai/src/provider/openai/openai-models.ts` (또는 새 파일)
- 기존 OpenAI 모델과 Codex 전용 모델 분리 (같은 모델이라도 Codex provider 경유 시 $0)
- 모델 목록: `gpt-5.3-codex`, `gpt-5.2-codex`, `gpt-5.2`, `gpt-5.1-codex`, `gpt-5.1-codex-max`, `gpt-5.1-codex-mini`

### 1-3. validate-api-key.ts
- **File**: `packages/ai/src/provider/validate-api-key.ts`
- Codex provider는 API key 검증 불필요 (OAuth 방식) — exhaustive match 깨지지 않게 처리

## 2. `apps/tauri/src` — UI Components

### 2-1. Provider Icon
- **File**: `apps/tauri/src/business/logo/ProviderIconMap.tsx`
- `'codex'` case 추가 (ChatGPT/OpenAI 아이콘 또는 별도 아이콘)
- `@lobehub/icons`에서 적절한 아이콘 선택 (또는 OpenAI 아이콘에 badge)

### 2-2. Provider Config UI — OAuth 로그인
- **File**: `apps/tauri/src/business/command-palette/panes/ProviderConfigCommandView.tsx`
- 현재: API key 입력만 지원
- 추가: `codex` provider일 때 "ChatGPT로 로그인" 버튼 렌더링
- 버튼 클릭 → `invoke('start_codex_oauth')` 호출
- 인증 상태 표시: 🟢 연결됨 / ⚪ 미연결 / 🔴 만료됨
- `PROVIDER_INFO`에 codex 항목 추가

### 2-3. Codex 인증 상태 조회
- **New file**: `apps/tauri/src/lib/gateway/codex-auth/codexAuthGateway.ts`
- Tauri invoke wrapper: `start_codex_oauth`, `get_codex_auth_status`, `revoke_codex_auth`
- React Query hook으로 인증 상태 관리

### 2-4. Tauri event listener
- Rust에서 emit하는 `codex_auth_changed` 이벤트 수신
- 인증 상태 변경 시 UI 자동 갱신

## 3. `apps/tauri/src` — Chat Transport

### 3-1. TauriChatTransport
- **File**: `apps/tauri/src/business/chatting/transport/TauriChatTransport.ts`
- `ProviderId` 타입이 확장되면 자동으로 `'codex'` 전달 가능
- 별도 수정 불필요할 가능성 높음 (Rust 백엔드에서 provider_name으로 분기)

## 4. Agent 관련

### 4-1. Agent Create/Edit View
- **Files**: `AgentCreateView.tsx`, `AgentEditView.tsx`
- Provider 선택 드롭다운에 Codex 추가
- Codex 선택 시 모델 목록 → Codex 전용 모델만 표시
- 비용 $0 표시 (optional)

## Dependencies

```
[Rust backend OAuth 완료] 
  → 1-1, 1-2, 1-3 (type system)
  → 2-1 (icon)
  → 2-2 (OAuth UI)
  → 2-3 (gateway)
  → 2-4 (event listener)
  → 4-1 (agent views)
```
