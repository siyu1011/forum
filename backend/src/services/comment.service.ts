import { Comment, Post, User } from '../models';
import { Op } from 'sequelize';

export interface CreateCommentData {
  post_id: number;
  user_id: number;
  content: string;
  parent_id?: number;
}

export const commentService = {
  async create(data: CreateCommentData) {
    const { parent_id, ...commentData } = data;

    let root_id = null;
    if (parent_id) {
      const parentComment = await Comment.findByPk(parent_id);
      if (parentComment) {
        root_id = parentComment.root_id || parentComment.id;
      }
    }

    const comment = await Comment.create({
      ...commentData,
      parent_id: parent_id || null,
      root_id,
    });

    await Post.increment('comments_count', { where: { id: data.post_id } });
    await Post.update(
      { last_comment_at: new Date() },
      { where: { id: data.post_id } }
    );

    return this.getCommentById(comment.id);
  },

  async getCommentById(id: number) {
    return await Comment.findByPk(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: Comment, as: 'replies', include: [{ model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] }] },
      ],
    });
  },

  async getCommentsByPostId(postId: number, page = 1, size = 20) {
    const { count, rows } = await Comment.findAndCountAll({
      where: { post_id: postId, parent_id: null, is_deleted: false },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
        {
          model: Comment,
          as: 'replies',
          where: { is_deleted: false },
          required: false,
          include: [
            { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
          ],
          order: [['created_at', 'ASC']],
        },
      ],
      order: [['created_at', 'ASC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      comments: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async updateComment(id: number, userId: number, content: string) {
    const comment = await Comment.findByPk(id);

    if (!comment) {
      throw new Error('评论不存在');
    }

    if (comment.user_id !== userId) {
      throw new Error('无权修改此评论');
    }

    if (comment.is_deleted) {
      throw new Error('评论已删除');
    }

    await comment.update({ content });

    return this.getCommentById(id);
  },

  async deleteComment(id: number, userId: number, isAdmin = false) {
    const comment = await Comment.findByPk(id);

    if (!comment) {
      throw new Error('评论不存在');
    }

    if (!isAdmin && comment.user_id !== userId) {
      throw new Error('无权删除此评论');
    }

    await comment.update({ is_deleted: true });

    await Post.decrement('comments_count', { where: { id: comment.post_id } });

    return { success: true };
  },
};

export default commentService;
