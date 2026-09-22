// ==========================================================================
// Gradient Noir Theme - Interactive Script
// Hansol Choi Portfolio
//
// 화면이 다 그려진 뒤에 버튼·모달·스크롤 효과를 연결합니다.
// (호출은 main.js 가 합니다)
// ==========================================================================

function initInteractions(portfolio) {
  const projects = portfolio.projects || [];

  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }

  // 1-1. Nav Link Selection
  // 처음에는 아무것도 선택되지 않은 상태(흰색)이고,
  // 메뉴를 클릭하면 그 항목만 연두색으로 표시된다.
  const navLinks = document.querySelectorAll('.nav-link');
  const navLogo = document.querySelector('.nav-logo');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(other => other.classList.remove('is-selected'));
      link.classList.add('is-selected');
    });
  });

  // 로고를 눌러 맨 위로 돌아오면 선택 상태를 해제한다.
  if (navLogo) {
    navLogo.addEventListener('click', () => {
      navLinks.forEach(link => link.classList.remove('is-selected'));
    });
  }

  // 2. Project Category Filter Tabs
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || filter === category) {
          card.style.display = 'flex';
          setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => { card.style.display = 'none'; }, 200);
        }
      });
    });
  });

  // 3. Panel Image Lightbox Modal & Zoom Controls
  const panelModal = document.getElementById('panelModal');
  const panelModalBackdrop = document.getElementById('panelModalBackdrop');
  const closePanelModal = document.getElementById('closePanelModal');
  const panelModalTitle = document.getElementById('panelModalTitle');
  const panelViewerImg = document.getElementById('panelViewerImg');

  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');

  let currentZoom = 1;

  function openPanelViewer(project) {
    // 고해상도 그림은 뷰어를 열 때 처음 불러온다.
    if (panelViewerImg) {
      panelViewerImg.src = project.media.fullSrc;
      panelViewerImg.alt = project.media.alt || project.title;
    }
    if (panelModalTitle) panelModalTitle.textContent = project.viewerTitle;

    panelModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetZoom();
  }

  function closePanelViewer() {
    panelModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function applyZoom() {
    if (panelViewerImg) {
      panelViewerImg.style.transform = `scale(${currentZoom})`;
    }
  }

  function resetZoom() {
    currentZoom = 1;
    applyZoom();
  }

  if (closePanelModal) closePanelModal.addEventListener('click', closePanelViewer);
  if (panelModalBackdrop) panelModalBackdrop.addEventListener('click', closePanelViewer);

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      if (currentZoom < 3) {
        currentZoom += 0.3;
        applyZoom();
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (currentZoom > 0.5) {
        currentZoom -= 0.3;
        applyZoom();
      }
    });
  }

  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePanelViewer();
      closeVideoViewer();
    }
  });

  // 4. Video Modal Controls
  const videoModal = document.getElementById('videoModal');
  const videoModalBackdrop = document.getElementById('videoModalBackdrop');
  const closeVideoModal = document.getElementById('closeVideoModal');
  const videoModalTitle = document.getElementById('videoModalTitle');
  const modalVideoPlayer = document.getElementById('modalVideoPlayer');

  // 지금 플레이어에 올려 둔 영상이 무엇인지 기억해 둔다.
  let loadedVideoId = null;

  function openVideoViewer(project) {
    if (videoModalTitle) videoModalTitle.textContent = project.viewerTitle;

    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (modalVideoPlayer) {
      // 영상 주소는 여기서 처음 넣는다.
      // 그래서 모달을 열기 전까지는 영상을 내려받지 않는다.
      if (loadedVideoId !== project.id) {
        modalVideoPlayer.src = project.media.src;
        loadedVideoId = project.id;
      } else if (modalVideoPlayer.readyState > 0) {
        // 같은 영상을 다시 열면 처음부터 재생한다.
        modalVideoPlayer.currentTime = 0;
      }

      // 모바일에서 재생이 거부될 수 있으므로 실패해도 조용히 넘어간다.
      // 재생 버튼은 controls 로 계속 노출된다.
      const played = modalVideoPlayer.play();
      if (played && typeof played.catch === 'function') {
        played.catch(() => {});
      }
    }
  }

  function closeVideoViewer() {
    videoModal.classList.remove('active');
    document.body.style.overflow = '';
    if (modalVideoPlayer) {
      modalVideoPlayer.pause();
    }
  }

  if (closeVideoModal) closeVideoModal.addEventListener('click', closeVideoViewer);
  if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeVideoViewer);

  // 4-1. 카드의 '열기' 버튼 — 어떤 작업물인지 확인해 알맞은 모달을 연다.
  //      카드는 데이터로 만들어지므로, 카드 하나하나가 아니라
  //      목록 전체에 한 번만 연결한다. 작업물이 늘어도 고칠 곳이 없다.
  const projectsGrid = document.getElementById('projectsGrid');

  if (projectsGrid) {
    projectsGrid.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action="open-project"]');
      if (!button) return;

      const card = button.closest('.project-card');
      const project = projects.find(item => item.id === card?.dataset.projectId);
      if (!project) return;

      if (project.media.type === 'video') {
        openVideoViewer(project);
      } else {
        openPanelViewer(project);
      }
    });
  }

  // 5. Contact Copy to Clipboard
  const btnCopyPhone = document.getElementById('btnCopyPhone');
  const phoneText = document.getElementById('phoneText');

  if (btnCopyPhone && phoneText) {
    btnCopyPhone.addEventListener('click', () => {
      const textToCopy = phoneText.textContent.trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHTML = btnCopyPhone.innerHTML;
        btnCopyPhone.innerHTML = '<i data-lucide="check"></i> 복사됨!';
        btnCopyPhone.style.background = '#f5b21c';
        btnCopyPhone.style.borderColor = '#f5b21c';
        btnCopyPhone.style.color = '#030405';
        lucide.createIcons();

        setTimeout(() => {
          btnCopyPhone.innerHTML = originalHTML;
          btnCopyPhone.style.background = '';
          btnCopyPhone.style.borderColor = '';
          btnCopyPhone.style.color = '';
          lucide.createIcons();
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy phone number: ', err);
      });
    });
  }

  // 6. Header — 스크롤을 내리면 헤더 뒤에 흐린 배경을 깐다.
  const siteHeader = document.getElementById('siteHeader');

  function updateHeader() {
    if (siteHeader) {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
    }
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // 7. Background — 화면 가운데에 온 섹션의 data-bg 값에 따라 배경 빛을 바꾼다.
  //    night: 어두운 남색 / vivid: 다채로운 색
  const bgSections = document.querySelectorAll('[data-bg]');

  if ('IntersectionObserver' in window && bgSections.length) {
    const bgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const isVivid = entry.target.getAttribute('data-bg') === 'vivid';
          document.body.classList.toggle('bg-is-vivid', isVivid);
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });

    bgSections.forEach(section => bgObserver.observe(section));
  }

  // 8. Reveal — 요소가 화면에 들어오면 흐림에서 선명하게 나타난다.
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-in'));
  }

  // 9. Glass Lens — 히어로 위에서만 커서를 부드럽게 따라다닌다.
  //    마우스가 있는 기기에서만, 움직임 줄이기 설정이 꺼져 있을 때만 동작한다.
  const lens = document.getElementById('lens');
  const hero = document.getElementById('hero');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (lens && hero && canHover && !reduceMotion) {
    let targetX = -400;
    let targetY = -400;
    let lensX = targetX;
    let lensY = targetY;
    let lensScale = 0.6;
    let isOverHero = false;

    hero.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isOverHero) {
        // 처음 들어올 때는 커서 위치에서 바로 시작한다.
        lensX = targetX;
        lensY = targetY;
        isOverHero = true;
        lens.classList.add('is-visible');
      }
    });

    hero.addEventListener('pointerleave', () => {
      isOverHero = false;
      lens.classList.remove('is-visible');
    });

    function moveLens() {
      lensX += (targetX - lensX) * 0.14;
      lensY += (targetY - lensY) * 0.14;
      lensScale += ((isOverHero ? 1 : 0.6) - lensScale) * 0.1;
      lens.style.transform = `translate3d(${lensX}px, ${lensY}px, 0) scale(${lensScale})`;
      requestAnimationFrame(moveLens);
    }

    requestAnimationFrame(moveLens);
  }

  // 10. Share — 헤더 오른쪽 '공유하기'에서 링크 공유 / PDF 공유를 고른다.
  const shareToggle = document.getElementById('shareToggle');
  const shareMenu = document.getElementById('shareMenu');
  const shareLink = document.getElementById('shareLink');
  const sharePdf = document.getElementById('sharePdf');

  function setShareMenu(open) {
    shareMenu.classList.toggle('is-open', open);
    shareToggle.setAttribute('aria-expanded', String(open));
  }

  if (shareToggle && shareMenu) {
    shareToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setShareMenu(!shareMenu.classList.contains('is-open'));
    });

    // 메뉴 바깥을 누르거나 Esc 를 누르면 닫는다.
    document.addEventListener('click', (e) => {
      if (!shareMenu.contains(e.target)) setShareMenu(false);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setShareMenu(false);
    });
  }

  // 10-1. 링크 공유 — 휴대폰은 기기 공유창, PC 는 주소 복사.
  if (shareLink) {
    shareLink.addEventListener('click', () => {
      const url = location.href.split('#')[0];
      const label = shareLink.querySelector('span');

      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        navigator.share({ title: document.title, url }).catch(() => {});
        setShareMenu(false);
        return;
      }

      if (!navigator.clipboard) {
        window.prompt('아래 링크를 복사하세요.', url);
        return;
      }

      navigator.clipboard.writeText(url).then(() => {
        label.textContent = '링크가 복사되었습니다';
        setTimeout(() => {
          label.textContent = '링크 공유';
          setShareMenu(false);
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
      });
    });
  }

  // 10-2. PDF 공유 — 페이지에서 핵심 내용만 읽어 A4 문서를 만든 뒤 저장창을 연다.
  //       문서 내용은 화면의 문구를 그대로 가져오므로, 페이지를 고치면 PDF 도 따라 바뀐다.
  const printDoc = document.getElementById('printDoc');

  // innerText 를 써야 <br> 줄바꿈이 띄어쓰기로 남는다.
  function textOf(selector, root = document) {
    const node = root.querySelector(selector);
    return node ? node.innerText.replace(/\s+/g, ' ').trim() : '';
  }

  function addSection(title) {
    const section = el('section', 'pd-section');
    section.append(el('h2', 'pd-h2', title));
    printDoc.append(section);
    return section;
  }

  function buildPrintDoc() {
    printDoc.innerHTML = '';

    const details = [...document.querySelectorAll('.contact-details .detail-item')].map(item => ({
      label: textOf('.label', item),
      value: textOf('.val', item),
    }));
    // 첫 항목 "최한솔 (여성)" 에서 이름만 꺼낸다.
    const name = details.length ? details[0].value.replace(/\s*\(.*\)$/, '') : '';

    // 머리말: 이름 · 한 줄 소개 · 소속
    const header = el('header', 'pd-header');
    const title = el('h1', 'pd-name', name);
    title.append(el('span', '', textOf('.hero-name')));
    header.append(
      el('p', 'pd-eyebrow', textOf('.hero-meta .meta-strong')),
      title,
      el('p', 'pd-headline', textOf('.hero-title')),
      el('p', 'pd-affiliation', textOf('.trust-label'))
    );
    printDoc.append(header);

    // 1. 인적사항
    const info = el('dl', 'pd-info');
    details.forEach(({ label, value }) => {
      info.append(el('dt', '', label), el('dd', '', value));
    });
    addSection('1. 인적사항 및 연락처').append(info);

    // 2. 작업물
    const works = addSection('2. 작업물');
    document.querySelectorAll('.project-card').forEach(card => {
      const item = el('article', 'pd-project');
      const img = card.querySelector('.thumb-frame img');
      if (img) {
        const copy = el('img', 'pd-project-img');
        copy.src = img.currentSrc || img.src;
        copy.alt = img.alt;
        item.append(copy);
      }
      const body = el('div');
      body.append(
        el('p', 'pd-tag', textOf('.project-tag', card)),
        el('h3', 'pd-h3', textOf('.project-title', card)),
        el('p', '', textOf('.project-desc', card))
      );

      // 날짜·역할·인원수와 참고사항은 적혀 있을 때만 넣는다.
      const meta = textOf('.project-meta', card);
      if (meta) body.append(el('p', 'pd-meta', meta));

      const notes = textOf('.project-notes', card);
      if (notes) body.append(el('p', 'pd-meta', notes));

      item.append(body);
      works.append(item);
    });

    // 3. 활동 및 자격
    const table = el('table', 'pd-table');
    table.innerHTML = '<thead><tr><th>구분</th><th>항목</th><th>내용</th></tr></thead>';
    const tbody = el('tbody');
    document.querySelectorAll('.about-list .feature-card').forEach(card => {
      const row = el('tr');
      row.append(
        el('td', '', textOf('.card-category', card)),
        el('td', '', textOf('h3', card)),
        el('td', '', textOf('.card-text', card))
      );
      tbody.append(row);
    });
    table.append(tbody);
    addSection('3. 활동 및 자격').append(table);

    // 꼬리말: 웹 주소(인터넷에 올라간 경우만) · 생성일
    const today = new Date();
    const date = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
      .map(n => String(n).padStart(2, '0')).join('.');
    const footer = el('footer', 'pd-footer');
    footer.append(
      el('span', '', location.protocol.startsWith('http') ? location.href.split('#')[0] : ''),
      el('span', '', `생성일 ${date}`)
    );
    printDoc.append(footer);

    return name;
  }

  if (sharePdf && printDoc) {
    sharePdf.addEventListener('click', () => {
      setShareMenu(false);
      const name = buildPrintDoc();
      const originalTitle = document.title;

      // 저장창이 제안하는 파일 이름이 된다.
      document.title = `${name}_포트폴리오`;
      document.body.classList.add('is-printing');

      window.addEventListener('afterprint', () => {
        document.body.classList.remove('is-printing');
        document.title = originalTitle;
      }, { once: true });

      // 이미지와 글꼴이 준비된 뒤에 저장창을 열어야 빈칸 없이 저장된다.
      const images = [...printDoc.querySelectorAll('img')].map(img => img.decode().catch(() => {}));
      Promise.all([...images, document.fonts.ready]).then(() => window.print());
    });
  }
}
