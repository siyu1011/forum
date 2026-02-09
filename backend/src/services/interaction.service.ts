import { PostLike, Post, Comment, User, UserFollow, Favorite, Notification } from '../models';

export const interactionService = {
  async likePost(userId: number, postId: number) {
    const existing = await PostLike.findOne({
      where: { user_id: userId, post_id: postId },
    });

    if (existing) {
      await existing.destroy();
      await Post.decrement('likes', { where: { id: postId } });
      return { liked: false, message: '已取消点赞' };
    }

    await PostLike.create({ user_id: userId, post_id: postId } as any);
    await Post.increment('likes', { where: { id: postId } });

    const post = await Post.findByPk(postId);
    if (post && post.user_id !== userId) {
      await this.createNotification(
        post.user_id,
        userId,
        'like',
        '点赞提醒',
        `${(await User.findByPk(userId))?.nickname || '某用户'} 点赞了你的帖子`,
        'post',
        postId
      );
    }

    return { liked: true, message: '点赞成功' };
  },

  async hasLikedPost(userId: number, postId: number): Promise<boolean> {
    const like = await PostLike.findOne({
      where: { user_id: userId, post_id: postId },
    });
    return !!like;
  },

  async likeComment(userId: number, commentId: number) {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      throw new Error('评论不存在');
    }

    const existing = await PostLike.findOne({
      where: { user_id: userId, post_id: commentId },
    });

    if (existing) {
      await existing.destroy();
      await Comment.decrement('likes', { where: { id: commentId } });
      return { liked: false, message: '已取消点赞' };
    }

    await PostLike.create({ user_id: userId, post_id: commentId } as any);
    await Comment.increment('likes', { where: { id: commentId } });

    if (comment.user_id !== userId) {
      await this.createNotification(
        comment.user_id,
        userId,
        'like',
        '点赞提醒',
        `${(await User.findByPk(userId))?.nickname || '某用户'} 点赞了你的评论`,
        'comment',
        commentId
      );
    }

    return { liked: true, message: '点赞成功' };
  },

  async hasLikedComment(userId: number, commentId: number): Promise<boolean> {
    const like = await PostLike.findOne({
      where: { user_id: userId, post_id: commentId },
    });
    return !!like;
  },

  async favoritePost(userId: number, postId: number, folderName = '默认收藏夹') {
    const existing = await Favorite.findOne({
      where: { user_id: userId, post_id: postId },
    });

    if (existing) {
      await existing.destroy();
      await Post.decrement('favorites_count', { where: { id: postId } });
      return { favorited: false, message: '已取消收藏' };
    }

    await Favorite.create({
      user_id: userId,
      post_id: postId,
      folder_name: folderName,
    } as any);
    await Post.increment('favorites_count', { where: { id: postId } });

    return { favorited: true, message: '收藏成功' };
  },

  async hasFavoritedPost(userId: number, postId: number): Promise<boolean> {
    const favorite = await Favorite.findOne({
      where: { user_id: userId, post_id: postId },
    });
    return !!favorite;
  },

  async getUserFavorites(userId: number, page = 1, size = 20) {
    const { count, rows } = await Favorite.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: Post, as: 'post',
          include: [
            { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
            { model: require('../models/category.model').default, as: 'category', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      favorites: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async followUser(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new Error('不能关注自己');
    }

    const existing = await UserFollow.findOne({
      where: { follower_id: followerId, following_id: followingId },
    });

    if (existing) {
      await existing.destroy();
      return { followed: false, message: '已取消关注' };
    }

    await UserFollow.create({
      follower_id: followerId,
      following_id: followingId,
    } as any);

    await this.createNotification(
      followingId,
      followerId,
      'follow',
      '关注提醒',
      `${(await User.findByPk(followerId))?.nickname || '某用户'} 开始关注你`,
      'user',
      followerId
    );

    return { followed: true, message: '关注成功' };
  },

  async hasFollowedUser(followerId: number, followingId: number): Promise<boolean> {
    const follow = await UserFollow.findOne({
      where: { follower_id: followerId, following_id: followingId },
    });
    return !!follow;
  },

  async getUserFollowers(userId: number, page = 1, size = 20) {
    const { count, rows } = await UserFollow.findAndCountAll({
      where: { following_id: userId },
      include: [
        { model: User, as: 'followerInfo', attributes: ['id', 'username', 'nickname', 'avatar', 'bio'] },
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      followers: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async getUserFollowing(userId: number, page = 1, size = 20) {
    const { count, rows } = await UserFollow.findAndCountAll({
      where: { follower_id: userId },
      include: [
        { model: User, as: 'followingInfo', attributes: ['id', 'username', 'nickname', 'avatar', 'bio'] },
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      following: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async createNotification(
    userId: number,
    senderId: number,
    type: 'system' | 'comment' | 'reply' | 'like' | 'follow' | 'mention',
    title: string,
    content: string,
    targetType: string,
    targetId: number
  ) {
    return await Notification.create({
      user_id: userId,
      sender_id: senderId,
      type,
      title,
      content,
      target_type: targetType,
      target_id: targetId,
      is_read: false,
    } as any);
  },

  async getUserNotifications(userId: number, options: { page?: number; size?: number; is_read?: boolean } = {}) {
    const { page = 1, size = 20, is_read } = options;

    const where: any = { user_id: userId };
    if (typeof is_read === 'boolean') {
      where.is_read = is_read;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      notifications: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async getUnreadCount(userId: number): Promise<number> {
    return await Notification.count({
      where: { user_id: userId, is_read: false },
    });
  },

  async markNotificationRead(userId: number, notificationId: number) {
    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new Error('通知不存在');
    }

    await notification.update({ is_read: true, read_at: new Date() });
    return notification;
  },

  async markAllNotificationsRead(userId: number) {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );
    return { success: true };
  },
};

export default interactionService;
