# University Extension - Requirements Specification

AI 기반 개인화 교육 서비스 익스텐션

## Overview

사용자가 특정 분야를 학습하고자 할 때 AI가 맞춤형 커리큘럼을 생성하고, 학습을 가이드하며, 문제 출제 및 오답 관리까지 지원하는 종합 교육 플랫폼.

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UNIVERSITY EXTENSION                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ONBOARDING (수준 진단)                                               │
│     ┌────────────────────────────────────────────────────────────────┐  │
│     │  "어떤 분야를 배우고 싶으신가요?"                               │  │
│     │       ↓                                                        │  │
│     │  AI가 4-5개 진단 질문 생성                                     │  │
│     │       ↓                                                        │  │
│     │  (선택) 실력 측정용 문제 출제 (Quiz MCP 연동)                  │  │
│     │       ↓                                                        │  │
│     │  사용자 수준 분석 완료                                         │  │
│     └────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                     │
│  2. CURRICULUM CANVAS (커리큘럼 시각화)                                  │
│     ┌────────────────────────────────────────────────────────────────┐  │
│     │                                                                 │  │
│     │   ┌───────┐     ┌───────┐     ┌───────┐                        │  │
│     │   │ 기초  │ ──→ │ 중급  │ ──→ │ 심화  │                        │  │
│     │   └───────┘     └───────┘     └───────┘                        │  │
│     │       │             │             │                            │  │
│     │       ▼             ▼             ▼                            │  │
│     │   ┌───────┐     ┌───────┐     ┌───────┐                        │  │
│     │   │Topic A│     │Topic C│     │Topic E│                        │  │
│     │   └───────┘     └───────┘     └───────┘                        │  │
│     │   ┌───────┐     ┌───────┐                                      │  │
│     │   │Topic B│     │Topic D│                                      │  │
│     │   └───────┘     └───────┘                                      │  │
│     │                                                                 │  │
│     │   * 클릭 → 해당 토픽 학습 채팅으로 이동                        │  │
│     └────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                     │
│  3. LEARNING CHAT (학습 채팅)                                            │
│     ┌────────────────────────────────────────────────────────────────┐  │
│     │  선택한 토픽에 대한 AI 튜터와 대화                             │  │
│     │       ↓                                                        │  │
│     │  개념 설명 + 예제 + Q&A                                        │  │
│     │       ↓                                                        │  │
│     │  학습 완료 시 커리큘럼으로 복귀                                │  │
│     └────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                     │
│  4. ASSESSMENT (평가 및 오답노트)                                        │
│     ┌────────────────────────────────────────────────────────────────┐  │
│     │  Quiz MCP를 통한 문제 생성                                     │  │
│     │       ↓                                                        │  │
│     │  자동 채점                                                     │  │
│     │       ↓                                                        │  │
│     │  오답노트 생성 및 관리                                         │  │
│     └────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Features

### Phase 1: Onboarding (수준 진단)

**목적**: 사용자의 현재 수준을 파악하여 맞춤형 커리큘럼 제공

**기능 명세**:
| Feature | Description | Priority |
|---------|-------------|----------|
| 학습 분야 입력 | 사용자가 배우고 싶은 분야를 자유 텍스트로 입력 | P0 |
| 진단 질문 생성 | AI가 해당 분야에 대한 4-5개 진단 질문 생성 | P0 |
| 답변 기반 분석 | 사용자 답변을 통해 수준(초급/중급/고급) 판단 | P0 |
| 실력 측정 문제 | Quiz MCP 연동하여 실제 문제 출제 (선택적) | P1 |

**AI 프롬프트 고려사항**:
- 분야의 핵심 개념 이해도를 측정할 수 있는 질문
- 사전 지식 범위 파악
- 학습 목표 및 기대 수준 확인

---

### Phase 2: Curriculum Canvas (커리큘럼 시각화)

**목적**: 학습 경로를 시각적으로 표현하여 전체 그림 파악

