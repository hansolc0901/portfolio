// ==========================================================================
// 데이터 가져오기
//   1순위: Supabase (DB 함수 get_public_portfolio 로 공개 내용만 받음)
//   2순위: 페이지에 내장된 데이터 (인터넷이 안 되거나 DB 가 응답하지 않을 때)
// 화면을 그리는 코드는 데이터가 어느 쪽에서 왔는지 신경 쓰지 않습니다.
// ==========================================================================

// DB 가 응답하지 않을 때 이 시간이 지나면 기다리지 않고 내장 데이터로 넘어갑니다.
const API_TIMEOUT_MS = 2000;

// 이 키는 공개용(publishable)입니다. 예약 페이지와 같은 키입니다.
// 표는 직접 읽을 수 없고, 공개 칸만 돌려주는 함수 하나만 부를 수 있습니다.
const SUPABASE_URL = 'https://owptpdlhkgpxaidgokua.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vZfS4WOpR09ZYbR0DnWidA_PVlKCB9A';

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

// Supabase 에서 받아옵니다. 실패하면 오류를 던집니다.
async function fetchFromSupabase() {
  // 정해진 시간이 지나면 요청을 취소합니다.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_portfolio`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: '{}',
    });

    if (!response.ok) {
      throw new Error(`Supabase 가 ${response.status} 로 응답했습니다.`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.projects)) {
      throw new Error('받은 데이터의 모양이 올바르지 않습니다.');
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

// 화면이 실제로 부르는 함수입니다.
// 돌려주는 값: { data: 포트폴리오, source: 'db' | 'embedded' }
async function loadPortfolio() {
  try {
    return { data: await fetchFromSupabase(), source: 'db' };
  } catch (error) {
    // 인터넷이 안 되는 것은 오류가 아니라 있을 수 있는 상황이므로 조용히 넘어갑니다.
    console.info('DB 를 사용하지 않고 내장 데이터로 표시합니다.', error.message);
    return { data: readEmbeddedData(), source: 'embedded' };
  }
}
