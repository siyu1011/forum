import { User, Post, Comment, Report, OperationLog, Notification } from '../models';

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function getYesterdayStart(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
}

export const adminService = {
  async getUsers(options: { page?: number; size?: number; keyword?: string; status?: string } = {}) {
    const { page = 1, size = 20, keyword, status } = options;

    const where: any = {};
    if (keyword) {
      where[Symbol.for('or')] = [
        { username: { [Symbol.for('like')]: `%${keyword}%` } },
        { email: { [Symbol.for('like')]: `%${keyword}%` } },
        { nickname: { [Symbol.for('like')]: `%${keyword}%` } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async getUserById(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  },

  async banUser(adminId: number, userId: number, reason: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    if (user.role === 'admin') {
      throw new Error('不能封禁管理员');
    }

    await user.update({ status: 'banned' });

    await OperationLog.create({
      user_id: adminId,
      action: 'ban_user',
      target_type: 'user',
      target_id: userId,
      details: { reason },
    } as any);

    return { success: true, message: '用户已封禁' };
  },

  async unbanUser(adminId: number, userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    await user.update({ status: 'active' });

    await OperationLog.create({
      user_id: adminId,
      action: 'unban_user',
      target_type: 'user',
      target_id: userId,
    } as any);

    return { success: true, message: '用户已解封' };
  },

  async updateUserRole(adminId: number, userId: number, role: 'user' | 'moderator') {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    if (user.role === 'admin') {
      throw new Error('不能修改管理员角色');
    }
    if (!['user', 'moderator'].includes(role)) {
      throw new Error('无效的角色');
    }

    await user.update({ role });

    await OperationLog.create({
      user_id: adminId,
      action: 'update_user_role',
      target_type: 'user',
      target_id: userId,
      details: { role },
    } as any);

    return { success: true, message: '角色已更新' };
  },

  async getReports(options: { page?: number; size?: number; status?: string; target_type?: string } = {}) {
    const { page = 1, size = 20, status, target_type } = options;

    const where: any = {};
    if (status) where.status = status;
    if (target_type) where.target_type = target_type;

    const { count, rows } = await Report.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      reports: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async handleReport(adminId: number, reportId: number, action: 'handled' | 'dismissed', reason?: string) {
    const report = await Report.findByPk(reportId);
    if (!report) {
      throw new Error('举报不存在');
    }

    await report.update({
      status: action,
      handler_id: adminId,
      handled_at: new Date(),
    });

    if (action === 'dismissed' && reason) {
      await report.update({ description: reason });
    }

    await OperationLog.create({
      user_id: adminId,
      action: action === 'handled' ? 'handle_report' : 'dismiss_report',
      target_type: 'report',
      target_id: reportId,
      details: { action, reason },
    } as any);

    return { success: true, message: action === 'handled' ? '已处理举报' : '已忽略举报' };
  },

  async deletePost(adminId: number, postId: number, reason: string) {
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new Error('帖子不存在');
    }

    await post.destroy();

    await OperationLog.create({
      user_id: adminId,
      action: 'delete_post',
      target_type: 'post',
      target_id: postId,
      details: { reason },
    } as any);

    return { success: true, message: '帖子已删除' };
  },

  async deleteComment(adminId: number, commentId: number, reason: string) {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      throw new Error('评论不存在');
    }

    await comment.update({ is_deleted: true });

    await OperationLog.create({
      user_id: adminId,
      action: 'delete_comment',
      target_type: 'comment',
      target_id: commentId,
      details: { reason },
    } as any);

    return { success: true, message: '评论已删除' };
  },

  async getStats() {
    const todayStart = getTodayStart();
    const yesterdayStart = getYesterdayStart();
    
    const [
      userCount,
      postCount,
      commentCount,
      todayUsers,
      todayPosts,
      pendingReports,
      bannedUsers,
      totalPosts,
      totalComments,
    ] = await Promise.all([
      User.count({ where: { status: 'active' } }),
      Post.count({ where: { status: 'published' } }),
      Comment.count({ where: { is_deleted: false } }),
      User.count({ where: { created_at: { [Symbol.for('gte')]: todayStart } } }),
      Post.count({ where: { created_at: { [Symbol.for('gte')]: todayStart } } }),
      Report.count({ where: { status: 'pending' } }),
      User.count({ where: { status: 'banned' } }),
      Post.count(),
      Comment.count(),
    ]);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekUserCount = await User.count({ where: { created_at: { [Symbol.for('gte')]: weekAgo } } });
    const weekPostCount = await Post.count({ where: { created_at: { [Symbol.for('gte')]: weekAgo } } });

    const yesterdayUsers = await User.count({ where: { created_at: { [Symbol.for('gte')]: yesterdayStart, [Symbol.for('lt')]: todayStart } } });
    const yesterdayPosts = await Post.count({ where: { created_at: { [Symbol.for('gte')]: yesterdayStart, [Symbol.for('lt')]: todayStart } } });

    return {
      userCount,
      postCount,
      commentCount,
      todayUsers,
      todayPosts,
      pendingReports,
      bannedUsers,
      totalPosts,
      totalComments,
      weekUserCount,
      weekPostCount,
      yesterdayUsers,
      yesterdayPosts,
      userGrowth: yesterdayUsers > 0 ? ((todayUsers - yesterdayUsers) / yesterdayUsers * 100).toFixed(1) : 0,
      postGrowth: yesterdayPosts > 0 ? ((todayPosts - yesterdayPosts) / yesterdayPosts * 100).toFixed(1) : 0,
    };
  },

  async getOperationLogs(adminId: number, options: { page?: number; size?: number; action?: string } = {}) {
    const { page = 1, size = 50, action } = options;

    const where: any = { user_id: adminId };
    if (action) where.action = action;

    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async getCategories() {
    const { Category } = require('../models');
    const categories = await Category.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    });
    return { categories };
  },

  async createCategory(adminId: number, data: { name: string; description?: string; icon?: string; color?: string; sort_order?: number; parent_id?: number }) {
    const { Category } = require('../models');
    
    const existing = await Category.findOne({ where: { name: data.name } });
    if (existing) {
      throw new Error('版块名称已存在');
    }

    const category = await Category.create(data);

    await OperationLog.create({
      user_id: adminId,
      action: 'create_category',
      target_type: 'category',
      target_id: category.id,
      details: { name: data.name },
    } as any);

    return { success: true, category, message: '版块创建成功' };
  },

  async updateCategory(adminId: number, categoryId: number, data: { name?: string; description?: string; icon?: string; color?: string; sort_order?: number; parent_id?: number; is_active?: boolean }) {
    const { Category } = require('../models');
    
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new Error('版块不存在');
    }

    if (data.name) {
      const existing = await Category.findOne({ where: { name: data.name } });
      if (existing && existing.id !== categoryId) {
        throw new Error('版块名称已存在');
      }
    }

    await category.update(data);

    await OperationLog.create({
      user_id: adminId,
      action: 'update_category',
      target_type: 'category',
      target_id: categoryId,
      details: data,
    } as any);

    return { success: true, message: '版块已更新' };
  },

  async deleteCategory(adminId: number, categoryId: number, force: boolean = false) {
    const { Category, Post } = require('../models');
    
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new Error('版块不存在');
    }

    const postCount = await Post.count({ where: { category_id: categoryId } });
    if (postCount > 0 && !force) {
      throw new Error(`该版块下有 ${postCount} 个帖子，请先处理后再删除，或使用强制删除`);
    }

    if (force) {
      await Post.update({ category_id: null }, { where: { category_id: categoryId } });
    }

    await category.destroy();

    await OperationLog.create({
      user_id: adminId,
      action: 'delete_category',
      target_type: 'category',
      target_id: categoryId,
      details: { name: category.name, force },
    } as any);

    return { success: true, message: '版块已删除' };
  },
};

export default adminService;
