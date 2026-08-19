# GhostKing AI 행동 패턴 문서

## 1. 개요

GhostKing은 Unreal Engine 5.4 기반 탑다운 액션 게임의 **보스급 스켈레톤 적 캐릭터**이다. 전용 AI Controller(`AIC_Skeleteon_GhostKing`), Blackboard(`BB_Skeleton_GhostKing`), Behavior Tree(`BT_Skeleton_GhostKing`)로 구동된다.

일반 스켈레톤(Knight, Archer)과 달리 텔레포트, 소환, 블랙홀, 오브 발사 등 보스 전용 능력을 보유하며, 상태 기반(Passive/Investigating/Attacking) AI로 가장 복잡한 행동 패턴을 가진다.

---

## 2. AI 구조

```
AIC_Skeleteon_GhostKing (AI Controller)
  |-- AIPerception 컴포넌트 (적/아군/중립 감지)
  |-- 감지 이벤트 발생 시 -> AttackTarget 설정, State 변경
  |
  +-- BB_Skeleton_GhostKing (Blackboard)
  |     |-- AttackTarget      (Object - 플레이어 캐릭터)
  |     |-- State              (Enum - E_AIState)
  |     |-- SelfActor          (Object - 자기 자신)
  |     |-- PointOfInterest    (Vector - 관심 지점)
  |     |-- LastKnownLocation  (Vector - 타겟 마지막 위치)
  |     |-- LastLocation       (Vector - 이전 위치)
  |
  +-- BT_Skeleton_GhostKing (Behavior Tree)
        |-- Service: BTS_GetCurrentLocation
        |-- Decorator: BTD_Boss_HP, BTD_ChkTargetDistance,
        |              BTD_HasPatrolRoute, BTDecorator_Blackboard,
        |              BTDecorator_Cooldown
        +-- Task: (4장 참조)
```

---

## 3. 블랙보드 키 (BB_Skeleton_GhostKing.uasset에서 추출)

| 키 이름 | 타입 | 설명 |
|---------|------|------|
| `AttackTarget` | Object (ET_TopDown_Player_C) | 현재 공격 대상 (플레이어) |
| `State` | Enum (E_AIState) | 현재 AI 상태 (Passive=0, Attacking=1 등) |
| `SelfActor` | Object | 자기 자신 참조 |
| `PointOfInterest` | Vector | 조사할 관심 지점 좌표 |
| `LastKnownLocation` | Vector | 타겟의 마지막 확인 위치 |
| `LastLocation` | Vector | 이전 위치 (이동 추적용) |

---

## 4. AI 상태 (E_AIState)

Behavior Tree에서 `BTDecorator_Blackboard`를 사용해 `State` 키 값에 따라 분기한다:

| 상태 값 | 이름 | 설명 |
|---------|------|------|
| `NewEnumerator0` | **Passive** | 대기/순찰 모드. 위협 미감지 상태. |
| `NewEnumerator1` | **Attacking** | 전투 모드. 플레이어를 공격한다. |
| `NewEnumerator3` | **Investigating** | 조사 모드. 마지막 감지 위치로 이동한다. |

---

## 5. 비헤이비어 트리 구조 (BT_Skeleton_GhostKing.uasset에서 추출)

루트는 **Selector**이며, AI 상태에 따라 분기한다. 각 상태별 서브 트리 구조는 아래와 같다:

