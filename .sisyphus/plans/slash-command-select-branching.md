# SlashCommand Selection Branching: Action vs Template

## Context

### Original Request
SlashCommand popover에서 아이템 선택 시, action/template 모드에 따라 다르게 동작하도록 구현:
- **Action**: input 비우고, 해당 action 실행
- **Template**: input을 `/{commandName} `으로 채우고 뒤에 $INPUT 입력 가능하게
- **Submit**: template 입력을 resolve해서 최종 텍스트로 변환

### Interview Summary
**Key Discussions**:
- submit-time template resolve도 같이 구현 (onSelect 분기 + handleSubmit resolve)
- template prefix 편집 시 기존 handleChange 커서위치 기반 로직이 이미 popover re-open 처리
- $HINT는 YAGNI — $INPUT만 처리, 언어 선택 UI는 별도 작업

**Analysis Finding**:
- `resolveTemplate()`이 `$1`/`$ALL`을 쓰지만, 실제 template은 `$INPUT`/`$HINT` 사용 → placeholder 불일치 수정 필요
- `handleSubmit`이 현재 stub (`// TODO: send message via session`) — template resolve까지만 구현, 실제 send는 기존 TODO 유지

### Metis Review
**Identified Gaps** (addressed):
- `SlashCommandManager`에 `findCommandByName()` 없음 → TODO 2에서 추가
- action의 `execute`가 async일 수 있음 (반환 타입 `void | Promise<void>`) → error catching 추가
- `setIsOpen(false)` 타이밍 → `setInput` 전에 호출하여 popover flash 방지
- `Cmd+Enter` 미연결, `session.sendMessage` 미구현 → 명시적으로 scope OUT

---

## Work Objectives

### Core Objective
SlashCommand 선택 시 action/template 분기 로직 구현 + submit 시 template resolve

### Concrete Deliverables
- `SlashCommandManager.resolveTemplate()` — `$INPUT`/`$HINT` placeholder로 수정
- `SlashCommandManager.findCommandByName()` — name 기반 lookup 메서드
- `ChatInputView.onSelect` — action/template 분기 로직
- `ChatInputView.handleSubmit` — template prefix 감지 + resolve
- 각 변경에 대한 unit test

### Definition of Done
- [x] Action 선택 시: input 비워짐, popover 닫힘, execute 콜백 호출됨
- [x] Template 선택 시: input이 `/{name} `으로 채워짐, popover 닫힘
- [x] `/Translate hello world` submit 시: template이 resolve되어 `$INPUT`→`hello world` 치환
- [x] 일반 텍스트 submit은 기존과 동일 (변경 없음)
- [x] `pnpm test` 실행 시 모든 테스트 통과

### Must Have
- action/template 분기 (ts-pattern 또는 if/else — 구현자 재량)
- `resolveTemplate`에서 `$INPUT` placeholder 치환
- 존재하지 않는 command prefix 시 graceful fallback (raw text 그대로 전송)
- async execute에 대한 error catching

### Must NOT Have (Guardrails)
- `SlashCommandPopover.tsx` 수정 금지 — 이미 정상 동작
- `defaultCommands.tsx` 수정 금지 — template placeholder 이미 올바름
- `$HINT` 선택 UI 추가 금지 — YAGNI
- `Cmd+Enter` 키보드 shortcut 연결 금지 — 별도 작업
- `session.sendMessage()` 실제 구현 금지 — 기존 TODO stub 유지
- `enabled` 필드 기반 필터링 추가 금지
- `handleChange` 기존 popover 열기/닫기 로직 수정 금지
- popover item에 mode badge UI 추가 금지
- error toast/validation UI 추가 금지

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (vitest + jsdom + @testing-library/react)
- **User wants tests**: YES (tests-after)
- **Framework**: vitest

---

## Task Flow

