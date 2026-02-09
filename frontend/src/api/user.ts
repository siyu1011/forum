import request from '@/utils/request'
import type { User, AuthResponse, LoginParams, RegisterParams } from '@/types'

export const userApi = {
  // 用户注册
  register(data: RegisterParams): Promise<AuthResponse> {
    return request.post('/users/register', data)
  },

  // 用户登录
  login(data: LoginParams): Promise<AuthResponse> {
    return request.post('/users/login', data)
  },

  // 获取当前用户信息
  getCurrentUser(): Promise<User> {
    return request.get('/users/me')
  },

  // 根据ID获取用户信息
  getUserById(id: number): Promise<User> {
    return request.get(`/users/${id}`)
  },

  // 更新当前用户信息
  updateCurrentUser(data: Partial<User>): Promise<User> {
    return request.put('/users/me', data)
  },
}

export default userApi