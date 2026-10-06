// ==========================================================================
// 예약하기 관리
//
// admin.js 의 api · $ · el · showMessage 를 함께 씁니다. (admin.js 다음에 불러옵니다)
// 처리 상태의 이름은 서버(reservationStatuses.js)가 알려준 대로 씁니다.
// ==========================================================================

const reservationState = {
  reservations: [],
  statuses: [],
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// '2026-10-07', '15:00' → '2026. 10. 7. (수) 15:00'
function formatVisit(date, time) {
  const [y, m, d] = date.split('-').map(Number);
  const day = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}. ${m}. ${d}. (${day}) ${time}`;
}

function statusLabel(value) {
  return reservationState.statuses.find((s) => s.value === value)?.label || value;
}

async function loadReservations() {
  const message = $('reservationMessage');
  showMessage(message, '예약을 불러오는 중입니다...', 'info');

  try {
    const { reservations, statuses } = await api('/reservations');
    reservationState.reservations = reservations;
    reservationState.statuses = statuses;
    showMessage(message, '');
  } catch (error) {
    reservationState.reservations = [];
    showMessage(message, error.message, 'error');
  }

  renderReservations();
}

function renderReservations() {
  const body = $('reservationRows');
  const list = reservationState.reservations;
  body.replaceChildren();

  $('reservationCount').textContent = list.length ? `총 ${list.length}건` : '';

  if (list.length === 0) {
    const row = el('tr');
    const cell = el('td', 'table-empty', '아직 들어온 예약 요청이 없습니다.');
    cell.colSpan = 6;
    row.append(cell);
    body.append(row);
    return;
  }

  list.forEach((reservation) => body.append(buildRow(reservation)));
}

function buildRow(reservation) {
  const row = el('tr');

  const number = el('td', 'cell-number', reservation.number);

  const person = el('td');
  person.append(el('span', 'cell-name', reservation.name), el('span', 'cell-email', reservation.email));

  const visit = el('td', 'cell-visit', formatVisit(reservation.visitDate, reservation.visitTime));
  const purpose = el('td', 'cell-purpose', reservation.purpose);

  const status = el('td');
  status.append(el('span', `badge status-${reservation.status}`, statusLabel(reservation.status)));

  // 관리: 4가지 상태 중 하나를 눌러 바로 바꿉니다. 지금 상태의 버튼은 눌린 모양으로 보입니다.
  const manage = el('td');
  const group = el('div', 'status-buttons');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', `${reservation.number} 처리 상태 변경`);

  reservationState.statuses.forEach((option) => {
    const button = el('button', `btn small status-btn status-${option.value}`, option.label);
    button.type = 'button';
    button.title = option.hint;
    const current = option.value === reservation.status;
    button.setAttribute('aria-pressed', current);
    if (current) button.classList.add('is-current');
    button.addEventListener('click', () => changeStatus(reservation, option.value, group));
    group.append(button);
  });
  manage.append(group);

  row.append(number, person, visit, purpose, status, manage);
  return row;
}

async function changeStatus(reservation, status, group) {
  if (reservation.status === status) return;

  const buttons = group.querySelectorAll('button');
  buttons.forEach((button) => (button.disabled = true));

  try {
    const updated = await api(`/reservations/${reservation.id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    Object.assign(reservation, updated);
    showMessage(
      $('reservationMessage'),
      `${reservation.number} (${reservation.name}) 예약을 '${statusLabel(status)}'(으)로 바꿨습니다.`,
      'success',
    );
    renderReservations();
  } catch (error) {
    showMessage($('reservationMessage'), error.message, 'error');
    buttons.forEach((button) => (button.disabled = false));
  }
}
