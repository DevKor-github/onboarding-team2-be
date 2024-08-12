export class CustomError extends Error {
  public code: number;
  public name: string;

  constructor(code: number, name: string, message: string | object) {
    super(JSON.stringify(message));
    this.code = code;
    this.name = name;
  }
}

/**
 * Request Format이 잘못되었을 경우
 */
export class BadRequestError extends CustomError {
  constructor(message: string | object) {
    super(400, 'BadRequestError', message);
  }
}
/**
 * 로그인이 되지 않은 상태에서 허용되지 않은 요청을 할 경우
 */
export class UnauthorizedError extends CustomError {
  constructor(message: string | object) {
    super(401, 'UnauthorizedError', message);
  }
}

/**
 * 권한(어드민 등..)에 따라 허용되지 않은 요청을 보내는 경우
 */
export class ForbiddenError extends CustomError {
  constructor(message: string | object) {
    super(403, 'ForbiddenError', message);
  }
}

/**
 * 요청에 대한 객체가 존재하지 않는 경우
 * - e.g., 100번 채팅방에 메세지를 날리지만 해당 채팅방이 존재하지 않는 경우
 */
export class NotFoundError extends CustomError {
  constructor(message: string | object) {
    super(404, 'NotFoundError', message);
  }
}

/**
 *
 */
export class ConflictError extends CustomError {
  constructor(message: string | object) {
    super(409, 'ConflictError', message);
  }
}

/**
 * AWS, DB 등에서 발생하는 에러
 */
export class InternalServerError extends CustomError {
  constructor(message: string | object) {
    super(500, 'InternalServerError', message);
  }
}
