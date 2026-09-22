// ==========================================================================
// 관리자 화면
//
// 비밀번호는 로그인할 때 한 번만 서버로 보냅니다.
// 서버는 맞으면 임시 출입증(토큰)만 돌려주므로, 비밀번호는 화면에 남지 않습니다.
// 입력 칸의 정의도 서버에서 받아옵니다. 화면과 서버의 규칙이 어긋날 수 없습니다.
// ==========================================================================

// 예전 판이 저장해 두었을 수 있는 출입증을 지웁니다.
// 지금은 출입증을 브라우저에 저장하지 않습니다.
const OLD_TOKEN_KEY = 'portfolioAdminToken';
try {
  sessionStorage.removeItem(OLD_TOKEN_KEY);
  localStorage.removeItem(OLD_TOKEN_KEY);
} catch {
  // 브라우저가 막아도 그냥 넘어갑니다.
}

const AUTOSAVE_KEY = 'portfolioAdminAutosave';
// 입력을 멈추고 이만큼 지나면 브라우저에 자동으로 보관합니다.
const AUTOSAVE_DELAY_MS = 600;

const state = {
  // 로그인 출입증은 이 변수(메모리)에만 둡니다.
  // 브라우저에 저장하지 않으므로 창을 닫거나 새로고침하면 사라지고,
  // 들어올 때마다 비밀번호를 새로 입력해야 합니다.
  token: '',
  fields: [],
  statuses: [],
  projects: [],
  // 지금 고치고 있는 작업물의 id. 새로 만드는 중이면 null 입니다.
  editingId: null,
  // 불러온 그대로의 값. 지금 입력과 비교해 '바뀌었는지'를 판단합니다.
  baseline: null,
};

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function showMessage(node, text, kind = 'info') {
  node.className = `message ${kind}`;
  node.textContent = text;
  node.hidden = !text;
}

// --------------------------------------------------------------------------
// 브라우저에 잠깐 보관하기
//
// 저장 버튼을 누르기 전의 입력도 잃지 않도록 브라우저에 담아 둡니다.
// 브라우저 설정(시크릿 모드 등)에 따라 막힐 수 있으므로 실패해도 그냥 넘어갑니다.
// --------------------------------------------------------------------------
function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 보관하지 못해도 화면 동작에는 문제가 없습니다.
  }
}

function removeStore(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // 위와 같습니다.
  }
}

