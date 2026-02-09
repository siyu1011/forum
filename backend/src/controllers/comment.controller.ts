import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const commentController = {
  createComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { post_id, content, parent_id } = req.body;

    if (!post_id || !content) {
      return ApiResponse.badRequest(res, '帖子ID和评论内容不能为空');
    }

    if (content.length < 1 || content.length > 1000) {
      return ApiResponse.badRequest(res, '评论长度必须为1-1000个字符');
    }

    const comment = await commentService.create({
      post_id: Number(post_id),
      user_id: req.user.id,
      content,
      parent_id: parent_id ? Number(parent_id) : undefined,
    });

    return ApiResponse.success(res, comment, '评论成功', 201);
  }),

  getCommentsByPostId: asyncHandler(async (req: Request, res: Response) => {
    const { post_id } = req.params;
    const { page = 1, size = 20 } = req.query;

    const result = await commentService.getCommentsByPostId(Number(post_id), Number(page), Number(size));

    return ApiResponse.success(res, result);
  }),

  updateComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return ApiResponse.badRequest(res, '评论内容不能为空');
    }

    const comment = await commentService.updateComment(Number(id), req.user.id, content);

    return ApiResponse.success(res, comment, '更新成功');
  }),

  deleteComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { id } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    await commentService.deleteComment(Number(id), req.user.id, isAdmin);

    return ApiResponse.success(res, null, '删除成功', 204);
  }),
};

export default commentController;