```
TODO 1 (resolveTemplate fix) → TODO 2 (findCommandByName) → TODO 3 (onSelect branching) → TODO 4 (handleSubmit resolve) → TODO 5 (tests)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | - | Pure function fix, no dependencies |
| 2 | - | Pure registry method, no dependencies |
| 3 | - | Uses types only, doesn't call resolveTemplate |
| 4 | 1, 2 | handleSubmit calls findCommandByName + resolveTemplate |
| 5 | 1, 2, 3, 4 | Tests verify all changes |

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2, 3 | Independent — can be implemented in parallel |
| B | 4 | Depends on A |
| C | 5 | Depends on all |

---

## TODOs

- [x] 1. Fix `resolveTemplate` to use `$INPUT`/`$HINT` placeholders

  **What to do**:
  - Replace `$ALL` → `$INPUT` replacement logic
  - Replace `$1` → `$HINT` replacement logic (only when hintSelection provided)
  - Remove the positional args loop (`$1`, `$2`, ...) entirely — was the old approach, conflicts with `$HINT`
  - Keep method signature unchanged: `resolveTemplate(command, args, hintSelection?)`

  **Must NOT do**:
  - Add new placeholder types beyond `$INPUT` and `$HINT`
  - Change the method signature
  - Add $HINT selection logic (YAGNI)

  **Parallelizable**: YES (with 2, 3)

  **References**:

  **Pattern References**:
  - `apps/tauri/src/business/slash-command/SlashCommandManager.ts:47-66` — current resolveTemplate implementation (the code to replace)
  
  **API/Type References**:
  - `apps/tauri/src/business/slash-command/types.ts:17-21` — `TemplateSlashCommand` type with `template: string` and `hints?: string[]`
  - `apps/tauri/src/business/slash-command/defaultCommands.tsx:21` — template example: `'Translate the following to $HINT:\n\n$INPUT'`
  - `apps/tauri/src/business/slash-command/defaultCommands.tsx:31` — template without $HINT: `'Improve the writing quality of the following text:\n\n$INPUT'`

  **Acceptance Criteria**:
  - [x] `resolveTemplate(cmd, "hello")` where `template = "Do: $INPUT"` → `"Do: hello"`
  - [x] `resolveTemplate(cmd, "hello", "Korean")` where `template = "To $HINT:\n\n$INPUT"` → `"To Korean:\n\nhello"`
  - [x] `resolveTemplate(cmd, "hello")` where `template = "To $HINT:\n\n$INPUT"` (no hint) → `"To $HINT:\n\nhello"` ($HINT left as literal)
  - [x] No positional `$1`/`$2`/`$ALL` replacement code remains
  - [x] `pnpm test` passes (existing tests still green)

  **Commit**: YES (groups with 2)
  - Message: `fix(slash-command): update resolveTemplate to use $INPUT/$HINT placeholders`
  - Files: `apps/tauri/src/business/slash-command/SlashCommandManager.ts`
  - Pre-commit: `cd apps/tauri && pnpm test`

---

- [x] 2. Add `findCommandByName` to SlashCommandManager

  **What to do**:
  - Add `public findCommandByName(name: string): SlashCommand | undefined` method
  - Case-insensitive comparison: `cmd.name.toLowerCase() === name.toLowerCase()`
  - Uses `this.commands$.getValue().find(...)` — pure registry lookup, fits Manager pattern

  **Must NOT do**:
  - Add fuzzy matching — exact match (case-insensitive) only
  - Add filtering by `enabled` field
  - Return multiple results (find, not filter)

  **Parallelizable**: YES (with 1, 3)

  **References**:

  **Pattern References**:
  - `apps/tauri/src/business/slash-command/SlashCommandManager.ts:21-23` — `getCommands()` pattern (existing registry lookup method to follow)
  - `apps/tauri/src/business/slash-command/SlashCommandManager.ts:25-33` — `registerCommand()` shows how to access `this.commands$.getValue()`

  **Acceptance Criteria**:
  - [x] `findCommandByName('Translate')` returns the Translate command
  - [x] `findCommandByName('translate')` returns the Translate command (case-insensitive)
  - [x] `findCommandByName('nonexistent')` returns `undefined`
  - [x] `pnpm test` passes

  **Commit**: YES (groups with 1)
  - Message: `feat(slash-command): add findCommandByName to SlashCommandManager`
  - Files: `apps/tauri/src/business/slash-command/SlashCommandManager.ts`
  - Pre-commit: `cd apps/tauri && pnpm test`

---

- [x] 3. Implement `onSelect` branching in ChatInputView

  **What to do**:
  - Replace `console.log(c)` in the `onSelect` callback with action/template branching
  - **Action mode** (`command.mode === 'action'`):
    1. `setIsOpen(false)` — close popover first (prevents flash)
    2. Build `SlashCommandContext`: `{ currentInput: input, setInput, close: () => setIsOpen(false) }`
    3. `setInput('')` — clear input
    4. Call `command.execute(context)` — wrap in Promise.resolve().catch() for async safety
  - **Template mode** (`command.mode === 'template'`):
    1. `setIsOpen(false)` — close popover first
    2. `setInput('/' + command.name + ' ')` — fill prefix with trailing space
    3. Focus textarea: `textAreaRef.current?.focus()` (ensure cursor is at end)

  **Must NOT do**:
  - Modify SlashCommandPopover.tsx
  - Call `resolveTemplate` in onSelect (that's handleSubmit's job)
  - Add hint selection step
  - Add UI feedback (toasts, badges, etc.)

  **Parallelizable**: YES (with 1, 2)

  **References**:

  **Pattern References**:
  - `apps/tauri/src/business/chat/ChatInputView.tsx:99-108` — current onSelect location (`console.log(c)` to replace)
  - `apps/tauri/src/business/chat/ChatInputView.tsx:25-29` — `setInput` wrapper that syncs with ChatInputState singleton
  - `apps/tauri/src/business/chat/ChatInputView.tsx:17-18` — `input` and `isOpen` state declarations

  **API/Type References**:
  - `apps/tauri/src/business/slash-command/types.ts:12-15` — `ActionSlashCommand` with `execute: (context) => void | Promise<void>`
  - `apps/tauri/src/business/slash-command/types.ts:25-29` — `SlashCommandContext` shape: `{ currentInput, setInput, close }`
  - `apps/tauri/src/business/slash-command/types.ts:17-21` — `TemplateSlashCommand` with `template` and `hints`

  **Acceptance Criteria**:
  - [x] Selecting action command: input is empty, popover is closed, `execute()` was called
  - [x] Selecting template command: input is `/{commandName} `, popover is closed
  - [x] After template fill: textarea has focus, cursor at end
  - [x] Async execute error does not crash the app (Promise catch)
  - [x] `pnpm test` passes (existing popover tests still green)

  **Commit**: YES
  - Message: `feat(chat): implement action/template branching on slash command select`
  - Files: `apps/tauri/src/business/chat/ChatInputView.tsx`
  - Pre-commit: `cd apps/tauri && pnpm test`

---

- [x] 4. Update `handleSubmit` for template-prefix detection and resolution

  **What to do**:
  - In `handleSubmit`, before the existing logic:
    1. Check if `input.trimStart()` starts with `/`
    2. If yes: extract command name (first word without `/`) and the rest as user text
    3. Call `slashCommandManager.findCommandByName(commandName)`
    4. If found AND `command.mode === 'template'`: call `slashCommandManager.resolveTemplate(command, userText)`
    5. Use resolved text as the message to send (currently just `// TODO: send message via session`)
    6. `setInput('')` and return
    7. If command not found: fall through to normal submit (send raw input as-is)
  - For non-slash input: existing behavior unchanged

  **Must NOT do**:
  - Implement actual `session.sendMessage()` — keep existing TODO stub pattern
  - Block submit on empty `$INPUT` — allow it
  - Add $HINT resolution logic beyond what resolveTemplate already does
  - Add error toasts or validation
  - Wire up `Cmd+Enter` keyboard shortcut

  **Parallelizable**: NO (depends on 1, 2)

  **References**:

  **Pattern References**:
  - `apps/tauri/src/business/chat/ChatInputView.tsx:31-35` — current handleSubmit (stub to extend)
  - `apps/tauri/src/business/chat/ChatInputView.tsx:8` — `slashCommandManager` import (already imported)

  **API/Type References**:
  - `apps/tauri/src/business/slash-command/SlashCommandManager.ts:47-66` — `resolveTemplate(command, args, hintSelection?)` signature
  - `apps/tauri/src/business/slash-command/types.ts:17-21` — `TemplateSlashCommand` type (needed for type narrowing)

  **Acceptance Criteria**:
  - [x] `/Translate hello world` → resolves template with `$INPUT=hello world`, clears input
  - [x] `/Translate ` (empty input after prefix) → resolves template with `$INPUT=` (empty string), clears input
  - [x] `hello world` (no slash) → existing behavior, no template resolution
  - [x] `/NonExistent foo` → command not found, sends raw text as-is, clears input
  - [x] After any submit: input is cleared
  - [x] `pnpm test` passes

  **Commit**: YES
  - Message: `feat(chat): resolve slash command templates on submit`
  - Files: `apps/tauri/src/business/chat/ChatInputView.tsx`
  - Pre-commit: `cd apps/tauri && pnpm test`

