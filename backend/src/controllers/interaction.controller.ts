import { Request, Response } from 'express';
import { interactionService } from '../services/interaction.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { User, UserFollow } from '../models';

export const interactionController = {
  likePost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const result = await interactionService.likePost(req.user.id, Number(id));
    return ApiResponse.success(res, result, result.message);
  }),

  hasLikedPost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const hasLiked = await interactionService.hasLikedPost(req.user.id, Number(id));
    return ApiResponse.success(res, { hasLiked });
  }),

  likeComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const result = await interactionService.likeComment(req.user.id, Number(id));
    return ApiResponse.success(res, result, result.message);
  }),

  hasLikedComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const hasLiked = await interactionService.hasLikedComment(req.user.id, Number(id));
    return ApiResponse.success(res, { hasLiked });
  }),

  favoritePost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { folder_name } = req.body;
    const result = await interactionService.favoritePost(req.user.id, Number(id), folder_name);
    return ApiResponse.success(res, result, result.message);
  }),

  hasFavoritedPost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const hasFavorited = await interactionService.hasFavoritedPost(req.user.id, Number(id));
    return ApiResponse.success(res, { hasFavorited });
  }),

  getUserFavorites: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { page = 1, size = 20 } = req.query;
    const result = await interactionService.getUserFavorites(req.user.id, Number(page), Number(size));
    return ApiResponse.success(res, result);
  }),

  followUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const result = await interactionService.followUser(req.user.id, Number(id));
    return ApiResponse.success(res, result, result.message);
  }),

  hasFollowedUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const hasFollowed = await interactionService.hasFollowedUser(req.user.id, Number(id));
    return ApiResponse.success(res, { hasFollowed });
  }),

  getUserFollowers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { page = 1, size = 20 } = req.query;
    const result = await interactionService.getUserFollowers(Number(id), Number(page), Number(size));
    return ApiResponse.success(res, result);
  }),

  getUserFollowing: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { page = 1, size = 20 } = req.query;
    const result = await interactionService.getUserFollowing(Number(id), Number(page), Number(size));
    return ApiResponse.success(res, result);
  }),

  getUserStats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);
    
    const [followersCount, followingCount] = await Promise.all([
      UserFollow.count({ where: { following_id: userId } }),
      UserFollow.count({ where: { follower_id: userId } }),
    ]);
    
    return ApiResponse.success(res, {
      followersCount,
      followingCount,
    });
  }),

  getNotifications: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { page = 1, size = 20, is_read } = req.query;
    const result = await interactionService.getUserNotifications(req.user.id, {
      page: Number(page),
      size: Number(size),
      is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
    });
    return ApiResponse.success(res, result);
  }),

  getUnreadCount: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const count = await interactionService.getUnreadCount(req.user.id);
    return ApiResponse.success(res, { count });
  }),

  markNotificationRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const notification = await interactionService.markNotificationRead(req.user.id, Number(id));
    return ApiResponse.success(res, notification, '已标记为已读');
  }),

  markAllNotificationsRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    await interactionService.markAllNotificationsRead(req.user.id);
    return ApiResponse.success(res, null, '已全部标记为已读');
  }),
};

export default interactionController;
