// 비밀번호를 안전하게 저장하고 확인합니다.
//
// 비밀번호 원문은 어디에도 저장하지 않습니다.
// .env 에는 되돌릴 수 없는 형태(해시)만 들어갑니다.
// 화면으로도 절대 내보내지 않습니다. 화면은 "맞다/틀리다" 만 받습니다.
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SCHEME = 'scrypt';

/**
 * 비밀번호를 .env 에 적을 수 있는 한 줄로 바꿉니다.
 * 같은 비밀번호라도 소금(salt)이 매번 달라 결과가 달라집니다.
 */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `${SCHEME}:${salt}:${key.toString('hex')}`;
}

/**
 * 입력한 비밀번호가 저장된 해시와 맞는지 확인합니다.
 */
export async function verifyPassword(password, stored) {
  if (!password || !stored) return false;

  const [scheme, salt, key] = String(stored).split(':');
  if (scheme !== SCHEME || !salt || !key) return false;

  const expected = Buffer.from(key, 'hex');
  const actual = await scryptAsync(password, salt, expected.length);

  // 글자를 하나씩 비교하면 걸리는 시간으로 비밀번호를 추측당할 수 있습니다.
  // timingSafeEqual 은 항상 같은 시간이 걸리도록 비교합니다.
  return timingSafeEqual(expected, actual);
}