```
Root (Selector)
  |
  +-- [State == Passive] PassiveState (Selector)
  |     |
  |     +-- [BTD_HasPatrolRoute] Patrol (Sequence)
  |     |     +-- BTT_SetMovementSpeed (걷기)
  |     |     +-- BTT_MoveAlongPatrolRoute
  |     |
  |     +-- Roaming (Sequence)
  |           +-- BTT_Roam
  |           +-- BTT_SetStateAsPassive
  |
  +-- [State == Investigating] InvestigatingState (Sequence)
  |     +-- BTT_FocusTarget
  |     +-- BTTask_MoveTo (플레이어 위치로 이동)
  |     +-- BTT_ClearFocus
  |
  +-- [State == Attacking] CombatState (Selector)
        |
        +-- [BTD_Boss_HP] StunAttack (Sequence)
        |     +-- BTT_FocusTarget
        |     +-- BTT_Boss_Teleport
        |     +-- BTT_Boss_Sumon (x6 -- 미니언 6회 소환)
        |     +-- BTT_SetMovementSpeed
        |     +-- BTTask_Wait
        |     +-- BTT_ClearFocus
        |
        +-- MeleeAttack (Sequence)
        |     +-- BTT_FocusTarget
        |     +-- BTTask_MoveTo (플레이어에게 접근)
        |     +-- BTT_Boss_Swing
        |     +-- BTT_Boss_Slam
        |     +-- BTT_ClearFocus
        |
        +-- RangeAttack -- A 패턴 (Sequence)
        |     +-- BTT_FocusTarget
        |     +-- BTT_OrbShoot (x2)
        |     +-- BTT_ClearFocus
        |     +-- BTTask_MoveTo (플레이어에게 접근)
        |
        +-- RangeAttack -- B 패턴 (Sequence)
        |     +-- BTT_FocusTarget
        |     +-- BTT_Blackhole
        |     +-- BTT_ClearFocus
        |     +-- BTTask_MoveTo (플레이어에게 접근)
        |
        +-- StunAttack -- 돌진 패턴 (Sequence)
        |     +-- BTT_Boss_Charge
        |     +-- BTT_Boss_Charging
        |     +-- BTT_Boss_Teleport
        |     +-- BTTask_MoveTo (플레이어에게 접근)
        |
        +-- [BTD_Boss_HP] Special Combo (Sequence)
              +-- BTT_Boss_Teleport
              +-- BTT_Boss_Sumon (x6)
              +-- BTT_SetMovementSpeed
              +-- BTT_OrbShoot
              +-- BTT_Blackhole
              +-- BTTask_Wait
              +-- BTT_ClearFocus
```

**참고:** 여러 분기에 `BTDecorator_Cooldown`이 적용되어 같은 공격의 연속 사용을 방지한다.

---

## 6. 행동 흐름 상세

### 페이즈 1: Passive (순찰/배회)

- **조건**: State == Passive (플레이어 미감지)
- **행동**:
  - 순찰 경로가 있으면: `BP_PatrolRoute`를 따라 걷기 속도로 이동
  - 순찰 경로가 없으면: 스폰 주변을 배회
- **전환**: AIPerception이 플레이어 감지 -> Investigating 또는 Attacking으로 전환

### 페이즈 2: Investigating (조사)

- **조건**: State == Investigating (플레이어 감지했으나 미확인)
- **행동**:
  - 타겟 방향으로 시선 고정 (FocusTarget)
  - 플레이어의 마지막 감지 위치로 이동 (MoveTo)
  - 도착 후 시선 해제 (ClearFocus)
- **전환**: 플레이어 확인 -> Attacking / 플레이어 미발견 -> Passive

### 페이즈 3: Combat -- 일반 공격

- **조건**: State == Attacking (플레이어 확인)
- **근접 공격 (MeleeAttack)**:
  - 시선 고정 -> 플레이어에게 접근 -> Boss Swing -> Boss Slam -> 시선 해제
- **원거리 공격 A (RangeAttack)**:
  - 시선 고정 -> Orb Shoot x2 -> 시선 해제 -> 플레이어에게 접근
- **원거리 공격 B (RangeAttack)**:
  - 시선 고정 -> Blackhole -> 시선 해제 -> 플레이어에게 접근
- **돌진 공격 (StunAttack)**:
  - Boss Charge -> Boss Charging -> Boss Teleport -> 플레이어에게 접근
- 모든 공격 분기에 `BTDecorator_Cooldown` 적용으로 쿨타임 관리

### 페이즈 4: Combat -- 보스 HP 페이즈 (격노)

- **조건**: `BTD_Boss_HP` 데코레이터가 HP 임계치 이하 감지
- **StunAttack 시퀀스**:
  - 텔레포트로 재배치
  - 미니언 6회 소환 (Skeleton Knight + Skeleton Archer)
  - 이동 속도 변경
  - 대기 (시전/회복)
  - 시선 해제
- **Special Combo (저HP)**:
  - 텔레포트 -> 미니언 6회 소환 -> 속도 변경 -> Orb Shoot -> Blackhole -> 대기 -> 시선 해제
- 이 페이즈에서는 재배치, 미니언 소환, 광역 공격을 동시에 조합

---

## 7. 소환 미니언

GhostKing은 `BTT_Boss_Sumon`으로 아래 미니언을 소환한다:

| 미니언 | 블루프린트 | 역할 |
|--------|-----------|------|
| Skeleton Knight | `BP_Skeleton_knight` | 근접 전위 |
| Skeleton Archer | `BP_Skeleton_archer` | 원거리 후위 |

