// Supabase 에 요청을 보내는 곳입니다. 예약·포트폴리오 표가 모두 이 함수를 씁니다.
//
// 관리자 서버는 비밀 키(SUPABASE_SECRET_KEY)로 모든 표를 읽고 고칩니다.
// 비밀 키는 backend/.env 에만 두고, 화면으로는 절대 내보내지 않습니다.
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';

/**
 * @param {string} path  'reservations?select=...' 처럼 /rest/v1/ 뒤에 붙는 주소
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object|object[]} [options.body]
 * @param {string} [options.prefer]  Supabase 에 결과를 어떻게 돌려받을지 (Prefer 헤더)
 * @param {(payload: any, status: number) => HttpError|null} [options.explainError]
 *        표마다 다른 오류 안내가 필요할 때 씁니다. null 을 돌려주면 기본 안내를 씁니다.
 * @param {string} [options.failMessage]  알 수 없는 오류일 때 보여 줄 문구
 */
export async function supabaseRequest(
  path,
  {
    method = 'GET',
    body,
    prefer = 'return=representation',
    explainError,
    failMessage = 'Supabase 에서 요청을 처리하지 못했습니다.',
  } = {},
) {
  const key = config.supabaseSecretKey;

  if (!config.supabaseUrl || !key) {
    throw new HttpError(
      503,
      'Supabase 에 연결하려면 backend/.env 에 SUPABASE_URL 과 SUPABASE_SECRET_KEY 를 적어야 합니다.\n' +
        '비밀 키는 Supabase 대시보드 → Project Settings → API Keys 에서 복사합니다.',
    );
  }

  let response;
  try {
    response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HttpError(502, 'Supabase 에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('[Supabase]', response.status, payload);

    const explained = explainError?.(payload, response.status);
    if (explained) throw explained;

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(503, 'Supabase 비밀 키가 맞지 않습니다. backend/.env 의 SUPABASE_SECRET_KEY 를 확인해 주세요.');
    }
    throw new HttpError(502, failMessage);
  }

  return payload;
}
