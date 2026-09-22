// 서버의 구성을 조립합니다. (실제로 켜는 일은 server.js 가 합니다)
import express from 'express';
import cors from 'cors';

import { config } from './config.js';
import { createRepository } from './repositories/index.js';
import { createPortfolioRouter } from './routes/portfolioRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // 데이터를 어디서 읽을지는 여기서 한 번만 정합니다.
  const repository = createRepository();

  // 나중에 쓰기(POST/PUT) 기능을 붙일 때를 위해 JSON 본문을 읽을 수 있게 해 둡니다.
  app.use(express.json());

  // 다른 주소에서 열린 화면이나 다른 프로그램이 부를 수 있게 허용합니다.
  // ★ 방문자용 주소에만 붙입니다. 관리자 주소에는 일부러 붙이지 않습니다.
  //   관리자 화면은 이 서버가 함께 내보내므로(같은 주소) 허용이 필요 없고,
  //   허용해 두면 다른 사이트의 스크립트가 내 브라우저로 로그인을 시도할 수 있습니다.
  const allowAll = config.allowedOrigins.includes('*');
  const publicCors = cors({ origin: allowAll ? true : config.allowedOrigins });

  // 서버가 살아 있는지, 지금 어떤 저장소를 쓰는지 확인하는 주소입니다.
  app.get('/api/health', publicCors, (req, res) => {
    res.json({
      data: {
        status: 'ok',
        dataSource: config.dataSource,
        time: new Date().toISOString(),
      },
    });
  });

  // 관리자용 주소를 먼저 연결합니다. (로그인 확인이 붙어 있고, 같은 주소에서만 부를 수 있습니다)
  app.use('/api/admin', createAdminRouter(repository));

  app.use('/api', publicCors, createPortfolioRouter(repository));

  // /api 로 시작하는데 위에서 처리되지 않은 주소는 JSON 으로 응답합니다.
  // (화면 파일을 내보내기 전에 걸러야 HTML 이 잘못 전달되지 않습니다)
  app.use('/api', apiNotFound);

  // 용량이 큰 영상은 최상위 폴더에서 직접 내보냅니다.
  // 폴더 전체를 열지 않고 정해진 파일만 내보내므로 다른 파일은 노출되지 않습니다.
  for (const [urlPath, filePath] of Object.entries(config.mediaFiles)) {
    app.get(urlPath, (req, res) => res.sendFile(filePath));
  }

  // 화면 파일(HTML·CSS·JS·이미지)을 내보냅니다.
  app.use(express.static(config.frontendDir));

  app.use(errorHandler);

  return app;
}
