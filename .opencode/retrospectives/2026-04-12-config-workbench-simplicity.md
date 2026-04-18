# Config Workbench 구조 단순화 회고

## 1. 무엇이 문제였는가

- 기존 `ConfigFileWorkbenchProvider.tsx` 는 선택 상태, pane 전환, 폴더 트리 로딩, 파일 읽기/쓰기, 생성 폼 상태, 외부 앱 열기, 단축키, 토스트까지 한 파일에 몰려 있었다.
- 이 구조는 처음에는 "한 곳에 다 있다" 는 장점이 있어 보여도, 실제로는 변경 범위가 지나치게 넓고 읽는 사람이 한 번에 너무 많은 맥락을 이해해야 했다.
- `HeaderView`, `SidebarView`, `MainView` 같은 단순 뷰도 거대한 context contract 에 의존해서, 화면 한 군데를 고치려 해도 provider 전체를 먼저 읽어야 했다.
- AI 가 만든 구조 특성상 "일단 다 provider 에 넣고 본다" 는 방식으로 비대해졌고, 그 결과 책임 경계가 흐려졌다.

## 2. As-Is vs To-Be

| 구분 | As-Is | To-Be |
|---|---|---|
| 루트 구조 | `ConfigFileWorkbenchView` + 거대한 provider | `WorkbenchView` + 작은 context/hook 조합 |
| 상태 배치 | 대부분의 상태가 provider 하나에 집중 | 선택 상태, pane 상태, 데이터 조회를 목적별로 분리 |
| 뷰 의존성 | 하위 뷰들이 거대한 context 전체에 의존 | 각 뷰가 필요한 값만 직접 사용 |
| 읽기 비용 | provider 를 먼저 이해해야 화면이 보임 | 화면을 읽으면 구조가 자연스럽게 보임 |
| 변경 영향 범위 | 작은 수정도 provider 전역 영향 가능 | 변경 지점이 국소화됨 |
| 유지보수 방식 | "어디서 무엇을 관리하는지" 찾기 어려움 | 책임 단위가 파일명과 모듈 경계에 드러남 |

## 3. As-Is 코드 예시

기존 방식은 큰 provider 가 거의 모든 상태와 액션을 소유하고, 하위 컴포넌트는 그 provider 를 통해서만 동작했다.

```tsx
export const ConfigFileWorkbenchView = () => {
  return (
    <ConfigFileWorkbenchProvider>
      <div className='h-dvh w-full grid grid-cols-[320px_1fr] bg-background'>
        <SidebarView />
        <section className='flex flex-col min-w-0'>
          <HeaderView />
          <div className='flex-1 min-h-0'>
            <MainView />
          </div>
        </section>
      </div>
    </ConfigFileWorkbenchProvider>
  );
};
```

```tsx
type ConfigFileWorkbenchContextValue = {
  pane: 'content' | 'create-entry';
  configFiles: StorageConfigFile[];
  selectedConfigFile: StorageConfigFile | null;
  selectedBrowserItem: ConfigBrowserItem | null;
  isLoadingContent: boolean;
  isSaving: boolean;
  isDirty: boolean;
  newName: string;
  newPath: string;
  setPane: (pane: 'content' | 'create-entry') => void;
  createEntry: () => Promise<void>;
  openInFinder: () => Promise<void>;
  openInOpencode: () => Promise<void>;
  openInCursor: () => Promise<void>;
  openInZed: () => Promise<void>;
  saveActiveFile: () => Promise<void>;
  // ... dozens more fields
};
```

```tsx
export const HeaderView = () => {
  const context = use(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error('HeaderView must be used within ConfigFileWorkbenchProvider');
  }

  return (
    <>
      <HeaderTitleView pane={context.pane} ... />
      <HeaderActionsView
        pane={context.pane}
        isDirty={context.isDirty}
        canSave={context.canSave}
        onOpenInFinder={() => void context.openInFinder()}
        onRemoveSelectedEntry={() => void context.removeSelectedEntry()}
        onSaveActiveFile={() => void context.saveActiveFile()}
      />
    </>
  );
};
```

이 구조의 문제는 "상태가 한 곳에 있다" 가 아니라 "너무 많은 책임이 한 곳에 있다" 는 점이다.

## 4. To-Be 코드 예시

리팩터링 이후에는 루트는 레이아웃만 담당하고, 각 관심사는 작은 모듈로 분리한다.

```tsx
export const WorkbenchView = () => {
  return (
    <SelectionProvider>
      <div className='h-dvh w-full grid grid-cols-[320px_1fr] bg-background'>
        <SidebarView />
        <section className='flex flex-col min-w-0'>
          <HeaderView />
          <div className='flex-1 min-h-0'>
            <MainView />
          </div>
        </section>
      </div>
    </SelectionProvider>
  );
};
```

```tsx
export const SelectionContext = createContext<{
  selectedFile: StorageConfigFile | null;
  setSelectedFile: (file: StorageConfigFile | null) => void;
}>({
  selectedFile: null,
  setSelectedFile: () => {},
});
```

