import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { testConnection } from './config/database';
import { syncModels } from './models';
import { sequelize } from './config/database';
import { initRedis } from './config/redis';
import { cacheService } from './utils/cache';

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));

// 限流配置 - 仅限需要认证的API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 500, // 限制500个请求
  message: '请求过于频繁，请稍后再试',
  skip: (req) => {
    const publicPaths = ['/api/v1/posts', '/api/v1/categories', '/api/v1/users/']
    return publicPaths.some((path: string) => req.path.startsWith(path))
  },
});
app.use('/api/v1/interactions/', authLimiter);

// 登录接口限流
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 限制20次登录尝试
  skipSuccessfulRequests: true,
});
app.use('/api/v1/users/login', loginLimiter);

// 解析JSON和URL编码
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(config.upload.url, express.static(path.resolve(config.upload.dir)));

// 路由
app.use(config.apiPrefix, routes);

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 数据库连接和模型同步
export const initializeApp = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: false });
    
    // 初始化Redis
    const redisClient = await initRedis();
    if (redisClient) {
      cacheService.setAvailable(true);
      console.log('✅ Redis缓存已启用');
    } else {
      console.log('⚠️ Redis未连接，缓存功能不可用');
    }
    
    console.log('✅ 应用初始化成功');
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    throw error;
  }
};

export default app;