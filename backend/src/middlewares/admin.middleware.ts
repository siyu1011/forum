import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiResponse } from '../utils/response';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res);
  }

  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return ApiResponse.forbidden(res, '需要管理员权限');
  }

  next();
};

export const superAdminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res);
  }

  if (req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, '需要超级管理员权限');
  }

  next();
};
