async function makeIssue() {
  const token = process.env.GH_TOKEN;
  const OWNER = "usn757"; // GitHub 계정 이름
  const REPO = "number_generator"; // GitHub 저장소 이름

  console.log("makeIssue()");
  // 1~45의 숫자 중 6개 랜덤 생성
  function generateNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    console.log("generateNumbers()");
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
    console.log("실패:", response.status, response.statusText);
  }
}

console.log("index.js");
makeIssue();
