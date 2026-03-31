# 김승민 포트폴리오 — 구현 명세서

> Claude Code를 위한 구현 지침서.
> 콘텐츠 데이터는 `content.json`을 참조할 것.

---

## 1. 프로젝트 개요

**목표:** NYT 인터랙티브 롱폼 아티클 감성의 스크롤 기반 포트폴리오 사이트.
채용 담당자가 55초 안에 핵심을 파악할 수 있되, 천천히 읽을수록 깊이가 드러나는 구조.

**핵심 콘셉트:** "인쇄 매체 × 인터랙티브 웹"
활자·잉크·종이의 감성을 기반으로, 스크롤이 곧 이야기 진행인 경험을 만든다.
AI가 찍어낸 것 같은 카드·그라디언트·유리 효과는 절대 사용하지 않는다.

---

## 2. 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Astro** (정적 사이트) | 빠른 빌드, 추가 JS 최소화, SEO 좋음 |
| 스타일링 | **CSS Modules** (또는 vanilla CSS) | Tailwind 사용 금지 — 유틸리티 클래스 조합이 AI 티가 남 |
| 스크롤 애니메이션 | **GSAP ScrollTrigger** | CDN으로 로드, scrub/pin 활용 |
| 폰트 | Google Fonts CDN | Fraunces + Source Serif 4 조합 (아래 디자인 토큰 참조) |
| 배포 | **Vercel** | Astro와 궁합 좋음 |

> Tailwind, shadcn, Radix 사용 금지. 컴포넌트 라이브러리 전부 금지.
> 모든 스타일은 직접 작성한다.

---

## 3. 파일 구조

```
/
├── public/
│   └── fonts/ (필요시 self-host)
├── src/
│   ├── layouts/
│   │   └── Base.astro          # html, head, nav, footer 공통
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── StorySection.astro  # 01 철학 (longform 텍스트)
│   │   ├── Experience.astro    # 02 경력 타임라인
│   │   ├── ProjectChapter.astro # 03 작업물 (sticky scroll)
│   │   ├── Skills.astro        # 04 기술
│   │   └── Contact.astro       # 05 연락처
│   ├── pages/
│   │   └── index.astro         # 모든 섹션 조립
│   └── styles/
│       ├── global.css          # CSS 변수, reset, 기본 타이포
│       └── animations.css      # 스크롤 리빌, 트랜지션
├── content.json                # 모든 텍스트·링크 데이터
└── SPEC.md                     # 이 파일
```

---

## 4. 디자인 토큰

아래 CSS 변수를 `global.css`의 `:root`에 선언하고 전체에서 사용한다.

```css
:root {
  /* 배경 — 순백 아닌 따뜻한 종이 느낌 */
  --bg:        #F7F3EE;   /* 메인 배경: 크림 */
  --bg-warm:   #EDE8E0;   /* 섹션 구분용 약간 어두운 크림 */
  --bg-inset:  #E5DFD5;   /* 인셋 블록 배경 */

  /* 텍스트 */
  --text:      #1A1612;   /* 거의 검정, 순흑 아님 */
  --text-mid:  #4A4540;   /* 본문 보조 */
  --text-dim:  #8C857C;   /* 캡션, 메타 정보 */

  /* 악센트 — 잉크 색감의 붉은 갈색 (버밀리온) */
  --accent:    #B84A2E;   /* 주요 강조: 챕터 번호, 링크, 라인 */
  --accent-lt: #D4694A;   /* 호버 상태 */

  /* 선·구분 */
  --rule:      rgba(26,22,18,0.12); /* 가는 구분선 */
  --rule-heavy: rgba(26,22,18,0.35); /* 굵은 구분선 */

  /* 타이포그래피 스케일 */
  --fs-hero:   clamp(4rem, 10vw, 9rem);
  --fs-h1:     clamp(2.2rem, 5vw, 4rem);
  --fs-h2:     clamp(1.5rem, 3vw, 2.5rem);
  --fs-body:   clamp(1rem, 1.5vw, 1.125rem);
  --fs-small:  0.8rem;
  --fs-mono:   0.75rem;

  /* 폰트 패밀리 */
  --font-display: 'Fraunces', Georgia, serif;
    /* → 제목, 챕터 번호, 풀쿼트. 빈티지 가변 세리프 */
  --font-body:    'Source Serif 4', 'Georgia', serif;
    /* → 본문 전체. 에디토리얼 읽기 최적화 세리프 */
  --font-mono:    'DM Mono', 'Courier New', monospace;
    /* → 날짜, 태그, 기술 스펙 */

  /* 간격 */
  --section-gap: clamp(6rem, 12vw, 10rem);
  --content-max: 680px;   /* longform 텍스트 최대 너비 */
  --wide-max:    1200px;  /* 레이아웃 최대 너비 */
}
```

