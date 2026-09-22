// 서버를 켜는 진입점입니다. 실행: npm start
import { createApp } from './src/app.js';
import { config } from './src/config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log('─────────────────────────────────────────────');
  console.log('  포트폴리오 서버가 켜졌습니다.');
  console.log(`  화면    http://localhost:${config.port}`);
  console.log(`  API     http://localhost:${config.port}/api/portfolio`);
  console.log(`  상태    http://localhost:${config.port}/api/health`);
  console.log(`  데이터  ${config.dataSource}`);
  console.log('  끄기    Ctrl + C');
  console.log('─────────────────────────────────────────────');
});
