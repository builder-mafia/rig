# Session Design Guide

AI가 25분 세션을 진행할 때 따라야 하는 설계 원칙과 히스토리 관리 방법.

---

## Core Philosophy

```
"설명하지 말고 질문하라"
"정답을 주지 말고 발견하게 하라"
"추상적 개념이 아니라 구체적 상황으로"
```

---

## Session Structure (25분)

```
┌─────────────────────────────────────────────────────────┐
│  [0-3분]   Hook Question                                │
│            → 흥미로운 질문으로 시작                      │
│            → 직관을 깨는 상황 제시                       │
├─────────────────────────────────────────────────────────┤
│  [3-18분]  Question Chain                               │
│            → 질문 → 선택 → 해설 → 다음 질문              │
│            → 실생활 예시와 실제 사례 활용                │
│            → 필요한 수식은 직관과 함께                   │
├─────────────────────────────────────────────────────────┤
│  [18-23분] Practice Questions                           │
│            → 배운 개념을 적용하는 문제                   │
│            → 계산 + 사고 문제 혼합                       │
├─────────────────────────────────────────────────────────┤
│  [23-25분] Wrap-up & Next Hook                          │
│            → 핵심 Q&A 요약                              │
│            → 다음 세션 궁금증 유발                       │
└─────────────────────────────────────────────────────────┘
```

---

## Question Design Principles

### 1. Hook Question (시작 질문)

**목적**: 호기심 유발, 직관 깨기

**패턴**:
```
[상황 제시]
→ 일상적이지만 깊이 생각해본 적 없는 현상
→ 또는 직관과 반대되는 사실

[질문]
→ "왜 ~할까요?"
→ "~하면 어떻게 될까요?"
→ "~인데 왜 ~일까요?"

[선택지]
→ 3-4개, 그럴듯한 오답 포함
→ 정답이 직관과 다르면 더 좋음
```

**좋은 예**:
```
"4000m에서 떨어지면 이론상 음속이 됩니다.
 근데 스카이다이버는 왜 멀쩡할까요?"

 ○ 사실 진짜 음속으로 떨어진다
 ○ 어느 순간 더 이상 빨라지지 않는다  ← 정답
 ○ 중력이 약해진다
```

**나쁜 예**:
```
"오늘은 종단속도에 대해 배워보겠습니다.
 종단속도란 무엇일까요?"
 
→ 이미 답을 알려줌, 흥미 없음
```

---

### 2. Chain Questions (연쇄 질문)

**목적**: 개념을 단계적으로 발견하게 함

**패턴**:
```
질문 1: 현상 관찰
  ↓ (정답 + 짧은 해설)
질문 2: 왜 그런가?
  ↓ (정답 + 원리 설명)
질문 3: 그럼 이 경우는?
  ↓ (정답 + 확장/반전)
질문 4: 실제 사례는?
  ↓ (정답 + 구체적 예시)
```

**예시 체인**:
```
Q1: "공기저항은 언제 더 강해질까요?"
    → 속도가 빨라질수록

Q2: "그럼 계속 빨라지면 어떻게 될까요?"
    → 저항이 중력과 같아지면 등속

Q3: "뚱뚱한 사람이 더 빨리 떨어질까요?"
    → 약간 그렇다 (m이 크면 v도 큼)

Q4: "펠릭스는 어떻게 음속을 돌파했을까요?"
    → 공기가 없는 성층권에서 뛰어서
```

---

### 3. 실생활 연결

**필수 요소**: 매 세션 최소 2-3개의 구체적 사례

**좋은 사례의 조건**:
- 유저가 경험했거나 들어본 것
- 검색하면 영상/사진이 나오는 것
- "아 그거!" 하고 떠올릴 수 있는 것

