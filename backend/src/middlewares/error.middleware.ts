import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  if (statusCode === 500) {
    const devMode = process.env.NODE_ENV !== 'production';
    ApiResponse.serverError(res, devMode ? message : '服务器内部错误');
  } else {
    ApiResponse.error(res, statusCode, message);
  }
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  ApiResponse.notFound(res, `路由 ${req.originalUrl} 不存在`);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
