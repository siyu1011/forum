import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';

export const categoryController = {
  getCategories: asyncHandler(async (req: Request, res: Response) => {
    const { active_only } = req.query;
    const categories = await categoryService.getCategories(active_only === 'true');
    return ApiResponse.success(res, categories);
  }),

  getCategoryById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(Number(id));
    if (!category) {
      return ApiResponse.notFound(res, '版块不存在');
    }
    return ApiResponse.success(res, category);
  }),

  getCategoryPosts: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, size = 20, sort = 'created_at', order = 'DESC' } = req.query;

    const result = await categoryService.getCategoryPosts(Number(id), {
      page: Number(page),
      size: Number(size),
      sort: String(sort),
      order: order as 'ASC' | 'DESC',
    });

    return ApiResponse.success(res, result);
  }),
};

export default categoryController;
