// ==========================================================================
// 데이터를 화면에 그립니다.
// 이 파일은 데이터를 가져오는 방법도, 버튼이 어떻게 동작하는지도 모릅니다.
// 오로지 "받은 데이터 → HTML" 만 담당합니다.
// ==========================================================================

// 태그를 하나 만드는 도우미입니다. (api.js·ui.js 에서도 함께 씁니다)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function byId(id) {
  return document.getElementById(id);
}

// 목록을 통째로 새로 채웁니다.
function fill(container, nodes) {
  if (!container) return;
  container.replaceChildren(...nodes);
}

// Lucide 아이콘 한 개를 만듭니다.
function icon(name) {
  const node = document.createElement('i');
  node.setAttribute('data-lucide', name);
  return node;
}

// 인적사항에서 자주 쓰는 문구를 한 곳에서 만듭니다.
// 문구를 바꾸고 싶으면 여기만 고치면 페이지 전체가 함께 바뀝니다.
function affiliationText(profile) {
  return `${profile.university} ${profile.department}`;
}

function studentIdText(profile) {
  return `학번 ${profile.studentId}`;
}

// --------------------------------------------------------------------------
// 1. 히어로 — 이름과 소속
// --------------------------------------------------------------------------
function renderHero(profile) {
  // "Choi Hansol" → CHOI + Hansol (성은 대문자, 이름은 기울임체)
  const [family, ...given] = profile.nameEn.split(' ');

  const heroName = byId('heroName');
  if (heroName) {
    fill(heroName, [
      document.createTextNode(`${family.toUpperCase()} `),
      el('em', '', given.join(' ')),
    ]);
  }

  const heroAffiliation = byId('heroAffiliation');
  if (heroAffiliation) {
    fill(heroAffiliation, [
      document.createTextNode(profile.university),
      document.createElement('br'),
      document.createTextNode(profile.department),
    ]);
  }
}

// --------------------------------------------------------------------------
// 2. 상단 띠 — 소속 한 줄 + 활동·자격 요약
// --------------------------------------------------------------------------
function renderTrust(profile, credentials) {
  const label = byId('trustLabel');
  if (label) {
    label.textContent = `${affiliationText(profile)} · ${studentIdText(profile)}`;
  }

  fill(
    byId('trustItems'),
    credentials.map((item) => el('li', '', item.shortLabel || item.title)),
  );
}

// --------------------------------------------------------------------------
// 3. 분야 필터 버튼
// --------------------------------------------------------------------------
function renderFilters(filters) {
  fill(
    byId('filterTabs'),
    filters.map((filter, index) => {
      const button = el('button', 'filter-btn', filter.label);
      // 첫 번째 버튼이 처음부터 선택된 상태입니다.
      if (index === 0) button.classList.add('active');
      button.dataset.filter = filter.value;
      return button;
    }),
  );
}

// --------------------------------------------------------------------------
// 4. 작업물 카드
// --------------------------------------------------------------------------

// 카드 위쪽의 미리보기(사진 또는 영상)를 만듭니다.
// 관리자 화면에서 만든 작업물에는 사진·영상이 없으므로 null 을 돌려줍니다.
function projectPreview(media) {
  if (!media || !media.type) return null;

  if (media.type === 'video') {
    const video = el('video');
    video.src = media.src;
    video.setAttribute('muted', '');
    video.muted = true;
    // playsinline 은 iOS 에서 전체화면으로 튀는 것을 막습니다.
    video.setAttribute('playsinline', '');
    // 첫 장면만 미리 받아 표지처럼 보여 줍니다. 영상 전체는 받지 않습니다.
    video.setAttribute('preload', 'metadata');
    return video;
  }

  const image = el('img');
  image.src = media.thumbSrc;
  image.alt = media.alt || '';
  image.loading = 'lazy';
  return image;
}

// 사진 위에 떠오르는 버튼과 그 아래 화살표 버튼을 담은 미리보기 영역입니다.
function projectThumb(project) {
  const preview = projectPreview(project.media);
  if (!preview) return null;

  const frame = el('div', 'thumb-frame');
  frame.append(preview);

  const overlayButton = el('button', 'btn-overlay', project.overlayLabel);
  if (project.media.type === 'video') {
    overlayButton.classList.add('btn-play-trigger');
  }
  overlayButton.dataset.action = 'open-project';

  const overlay = el('div', 'thumb-overlay');
  overlay.append(overlayButton);

  const thumb = el('div', 'project-thumb');
  thumb.append(frame, overlay);
  return thumb;
}

