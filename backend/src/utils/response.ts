import { Response } from 'express';

export interface ApiResponseData<T = any> {
  code: number;
  message: string;
  data: T | null;
  timestamp: number;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'success', code = 200): Response {
    const response: ApiResponseData<T> = {
      code,
      message,
      data,
      timestamp: Date.now(),
    };
    return res.status(code).json(response);
  }

  static error(res: Response, code: number, message: string): Response {
    const response: ApiResponseData = {
      code,
      message,
      data: null,
      timestamp: Date.now(),
    };
    return res.status(code).json(response);
  }

  static badRequest(res: Response, message = '参数错误'): Response {
    return this.error(res, 400, message);
  }

  static unauthorized(res: Response, message = '未授权'): Response {
    return this.error(res, 401, message);
  }

  static forbidden(res: Response, message = '禁止访问'): Response {
    return this.error(res, 403, message);
  }

  static notFound(res: Response, message = '资源不存在'): Response {
    return this.error(res, 404, message);
  }

  static conflict(res: Response, message = '资源冲突'): Response {
    return this.error(res, 409, message);
  }

  static serverError(res: Response, message = '服务器内部错误'): Response {
    return this.error(res, 500, message);
  }
}
