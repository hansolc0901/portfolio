// ==========================================================================
// 시작점 — 순서를 정하는 파일입니다.
//   1) 데이터를 가져온다      (api.js)
//   2) 화면을 그린다          (render.js)
//   3) 버튼·효과를 연결한다   (ui.js)
//   4) 아이콘을 만든다        (Lucide)
//
// 3번이 2번보다 먼저 실행되면 아직 없는 버튼을 찾게 되므로 순서가 중요합니다.
// ==========================================================================

async function start() {
  const { data, source } = await loadPortfolio();

  if (!data) {
    console.error('포트폴리오 데이터를 불러오지 못했습니다.');
    // 데이터가 없어도 헤더의 아이콘은 보이도록 한다.
    lucide.createIcons();
    return;
  }

  // 지금 어느 쪽 데이터를 쓰는지 개발자 도구에서 확인할 수 있게 표시해 둔다.
  document.body.dataset.dataSource = source;

  renderPortfolio(data);
  initInteractions(data);

  // 아이콘은 카드가 만들어진 뒤에 한 번에 그린다.
  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', start);