```tsx
export const HeaderView = () => {
  const { paneType } = usePaneType();
  const { selectedFile } = use(SelectionContext);

  return (
    <div className='h-12 border-b px-4 flex items-center justify-between gap-2'>
      <HeaderTitleView paneType={paneType} selectedFile={selectedFile} />
      <HeaderActionsView paneType={paneType} selectedFile={selectedFile} />
    </div>
  );
};
```

```tsx
export const useAppOpener = () => {
  const openApp = (type: AppType, path: string) => {
    switch (type) {
      case 'finder':
        return invoke('open_config_file_folder', { path });
      case 'opencode':
        return invoke('open_config_file_in_opencode', { path });
      case 'cursor':
        return invoke('open_config_file_in_cursor', { path });
      case 'zed':
        return invoke('open_config_file_in_zed', { path });
    }
  };

  return { openApp };
};
```

핵심은 "모든 상태를 한 데 모으는 것" 이 아니라 "각 파일이 자기 책임만 설명하도록 만드는 것" 이다.

## 5. 구조적으로 무엇이 좋아졌는가

- `WorkbenchView` 는 레이아웃 조립만 담당한다.
- `SelectionContext` 는 선택된 파일만 담당한다.
- `usePaneType` 는 pane 전환만 담당한다.
- `useUserFile` 는 파일 목록 조회만 담당한다.
- `useAppOpener` 는 외부 앱 실행만 담당한다.
- `HeaderView`, `SidebarView`, `MainView` 는 더 이상 거대한 context shape 를 몰라도 된다.

이렇게 되면 코드를 읽는 사람이 "이 파일은 무슨 역할을 하나" 를 빠르게 파악할 수 있다. 이것이 가독성의 핵심이다.

## 6. 트레이드오프

- 상태가 한 파일에 모여 있지 않기 때문에, 전체 흐름을 보려면 여러 파일을 따라가야 한다.
- 복잡한 cross-cutting flow 가 다시 필요해지면, 어디에 orchestration 을 둘지 별도 판단이 필요하다.
- 작은 hook/context 가 늘어나면 파일 수는 증가한다.

하지만 현재 규모에서는 이 비용보다 거대한 provider 의 복잡성 비용이 훨씬 크다.

정리하면:

- 중앙집중 제어력은 조금 줄어든다.
- 지역적 단순성과 읽기 쉬움은 크게 올라간다.
- 변경 지점이 작아져 유지보수와 리뷰가 쉬워진다.

## 7. 왜 이것이 유지보수에 유리한가

- 기능 추가 시 수정 범위가 작다.
- 특정 UI 를 고칠 때 관련 모듈만 읽으면 된다.
- 타입과 props surface 가 줄어들어 실수 가능성이 낮아진다.
- 거대한 context value 변경이 연쇄적으로 하위 뷰를 흔드는 일이 줄어든다.
- 코드 리뷰 시 "이 변경이 어디까지 영향 주는지" 판단하기 쉬워진다.

결국 구조적 단순함은 미적 취향이 아니라, 변경 비용과 사고 비용을 낮추는 실용적인 전략이다.

## 8. 앞으로 AI 가 따라야 할 원칙

- 거대한 provider 하나로 문제를 덮지 마라.
- 먼저 책임을 나눌 수 있는 가장 작은 단위를 찾아라.
- 뷰는 가능한 한 rendering 에만 집중하게 하라.
- 한 컴포넌트가 너무 많은 상태와 액션을 알게 하지 마라.
- 여러 하위 컴포넌트가 실제로 몇 개 값만 쓰는데도 큰 context 전체를 받는 구조를 피하라.
- "한 곳에 다 모아두면 편하다" 보다 "읽는 사람이 바로 이해할 수 있는가" 를 우선하라.
- 새 추상화를 추가하기 전에, 기존 구조를 더 평평하게 만들 수 있는지 먼저 검토하라.
- 복잡한 흐름이 필요해질 때만 orchestration layer 를 도입하라. 처음부터 크게 만들지 마라.

## 9. 다음 요청부터 따를 프롬프트

```text
구현 전에 먼저 구조를 가장 단순하게 만들 수 있는지 검토하라.

- 거대한 provider/context 하나에 상태와 액션을 몰아넣지 마라.
- 화면 레이아웃, 선택 상태, 데이터 조회, 외부 액션 같은 책임을 목적별로 분리하라.
- 각 컴포넌트는 가능한 한 자기에게 필요한 값만 직접 사용하게 하라.
- 읽는 사람이 파일명과 코드만 보고 역할을 바로 이해할 수 있게 구성하라.
- As-Is 가 "중앙 집중으로 인한 복잡성" 이라면, To-Be 는 "작은 책임으로 나뉜 평탄한 구조" 여야 한다.
- 기능 추가 속도보다 먼저, 변경 범위 예측 가능성과 유지보수성을 높이는 구조를 선택하라.
- 새 코드 작성 전 As-Is 와 To-Be 를 짧게 비교하고, 어떤 책임을 어디에 둘지 먼저 설명한 뒤 구현하라.
```
