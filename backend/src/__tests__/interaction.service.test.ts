import { interactionService } from '../services/interaction.service';
import { PostLike, Favorite, UserFollow, Post, User, Notification } from '../models';

jest.mock('../models', () => ({
  PostLike: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  },
  Favorite: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
  UserFollow: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Post: {
    findByPk: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  },
  Notification: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
}));

describe('InteractionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('likePost', () => {
    it('应该点赞帖子', async () => {
      const mockPost = {
        id: 1,
        likes: 10,
        user_id: 2,
        increment: jest.fn().mockResolvedValue({}),
      };

      (Post.findByPk as jest.Mock).mockResolvedValue(mockPost);
      (PostLike.findOne as jest.Mock).mockResolvedValue(null);
      (PostLike.create as jest.Mock).mockResolvedValue({});
      (Post.increment as jest.Mock).mockResolvedValue({});
      (User.findByPk as jest.Mock).mockResolvedValue({ nickname: 'testuser' });
      (Notification.create as jest.Mock).mockResolvedValue({});

      const result = await interactionService.likePost(1, 1);

      expect(PostLike.create).toHaveBeenCalled();
      expect(Post.increment).toHaveBeenCalledWith('likes', { where: { id: 1 } });
      expect(result).toEqual({ liked: true, message: '点赞成功' });
    });

    it('应该取消已点赞的帖子', async () => {
      const mockPost = {
        id: 1,
        likes: 10,
        user_id: 2,
        decrement: jest.fn().mockResolvedValue({}),
      };

      const mockLike = {
        destroy: jest.fn().mockResolvedValue({}),
      };

      (Post.findByPk as jest.Mock).mockResolvedValue(mockPost);
      (PostLike.findOne as jest.Mock).mockResolvedValue(mockLike);
      (PostLike.destroy as jest.Mock).mockResolvedValue({});
      (Post.decrement as jest.Mock).mockResolvedValue({});

      const result = await interactionService.likePost(1, 1);

      expect(mockLike.destroy).toHaveBeenCalled();
      expect(Post.decrement).toHaveBeenCalledWith('likes', { where: { id: 1 } });
      expect(result).toEqual({ liked: false, message: '已取消点赞' });
    });

    it('当帖子不存在时应该取消点赞操作', async () => {
      (Post.findByPk as jest.Mock).mockResolvedValue(null);
      const mockLike = {
        destroy: jest.fn().mockResolvedValue({}),
      };
      (PostLike.findOne as jest.Mock).mockResolvedValue(mockLike);

      const result = await interactionService.likePost(999, 1);

      expect(result).toEqual({ liked: false, message: '已取消点赞' });
    });
  });

  describe('hasLikedPost', () => {
    it('应该返回点赞状态', async () => {
      (PostLike.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await interactionService.hasLikedPost(1, 1);

      expect(result).toBe(true);
    });

    it('当未点赞时应该返回false', async () => {
      (PostLike.findOne as jest.Mock).mockResolvedValue(null);

      const result = await interactionService.hasLikedPost(1, 1);

      expect(result).toBe(false);
    });
  });

  describe('favoritePost', () => {
    it('应该收藏帖子', async () => {
      (Favorite.findOne as jest.Mock).mockResolvedValue(null);
      (Favorite.create as jest.Mock).mockResolvedValue({});
      (Post.increment as jest.Mock).mockResolvedValue({});

      const result = await interactionService.favoritePost(1, 1);

      expect(Favorite.create).toHaveBeenCalled();
      expect(Post.increment).toHaveBeenCalledWith('favorites_count', { where: { id: 1 } });
      expect(result).toEqual({ favorited: true, message: '收藏成功' });
    });

    it('应该取消收藏', async () => {
      const mockFavorite = {
        destroy: jest.fn().mockResolvedValue({}),
      };

      (Favorite.findOne as jest.Mock).mockResolvedValue(mockFavorite);
      (Favorite.destroy as jest.Mock).mockResolvedValue({});
      (Post.decrement as jest.Mock).mockResolvedValue({});

      const result = await interactionService.favoritePost(1, 1);

      expect(mockFavorite.destroy).toHaveBeenCalled();
      expect(Post.decrement).toHaveBeenCalledWith('favorites_count', { where: { id: 1 } });
      expect(result).toEqual({ favorited: false, message: '已取消收藏' });
    });
  });

  describe('hasFavoritedPost', () => {
    it('应该返回收藏状态', async () => {
      (Favorite.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await interactionService.hasFavoritedPost(1, 1);

      expect(result).toBe(true);
    });

    it('当未收藏时应该返回false', async () => {
      (Favorite.findOne as jest.Mock).mockResolvedValue(null);

      const result = await interactionService.hasFavoritedPost(1, 1);

      expect(result).toBe(false);
    });
  });

  describe('followUser', () => {
    it('应该关注用户', async () => {
      (User.findByPk as jest.Mock)
        .mockResolvedValueOnce({ id: 2, nickname: 'target' }) // target user
        .mockResolvedValueOnce({ id: 1, nickname: 'follower' }); // current user

      (UserFollow.findOne as jest.Mock).mockResolvedValue(null);
      (UserFollow.create as jest.Mock).mockResolvedValue({});
      (Notification.create as jest.Mock).mockResolvedValue({});

      const result = await interactionService.followUser(1, 2);

      expect(UserFollow.create).toHaveBeenCalled();
      expect(result).toEqual({ followed: true, message: '关注成功' });
    });

    it('不能关注自己', async () => {
      await expect(interactionService.followUser(1, 1)).rejects.toThrow('不能关注自己');
    });

    it('应该取消关注', async () => {
      const mockFollow = {
        destroy: jest.fn().mockResolvedValue({}),
      };

      (User.findByPk as jest.Mock)
        .mockResolvedValueOnce({ id: 2, nickname: 'target' })
        .mockResolvedValueOnce({ id: 1, nickname: 'follower' });

      (UserFollow.findOne as jest.Mock).mockResolvedValue(mockFollow);

      const result = await interactionService.followUser(1, 2);

      expect(mockFollow.destroy).toHaveBeenCalled();
      expect(result).toEqual({ followed: false, message: '已取消关注' });
    });
  });

  describe('hasFollowedUser', () => {
    it('应该返回关注状态', async () => {
      (UserFollow.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await interactionService.hasFollowedUser(1, 2);

      expect(result).toBe(true);
    });

    it('当未关注时应该返回false', async () => {
      (UserFollow.findOne as jest.Mock).mockResolvedValue(null);

      const result = await interactionService.hasFollowedUser(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getUserNotifications', () => {
    it('应该返回用户通知列表', async () => {
      const mockNotifications = [
        { id: 1, title: '通知1', is_read: false },
        { id: 2, title: '通知2', is_read: true },
      ];

      (Notification.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockNotifications,
      });

      const result = await interactionService.getUserNotifications(1, { page: 1, size: 10 });

      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('pagination');
      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('getUnreadCount', () => {
    it('应该返回未读通知数量', async () => {
      (Notification.count as jest.Mock).mockResolvedValue(5);

      const result = await interactionService.getUnreadCount(1);

      expect(result).toBe(5);
    });
  });
});
