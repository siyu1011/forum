import request from '@/utils/request'
import type { Comment, CreateCommentParams } from '@/types'

export interface CommentListResponse {
  comments: Comment[]
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
}

export const commentApi = {
  // 获取帖子评论列表
  getCommentsByPostId(postId: number, params?: { page?: number; size?: number }): Promise<CommentListResponse> {
    return request.get(`/comments/post/${postId}`, { params })
  },

  // 创建评论
  createComment(data: CreateCommentParams): Promise<Comment> {
    return request.post('/comments', data)
  },

  // 更新评论
  updateComment(id: number, content: string): Promise<Comment> {
    return request.put(`/comments/${id}`, { content })
  },

  // 删除评论
  deleteComment(id: number): Promise<void> {
    return request.delete(`/comments/${id}`)
  },
}

export default commentApi