**폰트 로드 (Google Fonts):**
```html
<link href="https://fonts.googleapis.com/css2?
  family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300;1,9..144,600
  &family=Source+Serif+4:ital,wght@0,300;0,400;1,300;1,400
  &family=DM+Mono:wght@400;500
  &display=swap" rel="stylesheet">
```

---

## 5. 레이아웃 원칙

### 5-1. 기본 그리드
- 페이지 좌우 패딩: `clamp(1.5rem, 8%, 6rem)`
- longform 텍스트(스토리 섹션): `max-width: var(--content-max); margin: 0 auto`
- 와이드 레이아웃(프로젝트 sticky): `max-width: var(--wide-max); margin: 0 auto`

### 5-2. 절대 금지 패턴
- ❌ 둥근 카드 (`border-radius: 12px` 이상)
- ❌ box-shadow 카드 부유 효과
- ❌ 그라디언트 배경 (배경용 전면 금지. 텍스트 강조에만 허용)
- ❌ 아이콘 라이브러리 (Font Awesome, Lucide 등)
- ❌ 유리모피즘 (backdrop-filter blur 카드)
- ❌ 순백 `#ffffff` 배경
- ❌ 버튼에 border-radius 8px 이상
- ❌ 호버 시 카드 위로 뜨는 효과 (`translateY(-4px)` 류)

### 5-3. 적극 사용할 패턴
- ✅ 얇은 수평선(`border-top: 1px solid var(--rule)`)으로 섹션 구분
- ✅ 좌측 2px 세로선 + 들여쓰기로 인용·강조 블록
- ✅ 대문자 letterspacing 레이블 (`font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase`)
- ✅ 드롭캡 (CSS `::first-letter`)
- ✅ 오버사이즈 타이포 (히어로 제목)
- ✅ 직각 버튼 (`border-radius: 0`)

---

## 6. 섹션별 구현 명세

### 6-0. `<Nav>`

```
구조:
  - 좌: 이름 "김승민" (--font-mono, 0.85rem, letter-spacing: 0.15em)
  - 우: 텍스트 링크 4개 [작업물 / 경력 / 기술 / 연락]

스타일:
  - position: fixed, top: 0, z-index: 100
  - padding: 1.25rem clamp(1.5rem, 8%, 6rem)
  - background: rgba(247,243,238,0.92), backdrop-filter: blur(6px)
  - 하단 border: 1px solid var(--rule) — 스크롤 60px 이후 나타남 (JS)
  - 링크: --text-dim 색상, 호버 시 --accent, transition 0.2s
  - 모바일: 링크 숨김 (768px 이하)

JS:
  window.addEventListener('scroll', () => {
    nav.classList.toggle('has-border', window.scrollY > 60);
  });
```

---

### 6-1. `<Hero>`

