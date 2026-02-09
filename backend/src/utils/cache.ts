import { getRedisClient } from '../config/redis';
import logger from './logger';

const DEFAULT_TTL = 60 * 5; // 5 minutes

let redisAvailable = false;

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisAvailable) return null;
    
    const client = getRedisClient();
    if (!client) return null;

    try {
      const data = await client.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!redisAvailable) return false;
    
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!redisAvailable) return false;
    
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  async delPattern(pattern: string): Promise<boolean> {
    if (!redisAvailable) return false;
    
    const client = getRedisClient();
    if (!client) return false;

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redisAvailable) return false;
    
    const client = getRedisClient();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  async incr(key: string): Promise<number> {
    if (!redisAvailable) return 0;
    
    const client = getRedisClient();
    if (!client) return 0;

    try {
      return await client.incr(key);
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  },

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!redisAvailable) return false;
    
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  },

  setAvailable(available: boolean) {
    redisAvailable = available;
  },
};

export const withCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> => {
  if (!redisAvailable) {
    return fetchFn();
  }
  
  const cached = await cacheService.get<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetchFn();
  await cacheService.set(key, data, ttl);
  return data;
};

export default cacheService;
