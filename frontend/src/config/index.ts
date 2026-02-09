// API配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// 应用配置
export const APP_CONFIG = {
  name: '社区论坛',
  version: '1.0.0',
  defaultPageSize: 20,
  maxPageSize: 100,
}

// 存储键名
export const STORAGE_KEYS = {
  token: 'forum_token',
  refreshToken: 'forum_refresh_token',
  user: 'forum_user',
}