```
레이아웃: 수직 중앙 정렬, min-height: 100svh, padding-top: 6rem

요소 (위→아래):
  1. eyebrow — "컨텐츠 기획자 · Quest Designer"
     font: --font-mono, --fs-small, --accent, uppercase, letter-spacing 0.2em
     왼쪽에 2rem 가로선(border-bottom 아님, pseudo로) 앞에 붙임

  2. h1 — "김승민" (줄바꿈) "의 기록"
     font: --font-display, --fs-hero, font-weight 300
     "의 기록" → <em> italic, color: --accent

  3. sub — "스토리는 메커닉을 통해 살아난다. 4년 10개월, 수십 개의 미션, 하나의 신념."
     font: --font-body, 1.1rem, --text-mid, line-height 1.8

  4. CTA 두 개
     - "작업물 보기": border: 2px solid var(--text), padding 0.75rem 2rem,
       font: --font-mono, 0.75rem uppercase, border-radius: 0, background 없음
       호버: background --text, color --bg
     - "연락하기": color --accent, text-decoration underline, 호버 --accent-lt

  5. 스크롤 힌트
     "scroll to read" + 40px 가로선 (애니메이션: 좌→우 슬라이드 반복)
     position: absolute, bottom 3rem

페이지 로드 애니메이션:
  각 요소를 순서대로 fadeUp (opacity 0→1, translateY 20px→0)
  eyebrow 0.3s delay, h1 0.5s, sub 0.8s, cta 1s, 힌트 1.4s
  duration: 0.7s, easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)

배경:
  그라디언트 없음. --bg 단색.
  미묘한 종이 텍스처: SVG noise filter (opacity 3%) body::before에 적용
  → data:image/svg+xml에 feTurbulence baseFrequency=0.65 numOctaves=4
```

---

### 6-2. `<StorySection>` — 챕터 01

```
레이아웃:
  - 상단: 챕터 헤더 (아래 공통 패턴 참조)
  - 본문: max-width --content-max, 중앙 정렬

콘텐츠:
  1. 드롭캡 단락
     p:first-child::first-letter {
       font-size: 5.5em; float: left; line-height: 0.78;
       margin: 0.06em 0.1em 0 0;
       font-family: --font-display; font-weight: 600; color: --accent;
     }

  2. 본문 단락들 (3개)
     font: --font-body, --fs-body, line-height 1.85

  3. 풀쿼트 블록
     - 섹션 분리: border-top, border-bottom 1px solid var(--rule-heavy), padding 3rem 0
     - "「 」" 대신 왼쪽에 3px solid --accent 세로선 + padding-left 2rem
     - blockquote: --font-display italic, clamp(1.4rem, 2.5vw, 2rem), line-height 1.5
     - cite: --font-mono, 0.7rem, --accent, uppercase, letter-spacing 0.15em

스크롤 리빌:
  각 단락에 .reveal 클래스, IntersectionObserver로 .visible 토글
  .reveal { opacity: 0; transform: translateY(18px); transition: 0.7s ease; }
  .reveal.visible { opacity: 1; transform: none; }
```

---

### 6-3. `<Experience>` — 챕터 02

```
레이아웃: max-width --wide-max 내에서 수직 타임라인

타임라인 구조:
  - 중앙에 1px solid var(--rule) 세로선 (데스크톱)
  - 각 항목: CSS grid 3열 (1fr / 60px / 1fr)
  - 좌/우 교차 배치

각 타임라인 항목:
  ┌─────────────────────────────────┐
  │ 기간 (--font-mono, --accent)    │
  │ 회사명 (--font-display, 1.6rem) │
  │ 역할 (--font-mono, uppercase)   │
  │ 설명 (--font-body)              │
  │ 태그들 (border 1px solid)       │
  └─────────────────────────────────┘

중앙 도트:
  - 12px 원, border: 2px solid --accent
  - 현재/메인: background --accent (채움)
  - 이전: background --bg (빈 원)

태그 스타일:
  border: 1px solid var(--rule-heavy); border-radius: 0;
  padding: 0.15rem 0.5rem; font: --font-mono, 0.6rem, --text-dim

스크롤 리빌:
  각 타임라인 항목 .reveal, 0.1s씩 stagger delay
```

---

### 6-4. `<ProjectChapter>` — 챕터 03

> 가장 중요한 섹션. NYT "sticky scroll" 패턴.
> 각 프로젝트는 독립된 `<article class="project-chapter">` 컴포넌트.

