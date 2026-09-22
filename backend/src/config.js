// 설정값을 한 곳에 모읍니다.
// 다른 파일은 process.env 를 직접 읽지 않고 여기서 가져다 씁니다.
// 그래야 설정을 바꿀 때 이 파일만 보면 됩니다.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));

// 프로젝트 최상위 폴더 (backend/src 에서 두 단계 위)
export const ROOT = path.resolve(thisDir, '..', '..');

export const config = {
  port: Number(process.env.PORT) || 4000,

  // 'json' 또는 'db'. repositories/index.js 가 이 값을 보고 저장소를 고릅니다.
  dataSource: process.env.DATA_SOURCE || 'json',

  // DATA_SOURCE=json 일 때 읽을 파일
  dataFile: process.env.DATA_FILE || path.join(ROOT, 'data', 'portfolio.json'),

  // DATA_SOURCE=db 일 때 접속할 데이터베이스 주소
  databaseUrl: process.env.DATABASE_URL || '',

  // 관리자 비밀번호입니다. 되돌릴 수 없는 형태(해시)로만 보관합니다.
  // 값을 정하려면: cd backend && npm run set-password -- 새비밀번호
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',

  // 아무 동작도 하지 않고 이만큼 지나면 서버의 출입증이 저절로 없어집니다.
  // 쓰는 동안에는 계속 미뤄지므로 작업 중에 끊기지 않습니다. (기본 30분)
  sessionTtlMs: Number(process.env.SESSION_TTL_MINUTES || 30) * 60 * 1000,

  // '배포용 파일 다시 만들기' 버튼이 실행할 파이썬 명령입니다.
  pythonBin: process.env.PYTHON_BIN || 'python',

  // 화면 파일이 들어 있는 폴더
  frontendDir: path.join(ROOT, 'frontend'),

  // 용량이 큰 영상은 frontend 로 복사하지 않고 최상위에서 바로 내보냅니다.
  mediaFiles: {
    '/summerschool.mp4': path.join(ROOT, 'summerschool.mp4'),
  },

  // '*' 이면 모든 주소에서 호출할 수 있습니다.
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
