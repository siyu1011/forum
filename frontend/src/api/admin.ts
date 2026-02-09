import request from '@/utils/request'

export interface AdminUser {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string | null
  bio: string | null
  role: 'user' | 'moderator' | 'admin'
  status: 'active' | 'inactive' | 'banned'
  post_count: number
  comment_count: number
  reputation: number
  created_at: string
  last_login_at: string | null
}

export interface AdminReport {
  id: number
  reporter_id: number
  target_type: 'post' | 'comment' | 'user'
  target_id: number
  reason: string
  description: string | null
  status: 'pending' | 'handled' | 'dismissed'
  handler_id: number | null
  handled_at: string | null
  created_at: string
  reporter?: {
    id: number
    username: string
    nickname: string
    avatar: string | null
  }
}

export interface AdminStats {
  userCount: number
  postCount: number
  commentCount: number
  todayUsers: number
  todayPosts: number
  pendingReports: number
  bannedUsers: number
  totalPosts: number
  totalComments: number
  weekUserCount: number
  weekPostCount: number
  yesterdayUsers: number
  yesterdayPosts: number
  userGrowth: string
  postGrowth: string
}

export interface OperationLog {
  id: number
  user_id: number
  action: string
  target_type: string | null
  target_id: number | null
  details: any
  created_at: string
}

export interface AdminCategory {
  id: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
  parent_id: number | null
  is_active: boolean
  post_count: number
  created_at: string
  updated_at: string
}

export const adminApi = {
  getUsers(params?: { page?: number; size?: number; keyword?: string; status?: string }): Promise<{ users: AdminUser[]; pagination: any }> {
    return request.get('/admin/users', { params })
  },

  getUserById(id: number): Promise<AdminUser> {
    return request.get(`/admin/users/${id}`)
  },

  banUser(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return request.put(`/admin/users/${id}/ban`, { reason })
  },

  unbanUser(id: number): Promise<{ success: boolean; message: string }> {
    return request.put(`/admin/users/${id}/unban`)
  },

  updateUserRole(id: number, role: 'user' | 'moderator'): Promise<{ success: boolean; message: string }> {
    return request.put(`/admin/users/${id}/role`, { role })
  },

  getReports(params?: { page?: number; size?: number; status?: string; target_type?: string }): Promise<{ reports: AdminReport[]; pagination: any }> {
    return request.get('/admin/reports', { params })
  },

  handleReport(id: number, action: 'handled' | 'dismissed', reason?: string): Promise<{ success: boolean; message: string }> {
    return request.put(`/admin/reports/${id}/handle`, { action, reason })
  },

  deletePost(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return request.delete(`/admin/posts/${id}`, { data: { reason } })
  },

  deleteComment(id: number, reason: string): Promise<{ success: boolean; message: string }> {
    return request.delete(`/admin/comments/${id}`, { data: { reason } })
  },

  getStats(): Promise<AdminStats> {
    return request.get('/admin/stats')
  },

  getOperationLogs(params?: { page?: number; size?: number; action?: string }): Promise<{ logs: OperationLog[]; pagination: any }> {
    return request.get('/admin/logs', { params })
  },

  getCategories(): Promise<{ categories: AdminCategory[] }> {
    return request.get('/admin/categories')
  },

  createCategory(data: { name: string; description?: string; icon?: string; color?: string; sort_order?: number; parent_id?: number }): Promise<{ success: boolean; category: AdminCategory; message: string }> {
    return request.post('/admin/categories', data)
  },

  updateCategory(id: number, data: { name?: string; description?: string; icon?: string; color?: string; sort_order?: number; parent_id?: number; is_active?: boolean }): Promise<{ success: boolean; message: string }> {
    return request.put(`/admin/categories/${id}`, data)
  },

  deleteCategory(id: number, force?: boolean): Promise<{ success: boolean; message: string }> {
    return request.delete(`/admin/categories/${id}`, { params: { force }, data: {} })
  },
}

export default adminApi