```
레이아웃 (데스크톱):
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  border-top: 1px solid var(--rule);

  - 왼쪽(또는 오른쪽): sticky 비주얼 패널
    position: sticky; top: 0; height: 100vh;
    background: var(--bg-warm);
    border-right: 1px solid var(--rule);

  - 나머지: 스크롤 콘텐츠
    padding: 5rem clamp(2rem, 6%, 4rem);
    display: flex; flex-direction: column; gap: 2rem;

레이아웃 (모바일, 768px 이하):
  grid-template-columns: 1fr;
  sticky 해제, 비주얼 패널 상단 배치, min-height: 50vw

프로젝트별 좌우 교차:
  - Project 01: 비주얼 왼쪽 / 텍스트 오른쪽
  - Project 02: 텍스트 왼쪽 / 비주얼 오른쪽
  - Project 03: 비주얼 왼쪽 / 텍스트 오른쪽

스크롤 콘텐츠 구조 (content.json 데이터 활용):
  1. 프로젝트 번호 — "01 / 03" (--font-mono, --accent)
  2. 프로젝트명 — --font-display, --fs-h1, weight 300
  3. 서브타이틀 — --font-mono, uppercase, --text-dim
  ─── 구분선 ───
  4. 본문 — --font-body, --fs-body, --text-mid
  5. 디자인 의도 블록
     background: var(--bg-inset);
     border-left: 3px solid var(--accent);
     padding: 1.5rem;
     label: "디자인 의도" (--font-mono uppercase)
     text: --font-display italic, 1.05rem
  6. 미션 플로우 (해당 프로젝트만)
     단계들을 "A → B → C" 형태로 inline 나열
     각 단계: border: 1px solid var(--rule-heavy), padding 0.2rem 0.6rem, border-radius: 0
  7. 메타 정보 그리드 (2열)
     label: --font-mono uppercase --accent
     value: --font-body --text
  8. 외부 링크들
     → 텍스트 링크 스타일, 밑줄, --accent, 화살표 아이콘 없이 "↗" 문자 사용

비주얼 패널 콘텐츠:
  Project 01 — 월드맵 SVG 다이어그램 (CSS로 그린 노드+라인 구조)
               + YouTube 링크 버튼 (텍스트 버튼, 테두리만)

  Project 02 — 미션 플로우 수직 다이어그램
               (START → 노드 → 노드 → END 구조, CSS로 구현)
               + YouTube 링크 버튼

  Project 03 — "Unreal Engine 5" 에디터 감성 텍스트 아트
               (monospace 타입으로 구성한 텍스트 아스키 아트 느낌의 에디터 목업)
               + YouTube 링크 버튼

비주얼 패널 공통 규칙:
  - 배경: --bg-warm, 그림자 없음
  - 모든 다이어그램은 CSS + SVG로만 구현 (이미지 파일 없음)
  - 색상: --accent만 사용 (다채로운 색상 금지)
  - YouTube 버튼: border: 1px solid var(--rule-heavy), border-radius: 0
    padding: 0.6rem 1.2rem, --font-mono, 0.7rem
    호버: background: var(--text), color: var(--bg)
```

---

### 6-5. `<Skills>` — 챕터 04

```
레이아웃: 4열 그리드 (모바일 2열, 소형 모바일 1열)
  grid-template-columns: repeat(4, 1fr);
  gap: 3rem;

각 스킬 그룹:
  - 그룹 레이블: --font-mono, uppercase, --accent, border-bottom 1px solid var(--rule)
  - 항목들: --font-body, --text-mid
    앞에 "–" 대시 문자 (아이콘 없음)
    호버: color --text

스크롤 리빌: 0.12s씩 stagger
```

---

### 6-6. `<Contact>` — 챕터 05

```
레이아웃: 중앙 정렬, padding: var(--section-gap) clamp(1.5rem, 8%, 6rem)

구조:
  1. eyebrow — "함께 만들어봐요" (--font-mono)
  2. h2 — "새로운 이야기가" / "시작될 준비가 됐습니다"
     --font-display, --fs-h1, weight 300, italic 강조
  3. desc — --font-body, --text-mid, max-width 420px, 중앙
  4. 연락처 목록 (테이블 형태 아님, 세로 스택)
     각 항목: label (--font-mono uppercase --accent) + value (--font-body)
     항목 간 border-top: 1px solid var(--rule)
  5. 이메일 버튼
     border: 2px solid var(--text), border-radius: 0, background 없음
     호버: background --text, color --bg
```

---

### 6-7. `<Footer>`

```
border-top: 1px solid var(--rule)
padding: 1.5rem clamp(1.5rem, 8%, 6rem)
display: flex, justify-content: space-between
font: --font-mono, --fs-small, --text-dim
```

---

