import request from '@/utils/request'
import type { Category, Post, PaginationResponse } from '@/types'

export interface CategoryPostResponse {
  category: Category
  posts: Post[]
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
}

export const categoryApi = {
  // 获取版块列表
  getCategories(activeOnly?: boolean): Promise<Category[]> {
    return request.get('/categories', { params: { active_only: activeOnly } })
  },

  // 获取版块详情
  getCategoryById(id: number): Promise<Category> {
    return request.get(`/categories/${id}`)
  },

  // 获取版块帖子列表
  getCategoryPosts(
    id: number,
    params?: { page?: number; size?: number; sort?: string; order?: 'ASC' | 'DESC' }
  ): Promise<CategoryPostResponse> {
    return request.get(`/categories/${id}/posts`, { params })
  },
}

export default categoryApi