**기능 명세**:
| Feature | Description | Priority |
|---------|-------------|----------|
| 커리큘럼 생성 | 수준 진단 결과 기반 맞춤형 커리큘럼 생성 | P0 |
| 노드 기반 시각화 | HTML DOM으로 구현된 캔버스에 커리큘럼 노드 렌더링 | P0 |
| 의존성 표시 | 토픽 간 선수 관계를 화살표로 연결 | P0 |
| 진행률 표시 | 완료/진행중/미완료 상태 시각적 표시 | P1 |
| 노드 클릭 | 클릭 시 해당 토픽 학습 채팅으로 전환 | P0 |

**Canvas 구현 방식**:
- HTML/CSS 기반 DOM 요소로 구현 (HTML5 Canvas API 아님)
- React 컴포넌트로 노드 및 연결선 렌더링
- Tailwind CSS로 스타일링
- 필요시 드래그/줌 기능 추가 가능

**데이터 구조**:
```typescript
interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  prerequisites: string[]; // 선수 노드 ID 목록
  estimatedTime: string; // 예상 학습 시간
}

interface Curriculum {
  id: string;
  topic: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  nodes: CurriculumNode[];
  createdAt: Date;
}
```

---

### Phase 3: Learning Chat (학습 채팅)

**목적**: 선택한 토픽에 대해 AI 튜터와 대화형 학습

**기능 명세**:
| Feature | Description | Priority |
|---------|-------------|----------|
| 토픽 컨텍스트 | 선택된 토픽 정보를 시스템 프롬프트에 주입 | P0 |
| 개념 설명 | AI가 해당 토픽의 핵심 개념을 설명 | P0 |
| 예제 제공 | 실제 예제와 함께 학습 | P0 |
| Q&A | 사용자 질문에 대한 답변 | P0 |
| 학습 완료 마킹 | 사용자가 학습 완료를 표시할 수 있음 | P1 |
| 커리큘럼 복귀 | 학습 완료 후 캔버스 화면으로 돌아가기 | P0 |

**채팅 구현**:
- 기존 Chat 시스템 활용 (ChatFacade, Transport 레이어)
- 토픽별로 별도 세션 관리
- 시스템 프롬프트에 토픽 컨텍스트 및 튜터 역할 주입

**시스템 프롬프트 예시**:
```
You are an expert tutor for [TOPIC].
The student's current level is [LEVEL].
Learning context: [CURRICULUM_CONTEXT]

Your role is to:
1. Explain concepts clearly with examples
2. Answer questions patiently
3. Adjust difficulty based on student's understanding
4. Encourage and motivate the student
```

---

### Phase 4: Assessment (평가 및 오답노트)

**목적**: 학습 이해도 측정 및 취약점 관리

**기능 명세**:
| Feature | Description | Priority |
|---------|-------------|----------|
| 문제 생성 | Quiz MCP 연동하여 토픽 관련 문제 출제 | P1 |
| 자동 채점 | AI 기반 답안 채점 | P1 |
| 오답노트 | 틀린 문제와 해설 저장 | P1 |
| 복습 추천 | 오답 기반 복습 토픽 추천 | P2 |

**Quiz MCP 연동** (향후 구현):
- 문제 유형: 객관식, 주관식, 코딩 문제 등
- 난이도: 사용자 수준에 맞게 조절
- 피드백: 정답/오답 여부 + 상세 해설

---

## Technical Architecture

