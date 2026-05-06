# AI Edit TODO

## P0: MVP 핵심

### 1. 기본 연결

- [x] `apps/tauri/ai-edit` 초안을 실제 소스 위치인 `src/business/config-file/main/ai-edit` 아래로 옮긴다.
- [x] 기존 `FileEditorView` 컴포넌트 이름은 유지한다.
- [x] `FileEditorView`에서 editor/diff/chat/history 레이아웃을 조합한다.
- [x] 현재 `SelectedFile` 타입과 import 경로에 맞춘다.
- [ ] 기존 `PreviewActionsView`를 AI edit 레이아웃 안에서 어떻게 노출할지 결정한다.

### 2. 파일 편집/저장 흐름

- [ ] `draftContent`를 선택 파일 content로 초기화한다.
- [ ] 선택 파일이 바뀔 때 `draftContent`와 AI proposal 상태를 초기화한다.
- [ ] `Accept all` 시 `writeFile(selectedFile.path, nextContent)`를 호출한다.
- [ ] 저장 성공 후 `SelectionContext.selectedFile`의 content와 updatedAt을 갱신한다.
- [ ] 저장 실패 시 사용자에게 에러를 노출한다.

### 3. AI edit 상태 머신

- [ ] `idle`, `working`, `proposal-pending`, `applying` 상태를 유지한다.
- [ ] `idle`이 아닐 때 editor를 read-only로 잠근다.
- [ ] proposal pending 중 새 prompt 전송을 막는다.
- [ ] reject/apply 후 상태를 `idle`로 복구한다.

### 4. AI 응답 MVP

- [ ] mock proposal로 UI 흐름을 먼저 검증한다.
- [ ] 실제 AI 연결 전까지 `afterContent` 중심의 proposal 형태를 유지한다.
- [ ] 실제 AI command는 UI 흐름 검증 이후 별도로 설계한다.

### 5. Diff UI

- [ ] `DiffEditorView`를 Monaco `DiffEditor`로 연결한다.
- [ ] proposal이 있으면 editor 대신 diff를 표시한다.
- [ ] V1에서는 `Accept all` / `Reject all`을 우선 지원한다.
- [ ] per-hunk accept/reject는 diff 생성 안정화 후 활성화한다.

## P1: 실제 AI 연결과 안정화

- [ ] AI edit 전용 Tauri command를 설계한다.
- [ ] 입력은 provider/model/filePath/content/prompt를 포함한다.
- [ ] 출력은 `afterContent`와 `summary`를 우선으로 한다.
- [ ] frontend gateway를 추가한다.
- [ ] mock 대신 실제 command를 호출한다.
- [ ] `baseContent`와 `afterContent`를 비교해 hunk를 생성한다.

## P2: 확장 기능

- [ ] version history 저장 구조를 설계한다.
- [ ] stale base detection을 추가한다.
- [ ] sidebar lock indicator를 추가한다.
- [ ] 외부 파일 변경 감지를 설계한다.

## P3: 품질

- [ ] AI edit 타입 이름에 도메인 prefix를 붙일지 결정한다.
- [ ] `applyHunks` 단위 테스트를 추가한다.
- [ ] 상태 전이 테스트를 추가한다.
- [ ] `pnpm check-ts`를 유지한다.
