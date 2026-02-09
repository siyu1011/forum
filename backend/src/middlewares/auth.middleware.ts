import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponse.unauthorized(res, '请提供有效的Token');
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    // 确保用户ID为数字类型（JWT可能将数字序列化为字符串）
    req.user = {
      ...decoded,
      id: Number(decoded.id),
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      ApiResponse.unauthorized(res, 'Token已过期');
    } else {
      ApiResponse.unauthorized(res, '无效的Token');
    }
    return;  // ✅ 确保不继续执行
  }
};

export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    // 确保用户ID为数字类型
    req.user = {
      ...decoded,
      id: Number(decoded.id),
    };
  } catch (error) {
    // 忽略验证错误，继续执行
  }
  
  next();
};

export const requireAdminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    ApiResponse.unauthorized(res, '请先登录');
    return;
  }

  if (req.user.role !== 'admin') {
    ApiResponse.forbidden(res, '需要管理员权限');
    return;
  }

  next();
};
