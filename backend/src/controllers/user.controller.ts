import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const userController = {
  // 用户注册
  register: asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, nickname } = req.body;

    if (!username || !email || !password) {
      return ApiResponse.badRequest(res, '用户名、邮箱和密码不能为空');
    }

    if (password.length < 6) {
      return ApiResponse.badRequest(res, '密码长度至少6位');
    }

    const user = await userService.register({
      username,
      email,
      password,
      nickname,
    });

    const tokens = userService.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return ApiResponse.success(
      res,
      {
        user,
        ...tokens,
      },
      '注册成功',
      201
    );
  }),

  // 用户登录
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return ApiResponse.badRequest(res, '邮箱和密码不能为空');
    }

    const user = await userService.login({ email, password });

    const tokens = userService.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return ApiResponse.success(res, {
      user,
      ...tokens,
    });
  }),

  // 获取当前用户信息
  getCurrentUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const user = await userService.findById(req.user.id);
    if (!user) {
      // 用户已被删除，但Token仍有效，返回401要求重新登录
      return ApiResponse.unauthorized(res, '用户不存在或已被删除');
    }

    return ApiResponse.success(res, user);
  }),

  // 根据ID获取用户信息
  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.findById(Number(id));

    if (!user) {
      return ApiResponse.notFound(res, '用户不存在');
    }

    return ApiResponse.success(res, user);
  }),

  // 更新当前用户信息
  updateCurrentUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { nickname, bio, avatar } = req.body;
    const user = await userService.updateUser(req.user.id, {
      nickname,
      bio,
      avatar,
    } as any);

    return ApiResponse.success(res, user, '更新成功');
  }),
};

export default userController;