소환 태스크가 한 시퀀스에 **6회** 등장하며, 한 번의 소환 페이즈에서 다수의 미니언을 생성한다. 추가로 `HealthPotion`(`/Game/Blueprints/HealthPotion`) 레퍼런스가 발견되어, 보스전 중 힐 포션 드롭 가능성이 있다.

---

## 8. 공격 패턴 요약표

| 공격 | 사거리 | 유형 | 쿨다운 | 페이즈 |
|------|--------|------|--------|--------|
| Boss Swing | 근접 | 단일 대상 | 있음 | 일반 전투 |
| Boss Slam | 근접 | 광역 (AoE) | 있음 | 일반 전투 |
| Boss Charge + Charging | 중거리 | 돌진 (갭클로저) | 있음 | 일반 전투 |
| Orb Shoot (x2) | 원거리 | 투사체 | 있음 | 일반 전투 / 격노 |
| Blackhole | 원거리 | 광역 (흡인 + 데미지) | 있음 | 일반 전투 / 격노 |
| Teleport | 자기 자신 | 재배치 | -- | 격노 / 돌진 콤보 |
| Summon (x6) | 자기 자신 | 미니언 소환 | -- | 격노 전용 |

---

## 9. 다른 스켈레톤 AI와 비교

| 항목 | Knight | Archer | GhostKing |
|------|--------|--------|-----------|
| AI Controller | AIC_Skeleteon_Knight | AIC_Skeleteon_Archer | AIC_Skeleteon_GhostKing |
| Blackboard | BB_Skeleton_Knight | BB_Skeleton_Archer | BB_Skeleton_GhostKing |
| Behavior Tree | BT_Skeleton_Knight | BT_Skeleton_Archer | BT_Skeleton_GhostKing |
| 역할 | 근접 미니언 | 원거리 미니언 | 보스 |
| AI 상태 | Passive/Investigating/Attacking | Passive/Investigating/Attacking | Passive/Investigating/Attacking |
| 텔레포트 | 불가 | 불가 | 가능 |
| 소환 | 불가 | 불가 | 가능 (6회) |
| 블랙홀 | 불가 | 불가 | 가능 |
| 오브 발사 | 불가 | 불가 | 가능 |
| HP 페이즈 전환 | 없음 | 없음 | 있음 (BTD_Boss_HP) |
| 순찰 | 가능 | 가능 | 가능 |
| 쿨다운 관리 | 기본 | 기본 | 공격별 개별 쿨다운 |

---

## 10. 파일 레퍼런스

### GhostKing 핵심 파일
- `AI/AIC_Skeleteon_GhostKing.uasset` -- AI Controller (AIPerception 포함)
- `AI/BB_Skeleton_GhostKing.uasset` -- Blackboard (키 6개)
- `AI/BT_Skeleton_GhostKing.uasset` -- Behavior Tree (상태 기반 분기)

### 보스 전용 태스크
- `AI/Task/BTT_Boss_Charge.uasset` -- 돌진 시작
- `AI/Task/BTT_Boss_Charging.uasset` -- 돌진 유지
- `AI/Task/BTT_Boss_Slam.uasset` -- 내려찍기
- `AI/Task/BTT_Boss_Swing.uasset` -- 휘두르기
- `AI/Task/BTT_Boss_Sumon.uasset` -- 미니언 소환
- `AI/Task/BTT_Boss_Teleport.uasset` -- 텔레포트
- `AI/Task/BTT_Blackhole.uasset` -- 블랙홀
- `AI/Task/BTT_OrbShoot.uasset` -- 오브 발사

### 데코레이터
- `AI/Task/BTD_Boss_HP.uasset` -- HP 임계치 확인 (페이즈 전환)
- `AI/Task/BTD_ChkTargetDistance.uasset` -- 거리 기반 공격 선택
- `AI/Task/BTD_HasPatrolRoute.uasset` -- 순찰 경로 유무 확인

### Enum
- `AI/Enums/E_AIState.uasset` -- Passive(0), Attacking(1), Investigating(3)
- `AI/Enums/E_AISense.uasset` -- 감지 유형
- `AI/Enums/E_MovementSpeed.uasset` -- 속도 단계 (걷기=1, 달리기=2, 전력질주=3)

### 공용
- `AI/Task/BPI_EnemyAI.uasset` -- 적 AI 블루프린트 인터페이스
- `AI/BP_PatrolRoute.uasset` -- 순찰 경로 블루프린트
- `AI/Task/BTS_GetCurrentLocation.uasset` -- 현재 위치 갱신 서비스
