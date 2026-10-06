// 방문 예약의 처리 상태입니다.
// 상태의 이름과 설명은 이 파일 한 곳에서만 정합니다. 관리자 화면도 이 목록을 받아 버튼을 만듭니다.
// value 는 Supabase 표의 status 칸에 들어가는 값으로, 표의 검사 규칙(check)과 같아야 합니다.

export const RESERVATION_STATUSES = [
  {
    value: 'received',
    label: '접수',
    hint: '방문자가 신청한 그대로의 상태입니다.',
  },
  {
    value: 'confirmed',
    label: '확정',
    hint: '신청한 날짜와 시간으로 방문을 승인했습니다.',
  },
  {
    value: 'change_requested',
    label: '변경 요청',
    hint: '만남은 원하지만 다른 시간으로 방문을 요청합니다.',
  },
  {
    value: 'cancelled',
    label: '취소',
    hint: '이 방문은 진행하지 않습니다.',
  },
];

export function isReservationStatus(value) {
  return RESERVATION_STATUSES.some((status) => status.value === value);
}