// --------------------------------------------------------------------------
// 서버와 주고받기
// --------------------------------------------------------------------------
async function api(path, { method = 'GET', body } = {}) {
  let response;

  try {
    response = await fetch(`/api/admin${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // 서버가 꺼져 있거나 주소가 맞지 않을 때입니다.
    // 무엇을 해야 하는지 알려 주지 않으면 원인을 찾기 어렵습니다.
    throw new Error(
      '서버에 연결하지 못했습니다.\n' +
        '터미널에서 backend 폴더로 가서 npm start 로 서버를 켠 뒤 다시 시도해 주세요.',
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    // 출입증이 만료되면 로그인 화면으로 돌아갑니다.
    if (response.status === 401 && state.token) logout(true);

    const error = new Error(payload.error?.message || '요청을 처리하지 못했습니다.');
    error.fields = payload.error?.fields || {};
    // 같은 제목이 이미 있을 때 서버가 그 작업물을 함께 보내 줍니다.
    error.duplicate = payload.error?.duplicate || null;
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

// --------------------------------------------------------------------------
// 로그인 / 로그아웃
// --------------------------------------------------------------------------
function showLogin() {
  $('loginScreen').hidden = false;
  $('adminScreen').hidden = true;
  $('passwordInput').value = '';
  $('passwordInput').focus();
}

async function showAdmin() {
  $('loginScreen').hidden = true;
  $('adminScreen').hidden = false;

  const { fields, statuses } = await api('/fields');
  state.fields = fields;
  state.statuses = statuses;

  buildStatusOptions();
  buildFields();
  await reloadProjects();
  startNew();

  // 지난번에 저장하지 않고 닫은 내용이 있으면 되살릴지 물어봅니다.
  showRestoreBar();
}

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const button = $('loginButton');
  button.disabled = true;
  showMessage($('loginMessage'), '');

  try {
    const input = $('passwordInput');
    const password = input.value;
    // 읽자마자 지웁니다. 로그인한 뒤 화면에 비밀번호가 남아 있지 않게 하기 위해서입니다.
    input.value = '';

    const { token } = await api('/login', { method: 'POST', body: { password } });

    // 출입증은 메모리에만 둡니다. (브라우저에 저장하지 않습니다)
    state.token = token;
    await showAdmin();
  } catch (error) {
    showMessage($('loginMessage'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

async function logout(expired = false) {
  if (!expired) {
    await api('/logout', { method: 'POST' }).catch(() => {});
    // 직접 로그아웃한 경우에만 보관해 둔 내용을 지웁니다.
    removeStore(AUTOSAVE_KEY);
  }
  // 시간이 지나 풀린 경우에는 보관 내용을 남겨, 다시 로그인하면 되살릴 수 있게 합니다.

  state.token = '';
  state.baseline = null;
  showLogin();

  if (expired) {
    showMessage($('loginMessage'), '로그인 시간이 지났습니다. 다시 로그인해 주세요.', 'error');
  }
}

$('logoutButton').addEventListener('click', () => {
  if (!confirmDiscard()) return;
  logout();
});

// 창을 닫거나 다른 곳으로 이동하면 서버에 남은 출입증도 바로 없앱니다.
// keepalive 를 붙이면 페이지가 닫히는 중에도 요청이 끝까지 전달됩니다.
window.addEventListener('pagehide', () => {
  if (!state.token) return;

  try {
    fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      keepalive: true,
    });
  } catch {
    // 닫히는 중이라 실패해도 할 수 있는 일이 없습니다.
    // 서버 쪽 출입증은 시간이 지나면 저절로 없어집니다.
  }

  state.token = '';
});

// 뒤로 가기 등으로 화면이 되살아난 경우에도 다시 로그인하게 합니다.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    state.token = '';
    showLogin();
  }
});

// --------------------------------------------------------------------------
// 입력 폼 만들기 (서버가 알려준 정의대로)
// --------------------------------------------------------------------------
// 초안 / 공개를 고르는 카드를 만듭니다.
// 두 선택지의 설명이 항상 함께 보여서, 고르기 전에 비교할 수 있습니다.
function buildStatusOptions() {
  const box = $('statusOptions');
  box.replaceChildren();

  state.statuses.forEach((status, index) => {
    const card = el('label', 'status-option');

    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'status';
    radio.value = status.value;
    // 처음에는 초안이 골라져 있습니다. (빈칸이 있어도 저장되는 쪽)
    if (index === 0) radio.checked = true;
    radio.addEventListener('change', updateStatusUI);

    const text = el('span', 'status-text');
    text.append(
      el('span', 'status-name', status.label),
      el('span', 'status-desc', status.hint),
    );

    card.append(radio, el('span', 'status-mark'), text);
    box.append(card);
  });

  updateStatusUI();
}

// 고른 카드를 표시하고, 저장 버튼의 이름을 상태에 맞게 바꿉니다.
function updateStatusUI() {
  const current = readStatus();

  document.querySelectorAll('.status-option').forEach((card) => {
    const isSelected = card.querySelector('input').value === current;
    card.classList.toggle('is-selected', isSelected);
  });

  // 초안이면 '임시저장', 공개면 '공개로 저장' 이라고 알려 줍니다.
  $('saveButton').textContent = current === 'draft' ? '임시저장' : '공개로 저장';
}

function buildFields() {
  const list = $('fieldList');
  list.replaceChildren();

  state.fields.forEach((field) => {
    const wrap = el('label', 'field');
    wrap.dataset.fieldKey = field.key;

    const labelRow = el('span', 'field-label');
    labelRow.append(el('span', '', field.label));
    // 참고사항만 빼고 '공개' 저장 시 반드시 필요합니다.
    if (field.required) labelRow.append(el('span', 'required-chip', '필수'));

    const input =
      field.type === 'textarea' ? el('textarea') : el('input');

    if (field.type === 'textarea') {
      input.rows = field.rows || 4;
    } else {
      input.type = field.type === 'number' ? 'number' : 'text';
      if (field.min !== undefined) input.min = field.min;
    }

    // 빈칸일 때 옅은 색으로 보이는 예시입니다. 입력하면 사라집니다.
    input.placeholder = field.placeholder || '';
    input.id = `field-${field.key}`;

    wrap.append(labelRow, input, el('p', 'field-error'));
    list.append(wrap);
  });
}

// --------------------------------------------------------------------------
// 폼 읽기 / 채우기
// --------------------------------------------------------------------------
function readStatus() {
  return document.querySelector('input[name="status"]:checked')?.value || 'draft';
}

function readForm() {
  const value = { status: readStatus() };
  state.fields.forEach((field) => {
    value[field.key] = $(`field-${field.key}`).value.trim();
  });
  return value;
}

function fillForm(project) {
  state.fields.forEach((field) => {
    const raw = project?.[field.key];
    $(`field-${field.key}`).value = raw === null || raw === undefined ? '' : raw;
  });

  const status = project?.status || 'draft';
  const radio = document.querySelector(`input[name="status"][value="${status}"]`);
  if (radio) radio.checked = true;

  updateStatusUI();
  clearFieldErrors();

  // 지금 채운 값을 '기준'으로 삼습니다. 이후 달라지면 '바뀐 것'으로 봅니다.
  state.baseline = snapshot();
  updateAutosaveStatus(false);
}

// 지금 화면에 입력된 내용 전체입니다.
function snapshot() {
  return { editingId: state.editingId, ...readForm() };
}

function isDirty() {
  if (!state.baseline) return false;
  return JSON.stringify(snapshot()) !== JSON.stringify(state.baseline);
}

function confirmDiscard() {
  if (!isDirty()) return true;
  return window.confirm('저장하지 않은 변경이 있습니다. 버리고 이동할까요?');
}

function clearFieldErrors() {
  document.querySelectorAll('.field').forEach((field) => {
    field.classList.remove('has-error');
    const error = field.querySelector('.field-error');
    if (error) error.textContent = '';
  });
}

function showFieldErrors(errors) {
  clearFieldErrors();
  Object.entries(errors).forEach(([key, message]) => {
    const field = document.querySelector(`.field[data-field-key="${key}"]`);
    if (!field) return;
    field.classList.add('has-error');
    field.querySelector('.field-error').textContent = message;
  });
}

// 서버와 같은 규칙으로 미리 확인합니다. 최종 판단은 서버가 합니다.
function findEmptyRequired(value) {
  if (value.status !== 'published') return {};

  const errors = {};
  state.fields
    .filter((field) => field.required && !String(value[field.key] ?? '').trim())
    .forEach((field) => {
      errors[field.key] = `공개하려면 ${field.label}을(를) 입력해야 합니다.`;
    });
  return errors;
}

// --------------------------------------------------------------------------
// 자동 보관 — 저장 버튼을 누르기 전의 입력도 지키기
// --------------------------------------------------------------------------
let autosaveTimer = null;

function updateAutosaveStatus(dirty) {
  const node = $('autosaveStatus');
  node.classList.toggle('is-dirty', dirty);
  node.textContent = dirty ? '저장하지 않은 변경이 있습니다 (자동 보관 중)' : '';
}

function saveAutosave() {
  if (!isDirty()) {
    removeStore(AUTOSAVE_KEY);
    updateAutosaveStatus(false);
    return;
  }

  writeStore(AUTOSAVE_KEY, { ...snapshot(), savedAt: Date.now() });
  updateAutosaveStatus(true);
}

// 글자를 칠 때마다 저장하지 않고, 잠깐 멈췄을 때 한 번만 보관합니다.
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(saveAutosave, AUTOSAVE_DELAY_MS);
  updateAutosaveStatus(isDirty());
}

$('projectForm').addEventListener('input', scheduleAutosave);
$('projectForm').addEventListener('change', scheduleAutosave);

function timeAgo(time) {
  const minutes = Math.round((Date.now() - time) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  return `${Math.round(minutes / 60)}시간 전`;
}

// 저장하지 않고 창을 닫았던 내용이 있으면 알려 줍니다.
function showRestoreBar() {
  const saved = readStore(AUTOSAVE_KEY);
  if (!saved) return;

  const target = saved.editingId
    ? state.projects.find((project) => project.id === saved.editingId)
    : null;
  const where = saved.editingId
    ? `"${target?.title || '제목 없는 작업물'}" 을(를) 고치던 내용`
    : '새 작업물에 적던 내용';

  $('restoreText').textContent =
    `저장하지 않은 ${where}이 있습니다. (${timeAgo(saved.savedAt)})`;
  $('restoreBar').hidden = false;
}

function applyValues(values) {
  state.fields.forEach((field) => {
    $(`field-${field.key}`).value = values[field.key] ?? '';
  });

  const radio = document.querySelector(`input[name="status"][value="${values.status}"]`);
  if (radio) radio.checked = true;

  updateStatusUI();
  updateAutosaveStatus(true);
}

$('restoreApply').addEventListener('click', () => {
  const saved = readStore(AUTOSAVE_KEY);
  $('restoreBar').hidden = true;
  if (!saved) return;

  // 고치던 작업물이 아직 있으면 그 작업물을 열고, 없으면 새 작업물로 엽니다.
  if (saved.editingId && state.projects.some((p) => p.id === saved.editingId)) {
    startEdit(saved.editingId);
  } else {
    startNew();
  }

  applyValues(saved);
  showMessage($('formMessage'), '저장하지 않았던 내용을 불러왔습니다. 확인하고 저장해 주세요.', 'info');
});

$('restoreDiscard').addEventListener('click', () => {
  removeStore(AUTOSAVE_KEY);
  $('restoreBar').hidden = true;
});

// --------------------------------------------------------------------------
// 목록
// --------------------------------------------------------------------------
function missingCount(project) {
  return state.fields.filter(
    (field) => field.required && !String(project[field.key] ?? '').trim(),
  ).length;
}

function renderList() {
  const list = $('projectList');
  list.replaceChildren();

  if (state.projects.length === 0) {
    list.append(el('li', 'list-empty', '아직 등록된 작업물이 없습니다.'));
    return;
  }

  state.projects.forEach((project) => {
    const button = el('button', 'project-item');
    button.type = 'button';
    if (project.id === state.editingId) button.classList.add('is-selected');

    const title = el('span', 'item-title', project.title || '(제목 없음)');
    if (!project.title) title.classList.add('is-empty');

    const meta = el('div', 'item-meta');
    const isPublished = project.status === 'published';
    meta.append(
      el('span', `badge ${isPublished ? 'published' : 'draft'}`, isPublished ? '공개' : '초안'),
    );

    const missing = missingCount(project);
    if (missing > 0) {
      meta.append(el('span', 'badge missing', `빈 칸 ${missing}개`));
    }

    // 제목이 같은 작업물이 또 있으면 표시합니다. (판단은 서버가 합니다)
    if (project.isDuplicate) {
      meta.append(el('span', 'badge duplicate', '중복'));
    }

    button.append(title, meta);
    button.addEventListener('click', () => {
      // 이미 고르고 있는 항목이면 그대로 둡니다.
      if (project.id === state.editingId) return;
      // 저장하지 않은 내용이 있으면 먼저 물어봅니다.
      if (!confirmDiscard()) return;
      removeStore(AUTOSAVE_KEY);
      startEdit(project.id);
    });

    const row = el('li');
    row.append(button);
    list.append(row);
  });
}

async function reloadProjects() {
  state.projects = await api('/projects');
  renderList();
}

// --------------------------------------------------------------------------
// 중복 안내 — 같은 제목이 이미 있을 때 어떻게 할지 물어봅니다
// --------------------------------------------------------------------------
let pendingDuplicate = null;

function describeProject(project) {
  const status = project.status === 'published' ? '공개' : '초안';
  const detail = [project.date, project.role, project.teamSize ? `${project.teamSize}명` : '']
    .filter(Boolean)
    .join(' · ');
  return `"${project.title}"  [${status}]${detail ? `  ${detail}` : ''}`;
}

function showDuplicateBar(duplicate, values) {
  pendingDuplicate = { duplicate, values };

  $('duplicateTarget').textContent = describeProject(duplicate);
  $('duplicateNote').textContent = state.editingId
    ? '합치기를 누르면 기존 작업물의 빈 칸만 지금 입력한 내용으로 채우고, 지금 고치던 항목은 지웁니다. 이미 적혀 있던 값은 그대로 둡니다.'
    : '합치기를 누르면 기존 작업물의 빈 칸만 지금 입력한 내용으로 채웁니다. 이미 적혀 있던 값은 그대로 두고, 지금 만들던 항목은 따로 저장되지 않습니다.';
  $('duplicateBar').hidden = false;

  showMessage($('formMessage'), '');
}

function hideDuplicateBar() {
  pendingDuplicate = null;
  $('duplicateBar').hidden = true;
}

$('duplicateCancel').addEventListener('click', hideDuplicateBar);

$('duplicateSeparate').addEventListener('click', () => {
  hideDuplicateBar();
  saveProject({ allowDuplicate: true });
});

$('duplicateMerge').addEventListener('click', async () => {
  if (!pendingDuplicate) return;

  const { duplicate, values } = pendingDuplicate;
  const button = $('duplicateMerge');
  button.disabled = true;

  try {
    const result = await api(`/projects/${duplicate.id}/merge`, {
      method: 'POST',
      body: { values, fromId: state.editingId },
    });

    hideDuplicateBar();
    removeStore(AUTOSAVE_KEY);
    await reloadProjects();
    startEdit(result.project.id);

    const filled = result.filledLabels.length > 0
      ? `${result.filledLabels.join(', ')} 칸을 채웠습니다.`
      : '기존 내용이 이미 채워져 있어 그대로 두었습니다.';
    const removed = result.removed ? ' 중복 항목은 지웠습니다.' : '';

    showMessage($('formMessage'), `하나로 합쳤습니다. ${filled}${removed}`, 'success');
  } catch (error) {
    showMessage($('formMessage'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

// --------------------------------------------------------------------------
// 새로 만들기 / 수정하기 / 저장
// --------------------------------------------------------------------------
function startNew() {
  state.editingId = null;
  $('formTitle').textContent = '새 작업물';
  $('formHint').textContent = '';
  // 저장 버튼의 이름은 초안/공개에 따라 fillForm 안에서 정해집니다.
  fillForm(null);
  hideDuplicateBar();
  showMessage($('formMessage'), '');
  renderList();
}

function startEdit(id) {
  const project = state.projects.find((item) => item.id === id);
  if (!project) return;

  state.editingId = id;
  $('formTitle').textContent = '작업물 수정';
  $('formHint').textContent = project.media
    ? '사진·영상이 있는 작업물입니다 (사진·영상은 여기서 바뀌지 않습니다)'
    : '';
  fillForm(project);
  hideDuplicateBar();

  // 제목이 같은 작업물이 또 있으면 미리 알려 줍니다.
  showMessage(
    $('formMessage'),
    project.isDuplicate
      ? '제목이 같은 작업물이 또 있습니다. 저장을 누르면 합칠지 물어봅니다.'
      : '',
    'info',
  );
  renderList();
}

$('newButton').addEventListener('click', () => {
  if (!confirmDiscard()) return;
  removeStore(AUTOSAVE_KEY);
  startNew();
});

$('cancelButton').addEventListener('click', () => {
  removeStore(AUTOSAVE_KEY);
  if (state.editingId) {
    startEdit(state.editingId);
  } else {
    startNew();
  }
});

// allowDuplicate 를 주면 같은 제목이 있어도 그대로 저장합니다.
// (화면에서 '따로 저장' 을 골랐을 때 사용합니다)
async function saveProject({ allowDuplicate = false } = {}) {
  const value = readForm();
  const clientErrors = findEmptyRequired(value);

  if (Object.keys(clientErrors).length > 0) {
    showFieldErrors(clientErrors);
    showMessage($('formMessage'), '공개하려면 참고사항을 뺀 모든 칸을 채워야 합니다.', 'error');
    return;
  }

  const button = $('saveButton');
  button.disabled = true;

  try {
    const body = allowDuplicate ? { ...value, allowDuplicate: true } : value;
    const saved = state.editingId
      ? await api(`/projects/${state.editingId}`, { method: 'PUT', body })
      : await api('/projects', { method: 'POST', body });

    hideDuplicateBar();
    clearFieldErrors();
    // 서버에 들어갔으므로 브라우저에 잠깐 보관해 둔 내용은 필요 없습니다.
    removeStore(AUTOSAVE_KEY);
    $('restoreBar').hidden = true;

    await reloadProjects();
    startEdit(saved.id);

    showMessage(
      $('formMessage'),
      saved.status === 'published'
        ? '저장했습니다. 사이트에 바로 보입니다.'
        : '임시저장했습니다. 방문자에게는 보이지 않고, 다음에 들어와도 그대로 남아 있습니다.',
      'success',
    );
  } catch (error) {
    // 같은 제목이 이미 있으면, 합칠지 따로 저장할지 물어봅니다.
    if (error.status === 409 && error.duplicate) {
      showDuplicateBar(error.duplicate, value);
      return;
    }

    showFieldErrors(error.fields || {});
    showMessage($('formMessage'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

$('projectForm').addEventListener('submit', (event) => {
  event.preventDefault();
  saveProject();
});

// --------------------------------------------------------------------------
// 배포용 파일 다시 만들기
// --------------------------------------------------------------------------
$('buildButton').addEventListener('click', async () => {
  const button = $('buildButton');
  button.disabled = true;
  showMessage($('globalMessage'), '배포용 파일을 만드는 중입니다...', 'info');

  try {
    const result = await api('/build', { method: 'POST' });
    showMessage($('globalMessage'), `${result.message}\n\n${result.output.trim()}`, 'success');
  } catch (error) {
    showMessage($('globalMessage'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

// --------------------------------------------------------------------------
// 시작
// --------------------------------------------------------------------------
// 들어올 때는 언제나 로그인 화면부터 보여 줍니다.
// 출입증을 어디에도 저장하지 않으므로 새로고침해도, 새 창으로 열어도 마찬가지입니다.
showLogin();

// 파일을 직접 열면(file://) 서버에 연결할 수 없어 로그인이 되지 않습니다.
// 이때 아무 반응이 없으면 원인을 알기 어려우므로 미리 알려 줍니다.
if (!location.protocol.startsWith('http')) {
  showMessage(
    $('loginMessage'),
    '이 페이지는 서버를 통해 열어야 합니다.\n주소창에 http://localhost:4000/admin 을 입력해 주세요.',
    'error',
  );
  $('passwordInput').disabled = true;
  $('loginButton').disabled = true;
}