---

- [x] 5. Add unit tests for all changes

  **What to do**:
  - **`SlashCommandManager.test.ts`** (new file):
    - `resolveTemplate` with `$INPUT` only
    - `resolveTemplate` with `$INPUT` + `$HINT`
    - `resolveTemplate` with `$HINT` but no hintSelection (leaves `$HINT` literal)
    - `findCommandByName` exact match
    - `findCommandByName` case-insensitive match
    - `findCommandByName` returns undefined for nonexistent
  - **Update `SlashCommandPopover.test.tsx`** (if needed — likely no changes, tests already pass)

  **Must NOT do**:
  - Write integration/e2e tests
  - Test ChatInputView rendering (complex, requires session mock — separate task)
  - Over-mock — test real SlashCommandManager methods, only mock external deps

  **Parallelizable**: NO (depends on 1, 2, 3, 4)

  **References**:

  **Test References**:
  - `apps/tauri/src/business/slash-command/SlashCommandPopover.test.tsx` — existing test structure, setup/cleanup pattern, vi.mock usage
  - `apps/tauri/vitest.config.ts` — test configuration (jsdom environment, @ alias)

  **Pattern References**:
  - `apps/tauri/src/business/slash-command/SlashCommandManager.ts` — all methods under test

  **Acceptance Criteria**:
  - [x] `SlashCommandManager.test.ts` created with 6+ test cases (12 created)
  - [x] All tests exercise real SlashCommandManager (no mocking of the class itself)
  - [x] `cd apps/tauri && pnpm test` → all tests pass, 0 failures (21/21 pass)
  - [x] Coverage: resolveTemplate (6 cases), findCommandByName (6 cases)

  **Commit**: YES
  - Message: `test(slash-command): add unit tests for resolveTemplate and findCommandByName`
  - Files: `apps/tauri/src/business/slash-command/SlashCommandManager.test.ts`
  - Pre-commit: `cd apps/tauri && pnpm test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1+2 | `fix(slash-command): update resolveTemplate placeholders and add findCommandByName` | `SlashCommandManager.ts` | `pnpm test` |
| 3 | `feat(chat): implement action/template branching on slash command select` | `ChatInputView.tsx` | `pnpm test` |
| 4 | `feat(chat): resolve slash command templates on submit` | `ChatInputView.tsx` | `pnpm test` |
| 5 | `test(slash-command): add unit tests for resolveTemplate and findCommandByName` | `SlashCommandManager.test.ts` | `pnpm test` |

---

## Success Criteria

### Verification Commands
```bash
cd apps/tauri && pnpm test  # All tests pass
```

### Final Checklist
- [x] Action 선택 → input 비움 + execute 호출 + popover 닫힘
- [x] Template 선택 → input `/{name} ` + popover 닫힘 + focus 유지
- [x] Template submit → resolveTemplate → `$INPUT` 치환됨
- [x] 일반 텍스트 submit → 변경 없음
- [x] 존재하지 않는 command → raw text fallback
- [x] 기존 popover 테스트 9개 여전히 통과
- [x] 새 테스트 12개 통과 (exceeded 6+ requirement)
- [x] SlashCommandPopover.tsx 변경 없음
- [x] defaultCommands.tsx 변경 없음
- [x] $HINT UI 없음
- [x] Cmd+Enter 연결 없음
