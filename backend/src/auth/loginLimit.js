// 비밀번호를 반복해서 찍어 보는 것을 늦춥니다.
//
// 같은 곳에서 연달아 틀리면 잠시 잠급니다.
// 기록은 서버 메모리에만 두고, 성공하면 지웁니다.

const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000; // 10분

const attempts = new Map();

function keyOf(req) {
  return req.ip || 'unknown';
}

/** 지금 잠겨 있으면 남은 시간(초)을, 아니면 0 을 돌려줍니다. */
export function lockedSeconds(req) {
  const record = attempts.get(keyOf(req));
  if (!record || record.count < MAX_FAILURES) return 0;

  const remaining = record.lockedUntil - Date.now();
  if (remaining <= 0) {
    attempts.delete(keyOf(req));
    return 0;
  }
  return Math.ceil(remaining / 1000);
}

export function recordFailure(req) {
  const key = keyOf(req);
  const record = attempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  record.lockedUntil = Date.now() + LOCK_MS;
  attempts.set(key, record);
  return MAX_FAILURES - record.count;
}

export function recordSuccess(req) {
  attempts.delete(keyOf(req));
}