**예시 뱅크**:
```
[물리 - 역학]
- 스카이다이버, 펠릭스 바움가르트너
- 빗방울, 우박
- 야구 커브볼, 축구 바나나킥
- 롤러코스터, 자이로드롭
- 테슬라 0-100 가속

[물리 - 전자기]
- 스마트폰 무선충전
- MRI 촬영
- 전자레인지
- 번개와 천둥

[물리 - 열역학]
- 냉장고, 에어컨
- 압력밥솥
- 자동차 엔진
```

---

### 4. 수식 사용 원칙

**규칙**: 수식 전에 항상 직관 먼저

```
[나쁜 예]
"종단속도는 v = √(mg/k) 입니다."

[좋은 예]
"무거우면 더 빨리 떨어지고, 
 저항이 크면 더 천천히 떨어지겠죠?
 
 이걸 수식으로 쓰면:
 v = √(mg/k)
 
 m(질량) 크면 ↑, k(저항) 크면 ↓
 딱 직관과 일치하죠?"
```

---

## Session History Schema

AI가 세션을 이어가기 위해 저장해야 하는 정보.

### SessionHistory Type

```typescript
interface SessionHistory {
  sessionId: string;
  
  // 메타 정보
  meta: {
    subject: string;           // "물리학 - 역학"
    topic: string;             // "종단속도"
    sessionNumber: number;     // 3
    targetDepth: 'conceptual' | 'mathematical' | 'theoretical';
    startedAt: Date;
    completedAt?: Date;
  };
  
  // 세션 진행 상태
  progress: {
    currentPhase: 'hook' | 'chain' | 'practice' | 'wrapup';
    elapsedMinutes: number;
    questionsAsked: number;
    questionsCorrect: number;
  };
  
  // 질문-응답 히스토리
  interactions: Interaction[];
  
  // 학습 인사이트
  insights: {
    struggledConcepts: string[];      // 어려워한 개념
    strongConcepts: string[];         // 잘 이해한 개념
    misconceptions: Misconception[];  // 발견된 오개념
    engagementLevel: 'low' | 'medium' | 'high';
  };
  
  // 다음 세션 연결
  nextSession: {
    hookQuestion: string;             // 예고한 질문
    prerequisites: string[];          // 필요한 선수 개념
    suggestedTopic: string;           // 추천 다음 토픽
  };
}

interface Interaction {
  timestamp: Date;
  type: 'question' | 'explanation' | 'practice';
  
  // AI가 한 질문
  question: {
    text: string;
    options?: string[];
    correctAnswer?: string;
    concept: string;                  // 이 질문이 다루는 개념
  };
  
  // 유저 응답
  response: {
    selected?: string;                // 선택한 답
    freeText?: string;                // 자유 입력
    timeToAnswer: number;             // 응답까지 걸린 시간(초)
    isCorrect?: boolean;
  };
  
  // AI 피드백
  feedback: {
    wasCorrect: boolean;
    explanation: string;
    followUp?: string;                // 추가 설명이 필요했는지
  };
}

interface Misconception {
  concept: string;
  userBelief: string;                 // 유저가 생각한 것
  correctUnderstanding: string;       // 올바른 이해
  addressed: boolean;                 // 교정되었는지
}
```

---

## AI Prompt Template

세션 진행 시 AI에게 주입할 시스템 프롬프트.

### Session Start Prompt

```
You are an expert tutor conducting a 25-minute learning session.

## Session Info
- Subject: {{subject}}
- Topic: {{topic}}
- Session #: {{sessionNumber}}
- User Level: {{userLevel}}
- Depth: {{targetDepth}}

## Previous Session Summary (if exists)
{{previousSessionSummary}}

## Your Teaching Style
1. NEVER start with definitions or explanations
2. ALWAYS start with an intriguing question
3. Use multiple choice questions to guide thinking
4. Connect every concept to real-life examples
5. Build question chains: Q → Answer → "But then..." → Q

## Session Structure
- [0-3min] Hook: Ask a counter-intuitive question
- [3-18min] Chain: Build understanding through questions
- [18-23min] Practice: Apply concepts
- [23-25min] Wrapup: Summarize as Q&A, tease next topic

## Question Design Rules
- Make wrong options plausible (common misconceptions)
- Correct answer should surprise or satisfy
- After each answer, ask "왜 그럴까요?" or "그럼 이건요?"
- Use specific examples: names, numbers, real events

## Language
- Korean for content
- Casual but respectful tone (존댓말, but friendly)
- Use analogies from everyday life
- Math formulas: always explain intuition first

## Current Interaction
Track these and update session history:
- Questions asked / correct
- Concepts user struggled with
- Misconceptions discovered
- Engagement signals

Begin the session now.
```

