# src/AGENTS.md

## Module Context

React 19 프론트엔드. `/api/generate`, `/api/config`만 서버와 통신한다. 루트 규칙을 따른다.

## Tech Stack & Constraints

- 상태 관리는 React 내장(`useState`)만 사용한다. 외부 상태 라이브러리를 추가하지 마라.
- 서버 호출은 상대 경로 `/api/*`로만 한다 (Vite proxy 의존, `useComponentGenerator.ts`). 서버 URL을 하드코딩하지 마라.
- 타입 import는 `import type`을 쓴다 (`useComponentGenerator.ts`).

## Implementation Patterns

- 서버 호출·결과 상태는 `hooks/useComponentGenerator.ts`에 모은다. 컴포넌트에서 직접 `fetch`하지 마라 (단, `App.tsx`의 `/api/config` 조회 제외).
- 공용 타입은 `types/index.ts`에 둔다 (`Provider` 타입은 서버 `index.ts`에도 별도 정의되어 있으므로 값 추가 시 양쪽 수정).
- 새 결과는 목록 맨 앞에 추가한다 (`[newComponent, ...prev]`).

## Testing Strategy

- `bun run test`. 환경은 jsdom, 셋업은 `test/setup.ts` (jest-dom + 테스트 후 `cleanup`).
- 컴포넌트 테스트는 `*.test.tsx`를 같은 폴더에 두고 Testing Library `user-event`를 쓴다 (`PromptInput.test.tsx` 참고).

## Local Golden Rules

- 새로고침 유지 대상(API 키·Provider·프롬프트 히스토리·생성 컴포넌트)은 `useLocalStorageState`로 `rcg:*` 키에만 저장한다. 그 외 상태나 다른 저장소(쿠키 등)에 API 키를 두지 마라. 키는 서버 `/api/generate` 요청 외로 전송하지 않는다.
- localStorage 읽기값은 반드시 `utils/revive.ts`의 revive 함수로 검증한다 (`createdAt`은 문자열 → `Date` 복원 필요).
- `LivePreview`의 `noInline`을 제거하지 마라 (루트 규칙 참조). 생성 코드는 `render()`로 끝나야 한다.
- `App.tsx`(208줄)에 로직이 몰려 있고 테스트가 없다. 기능 추가 시 훅/하위 컴포넌트로 분리하라.
