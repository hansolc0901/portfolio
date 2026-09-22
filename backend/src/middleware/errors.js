// 상황에 맞는 상태 코드를 붙인 오류 종류입니다.
// status 를 붙여 두면 errorHandler 가 알맞은 응답을 만들 수 있습니다.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = '요청한 내용을 찾을 수 없습니다.') {
    super(404, message);
  }
}