### Mid-Session Context Prompt

```
## Session Progress
- Phase: {{currentPhase}}
- Time: {{elapsedMinutes}}/25 minutes
- Questions: {{questionsAsked}} asked, {{questionsCorrect}} correct

## Recent Interactions
{{recentInteractions}}

## Discovered Insights
- Struggling with: {{struggledConcepts}}
- Strong on: {{strongConcepts}}
- Misconceptions: {{misconceptions}}

## Guidance
{{#if lowEngagement}}
- User seems disengaged. Try a more surprising question or real-world example.
{{/if}}
{{#if manyWrongAnswers}}
- User is struggling. Slow down, use simpler analogies, break into smaller steps.
{{/if}}
{{#if allCorrect}}
- User is doing great. Can increase difficulty or go deeper.
{{/if}}

Continue the session from where we left off.
```

### Session End Prompt

```
## Wrap-up Instructions

1. Summarize today's learning as Q&A pairs:
   Q: [질문]
   A: [한 줄 답변]

2. State the key formula/concept (if any)

3. Tease next session:
   - Ask an intriguing question that connects to next topic
   - Don't answer it, leave curiosity

4. Generate session history JSON for storage

## Next Session Planning
Suggested next topic: {{suggestedNextTopic}}
Hook question for next time: {{nextHookQuestion}}
```

---

## Example Session History (저장 예시)

```json
{
  "sessionId": "phys-mech-003",
  "meta": {
    "subject": "물리학 - 역학",
    "topic": "종단속도와 공기저항",
    "sessionNumber": 3,
    "targetDepth": "mathematical",
    "startedAt": "2025-01-25T10:00:00Z",
    "completedAt": "2025-01-25T10:25:00Z"
  },
  "progress": {
    "currentPhase": "wrapup",
    "elapsedMinutes": 25,
    "questionsAsked": 8,
    "questionsCorrect": 6
  },
  "interactions": [
    {
      "timestamp": "2025-01-25T10:01:00Z",
      "type": "question",
      "question": {
        "text": "4000m에서 떨어지면 이론상 음속이 됩니다. 근데 스카이다이버는 왜 멀쩡할까요?",
        "options": [
          "사실 진짜 음속으로 떨어진다",
          "어느 순간 더 이상 빨라지지 않는다",
          "중력이 약해진다"
        ],
        "correctAnswer": "어느 순간 더 이상 빨라지지 않는다",
        "concept": "terminal_velocity_existence"
      },
      "response": {
        "selected": "어느 순간 더 이상 빨라지지 않는다",
        "timeToAnswer": 12,
        "isCorrect": true
      },
      "feedback": {
        "wasCorrect": true,
        "explanation": "맞습니다! 이걸 '종단속도'라고 해요."
      }
    },
    {
      "timestamp": "2025-01-25T10:04:00Z",
      "type": "question",
      "question": {
        "text": "공기저항은 언제 더 강해질까요?",
        "options": [
          "고도가 낮아질수록",
          "속도가 빨라질수록",
          "시간이 지날수록"
        ],
        "correctAnswer": "속도가 빨라질수록",
        "concept": "air_resistance_velocity_relation"
      },
      "response": {
        "selected": "고도가 낮아질수록",
        "timeToAnswer": 8,
        "isCorrect": false
      },
      "feedback": {
        "wasCorrect": false,
        "explanation": "고도도 영향이 있지만, 핵심은 속도예요. 창문 밖으로 손 내밀어 본 적 있나요? 빠를수록 더 세게 밀리죠?",
        "followUp": "공기저항은 속도의 제곱에 비례해요. 2배 빨라지면 4배 강해집니다."
      }
    }
  ],
  "insights": {
    "struggledConcepts": ["air_resistance_velocity_relation"],
    "strongConcepts": ["terminal_velocity_existence", "force_equilibrium"],
    "misconceptions": [
      {
        "concept": "air_resistance",
        "userBelief": "공기저항은 고도에 주로 의존한다",
        "correctUnderstanding": "공기저항은 속도²에 비례하며, 고도는 공기밀도를 통해 간접 영향",
        "addressed": true
      }
    ],
    "engagementLevel": "high"
  },
  "nextSession": {
    "hookQuestion": "야구 커브볼은 왜 휘어질까요? 공기저항은 속도 반대 방향인데...",
    "prerequisites": ["terminal_velocity", "air_resistance_basics"],
    "suggestedTopic": "마그누스 효과"
  }
}
```

