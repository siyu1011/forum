// 用户类型
export interface User {
  id: number
  username: string
  email: string
  nickname: string | null
  avatar: string | null
  bio: string | null
  role: 'user' | 'moderator' | 'admin'
  status: 'active' | 'inactive' | 'banned'
  reputation: number
  post_count: number
  comment_count: number
  last_login_at: string | null
  created_at: string
  updated_at: string
}

// 登录/注册响应
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: string
}

// 登录参数
export interface LoginParams {
  email: string
  password: string
}

// 注册参数
export interface RegisterParams {
  username: string
  email: string
  password: string
  nickname?: string
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 分页参数
export interface PaginationParams {
  page?: number
  size?: number
}

// 分页响应
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// 标签类型
export interface Tag {
  id: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  post_count: number
  created_at: string
}

// 版块类型
export interface Category {
  id: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
  parent_id: number | null
  moderator_id: number | null
  rules: string | null
  post_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  moderator?: User
  children?: Category[]
}

// 帖子类型
export interface Post {
  id: number
  user_id: number
  category_id: number
  title: string
  content: string
  content_type: 'html' | 'markdown'
  excerpt: string | null
  cover_image: string | null
  views: number
  likes: number
  comments_count: number
  favorites_count: number
  is_top: boolean
  is_essence: boolean
  status: 'published' | 'draft' | 'pending' | 'rejected' | 'deleted'
  published_at: string | null
  last_comment_at: string | null
  created_at: string
  updated_at: string
  author?: User
  category?: Category
  tags?: Tag[]
}

// 评论类型
export interface Comment {
  id: number
  post_id: number
  user_id: number
  parent_id: number | null
  root_id: number | null
  content: string
  likes: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  author?: User
  replies?: Comment[]
}

// 发帖参数
export interface CreatePostParams {
  title: string
  content: string
  category_id: number
  tags?: string[]
  cover_image?: string
  excerpt?: string
}

// 评论参数
export interface CreateCommentParams {
  post_id: number
  content: string
  parent_id?: number
}

// 帖子列表查询参数
export interface PostQueryParams {
  page?: number
  size?: number
  category_id?: number
  tag?: string
  user_id?: number
  sort?: string
  order?: 'ASC' | 'DESC'
  keyword?: string
}

// 帖子搜索参数
export interface PostSearchParams {
  q: string
  page?: number
  size?: number
}
