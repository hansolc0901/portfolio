// 관리자용 예약 관리 주소입니다. (adminRoutes 가 로그인 확인 뒤에 연결합니다)
import { Router } from 'express';

import { RESERVATION_STATUSES, isReservationStatus } from '../reservations/reservationStatuses.js';
import { listReservations, updateReservationStatus } from '../reservations/reservationStore.js';

function fail(res, status, message) {
  res.status(status).json({ error: { status, message } });
}

export function createReservationRouter() {
  const router = Router();

  // 예약 목록과 처리 상태 정의를 함께 돌려줍니다.
  router.get('/', async (req, res) => {
    const reservations = await listReservations();
    res.json({ data: { reservations, statuses: RESERVATION_STATUSES } });
  });

  // 처리 상태 바꾸기
  router.patch('/:id/status', async (req, res) => {
    const id = Number(req.params.id);
    const status = req.body?.status;

    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, '예약 번호가 올바르지 않습니다.');
    if (!isReservationStatus(status)) return fail(res, 400, '처리 상태가 올바르지 않습니다.');

    const updated = await updateReservationStatus(id, status);
    if (!updated) return fail(res, 404, '예약을 찾을 수 없습니다.');

    res.json({ data: updated });
  });

  return router;
}