### Extension Structure
```
extensions/university/
├── src/
│   ├── index.ts                 # Entry point
│   ├── universityExtension.tsx  # Main extension
│   ├── components/
│   │   ├── OnboardingView.tsx   # 수준 진단 UI
│   │   ├── CurriculumCanvas.tsx # 커리큘럼 캔버스
│   │   ├── CurriculumNode.tsx   # 개별 노드 컴포넌트
│   │   ├── LearningChat.tsx     # 학습 채팅 뷰
│   │   └── AssessmentView.tsx   # 평가 뷰
│   ├── hooks/
│   │   ├── useCurriculum.ts     # 커리큘럼 상태 관리
│   │   ├── useOnboarding.ts     # 온보딩 흐름 관리
│   │   └── useLearningSession.ts # 학습 세션 관리
│   ├── services/
│   │   ├── curriculumGenerator.ts # AI 커리큘럼 생성
│   │   ├── levelAssessor.ts     # 수준 진단 로직
│   │   └── tutorService.ts      # 튜터 AI 서비스
│   ├── types/
│   │   └── index.ts             # 타입 정의
│   └── store/
│       └── universityStore.ts   # RxJS 기반 상태 관리
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### State Management (RxJS Pattern)
```typescript
// 기존 프로젝트 패턴 준수
class UniversityStore {
  private curriculum$ = new StateSubject<Curriculum | null>(null);
  private currentView$ = new StateSubject<ViewType>('onboarding');
  private selectedNode$ = new StateSubject<string | null>(null);
  
  // Observable getters
  getCurriculum$(): Observable<Curriculum | null> {
    return this.curriculum$.asObservable();
  }
  
  // Actions
  setCurriculum(curriculum: Curriculum): void {
    this.curriculum$.next(curriculum);
  }
}
```

### Extension Context Usage
```typescript
export const universityExtension: Extension = ({ event, ui, ai }) => {
  // AI API로 커리큘럼 생성
  const generateCurriculum = async (topic: string, userLevel: string) => {
    const result = await ai.ask(prompt, {
      systemPrompt: CURRICULUM_GENERATOR_PROMPT,
      schema: CurriculumSchema, // Zod schema for structured output
    });
    return result.data;
  };

  // UI 렌더링
  event['extension.open']('university').subscribe(() => {
    ui.render({
      id: 'university',
      component: <UniversityApp />,
    });
  });

  return {
    id: 'university',
    name: 'University',
    description: 'AI-powered personalized education platform',
    version: '0.1.0',
  };
};
```

---

## Implementation Phases

### MVP (Phase 1) - 핵심 흐름
1. [ ] 온보딩: 분야 입력 + AI 진단 질문 + 수준 분석
2. [ ] 커리큘럼: 기본 노드 시각화 + 클릭 이벤트
3. [ ] 학습 채팅: 토픽별 AI 튜터 대화

### Phase 2 - 고도화
1. [ ] 커리큘럼 진행률 및 상태 표시
2. [ ] 학습 완료 마킹 및 저장
3. [ ] 노드 간 의존성 화살표 표시

### Phase 3 - 평가 시스템
1. [ ] Quiz MCP 연동
2. [ ] 자동 채점
3. [ ] 오답노트 관리

### Phase 4 - 확장
1. [ ] 복습 추천 알고리즘
2. [ ] 학습 통계 대시보드
3. [ ] 커리큘럼 공유/수정 기능

---

## Technical Deep Dive: Yoga Layout + Infinite Canvas

### Yoga Layout Engine

**Yoga**는 Facebook에서 만든 크로스 플랫폼 Flexbox 레이아웃 엔진입니다. React Native 내부에서 사용되며, 웹에서도 WebAssembly를 통해 사용 가능합니다.

#### 왜 Yoga를 사용하나?
- **일관된 레이아웃**: CSS Flexbox와 동일한 알고리즘으로 노드 위치 계산
- **DOM 독립적**: 계산된 레이아웃을 어디에든 적용 가능 (DOM, Canvas, WebGL 등)
- **Node 트리 기반**: 커리큘럼 노드 간 관계를 자연스럽게 표현

#### 설치 및 기본 사용법

```bash
npm install yoga-layout
# 또는
npm install yoga-wasm-web  # WASM 버전 (더 빠름)
```

#### Yoga Node 클래스 설계

```typescript
import Yoga, {
  FlexDirection,
  JustifyContent,
  AlignItems,
  Edge,
  Direction,
  Node as YogaNode
} from 'yoga-layout';

/**
 * Curriculum Node wrapper around Yoga Node
 * Combines layout calculation with curriculum data
 */
