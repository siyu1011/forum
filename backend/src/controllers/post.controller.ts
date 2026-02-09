import { Request, Response } from 'express';
import { postService } from '../services/post.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const postController = {
  createPost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { title, content, category_id, tags, cover_image, excerpt } = req.body;

    if (!title || !content || !category_id) {
      return ApiResponse.badRequest(res, '标题、内容和版块不能为空');
    }

    if (title.length < 5 || title.length > 255) {
      return ApiResponse.badRequest(res, '标题长度必须为5-255个字符');
    }

    if (content.length < 10) {
      return ApiResponse.badRequest(res, '内容至少需要10个字符');
    }

    const post = await postService.create({
      user_id: req.user.id,
      title,
      content,
      category_id: Number(category_id),
      tags,
      cover_image,
      excerpt,
    });

    return ApiResponse.success(res, post, '发帖成功', 201);
  }),

  getPostById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = await postService.getPostById(Number(id));

    if (!post) {
      return ApiResponse.notFound(res, '帖子不存在');
    }

    await postService.incrementViews(Number(id));

    return ApiResponse.success(res, post);
  }),

  getPosts: asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      size = 20,
      category_id,
      tag,
      user_id,
      sort = 'created_at',
      order = 'DESC',
      keyword,
    } = req.query;

    const options: any = {
      page: Number(page),
      size: Number(size),
    };

    if (category_id) options.category_id = Number(category_id);
    if (tag) options.tag = String(tag);
    if (user_id) options.user_id = Number(user_id);
    if (sort) options.sort = String(sort);
    if (order) options.order = order;
    if (keyword) options.keyword = String(keyword);

    const result = await postService.getPosts(options);

    return ApiResponse.success(res, result);
  }),

  updatePost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { id } = req.params;
    const { title, content, category_id, tags, cover_image, excerpt } = req.body;

    const post = await postService.updatePost(Number(id), req.user.id, {
      title,
      content,
      category_id: category_id ? Number(category_id) : undefined,
      tags,
      cover_image,
      excerpt,
    });

    return ApiResponse.success(res, post, '更新成功');
  }),

  deletePost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { id } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    await postService.deletePost(Number(id), req.user.id, isAdmin);

    return ApiResponse.success(res, null, '删除成功', 204);
  }),

  getHotPosts: asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 10;
    const posts = await postService.getHotPosts(limit);
    return ApiResponse.success(res, posts);
  }),

  getLatestPosts: asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 10;
    const posts = await postService.getLatestPosts(limit);
    return ApiResponse.success(res, posts);
  }),

  searchPosts: asyncHandler(async (req: Request, res: Response) => {
    const { q, page = 1, size = 20 } = req.query;

    if (!q) {
      return ApiResponse.badRequest(res, '搜索关键词不能为空');
    }

    const result = await postService.getPosts({
      page: Number(page),
      size: Number(size),
      keyword: String(q),
    });

    return ApiResponse.success(res, result);
  }),
};

export default postController;
