// 로그인한 사람에게 임시 출입증(토큰)을 발급하고 관리합니다.
//
// 비밀번호는 로그인할 때 한 번만 주고받습니다.
// 그 뒤의 모든 요청은 이 출입증으로 확인하므로 비밀번호가 다시 오가지 않습니다.
//
// 출입증은 서버 메모리에만 둡니다. 서버를 끄면 모두 사라지고 다시 로그인해야 합니다.
import { randomBytes } from 'node:crypto';

const sessions = new Map();

function removeExpired() {
  const now = Date.now();
  for (const [token, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(token);
  }
}

export function createSession(ttlMs) {
  removeExpired();
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + ttlMs);
  return token;
}

/**
 * 출입증이 아직 쓸 수 있는지 확인합니다.
 *
 * 확인할 때마다 만료 시각을 뒤로 미룹니다.
 * 그래서 쓰는 동안에는 풀리지 않고, 손을 떼면 정해진 시간 뒤에 저절로 없어집니다.
 */
export function isValidSession(token, ttlMs) {
  if (!token) return false;
  removeExpired();

  if (!sessions.has(token)) return false;

  sessions.set(token, Date.now() + ttlMs);
  return true;
}

export function destroySession(token) {
  sessions.delete(token);
}