class CanvasNode {
  private yogaNode: YogaNode;
  private children: CanvasNode[] = [];
  private parent: CanvasNode | null = null;
  
  // Curriculum-specific data
  public readonly id: string;
  public readonly data: CurriculumNodeData;
  
  constructor(id: string, data: CurriculumNodeData) {
    this.id = id;
    this.data = data;
    this.yogaNode = Yoga.Node.create();
    
    // Default styling
    this.yogaNode.setWidth(200);
    this.yogaNode.setHeight(100);
    this.yogaNode.setPadding(Edge.All, 16);
  }
  
  // Layout configuration
  setSize(width: number, height: number): this {
    this.yogaNode.setWidth(width);
    this.yogaNode.setHeight(height);
    return this;
  }
  
  setFlexDirection(direction: FlexDirection): this {
    this.yogaNode.setFlexDirection(direction);
    return this;
  }
  
  setMargin(edge: Edge, value: number): this {
    this.yogaNode.setMargin(edge, value);
    return this;
  }
  
  // Child management
  addChild(child: CanvasNode): this {
    child.parent = this;
    this.children.push(child);
    this.yogaNode.insertChild(child.yogaNode, this.children.length - 1);
    return this;
  }
  
  removeChild(child: CanvasNode): this {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
      this.yogaNode.removeChild(child.yogaNode);
    }
    return this;
  }
  
  // Layout calculation
  calculateLayout(width?: number, height?: number): void {
    this.yogaNode.calculateLayout(width, height, Direction.LTR);
  }
  
  // Get computed layout
  getComputedLayout(): ComputedLayout {
    return {
      left: this.yogaNode.getComputedLeft(),
      top: this.yogaNode.getComputedTop(),
      width: this.yogaNode.getComputedWidth(),
      height: this.yogaNode.getComputedHeight(),
    };
  }
  
  // Get absolute position (relative to root)
  getAbsolutePosition(): { x: number; y: number } {
    let x = this.yogaNode.getComputedLeft();
    let y = this.yogaNode.getComputedTop();
    let current = this.parent;
    
    while (current) {
      x += current.yogaNode.getComputedLeft();
      y += current.yogaNode.getComputedTop();
      current = current.parent;
    }
    
    return { x, y };
  }
  
  // Cleanup (important for memory management!)
  dispose(): void {
    this.children.forEach(child => child.dispose());
    this.yogaNode.free();
  }
}

interface ComputedLayout {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CurriculumNodeData {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}
```

#### 커리큘럼 레이아웃 예제

```typescript
// Create curriculum tree
const root = new CanvasNode('root', { title: 'Curriculum', ... });
root.setSize(800, 600);
root.setFlexDirection(FlexDirection.Column);

const level1 = new CanvasNode('level-1', { title: 'Basics', ... });
level1.setFlexDirection(FlexDirection.Row);
level1.setMargin(Edge.Bottom, 40);

const topic1 = new CanvasNode('topic-1', { title: 'Variables', ... });
const topic2 = new CanvasNode('topic-2', { title: 'Functions', ... });
topic1.setMargin(Edge.Right, 20);

level1.addChild(topic1);
level1.addChild(topic2);
root.addChild(level1);

// Calculate layout
root.calculateLayout();

// Get positions for rendering
const topic1Layout = topic1.getComputedLayout();
// { left: 0, top: 0, width: 200, height: 100 }

const topic1Absolute = topic1.getAbsolutePosition();
// { x: 16, y: 16 } (considering root padding)
```

---

### Infinite Canvas 구현

무한 캔버스는 **뷰포트(Viewport)** 개념으로 구현합니다. 전체 캔버스는 무한하지만, 사용자가 보는 영역(뷰포트)만 렌더링합니다.

#### 핵심 개념

```
┌──────────────────────────────────────────────────────────────┐
│                     INFINITE CANVAS SPACE                     │
│                                                               │
│         ┌─────────────────────┐                               │
│         │     VIEWPORT        │← 사용자가 실제로 보는 영역     │
│         │   (visible area)    │                               │
│         │                     │                               │
│         │   ○ Node A          │                               │
│         │        ○ Node B     │                               │
│         └─────────────────────┘                               │
│                                                               │
│                    ○ Node C (화면 밖 - 렌더링 안 함)           │
│                                                               │
└──────────────────────────────────────────────────────────────┘

Transform: translate(x, y) scale(zoom)
- x, y: 뷰포트의 캔버스 내 위치 (pan)
- zoom: 확대/축소 레벨
```

#### 구현 접근법 비교

| 접근법 | 장점 | 단점 | 적합한 경우 |
|--------|------|------|-------------|
| **CSS Transform** | 간단, DOM 유지, 접근성 좋음 | 많은 노드 시 성능 저하 | 노드 100개 이하 |
| **HTML5 Canvas** | 고성능, 많은 객체 가능 | DOM 접근 불가, 접근성 나쁨 | 수천 개 노드 |
| **React Flow** | 검증된 라이브러리, 풍부한 기능 | 번들 크기, 커스텀 제한 | 빠른 개발 필요 시 |
| **직접 구현** | 완전한 제어권 | 개발 시간 | 특수 요구사항 |

**추천**: 커리큘럼 노드 수가 제한적(~50개)이므로 **CSS Transform** 방식이 적합

#### CSS Transform 기반 Infinite Canvas

```typescript
import { useState, useRef, useCallback, WheelEvent, MouseEvent } from 'react';

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface UseInfiniteCanvasOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomSensitivity?: number;
}

