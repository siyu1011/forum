import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const userService = {
  // 根据ID查找用户
  async findById(id: number | string) {
    // 确保ID为数字类型
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      return null;
    }
    return await User.findByPk(numericId, {
      attributes: { exclude: ['password'] },
    });
  },

  // 根据邮箱查找用户
  async findByEmail(email: string) {
    return await User.findOne({
      where: { email },
    });
  },

  // 根据用户名查找用户
  async findByUsername(username: string) {
    return await User.findOne({
      where: { username },
    });
  },

  // 注册用户
  async register(data: RegisterData) {
    // 检查邮箱是否已存在
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) {
      const err: AppError = new Error('该邮箱已被注册');
      err.statusCode = 400;
      throw err;
    }

    // 检查用户名是否已存在
    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) {
      const err: AppError = new Error('该用户名已被使用');
      err.statusCode = 400;
      throw err;
    }

    // 创建用户
    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      nickname: data.nickname || null,
      role: 'user',
      status: 'active',
      reputation: 0,
      post_count: 0,
      comment_count: 0,
    } as any);

    return user.toJSON();
  },

  // 登录用户
  async login(data: LoginData) {
    const user = await this.findByEmail(data.email);
    
    if (!user) {
      const err: AppError = new Error('用户不存在');
      err.statusCode = 401;
      throw err;
    }

    if (user.status === 'banned') {
      const err: AppError = new Error('账号已被封禁');
      err.statusCode = 403;
      throw err;
    }

    const isValidPassword = await user.comparePassword(data.password);
    if (!isValidPassword) {
      const err: AppError = new Error('密码错误');
      err.statusCode = 401;
      throw err;
    }

    // 更新最后登录时间
    await user.update({ last_login_at: new Date() });

    return user.toJSON();
  },

  // 生成Token
  generateTokens(user: TokenPayload) {
    const accessToken = jwt.sign(user, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.secret,
      {
        expiresIn: config.jwt.refreshExpiresIn as string,
      } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  },

  // 验证Token
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  },

  // 更新用户信息
  async updateUser(id: number, data: Partial<RegisterData>) {
    const user = await User.findByPk(id);
    if (!user) {
      const err: AppError = new Error('用户不存在');
      err.statusCode = 404;
      throw err;
    }

    // 如果要更新邮箱，检查是否已存在
    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing) {
        const err: AppError = new Error('该邮箱已被使用');
        err.statusCode = 400;
        throw err;
      }
    }

    // 如果要更新用户名，检查是否已存在
    if (data.username && data.username !== user.username) {
      const existing = await this.findByUsername(data.username);
      if (existing) {
        const err: AppError = new Error('该用户名已被使用');
        err.statusCode = 400;
        throw err;
      }
    }

    await user.update(data);
    return user.toJSON();
  },
};

export default userService;
