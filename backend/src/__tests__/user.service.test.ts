import jwt from 'jsonwebtoken';
import { userService, RegisterData, LoginData, TokenPayload } from '../services/user.service';
import { User } from '../models';
import { config } from '../config';
import bcrypt from 'bcryptjs';

jest.mock('../models', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key',
      expiresIn: '7d',
      refreshExpiresIn: '30d',
    },
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('应该根据ID查找用户并排除密码字段', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findById(1);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] },
      });
      expect(result).toEqual(mockUser);
    });

    it('当用户不存在时应该返回null', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await userService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('应该根据邮箱查找用户', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findByEmail('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('应该根据用户名查找用户', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findByUsername('testuser');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('generateTokens', () => {
    it('应该生成有效的accessToken和refreshToken', () => {
      const user: TokenPayload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      const tokens = userService.generateTokens(user);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');

      // 验证accessToken
      const decoded = jwt.verify(tokens.accessToken, config.jwt.secret) as any;
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('testuser');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');

      // 验证refreshToken
      const refreshDecoded = jwt.verify(tokens.refreshToken, config.jwt.secret) as any;
      expect(refreshDecoded.id).toBe(1);
    });
  });

  describe('verifyToken', () => {
    it('应该验证并解析有效的token', () => {
      const user: TokenPayload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      const tokens = userService.generateTokens(user);
      const decoded = userService.verifyToken(tokens.accessToken);

      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe('testuser');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');
    });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        nickname: '新用户',
      };

      const mockCreatedUser = {
        id: 1,
        ...registerData,
        role: 'user',
        status: 'active',
        reputation: 0,
        post_count: 0,
        comment_count: 0,
        toJSON: () => ({
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          nickname: '新用户',
          role: 'user',
          status: 'active',
          password: undefined,
        }),
      };

      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check

      (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await userService.register(registerData);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(User.create).toHaveBeenCalled();
      expect(result.username).toBe('newuser');
      expect(result.email).toBe('new@example.com');
    });

    it('当邮箱已存在时应该抛出错误', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockResolvedValue({ id: 1, email: 'existing@example.com' });

      await expect(userService.register(registerData)).rejects.toThrow('该邮箱已被注册');
    });

    it('当用户名已存在时应该抛出错误', async () => {
      const registerData: RegisterData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 1, username: 'existinguser' }); // username check

      await expect(userService.register(registerData)).rejects.toThrow('该用户名已被使用');
    });
  });

  describe('login', () => {
    it('应该成功登录并返回用户信息', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        status: 'active',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          status: 'active',
          role: 'user',
          password: undefined,
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.login(loginData);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(mockUser.update).toHaveBeenCalled();
      expect(result).toHaveProperty('username', 'testuser');
    });

    it('当用户不存在时应该抛出错误', async () => {
      const loginData: LoginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(userService.login(loginData)).rejects.toThrow('用户不存在');
    });

    it('当账号被封禁时应该抛出错误', async () => {
      const loginData: LoginData = {
        email: 'banned@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        status: 'banned',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(userService.login(loginData)).rejects.toThrow('账号已被封禁');
    });

    it('当密码错误时应该抛出错误', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 1,
        status: 'active',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(userService.login(loginData)).rejects.toThrow('密码错误');
    });
  });
});
