import request from '@/utils/request'

export interface InteractionResponse {
  liked: boolean
  message: string
  hasLiked?: boolean
  hasFavorited?: boolean
  favorited?: boolean
  followed?: boolean
  hasFollowed?: boolean
}

export interface Notification {
  id: number
  type: 'system' | 'comment' | 'reply' | 'like' | 'follow' | 'mention'
  title: string
  content: string | null
  target_type: string | null
  target_id: number | null
  is_read: boolean
  read_at: string | null
  created_at: string
  sender?: {
    id: number
    username: string
    nickname: string
    avatar: string | null
  }
}

export interface NotificationListResponse {
  notifications: Notification[]
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
}

export const interactionApi = {
  likePost(postId: number): Promise<InteractionResponse> {
    return request.post(`/interactions/posts/${postId}/like`)
  },

  hasLikedPost(postId: number): Promise<{ hasLiked: boolean }> {
    return request.get(`/interactions/posts/${postId}/like/status`)
  },

  likeComment(commentId: number): Promise<InteractionResponse> {
    return request.post(`/interactions/comments/${commentId}/like`)
  },

  hasLikedComment(commentId: number): Promise<{ hasLiked: boolean }> {
    return request.get(`/interactions/comments/${commentId}/like/status`)
  },

  favoritePost(postId: number, folderName?: string): Promise<InteractionResponse> {
    return request.post(`/interactions/posts/${postId}/favorite`, { folder_name: folderName })
  },

  hasFavoritedPost(postId: number): Promise<{ hasFavorited: boolean }> {
    return request.get(`/interactions/posts/${postId}/favorite/status`)
  },

  getUserFavorites(params?: { page?: number; size?: number }): Promise<{ favorites: any[]; pagination: any }> {
    return request.get('/interactions/users/me/favorites', { params })
  },

  followUser(userId: number): Promise<InteractionResponse> {
    return request.post(`/interactions/users/${userId}/follow`)
  },

  hasFollowedUser(userId: number): Promise<{ hasFollowed: boolean }> {
    return request.get(`/interactions/users/${userId}/follow/status`)
  },

  getUserFollowers(userId: number, params?: { page?: number; size?: number }): Promise<{ followers: any[]; pagination: any }> {
    return request.get(`/interactions/users/${userId}/followers`, { params })
  },

  getUserFollowing(userId: number, params?: { page?: number; size?: number }): Promise<{ following: any[]; pagination: any }> {
    return request.get(`/interactions/users/${userId}/following`, { params })
  },

  getUserStats(userId: number): Promise<{ followersCount: number; followingCount: number }> {
    return request.get(`/interactions/users/${userId}/stats`)
  },

  getNotifications(params?: { page?: number; size?: number; is_read?: boolean }): Promise<NotificationListResponse> {
    return request.get('/interactions/notifications', { params })
  },

  getUnreadCount(): Promise<{ count: number }> {
    return request.get('/interactions/notifications/unread-count')
  },

  markNotificationRead(notificationId: number): Promise<Notification> {
    return request.put(`/interactions/notifications/${notificationId}/read`)
  },

  markAllNotificationsRead(): Promise<void> {
    return request.put('/interactions/notifications/read-all')
  },
}

export default interactionApi
