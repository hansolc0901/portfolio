// Supabase 에 저장된 방문 예약을 읽고, 처리 상태를 바꿉니다.
//
// 방문자는 공개 키로 '추가'만 할 수 있어서 예약을 읽을 수 없습니다.
// 관리자 서버는 비밀 키(SUPABASE_SECRET_KEY)로 읽습니다.
// 비밀 키는 backend/.env 에만 두고, 화면으로는 절대 내보내지 않습니다.
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';

const COLUMNS = [
  'id',
  'reservation_no',
  'created_at',
  'visit_date',
  'visit_time',
  'name',
  'email',
  'purpose',
  'status',
  'status_updated_at',
].join(',');

async function request(path, { method = 'GET', body } = {}) {
  const key = config.supabaseSecretKey;

  if (!config.supabaseUrl || !key) {
    throw new HttpError(
      503,
      '예약을 불러오려면 backend/.env 에 SUPABASE_URL 과 SUPABASE_SECRET_KEY 를 적어야 합니다.\n' +
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
        Prefer: 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HttpError(502, 'Supabase 에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('[Supabase]', response.status, payload);

    // 42703: 없는 칸. 예약 관리용 칸을 추가하는 SQL 을 아직 실행하지 않은 경우입니다.
    if (payload?.code === '42703') {
      throw new HttpError(
        503,
        '예약 관리용 칸(예약 번호·처리 상태)이 아직 없습니다.\n' +
          'backend/sql/002_reservation_status_and_number.sql 을 Supabase SQL Editor 에서 실행해 주세요.',
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new HttpError(503, 'Supabase 비밀 키가 맞지 않습니다. backend/.env 의 SUPABASE_SECRET_KEY 를 확인해 주세요.');
    }
    throw new HttpError(502, 'Supabase 에서 예약을 처리하지 못했습니다.');
  }

  return payload;
}

// DB 의 칸 이름을 화면에서 쓰기 쉬운 이름으로 바꿉니다.
function toReservation(row) {
  return {
    id: row.id,
    number: row.reservation_no,
    createdAt: row.created_at,
    visitDate: row.visit_date,
    // '15:00:00' → '15:00'
    visitTime: String(row.visit_time).slice(0, 5),
    name: row.name,
    email: row.email,
    purpose: row.purpose,
    status: row.status,
    statusUpdatedAt: row.status_updated_at,
  };
}

// 방문 일시가 이른 순서로 돌려줍니다.
export async function listReservations() {
  const rows = await request(
    `reservations?select=${COLUMNS}&order=visit_date.asc,visit_time.asc,id.asc`,
  );
  return rows.map(toReservation);
}

export async function updateReservationStatus(id, status) {
  const rows = await request(`reservations?id=eq.${id}&select=${COLUMNS}`, {
    method: 'PATCH',
    body: { status, status_updated_at: new Date().toISOString() },
  });
  return rows[0] ? toReservation(rows[0]) : null;
}
