// ==========================================================================
// Original Glassmorphism Theme - Interactive Script
// Hansol Choi Portfolio
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
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
  const openPanelBtn1 = document.getElementById('openPanelModal');
  const openPanelBtn2 = document.getElementById('btnViewPanel');
  const panelViewerImg = document.getElementById('panelViewerImg');

  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');

  let currentZoom = 1;

  function openPanelViewer() {
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

  if (openPanelBtn1) openPanelBtn1.addEventListener('click', openPanelViewer);
  if (openPanelBtn2) openPanelBtn2.addEventListener('click', openPanelViewer);
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
  const openVideoBtn1 = document.getElementById('openVideoModal');
  const openVideoBtn2 = document.getElementById('btnPlayVideo');
  const modalVideoPlayer = document.getElementById('modalVideoPlayer');

  function openVideoViewer() {
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (modalVideoPlayer) {
      modalVideoPlayer.currentTime = 0;
      modalVideoPlayer.play();
    }
  }

  function closeVideoViewer() {
    videoModal.classList.remove('active');
    document.body.style.overflow = '';
    if (modalVideoPlayer) {
      modalVideoPlayer.pause();
    }
  }

  if (openVideoBtn1) openVideoBtn1.addEventListener('click', openVideoViewer);
  if (openVideoBtn2) openVideoBtn2.addEventListener('click', openVideoViewer);
  if (closeVideoModal) closeVideoModal.addEventListener('click', closeVideoViewer);
  if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeVideoViewer);

  // 5. Contact Copy to Clipboard
  const btnCopyPhone = document.getElementById('btnCopyPhone');
  const phoneText = document.getElementById('phoneText');

  if (btnCopyPhone && phoneText) {
    btnCopyPhone.addEventListener('click', () => {
      const textToCopy = phoneText.textContent.trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHTML = btnCopyPhone.innerHTML;
        btnCopyPhone.innerHTML = '<i data-lucide="check"></i> 복사됨!';
        btnCopyPhone.style.background = '#10b981';
        btnCopyPhone.style.color = '#042f2e';
        lucide.createIcons();

        setTimeout(() => {
          btnCopyPhone.innerHTML = originalHTML;
          btnCopyPhone.style.background = '';
          btnCopyPhone.style.color = '';
          lucide.createIcons();
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy phone number: ', err);
      });
    });
  }
});
