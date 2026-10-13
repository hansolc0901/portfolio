// Supabase 에 저장된 방문 예약을 읽고, 처리 상태를 바꿉니다.
//
// 방문자는 공개 키로 '추가'만 할 수 있어서 예약을 읽을 수 없습니다.
// 관리자 서버는 비밀 키(SUPABASE_SECRET_KEY)로 읽습니다.
// 비밀 키는 backend/.env 에만 두고, 화면으로는 절대 내보내지 않습니다.
import { HttpError } from '../middleware/errors.js';
import { supabaseRequest } from '../supabase/client.js';

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

// 예약 표에서만 생기는 오류를 알기 쉬운 안내로 바꿉니다.
function explainReservationError(payload) {
  // 42703: 없는 칸. 예약 관리용 칸을 추가하는 SQL 을 아직 실행하지 않은 경우입니다.
  if (payload?.code === '42703') {
    return new HttpError(
      503,
      '예약 관리용 칸(예약 번호·처리 상태)이 아직 없습니다.\n' +
        'backend/sql/002_reservation_status_and_number.sql 을 Supabase SQL Editor 에서 실행해 주세요.',
    );
  }
  // 23505: 같은 날짜·시간에 이미 다른 예약이 있음 (취소된 예약을 되살리려 할 때 생길 수 있습니다)
  if (payload?.code === '23505') {
    return new HttpError(
      409,
      '같은 날짜·시간에 이미 다른 예약이 있어 이 상태로 바꿀 수 없습니다.\n' +
        '다른 예약을 먼저 취소하거나, 이 예약은 취소 상태로 두세요.',
    );
  }
  return null;
}

function request(path, options = {}) {
  return supabaseRequest(path, {
    ...options,
    explainError: explainReservationError,
    failMessage: 'Supabase 에서 예약을 처리하지 못했습니다.',
  });
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