export function useInfiniteCanvas(options: UseInfiniteCanvasOptions = {}) {
  const {
    minZoom = 0.1,
    maxZoom = 3,
    zoomSensitivity = 0.001,
  } = options;

  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Pan handling
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) { // Left click
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setViewport(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Zoom handling (wheel)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const zoomDelta = -e.deltaY * zoomSensitivity;
    
    setViewport(prev => {
      const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoom + zoomDelta));
      
      // Zoom toward mouse position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomRatio = newZoom / prev.zoom;
      
      return {
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio,
        zoom: newZoom,
      };
    });
  }, [minZoom, maxZoom, zoomSensitivity]);

  // Transform CSS
  const getTransformStyle = useCallback(() => ({
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    transformOrigin: '0 0',
  }), [viewport]);

  // Convert screen coords to canvas coords
  const screenToCanvas = useCallback((screenX: number, screenY: number) => ({
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  }), [viewport]);

  // Convert canvas coords to screen coords
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => ({
    x: canvasX * viewport.zoom + viewport.x,
    y: canvasY * viewport.zoom + viewport.y,
  }), [viewport]);

  return {
    viewport,
    setViewport,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
    },
    getTransformStyle,
    screenToCanvas,
    canvasToScreen,
  };
}
```

#### Infinite Canvas 컴포넌트

```tsx
import { useInfiniteCanvas } from './useInfiniteCanvas';
import { CanvasNode } from './CanvasNode';

interface InfiniteCanvasProps {
  nodes: CanvasNode[];
  onNodeClick?: (node: CanvasNode) => void;
}

