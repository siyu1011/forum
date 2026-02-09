import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URL, STORAGE_KEYS } from '@/config'
import router from '@/router'
import { useUserStore } from '@/stores/user'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 防止重复跳转标志
let isRedirecting = false

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isAuthRequest = config.url?.includes('/users/login') || config.url?.includes('/users/register')
    if (isAuthRequest) {
      return config
    }
    const token = localStorage.getItem(STORAGE_KEYS.token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url} - Token added`)
    } else {
      console.warn(`[Request] ${config.method?.toUpperCase()} ${config.url} - No token found`)
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

  // 响应拦截器
  request.interceptors.response.use(
    (response: AxiosResponse) => {
      const { code, message, data } = response.data
      
      if (code === 200 || code === 201) {
        return data
      }
      
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message))
    },
    (error: AxiosError) => {
      const { response } = error
      
      if (response) {
        const { status, data, config } = response as any
        const message = data?.message || '请求失败'
        const isLoginRequest = config?.url?.includes('/users/login') && config?.method === 'post'

        switch (status) {
          case 401:
            if (isLoginRequest) {
              ElMessage.error(message || '邮箱或密码错误')
            } else if (!isRedirecting) {
              isRedirecting = true
              ElMessage.error('登录已过期，请重新登录')
              // 使用 store 清除认证状态（同步内存和 localStorage）
              const userStore = useUserStore()
              userStore.clearAuth()
              router.push('/login').finally(() => {
                // 延迟重置标志，防止紧接的请求再次触发跳转
                setTimeout(() => {
                  isRedirecting = false
                }, 100)
              })
            }
            break
          case 403:
            ElMessage.error('没有权限执行此操作')
            break
          case 404:
            ElMessage.error('请求的资源不存在')
            break
          case 500:
            ElMessage.error('服务器内部错误')
            break
          default:
            ElMessage.error(message)
        }
      } else {
        ElMessage.error('网络错误，请检查网络连接')
      }
      
      return Promise.reject(error)
    }
  )

export default request
