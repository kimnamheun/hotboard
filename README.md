# Hotboard

자주 보는 커뮤니티 게시판의 최신글을 한 화면에 모아 추천·댓글·조회 순으로 정렬해 보는 개인 사이트.

현재 소스: **뽐뿌** — 자유게시판 · 뽐뿌게시판 · 휴대폰포럼 · 자동차포럼 · 재테크포럼

## 실행

```powershell
npm install
npm run dev      # http://localhost:3000
npm run build    # 배포 전 확인
```

## 구조

| 파일 | 역할 |
|---|---|
| `src/lib/types.ts` | `Post` / `Board` / `Source` 공통 타입 |
| `src/lib/sources/ppomppu.ts` | 뽐뿌 RSS 어댑터 (게시판 목록 + RSS 파싱) |
| `src/lib/sources/index.ts` | 소스 등록 + 전체 게시판 병렬 조회 (한 게시판 실패해도 나머지 표시) |
| `src/lib/config.ts` | 갱신 주기(600초)·User-Agent |
| `src/app/page.tsx` | 서버에서 조회 → 10분 단위 ISR 캐시 |
| `src/components/FeedView.tsx` | 게시판 필터·정렬 화면 (선택값은 브라우저에 기억) |

### 다른 사이트 추가

1. `src/lib/sources/<사이트>.ts` 에 `Source` 구현 (`boards` 목록 + `fetchBoard(board)` → `Post[]`)
2. `src/lib/sources/index.ts` 의 `sources` 배열에 추가

화면은 소스·게시판 목록을 그대로 따라가므로 따로 고칠 곳이 없다.

## 데이터 수집 원칙

- 사이트가 공식 제공하는 RSS·API 만 사용한다. 뽐뿌는 게시판 목록 화면(`zboard.php`)을 프로그램 접근 시 403 으로 막고 RSS(`rss.php?id=게시판`)는 허용한다 — 차단을 우회하지 않는다.
- User-Agent 는 `hotboard/0.1 (personal RSS reader)` 로 정직하게 보낸다.
- 게시판당 10분에 최대 1회만 조회한다 (ISR + fetch 캐시).
- 제목·작성자·반응 수치·링크만 표시하고 본문은 원본 사이트로 보낸다.
- 뽐뿌 RSS `<hits>` 는 `[댓글|조회|추천|비추천]` 순서 (2026-10-12 목록 화면과 대조 확인).
- RSS 는 게시판당 최신 13~15건이라 사이트 자체 "인기글" 목록과는 다르다 (자유게시판은 약 13분, 재테크포럼은 약 5시간 분량).

## 배포 (Vercel)

`vercel.json` 에서 함수 리전을 서울(`icn1`)로 고정했다 — 원본 사이트 조회가 국내에서 나가도록.

- GitHub 저장소에 올린 뒤 vercel.com → Add New → Project → 저장소 Import (설정 기본값 그대로). 이후 push 할 때마다 자동 배포.
- 또는 Vercel CLI (`npx vercel@latest`, Node 20 이상 필요).

검색엔진 수집은 막아 두었다 (`robots: noindex`).
