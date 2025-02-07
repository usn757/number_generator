# 번호 생성기 number generator 설명

이 문서는 매주 일요일마다 GitHub 저장소에 자동으로 번호 6개를 생성하여 이슈를 생성하는 `number_generator` 코드와 GitHub Actions 워크플로우에 대한 설명을 제공

## 개요

`number_generator`는 GitHub API와 JavaScript를 사용하여 지정된 GitHub 저장소에 매주 일요일마다 자동으로 번호 6개를 알려주는 이슈를 생성. 이를 위해 GitHub Actions 워크플로우를 사용하며, `index.js` 스크립트가 번호를 생성하고 GitHub API를 통해 이슈를 생성하는 역할

## `index.js` 코드 분석

```javascript
async function makeIssue() {
  const token = process.env.GH_TOKEN;
  const OWNER = "usn757"; // GitHub 계정 이름
  const REPO = "number_generator"; // GitHub 저장소 이름

  // 1~45의 숫자 중 6개 랜덤 생성
  function generateNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).join(", ");
  }

  const Numbers = generateNumbers();

  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "이번 주 번호 추천",
        body: `이번 주 추천 번호는 ${Numbers} 입니다.`,
      }),
    }
  );

  if (response.ok) {
    console.log("성공");
  } else {
    console.log("실패");
  }
}

makeIssue();
```

### 1. 환경 변수 설정

- `const token = process.env.GH_TOKEN;`: `GH_TOKEN` 환경 변수에서 GitHub 개인 액세스 토큰(PAT)을 가져옵니다. 이 토큰은 GitHub API에 인증하는 데 사용
- **중요:** GitHub 저장소 설정에서 `GH_TOKEN`이라는 이름으로 Secrets를 추가하고, 생성한 PAT를 값으로 설정. PAT는 `repo` 범위에 대한 권한 필요

### 2. 저장소 정보 설정

- `const OWNER = "usn757";`: 이슈를 생성할 GitHub 저장소의 소유자 이름(사용자 이름 또는 조직 이름)을 설정
- `const REPO = "number_generator";`: 이슈를 생성할 GitHub 저장소의 이름을 설정
- **중요:** `"usn757"`과 `"number_generator"`를 자신의 GitHub 계정 및 저장소 이름으로 교체

### 3. 번호 생성 함수

- `generateNumbers()`: 1부터 45 사이의 중복되지 않는 6개의 랜덤 번호를 생성하여 문자열로 반환
  - `new Set()`을 사용하여 중복을 방지
  - `while` 루프를 통해 6개의 고유한 번호가 생성될 때까지 반복
  - `Math.random()`과 `Math.floor()`를 사용하여 1~45 사이의 정수를 생성
  - `Array.from(numbers).join(", ")`을 사용하여 Set을 배열로 변환하고 쉼표로 구분된 문자열로 결합

### 4. GitHub API 요청

- `fetch(...)`: GitHub API에 `POST` 요청을 보내 새 이슈를 생성
  - `https://api.github.com/repos/${OWNER}/${REPO}/issues`: 이슈 생성 API 엔드포인트
  - `method: "POST"`: POST 요청을 지정
  - `headers`:
    - `Authorization: Bearer ${token}`: 인증을 위해 `GH_TOKEN`을 헤더에 포함
  - `body`:
    - `title: "이번 주 번호 추천"`: 생성될 이슈의 제목
    - `body: 이번 주 추천 번호는 ${Numbers} 입니다.`: 생성된 번호를 포함한 이슈 본문
- `await`: `fetch`는 Promise를 반환하므로 `await`를 사용하여 요청이 완료될 때까지 대기

### 5. 응답 처리

- `if (response.ok)`: 요청이 성공했는지 확인
  - `response.ok`: HTTP 상태 코드가 200-299 범위 내에 있으면 `true`를 반환
- 성공(`response.ok`가 `true`)하면 "성공"을, 실패하면 "실패"를 콘솔에 출력

### 6. 함수 실행

- `makeIssue();`: `makeIssue` 함수를 호출하여 이슈 생성 프로세스를 시작

## 워크플로우: `.github/workflows/number_generator.yml`

```yaml
name: Number Generator
run-name: ${{ github.actor }} is write issue
on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * 0" # 매주 일요일 자정에 실행 (UTC 기준)

jobs:
  make-issue:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Run number generator
        run: node index.js
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 워크플로우 설명

- **`name: Number Generator`**: 워크플로우의 이름
- **`on.schedule`**: 워크플로우를 주기적으로 실행하도록 설정
  - **`cron: "0 0 * * 0"`**: 매주 일요일 자정(UTC 기준)에 실행되도록 설정 (한국 시간으로는 일요일 오전 9시)
- **`make-issue`**: 작업을 정의
  - **`runs-on: ubuntu-latest`**: 최신 Ubuntu 환경에서 작업을 실행
  - **`permissions`**:
    - **`issues: write`**: 이슈를 생성 권한 부여
  - **`steps`**: 실행할 단계들을 정의
    - **`Checkout repository`**: `actions/checkout@v4` 액션을 사용하여 저장소의 코드를 체크아웃
    - **`Set up Node.js`**: `actions/setup-node@v4` 액션을 사용하여 Node.js 20 버전을 설치
    - **`Install dependencies`**: `npm install`을 실행하여 필요한 의존성을 설치 (현재 `index.js`에는 의존성이 없지만, 나중에 추가될 경우를 대비)
    - **`Run generator`**: `node index.js`를 실행하여 `index.js` 스크립트를 실행
      - **`env`**:
        - **`GH_TOKEN: ${{ secrets.GH_TOKEN }}`**: `GH_TOKEN` 환경 변수를 GitHub 저장소에 설정된 Secrets에서 가져와서 설정

## 결론

이 `number_-_generator` 코드는 GitHub Actions를 사용하여 매주 일요일마다 자동으로 번호를 생성하고 GitHub 저장소에 이슈를 생성. `index.js` 스크립트는 번호를 생성하고 GitHub API를 통해 이슈를 생성하는 로직을 담당하며, `.github/workflows/number_-_generator.yml` 파일은 이 스크립트를 주기적으로 실행하는 워크플로우를 정의. 이 코드를 참고하여 자신만의 자동화 작업 생성.
