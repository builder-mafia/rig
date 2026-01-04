# ALLIN

채팅 인터페이스와 확장 가능한 기능을 갖춘 오픈소스 AI 올인원 키트

## 소개

ALLIN은 다양한 AI 기능을 한 곳에 모으는 플랫폼입니다. 현재는 ChatGPT/Gemini와 같은 채팅 인터페이스를 제공하며, 지속적으로 더 많은 창의적인 AI 기능을 추가할 계획입니다.

## 프로젝트 구조

```
ALLIN/
├── apps/
│   ├── web/              # Next.js 웹 애플리케이션
│   └── desktop-app/      # Tauri 데스크톱 애플리케이션
├── packages/
│   ├── allin-api/        # 확장 기능용 API 정의
│   ├── allin-extension/  # 확장 시스템 코어
│   ├── chat/             # 채팅 기능 (프로바이더, 파사드)
│   ├── db-atom/          # 데이터베이스 상태 관리
│   ├── db-schema/        # 데이터베이스 스키마
│   ├── message-metadata-schema/  # 메시지 메타데이터 타입
│   └── ui/               # 공유 UI 컴포넌트 (shadcn/ui)
└── extensions/
    └── quiz/             # 확장 기능 예시 (퀴즈)
```

## 기술 스택

- **프레임워크**: Next.js 15, React 19
- **데스크톱**: Tauri (Rust)
- **상태 관리**: Jotai + RxJS
- **UI**: shadcn/ui, Tailwind CSS, Lucide Icons
- **데이터베이스**: IndexedDB
- **AI 프로바이더**: OpenAI, Google AI, Anthropic
- **테스트**: Vitest
- **모노레포**: Turbo + pnpm

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm 9.6.0+

### 설치

```bash
# 의존성 설치
pnpm install

# 웹 앱 개발 모드 실행
pnpm dev

# 데스크톱 앱 실행
pnpm dev:app

# 전체 빌드
pnpm build

# 테스트 실행
pnpm test
```

## 기여하기

다음과 같은 모든 형태의 기여를 환영합니다:

- 새로운 AI 기능 아이디어
- UX/UI 개선
- 성능 최적화
- 테스트 보강 및 리팩토링
- 문서 개선

아이디어가 있으시면 Issue를 열어 논의하거나 Pull Request를 제출해주세요.

## 라이선스

이 프로젝트는 GNU General Public License v3.0 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

### 기술 스택

ALLIN은 다음과 같은 기술 스택 위에서 만들어지고 있습니다.

* **상태 관리**
    * `jotai`
* **이벤트 스트림 / 반응형 로직**
    * `jotai` + `rxjs`
* **UI**
    * `shadcn/ui`
    * `lucide-react` (아이콘)
    * `tailwindcss`
* **데이터 저장**
    * `IndexedDB`
* **테스트**
    * `vitest`

이 스펙을 통해, **가볍고 유연하면서도 확장 가능한 AI 플랫폼**을 지향합니다.

---

### 함께 만들고 싶습니다

ALLIN은 혼자 완성하는 프로젝트가 아니라,  
**창의성 있고 유능한 개발자들과 함께 키워 나가고 싶은 프로젝트**입니다.

* 새로운 AI 기능 아이디어
* UX/UI 개선 제안
* 성능 최적화
* 테스트 보강 및 리팩토링
* 문서 개선

어떤 기여든 환영합니다.

---

### 기여 & 문의 방법

* **기능 제안 / 버그 제보 / 리팩토링 아이디어**
    * GitHub 저장소의 **Issues 탭**에 자유롭게 등록해 주세요.
* **개발 관련 문의**
    * 마찬가지로 **Issue 탭에 질문 형태로 남겨주시면** 확인 후 답변드리겠습니다.
* **개인적으로 궁금한 점 / 더 깊은 논의**
    * 직접 저에게 문의해 주세요. (이메일 또는 GitHub 프로필에 기재된 연락 수단을 사용해 주세요)

ALLIN이 **“AI 기능을 실험하고, 붙이고, 함께 놀 수 있는 올인원 키트”** 가 되도록  
많은 관심과 기여 부탁드립니다.

---