# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정. npm/yarn/pnpm 사용 금지 (`bun.lock` 사용).
- `bun install` — 의존성 설치
- `bun run dev` — API 서버(3002) + Vite(5173) 동시 실행
- `bun run server` — API 서버만 실행 (`bun --watch`)
- `bun run test` — vitest 1회 실행 (`src/**`, `server/**` 테스트 포함). `bun test`(Bun 내장 러너) 사용 금지
- `bun run lint` — ESLint
- `bun run build` — `tsc -b && vite build`

## Golden Rules

### Immutable

- API 키는 서버 밖으로 노출하지 않는다. `/api/config`는 키 존재 여부(boolean)만 반환한다 (`server/index.ts:150`). 키 값 자체를 응답에 넣지 마라.
- `.env`는 커밋하지 않는다 (`.gitignore`, `.worktreeinclude`).

### Do's & Don'ts

- AI가 생성하는 코드는 `import` 없음, TypeScript 문법 없음, 인라인 스타일만 허용이다 (`server/index.ts:11`, `:20`). 시스템 프롬프트를 수정할 때 이 제약을 유지하라.
- 프리뷰는 react-live `noInline` 모드라 `render(<X />)` 호출이 필수다 (`src/components/LivePreview.tsx:14`). 이 모드를 바꾸면 생성 코드 형식 전체가 깨진다.
- `render()` 보장은 이중 방어다: 프롬프트 지시 + `ensureRenderCall` 주입 (`server/generator.ts`). 한쪽만 제거하지 마라.
- 프로바이더 간 비대칭: Google만 모델 폴백이 있고 (`server/index.ts:5`, `:135`) Anthropic은 단일 모델이다. 새 프로바이더·모델 추가 시 `withModelFallback`(`server/fallback.ts`)을 재사용하라.
- API 포트 3002는 `server/index.ts:139`와 `vite.config.ts`의 proxy 두 곳에 있다. 함께 변경하라.
- 순수 로직(`generator.ts`, `fallback.ts`)은 부수효과 없이 유지한다. `Bun.serve`는 `server/index.ts`에만 둔다. 테스트 가능성 때문이다.
- 테스트 경계: 테스트는 `server/generator`, `server/fallback`, `PromptInput`에만 있다. `server/index.ts`, `App.tsx`, `useComponentGenerator`, `LivePreview`는 테스트가 없으므로 변경 시 수동 검증(`bun run dev`)을 하거나 로직을 순수 함수로 분리해 테스트를 추가하라.

## Project Context

- 프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기를 제공하는 도구.
- Stack: React 19, TypeScript, Vite, react-live, Bun(API 서버), Vitest + Testing Library.

## Standards & References

- 프로젝트 소개/실행 방법: `README.md`
- 커밋: `<type>: <한국어 요약>` (type: feat, fix, refactor, chore). 요약 50자 이내, 마침표 없음. push 금지(요청 시 제외).
- 주석과 UI 문구는 한국어, 코드 식별자는 영어.
- Maintenance Policy: 이 문서의 규칙과 코드가 어긋나면 수정을 제안하라.

## Context Map

- **[API 서버 수정](./server/AGENTS.md)** — Bun 서버, 프로바이더 호출, 프롬프트 수정 시.
- **[프론트엔드 수정](./src/AGENTS.md)** — React 컴포넌트, 훅, 프리뷰 작업 시.
