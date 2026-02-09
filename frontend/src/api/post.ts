import request from '@/utils/request'
import type { Post, CreatePostParams, PostQueryParams, PaginationResponse, Tag } from '@/types'

export interface PostListResponse {
  posts: Post[]
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
}

export const postApi = {
  // 获取帖子列表
  getPosts(params: PostQueryParams): Promise<PostListResponse> {
    return request.get('/posts', { params })
  },

  // 获取帖子详情
  getPostById(id: number): Promise<Post> {
    return request.get(`/posts/${id}`)
  },

  // 创建帖子
  createPost(data: CreatePostParams): Promise<Post> {
    return request.post('/posts', data)
  },

  // 更新帖子
  updatePost(id: number, data: Partial<CreatePostParams>): Promise<Post> {
    return request.put(`/posts/${id}`, data)
  },

  // 删除帖子
  deletePost(id: number): Promise<void> {
    return request.delete(`/posts/${id}`)
  },

  // 获取热门帖子
  getHotPosts(limit?: number): Promise<Post[]> {
    return request.get('/posts/hot', { params: { limit } })
  },

  // 获取最新帖子
  getLatestPosts(limit?: number): Promise<Post[]> {
    return request.get('/posts/latest', { params: { limit } })
  },

  // 搜索帖子
  searchPosts(params: { q: string; page?: number; size?: number }): Promise<PostListResponse> {
    return request.get('/posts/search', { params })
  },
}

export default postApi