// 날짜 · 역할 · 인원수를 한 줄로 만듭니다.
// 비어 있는 항목은 건너뛰므로, 아직 채우지 않은 칸이 빈칸으로 보이지 않습니다.
function projectMetaText(project) {
  return [
    project.date,
    project.role,
    project.teamSize ? `${project.teamSize}명` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function projectCard(project) {
  const card = el('article', 'project-card');
  card.dataset.category = project.category;
  // 버튼을 눌렀을 때 어떤 작업물인지 찾는 데 씁니다.
  card.dataset.projectId = project.id;

  const head = el('div', 'card-head');
  head.append(
    el('h3', 'project-title', project.title),
    el('span', 'card-rule'),
    el('span', 'project-tag', project.tag),
  );
  card.append(head);

  // 사진·영상이 있는 작업물만 미리보기와 열기 버튼을 갖습니다.
  const thumb = projectThumb(project);
  if (thumb) card.append(thumb);

  // 설명·날짜·참고사항을 한 덩어리로 묶습니다.
  // 오른쪽 버튼과 나란히 놓이도록 하기 위해서입니다.
  const textBox = el('div', 'project-text');
  textBox.append(el('p', 'project-desc', project.description));

  const meta = projectMetaText(project);
  if (meta) textBox.append(el('p', 'project-meta', meta));

  if (project.notes) {
    textBox.append(el('p', 'project-notes', `참고 — ${project.notes}`));
  }

  const body = el('div', 'project-body');
  body.append(textBox);

  if (thumb) {
    const arrowCircle = el('span', 'arrow-circle');
    arrowCircle.append(icon(project.actionIcon));

    const actionButton = el('button', 'btn-arrow');
    actionButton.dataset.action = 'open-project';
    actionButton.append(el('span', '', project.actionLabel), arrowCircle);
    body.append(actionButton);
  }

  card.append(body);
  return card;
}

function renderProjects(projects) {
  fill(byId('projectsGrid'), projects.map(projectCard));
}

// --------------------------------------------------------------------------
// 5. 활동 · 자격 카드
// --------------------------------------------------------------------------
function credentialCard(credential, index) {
  const card = el('li', 'feature-card reveal');

  const iconBox = el('span', 'card-icon');
  iconBox.append(icon(credential.icon));

  card.append(
    // 01, 02, 03 … 순서대로 매깁니다.
    el('span', 'card-index', String(index + 1).padStart(2, '0')),
    el('span', 'card-category', credential.category),
    el('h3', '', credential.title),
    el('p', 'card-text', credential.description),
    iconBox,
  );

  return card;
}

function renderCredentials(credentials) {
  fill(byId('aboutList'), credentials.map(credentialCard));
}

// --------------------------------------------------------------------------
// 6. 인적사항
// --------------------------------------------------------------------------

// 어떤 항목을 어떤 이름으로 보여줄지 정합니다.
// 항목을 늘리려면 이 목록에 한 줄만 추가하면 됩니다.
const CONTACT_ROWS = [
  {
    label: '성명 / 성별',
    value: (profile) => `${profile.name} (${profile.gender})`,
  },
  {
    label: '소속 및 학번',
    value: (profile) => `${affiliationText(profile)} (${studentIdText(profile)})`,
  },
  {
    label: '생년월일',
    value: (profile) => profile.birthDate,
  },
  {
    label: '연락처',
    value: (profile) => profile.phone,
    copyable: true,
  },
];

function contactRow(row, profile) {
  const item = el('div', 'detail-item');
  const value = el('dd', 'val');

  if (row.copyable) {
    // 복사 버튼이 읽어 갈 수 있도록 값을 span 으로 감쌉니다.
    const text = el('span', '', row.value(profile));
    text.id = 'phoneText';
    value.append(text);
  } else {
    value.textContent = row.value(profile);
  }

  item.append(el('dt', 'label', row.label), value);

  if (row.copyable) {
    const button = el('button', 'btn-copy');
    button.id = 'btnCopyPhone';
    button.title = '복사하기';
    button.append(icon('copy'), document.createTextNode(' 복사'));
    item.append(button);
  }

  return item;
}

function renderContact(profile) {
  fill(
    byId('contactDetails'),
    CONTACT_ROWS.map((row) => contactRow(row, profile)),
  );
}

// --------------------------------------------------------------------------
// 7. 푸터
// --------------------------------------------------------------------------
function renderFooter(profile, projects) {
  fill(
    byId('footerWorks'),
    projects.map((project) => {
      const link = el('a', '', project.title);
      link.href = '#projects';
      const row = el('li');
      row.append(link);
      return row;
    }),
  );

  fill(byId('footerAbout'), [
    el('li', '', affiliationText(profile)),
    el('li', '', studentIdText(profile)),
    el('li', '', profile.birthDate),
  ]);

  fill(byId('footerContact'), [el('li', '', profile.phone)]);

  const copyright = byId('footerCopyright');
  if (copyright) {
    copyright.textContent =
      `© ${profile.copyrightYear} ${profile.name} (${profile.nameEn}). All Rights Reserved.`;
  }
}

// --------------------------------------------------------------------------
// 전체 그리기
// --------------------------------------------------------------------------
function renderPortfolio(data) {
  const { profile, filters = [], projects = [], credentials = [] } = data;

  renderHero(profile);
  renderTrust(profile, credentials);
  renderFilters(filters);
  renderProjects(projects);
  renderCredentials(credentials);
  renderContact(profile);
  renderFooter(profile, projects);
}