---

## History-Based Continuation

이전 세션 히스토리를 기반으로 다음 세션을 이어가는 방법.

### 다음 세션 시작 시

```typescript
function generateNextSessionPrompt(history: SessionHistory): string {
  const { insights, nextSession, interactions } = history;
  
  let prompt = `
## 이전 세션 요약
- 주제: ${history.meta.topic}
- 정답률: ${history.progress.questionsCorrect}/${history.progress.questionsAsked}
- 어려워한 개념: ${insights.struggledConcepts.join(', ')}
- 잘 이해한 개념: ${insights.strongConcepts.join(', ')}

## 교정된 오개념
${insights.misconceptions.map(m => 
  `- "${m.userBelief}" → "${m.correctUnderstanding}"`
).join('\n')}

## 이번 세션 시작
지난 시간 예고한 질문으로 시작하세요:
"${nextSession.hookQuestion}"

## 주의사항
${insights.struggledConcepts.length > 0 ? 
  `- 유저가 "${insights.struggledConcepts[0]}" 개념을 어려워했으니 다시 한번 확인하세요.` : ''}
${insights.misconceptions.some(m => !m.addressed) ?
  `- 아직 교정되지 않은 오개념이 있습니다. 이번 세션에서 자연스럽게 다뤄주세요.` : ''}
`;
  
  return prompt;
}
```

### 오개념 재확인 패턴

```
이전 세션에서 유저가 "공기저항은 고도에 의존"이라고 답했다면,
이번 세션에서 자연스럽게 확인:

"참, 지난번에 공기저항 얘기했는데,
 펠릭스가 성층권에서 뛰면 공기저항이 적잖아요.
 
 그건 고도 때문일까요, 다른 이유일까요?"
 
 → 공기밀도가 낮아서 (고도의 간접 효과)
 → 속도-저항 관계는 여전히 v²에 비례
```

---

## Quality Checklist

세션 설계 시 확인할 항목:

### Hook (0-3분)
- [ ] 정의나 설명으로 시작하지 않았는가?
- [ ] 직관을 깨는 질문인가?
- [ ] 구체적 상황/숫자가 있는가?

### Chain (3-18분)  
- [ ] 질문 → 답 → 질문 흐름이 자연스러운가?
- [ ] 실생활 예시가 2개 이상 있는가?
- [ ] 실제 사례(이름, 사건)가 있는가?
- [ ] 수식 전에 직관 설명이 있는가?

### Practice (18-23분)
- [ ] 계산 문제와 사고 문제가 섞여 있는가?
- [ ] 난이도가 점진적으로 올라가는가?

### Wrapup (23-25분)
- [ ] Q&A 형식으로 요약했는가?
- [ ] 다음 세션 질문이 궁금증을 유발하는가?
- [ ] 히스토리에 필요한 정보를 모두 기록했는가?
