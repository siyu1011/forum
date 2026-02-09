import { Router } from 'express';
import interactionController from '../controllers/interaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/posts/:id/like', authMiddleware, interactionController.likePost);
router.get('/posts/:id/like/status', authMiddleware, interactionController.hasLikedPost);
router.post('/comments/:id/like', authMiddleware, interactionController.likeComment);
router.get('/comments/:id/like/status', authMiddleware, interactionController.hasLikedComment);

router.post('/posts/:id/favorite', authMiddleware, interactionController.favoritePost);
router.get('/posts/:id/favorite/status', authMiddleware, interactionController.hasFavoritedPost);
router.get('/users/me/favorites', authMiddleware, interactionController.getUserFavorites);

router.post('/users/:id/follow', authMiddleware, interactionController.followUser);
router.get('/users/:id/follow/status', authMiddleware, interactionController.hasFollowedUser);
router.get('/users/:id/followers', interactionController.getUserFollowers);
router.get('/users/:id/following', interactionController.getUserFollowing);
router.get('/users/:id/stats', interactionController.getUserStats);

router.get('/notifications', authMiddleware, interactionController.getNotifications);
router.get('/notifications/unread-count', authMiddleware, interactionController.getUnreadCount);
router.put('/notifications/:id/read', authMiddleware, interactionController.markNotificationRead);
router.put('/notifications/read-all', authMiddleware, interactionController.markAllNotificationsRead);

export default router;
