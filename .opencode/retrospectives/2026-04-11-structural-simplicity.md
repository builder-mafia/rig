# 구조 단순성 우선 원칙

## 1. 무엇이 문제였는가

- 하위 레이어인 Rust 쪽에 `preset`, `config registration` 같은 제품 개념이 들어가면서 책임 경계가 흐려졌다.
- 실제로 필요한 동작은 "주어진 로컬 경로를 검사"하는 것뿐인데, 그 위에 feature-specific 타입과 함수가 추가되어 구조가 과도하게 커졌다.
- `check_config_file_presets`, `get_registered_config_paths` 같은 이름은 동작 자체보다 현재 기능 맥락에 묶여 재사용성을 낮췄다.
- 등록 여부 판단까지 Rust가 맡으면서, 파일 시스템 검사와 제품 도메인 로직이 한 레이어에 섞였다.

## 2. As-Is vs To-Be

| 구분 | As-Is | To-Be |
|---|---|---|
| Rust 책임 | preset 검사, 등록 상태 판단, config 맥락 이해 | 로컬 경로 resolve 및 존재/타입 검사만 담당 |
| 프론트 책임 | preset 메타데이터 일부만 가짐 | preset 정의, 등록 여부 판단, 선택/등록 UX 담당 |
| 함수 이름 | `check_config_file_presets`, `get_registered_config_paths` | `check_local_paths` 같은 generic 이름 |
| 타입 구조 | preset 전용 Rust 엔티티 추가 | Rust는 generic path check input/output만 유지 |
| 개념 배치 | 제품 개념이 Rust/storage까지 내려감 | 제품 개념은 frontend/application에만 남김 |
| 재사용성 | config file 기능에 종속 | 다른 기능에서도 재사용 가능한 local path inspection primitive |

## 3. 더 나은 구조 경계

- Rust/backend/storage 레이어는 파일 시스템 사실만 다룬다: 경로 resolve, 존재 여부, 파일/폴더 타입.
- frontend/application 레이어는 제품 의미를 다룬다: preset, 추천, 등록, 선택, 이미 추가됨.
- `already registered`는 파일 시스템의 일반 속성이 아니라 제품 상태이므로 프론트에서 계산한다.
- preset 메타데이터는 UI와 제품 정책의 일부이므로 프론트 상수/모듈에 둔다.
- 하위 레이어 API는 현재 기능명이 아니라 동작 자체를 기준으로 설계한다.

## 4. 재사용 가능한 작업 규칙

- lower layer에는 제품 개념을 넣지 않는다.
- 실제 책임이 generic 하면 이름도 generic 하게 짓는다.
- feature-specific API 여러 개보다 general primitive 하나를 먼저 찾는다.
- 등록, 선택, 추천, preset 같은 의미는 application layer에 둔다.
- 새 타입은 실제 도메인 경계를 표현할 때만 추가한다.
- 파일 시스템 검사와 제품 상태 판단을 한 함수에 섞지 않는다.

## 5. 리팩터링 방향

- Rust API는 `local path inspection` 하나로 수렴시킨다.
- Rust 반환값에서는 제품 상태를 제거하고 파일 시스템 정보만 남긴다.
- preset 관련 타입과 메타데이터는 전부 프론트로 올린다.
- 프론트에서 `configFiles`와 path check 결과를 조합해 `alreadyRegistered`를 계산한다.
- 이후 유사 요구사항도 먼저 "generic primitive로 줄일 수 있는지"부터 검토한다.

## 6. 다음 요청부터 따를 프롬프트

```text
구현 전에 먼저 가장 단순한 구조 경계를 잡아라.

- lower layer(Rust/backend/storage)는 generic primitive만 가져가라.
- frontend/application에 남아야 할 제품 개념(preset, 등록, 선택, 추천)을 하위 레이어로 내리지 마라.
- 새 타입/함수/엔티티를 추가하기 전에, 기존 동작을 더 일반적인 하나의 primitive로 표현할 수 있는지 먼저 검토하라.
- 함수 이름은 현재 기능명이 아니라 실제 동작 기준으로 지어라.
- As-Is와 To-Be를 먼저 비교해서, 어떤 개념이 어느 레이어에 있어야 하는지 명확히 설명한 뒤 구현하라.
```
