// 오류를 한 곳에서 처리합니다.
// 각 라우트에서 try/catch 를 반복하지 않아도 되도록 모아 두었습니다.

// 없는 API 주소로 들어온 경우
export function apiNotFound(req, res) {
  res.status(404).json({
    error: {
      status: 404,
      message: `없는 주소입니다: ${req.method} ${req.originalUrl}`,
    },
  });
}

// 라우트에서 오류가 났을 때 마지막으로 실행됩니다.
// 매개변수가 4개여야 Express 가 오류 처리기로 인식합니다.
export function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  // 서버 화면(터미널)에는 원인을 그대로 남깁니다.
  console.error(`[오류] ${req.method} ${req.originalUrl}`, error);

  res.status(status).json({
    error: {
      status,
      // 500 은 내부 사정이 드러날 수 있으므로 자세한 내용을 숨깁니다.
      message: status === 500 ? '서버에서 오류가 발생했습니다.' : error.message,
    },
  });
}