export function InfiniteCanvas({ nodes, onNodeClick }: InfiniteCanvasProps) {
  const { handlers, getTransformStyle, viewport } = useInfiniteCanvas({
    minZoom: 0.25,
    maxZoom: 2,
  });

  return (
    <div
      className="w-full h-full overflow-hidden relative bg-slate-50"
      {...handlers}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Canvas content layer */}
      <div style={getTransformStyle()}>
        {/* Grid background (optional) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
          }}
        />

        {/* Render nodes */}
        {nodes.map(node => {
          const layout = node.getComputedLayout();
          return (
            <div
              key={node.id}
              className="absolute bg-white border-2 rounded-lg shadow-md 
                         hover:shadow-lg transition-shadow cursor-pointer"
              style={{
                left: layout.left,
                top: layout.top,
                width: layout.width,
                height: layout.height,
              }}
              onClick={() => onNodeClick?.(node)}
            >
              <div className="p-4">
                <h3 className="font-semibold">{node.data.title}</h3>
                <p className="text-sm text-gray-500">{node.data.description}</p>
              </div>
            </div>
          );
        })}

        {/* Render edges (connections between nodes) */}
        <svg className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Edge rendering logic */}
        </svg>
      </div>

      {/* Zoom controls (fixed position) */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button onClick={() => setViewport(v => ({ ...v, zoom: v.zoom * 1.2 }))}>
          +
        </button>
        <span>{Math.round(viewport.zoom * 100)}%</span>
        <button onClick={() => setViewport(v => ({ ...v, zoom: v.zoom / 1.2 }))}>
          -
        </button>
      </div>
    </div>
  );
}
```

#### 성능 최적화: Viewport Culling

뷰포트 밖의 노드는 렌더링하지 않음:

```typescript
function isNodeVisible(
  node: CanvasNode,
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number
): boolean {
  const layout = node.getComputedLayout();
  
  // Convert node bounds to screen space
  const screenLeft = layout.left * viewport.zoom + viewport.x;
  const screenTop = layout.top * viewport.zoom + viewport.y;
  const screenRight = screenLeft + layout.width * viewport.zoom;
  const screenBottom = screenTop + layout.height * viewport.zoom;
  
  // Check if node overlaps with viewport
  return (
    screenRight > 0 &&
    screenBottom > 0 &&
    screenLeft < containerWidth &&
    screenTop < containerHeight
  );
}

// Usage in render
const visibleNodes = nodes.filter(node => 
  isNodeVisible(node, viewport, containerWidth, containerHeight)
);
```

---

### 대안: React Flow 사용

더 빠른 개발이 필요하다면 **React Flow** 사용을 고려할 수 있습니다:

```bash
npm install reactflow
```

```tsx
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Variables' } },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'Functions' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
];

export function CurriculumCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.25}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

**React Flow 장점**:
- 검증된 성능 최적화 (뷰포트 컬링 내장)
- 풍부한 인터랙션 (드래그, 선택, 연결)
- 커스텀 노드/엣지 컴포넌트 지원
- TypeScript 지원

**React Flow 단점**:
- 번들 크기 추가 (~100KB gzipped)
- Yoga와 별개로 자체 레이아웃 시스템 사용
- 완전한 커스텀이 어려울 수 있음

---

### 권장 구현 전략

| 단계 | 접근법 | 이유 |
|------|--------|------|
| **MVP** | React Flow | 빠른 프로토타이핑, 검증된 UX |
| **Phase 2** | 직접 구현 고려 | 커스텀 요구사항 증가 시 |
| **Yoga 통합** | 레이아웃 계산용 | 복잡한 커리큘럼 구조 시 |

MVP에서는 React Flow로 빠르게 구현하고, 요구사항이 복잡해지면 Yoga 기반 직접 구현으로 전환하는 것을 권장합니다.

---

## Dependencies

### Required
- `@allin/extension` - Extension type
- `@allin/context` - Extension context API (ui, event, ai)
- `react` - UI rendering

### Canvas Implementation (택 1)
- `reactflow` - 검증된 노드 기반 UI 라이브러리 (권장 - MVP)
- `yoga-layout` - Flexbox 레이아웃 엔진 (직접 구현 시)
- `yoga-wasm-web` - WASM 버전 Yoga (더 빠른 성능)

### Optional (향후)
- Quiz MCP - 문제 생성 및 채점

---

## Notes

### 기존 코드베이스 패턴 준수
- RxJS `BehaviorSubject`/`Subject` for state management
- Singleton pattern for managers
- Tailwind CSS for styling
- `fromEvent` over `addEventListener`

### UI Guidelines
- `@allin/ui` 또는 `src/components` 컴포넌트 사용
- lucide-react 아이콘
- 반응형 디자인 고려

### Korean Comments
- 코드 주석은 영어로 작성
- 사용자 facing 텍스트는 한국어/다국어 지원 고려
