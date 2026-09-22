// 로그인한 사람만 통과시킵니다.
// 관리자용 주소 앞에 붙여 두면, 출입증이 없는 요청은 여기서 막힙니다.
import { isValidSession } from '../auth/sessions.js';
import { config } from '../config.js';

export function readToken(req) {
  const header = req.get('authorization') || '';
  // "Bearer 아무개토큰" 형태에서 토큰만 꺼냅니다.
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' ? token : null;
}

export function requireAuth(req, res, next) {
  if (!isValidSession(readToken(req), config.sessionTtlMs)) {
    return res.status(401).json({
      error: { status: 401, message: '로그인이 필요합니다.' },
    });
  }
  next();
}
