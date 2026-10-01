---
name: create-pr
description: |
  현재 브랜치의 커밋을 분석해 PR 제목·본문을 작성하고 GitHub Pull Request를 생성한다. 프로젝트 언어에 따라 references의 영문/한국어 템플릿 중 하나를 골라 쓴다 (해외 오픈소스 → 영문, 한국 프로젝트 → 한국어).
  "PR 만들어줘", "PR 생성", "풀리퀘 올려줘", "pull request 열어줘", "create pr", "open a PR", "/create-pr" 같은 요청에 활성화한다. 사용자가 PR이라는 단어를 직접 말하지 않아도 "작업 끝났으니 리뷰 올려줘"처럼 변경사항을 리뷰 요청으로 올리려는 의도면 사용한다.
context: fork
allowed-tools: Bash, Read, Glob, Grep
---

# create-pr: 템플릿 기반 Pull Request 생성

현재 브랜치의 변경사항을 분석해 PR을 만든다. 이 스킬은 `context: fork`로 서브 에이전트에서 실행되므로 **이전 대화 내용을 볼 수 없다.** 필요한 정보는 모두 git/gh 명령과 저장소 파일에서 직접 수집한다. 마지막에는 PR URL과 사용한 템플릿·언어를 짧게 보고해, 메인 대화가 결과만 받도록 한다.

## 워크플로우

### Step 0: 저장소 지침 확인

루트 `AGENTS.md`(없으면 `CLAUDE.md`)에 PR·브랜치·push 규칙이 있으면 이 스킬보다 우선한다. 저장소에 자체 PR 템플릿(`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`, 루트 `pull_request_template.md`)이 있으면 **그 템플릿을 references보다 우선 사용한다.** 팀이 이미 정한 형식이기 때문이다.

### Step 1: 사전 점검

```bash
gh auth status
git remote -v
git branch --show-current
gh repo view --json defaultBranchRef,isFork,parent,url
```

- `gh` 인증이 안 되어 있거나 remote가 없으면 이유를 보고하고 종료한다. 로그인은 사용자가 해야 한다(`! gh auth login` 안내).
- 현재 브랜치가 기본 브랜치(main/master)면 PR을 만들 수 없다. 변경 내용에 맞는 이름으로 새 브랜치(`feat/...`, `fix/...`)를 만들어 이동한다. 커밋되지 않은 변경이 있으면 커밋하지 말고 사용자에게 먼저 `/commit`을 안내한 뒤 종료한다.
- 기본 브랜치 대비 새 커밋이 없으면 알리고 종료한다.
- 이미 같은 브랜치의 열린 PR이 있으면(`gh pr view`) 새로 만들지 말고 그 URL을 보고한다.

### Step 2: 변경사항 수집

base는 기본 브랜치다(포크라면 upstream의 기본 브랜치).

```bash
git log --oneline <base>..HEAD
git diff --stat <base>...HEAD
git diff <base>...HEAD
```

diff가 크면 `--stat`과 핵심 파일 위주로 읽는다. 커밋 로그만으로 "왜"가 부족하면 변경된 코드를 읽어 목적을 파악한다. 본문에는 사실만 쓴다. 실행하지 않은 테스트를 "통과"로 적지 않는다.

### Step 3: 템플릿 언어 결정

아래 신호를 위에서부터 보고 **처음 확정되는 것**을 따른다. 신호가 서로 충돌하면 위쪽이 우선이다.

1. 사용자가 언어를 명시함 (인자·요청에 "영문으로", "한국어로")
2. 저장소 지침(`AGENTS.md`/`CLAUDE.md`)의 언어 규칙 (예: "주석과 UI 문구는 한국어")
3. 최근 커밋·기존 PR 언어 (`git log -10`, `gh pr list --state all -L 5`)
4. `README.md` 본문 언어와 기여 가이드(`CONTRIBUTING.md`)
5. 저장소가 해외 오픈소스 성격인지 (upstream이 외국 조직, 영문 이슈·PR 위주)

한글이 주로 쓰이면 한국 프로젝트로 보고 `references/pr-template-ko.md`, 영문 위주면 `references/pr-template-en.md`를 읽어 쓴다. 판단이 정말 갈리면 한국어/영문 중 기본값을 임의로 고르지 말고, 보고에 "언어 판단 불확실"을 명시한 채 근거가 더 강한 쪽으로 진행한다(서브 에이전트는 사용자에게 되묻기 어렵다).

선택한 템플릿 파일을 반드시 Read로 읽고, 그 구조(섹션 순서·제목)를 그대로 유지해 채운다. 해당 없는 섹션은 지우지 말고 "N/A"(한국어는 "해당 없음")로 둔다. 리뷰어가 항상 같은 위치에서 같은 정보를 찾게 하기 위해서다.

### Step 4: 제목과 본문 작성

- **제목**: 70자 이내. 저장소 커밋 컨벤션이 있으면 그대로 따른다(예: `feat: 한국어 요약`). 없으면 영문은 명령형 현재시제, 한국어는 명사형 종결. 마침표를 붙이지 않는다.
- **본문**: 템플릿의 각 섹션을 diff 근거로 채운다. 커밋 목록을 복붙하지 말고 리뷰어가 알아야 할 "무엇을/왜/어떻게 검증했는지"로 요약한다.
- 관련 이슈가 커밋·브랜치명에서 보이면 `Closes #N`을 쓴다. 확실하지 않으면 쓰지 않는다.
- 시스템이 지정한 PR attribution 줄이 있으면 본문 맨 끝에 붙인다.
- 비밀정보·토큰·내부 URL이 diff에서 보이면 본문에 옮기지 말고 보고에서 경고한다.

### Step 5: push와 PR 생성

`/create-pr` 호출 자체가 push와 PR 생성에 대한 요청이므로 별도 승인은 묻지 않는다.

```bash
git push -u origin HEAD
gh pr create --base <base> --title "<제목>" --body-file <임시 본문 파일>
```

- 본문은 임시 파일로 써서 `--body-file`로 넘긴다. 줄바꿈·백틱·따옴표 이스케이프 문제를 피하려는 것이다. 생성 후 임시 파일은 삭제한다.
- 기본은 일반 PR이다. 사용자가 draft를 요청하면 `--draft`를 붙인다.
- 실패하면(권한, 브랜치 보호, 충돌) 원인을 그대로 보고한다. 우회하지 않는다.

### Step 6: 결과 보고

다음만 간결하게 보고한다.

```
PR: <URL>
base ← head: main ← feat/xxx
템플릿: 한국어 (근거: AGENTS.md 한국어 규칙, 최근 커밋 한국어)
경고: <있을 때만>
```

## 금지 사항

- `git push --force`/`--force-with-lease`, 기본 브랜치로의 직접 push
- 커밋되지 않은 변경을 임의로 커밋하거나 stash하는 것
- `--no-verify`로 hook 우회
- 실행하지 않은 테스트·검증을 본문에 "완료"로 쓰는 것
- 템플릿 섹션 구조를 임의로 바꾸거나 삭제하는 것
