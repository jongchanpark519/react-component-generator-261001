# server/AGENTS.md

## Module Context

Bun 기반 AI 프록시 서버. 프론트엔드는 Vite proxy(`/api` -> 3002)로 접근한다. 루트 규칙을 따른다.

## Tech Stack & Constraints

- 런타임은 Bun (`Bun.serve`, `process.env`). Node 전용 API에 의존하지 마라.
- 외부 SDK 없이 `fetch`로 Anthropic/Gemini REST를 직접 호출한다 (`index.ts`). SDK를 추가하지 마라.
- 이 디렉토리의 테스트도 vitest로 실행된다 (`vite.config.ts`의 `server/**/*.test.ts`).

## Implementation Patterns

- 응답 정규화는 `generator.ts`(`stripCodeFences` -> `ensureRenderCall`) 순서로 적용한다.
- 모델 폴백은 `withModelFallback`을 쓴다. 모든 모델 실패 시 마지막 에러를 던진다.
- 에러 분기는 메시지 문자열의 `503`/`429` 포함 여부로 한다 (`index.ts:194`, `:201`). 프로바이더 호출 함수는 `API error: <status>` 형태로 던져야 매핑된다.
- 모든 `Response`에 `CORS_HEADERS`를 붙인다.

## Testing Strategy

- `bun run test`. 순수 함수는 `*.test.ts`를 같은 폴더에 둔다.
- `index.ts`는 서버 기동 부수효과가 있어 테스트가 없다. 새 로직은 순수 모듈로 분리해 테스트하라.

## Local Golden Rules

- Google URL에 API 키가 쿼리스트링으로 들어간다 (`index.ts:99`). 이 URL이나 에러 객체를 로그·응답에 그대로 출력하지 마라.
- Gemini `MAX_TOKENS` 잘림은 에러로 처리한다 (`index.ts:123`). 잘린 코드를 반환하면 프리뷰가 깨진다.
- 클라이언트가 보낸 `apiKey`가 `.env` 키보다 우선한다 (`resolveApiKey`). 순서를 바꾸지 마라 (UI 안내 문구가 이 동작에 의존, `src/App.tsx:126`).
