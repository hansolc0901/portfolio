// ==========================================================================
// 데이터 가져오기
//   1순위: 백엔드 API
//   2순위: 페이지에 내장된 데이터 (서버 없이 파일만 열었을 때)
// 화면을 그리는 코드는 데이터가 어느 쪽에서 왔는지 신경 쓰지 않습니다.
// ==========================================================================

// 서버가 응답하지 않을 때 이 시간이 지나면 기다리지 않고 내장 데이터로 넘어갑니다.
const API_TIMEOUT_MS = 2000;

// 백엔드 주소입니다. 다른 곳에 올린 서버를 쓰려면
// index.html 에서 window.PORTFOLIO_API_BASE 를 먼저 지정하면 됩니다.
function getApiBase() {
  if (typeof window.PORTFOLIO_API_BASE === 'string') {
    return window.PORTFOLIO_API_BASE;
  }
  return '/api';
}

// 페이지 안에 들어 있는 데이터를 읽습니다.
function readEmbeddedData() {
  const slot = document.getElementById('portfolioData');
  if (!slot) return null;

  try {
    return JSON.parse(slot.textContent);
  } catch (error) {
    console.error('내장 데이터를 읽지 못했습니다.', error);
    return null;
  }
}

// 백엔드에서 받아옵니다. 실패하면 오류를 던집니다.
async function fetchFromApi() {
  // file:// 로 파일을 직접 열었을 때는 서버가 없으므로 시도하지 않습니다.
  if (!location.protocol.startsWith('http')) {
    throw new Error('서버 주소가 아니므로 API 를 사용하지 않습니다.');
  }

  // 정해진 시간이 지나면 요청을 취소합니다.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBase()}/portfolio`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`서버가 ${response.status} 로 응답했습니다.`);
    }

    const body = await response.json();

    // 응답은 항상 { data: ... } 모양입니다.
    if (!body || !body.data) {
      throw new Error('응답에 data 가 없습니다.');
    }

    return body.data;
  } finally {
    clearTimeout(timer);
  }
}

// 화면이 실제로 부르는 함수입니다.
// 돌려주는 값: { data: 포트폴리오, source: 'api' | 'embedded' }
async function loadPortfolio() {
  try {
    return { data: await fetchFromApi(), source: 'api' };
  } catch (error) {
    // 서버가 없는 것은 오류가 아니라 정상적인 상황이므로 조용히 넘어갑니다.
    console.info('백엔드를 사용하지 않고 내장 데이터로 표시합니다.', error.message);
    return { data: readEmbeddedData(), source: 'embedded' };
  }
}
