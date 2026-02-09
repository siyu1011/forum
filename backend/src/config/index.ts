import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'forum',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    poolMin: parseInt(process.env.DB_POOL_MIN || '5', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
    dir: process.env.UPLOAD_DIR || './uploads',
    url: process.env.UPLOAD_URL || '/uploads',
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'debug',
    dir: process.env.LOG_DIR || './logs',
  },
};
