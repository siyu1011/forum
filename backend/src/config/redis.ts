import { createClient } from 'redis';
import { config } from './index';
import logger from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export const initRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password || undefined,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis连接错误:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis连接成功');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis连接失败:', error);
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default {
  initRedis,
  getRedisClient,
  closeRedis,
};