## 7. 공통 컴포넌트

### 챕터 헤더 (모든 섹션 상단)

```html
<div class="chapter-header">
  <span class="chapter-num">01 /</span>
  <span class="chapter-label">철학</span>
</div>
```

```css
.chapter-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--rule-heavy);
  margin-bottom: 3rem;
}
.chapter-num {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--accent);
  letter-spacing: 0.15em;
}
.chapter-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-dim);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
```

### 읽기 진행률 바

```css
#progress-bar {
  position: fixed; top: 0; left: 0;
  height: 2px;
  background: var(--accent);
  width: 0%;
  z-index: 200;
  transition: width 0.08s linear;
}
```

```js
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  document.getElementById('progress-bar').style.width =
    (window.scrollY / h * 100) + '%';
});
```

### 챕터 사이드 도트 네비게이터

```
position: fixed; left: 1.5rem; top: 50%; transform: translateY(-50%);
display: flex; flex-direction: column; gap: 0.7rem;
768px 이하 숨김

각 dot: width 5px; height 5px; border-radius 50%;
  background: var(--rule-heavy); cursor: pointer;
  .active → background: var(--accent); transform: scale(1.5);
  data-label 속성에 섹션명 저장 (호버 시 tooltip 없어도 됨)
```

---

## 8. 스크롤 애니메이션 명세

### 기본 리빌 (IntersectionObserver)

```js
// animations.css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.reveal.visible {
  opacity: 1;
  transform: none;
}

// JS
const obs = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 5 * 0.08) + 's'; // 최대 0.32s
  obs.observe(el);
});
```

### GSAP ScrollTrigger — 프로젝트 텍스트 stagger

프로젝트 챕터 각 텍스트 블록에 GSAP 적용:

```js
// CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js
// CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js

gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('.project-scroll-content').forEach(section => {
  gsap.from(section.querySelectorAll('.reveal-gsap'), {
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
    },
    opacity: 0,
    y: 25,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power2.out',
  });
});
```

### 히어로 타이틀 키네틱 (선택, 난이도 낮음)

```js
// 히어로 h1을 단어 단위로 분리 후 stagger fadeUp
// GSAP 없이 CSS animation-delay로도 구현 가능
// 단어마다 <span>으로 감싸고 animation-delay 0.1s씩 증가
```

### prefers-reduced-motion 대응 (필수)

```css
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal-gsap {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

```js
// GSAP
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0); // 또는 ScrollTrigger 전부 비활성화
}
```

---

## 9. 반응형 브레이크포인트

| 브레이크포인트 | 변경 사항 |
|---|---|
| `max-width: 1100px` | 프로젝트 sticky 레이아웃 유지하되 패딩 축소 |
| `max-width: 900px` | 프로젝트 grid → 1열. sticky 해제. 비주얼 상단 배치 |
| `max-width: 768px` | Nav 링크 숨김. 챕터 도트 숨김. 타임라인 → 좌측 단일 세로선. Skills → 2열 |
| `max-width: 480px` | Hero 텍스트 축소. Skills → 1열. Contact 스택 |

---

## 10. 완성 기준 체크리스트

### 필수
- [ ] Lighthouse Performance 90+ (모바일)
- [ ] 모든 YouTube 링크 실제 작동 확인
- [ ] 이메일·전화 링크 (`mailto:`, `tel:`) 작동
- [ ] 768px 이하 레이아웃 깨짐 없음
- [ ] `prefers-reduced-motion` 대응
- [ ] 페이지 로드 시 FOUC(스타일 없는 콘텐츠 깜빡임) 없음

### 권장
- [ ] 이미지 없음 → alt 태그 불필요, 다이어그램은 aria-hidden
- [ ] 모든 인터랙티브 요소 `focus` 스타일 있음 (outline)
- [ ] `<title>` 태그: "김승민 — 컨텐츠 기획자 · Quest Designer"
- [ ] OG 태그 기본 설정

### 금지 재확인
- [ ] `border-radius` 8px 초과 없음
- [ ] 카드 float 호버 효과 없음
- [ ] 아이콘 라이브러리 없음
- [ ] Tailwind 없음
- [ ] 배경 그라디언트 없음
- [ ] 순백 `#ffffff` 없음
