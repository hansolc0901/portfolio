// 관리자 비밀번호를 정합니다.
//
//   사용법:  cd backend && npm run set-password -- 새비밀번호
//
// 비밀번호 원문은 저장하지 않습니다.
// 되돌릴 수 없는 형태(해시)로 바꿔 backend/.env 에 적습니다.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hashPassword } from '../src/auth/password.js';

const BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(BACKEND, '.env');
const KEY = 'ADMIN_PASSWORD_HASH';
const MIN_LENGTH = 4;

async function readEnv() {
  try {
    return await readFile(ENV_FILE, 'utf-8');
  } catch {
    // .env 가 아직 없으면 예시 파일을 바탕으로 만듭니다.
    try {
      return await readFile(path.join(BACKEND, '.env.example'), 'utf-8');
    } catch {
      return '';
    }
  }
}

function replaceOrAppend(text, line) {
  const pattern = new RegExp(`^${KEY}=.*$`, 'm');
  if (pattern.test(text)) return text.replace(pattern, line);
  return (text.trimEnd() + '\n\n' + line + '\n').trimStart();
}

const password = process.argv[2];

if (!password) {
  console.error('비밀번호를 함께 적어 주세요.');
  console.error('  예)  npm run set-password -- 내비밀번호1234');
  process.exit(1);
}

if (password.length < MIN_LENGTH) {
  console.error(`비밀번호는 ${MIN_LENGTH}자 이상으로 정해 주세요.`);
  process.exit(1);
}

const hash = await hashPassword(password);
const text = await readEnv();

await writeFile(ENV_FILE, replaceOrAppend(text, `${KEY}=${hash}`), 'utf-8');

// 짧거나 숫자뿐인 비밀번호는 추측하기 쉬우므로 알려만 줍니다. (막지는 않습니다)
if (password.length < 8 || /^\d+$/.test(password)) {
  console.log('');
  console.log('[알림] 짧거나 숫자로만 된 비밀번호입니다.');
  console.log('       서버를 켜 둔 동안에는 같은 와이파이의 다른 기기에서도');
  console.log('       관리자 페이지에 접속할 수 있으니, 쓰지 않을 때는 서버를 꺼 주세요.');
}

// 비밀번호와 해시는 화면에 찍지 않습니다.
console.log('관리자 비밀번호를 저장했습니다: backend/.env');
console.log('서버를 다시 켠 뒤 http://localhost:4000/admin 에서 로그인하세요.');
console.log('');
console.log('주의: 이 터미널 기록에 비밀번호가 남아 있습니다. 필요하면 지워 주세요.');
