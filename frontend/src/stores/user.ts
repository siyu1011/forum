import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse } from '@/types'
import { userApi } from '@/api'
import { STORAGE_KEYS } from '@/config'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isModerator = computed(() => user.value?.role === 'admin' || user.value?.role === 'moderator')
  const isAdminOrModerator = computed(() => user.value?.role === 'admin' || user.value?.role === 'moderator')
  const displayName = computed(() => {
    return user.value?.nickname || user.value?.username || '匿名用户'
  })

  // Actions
  const setAuth = (data: AuthResponse) => {
    user.value = data.user
    token.value = data.accessToken
    refreshToken.value = data.refreshToken
    
    // 保存到本地存储
    localStorage.setItem(STORAGE_KEYS.token, data.accessToken)
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refreshToken)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user))
  }

  const clearAuth = () => {
    user.value = null
    token.value = ''
    refreshToken.value = ''
    
    // 清除本地存储
    localStorage.removeItem(STORAGE_KEYS.token)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
    localStorage.removeItem(STORAGE_KEYS.user)
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      const data = await userApi.login({ email, password })
      setAuth(data)
      return true
    } catch (error) {
      return false
    } finally {
      loading.value = false
    }
  }

  const register = async (username: string, email: string, password: string, nickname?: string) => {
    loading.value = true
    try {
      const data = await userApi.register({ username, email, password, nickname })
      setAuth(data)
      return true
    } catch (error) {
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    clearAuth()
  }

  const fetchCurrentUser = async () => {
    try {
      const data = await userApi.getCurrentUser()
      user.value = data
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data))
      return true
    } catch (error) {
      clearAuth()
      return false
    }
  }

  const updateUser = async (data: Partial<User>) => {
    try {
      const updatedUser = await userApi.updateCurrentUser(data)
      user.value = updatedUser
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser))
      return updatedUser
    } catch (error) {
      throw error
    }
  }

  const initAuth = () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.token)
    const storedUser = localStorage.getItem(STORAGE_KEYS.user)
    
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        clearAuth()
      }
    }
  }

  // 验证Token有效性并同步用户角色信息
  const validateAuth = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }
    
    try {
      // 调用API验证Token并获取最新用户信息
      const currentUser = await userApi.getCurrentUser()
      // 更新本地用户信息（包括角色）
      user.value = currentUser
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(currentUser))
      return true
    } catch (error: any) {
      const status = error.response?.status
      
      // 401: Token无效或过期 - 必须清除认证
      // 404: 用户不存在（被删除）- 必须清除认证
      if (status === 401 || status === 404) {
        clearAuth()
        return false
      }
      
      // 500或其他服务器错误：不清除认证，保持当前状态
      // 因为Token可能仍然有效，只是服务器暂时不可用
      console.error('验证认证状态失败（服务器错误）:', error.message)
      
      // 返回true表示"假设认证仍然有效"，但使用本地缓存的数据
      return true
    }
  }

  return {
    user,
    token,
    refreshToken,
    loading,
    isLoggedIn,
    isAdmin,
    isModerator,
    isAdminOrModerator,
    displayName,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateUser,
    initAuth,
    validateAuth,
    setAuth,
    clearAuth,
  }
})