import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const adminController = {
  getUsers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, size = 20, keyword, status } = req.query;
    const result = await adminService.getUsers({
      page: Number(page),
      size: Number(size),
      keyword: keyword as string,
      status: status as string,
    });
    return ApiResponse.success(res, result);
  }),

  getUserById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = await adminService.getUserById(Number(id));
    return ApiResponse.success(res, user);
  }),

  banUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { reason } = req.body;
    const result = await adminService.banUser(req.user.id, Number(id), reason);
    return ApiResponse.success(res, result, result.message);
  }),

  unbanUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const result = await adminService.unbanUser(req.user.id, Number(id));
    return ApiResponse.success(res, result, result.message);
  }),

  updateUserRole: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { role } = req.body;
    const result = await adminService.updateUserRole(req.user.id, Number(id), role);
    return ApiResponse.success(res, result, result.message);
  }),

  getReports: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, size = 20, status, target_type } = req.query;
    const result = await adminService.getReports({
      page: Number(page),
      size: Number(size),
      status: status as string,
      target_type: target_type as string,
    });
    return ApiResponse.success(res, result);
  }),

  handleReport: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { action, reason } = req.body;
    const result = await adminService.handleReport(req.user.id, Number(id), action, reason);
    return ApiResponse.success(res, result, result.message);
  }),

  deletePost: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { reason } = req.body;
    const result = await adminService.deletePost(req.user.id, Number(id), reason);
    return ApiResponse.success(res, result, result.message);
  }),

  deleteComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { reason } = req.body;
    const result = await adminService.deleteComment(req.user.id, Number(id), reason);
    return ApiResponse.success(res, result, result.message);
  }),

  getStats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await adminService.getStats();
    return ApiResponse.success(res, stats);
  }),

  getOperationLogs: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { page = 1, size = 50, action } = req.query;
    const result = await adminService.getOperationLogs(req.user.id, {
      page: Number(page),
      size: Number(size),
      action: action as string,
    });
    return ApiResponse.success(res, result);
  }),

  getCategories: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await adminService.getCategories();
    return ApiResponse.success(res, result);
  }),

  createCategory: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { name, description, icon, color, sort_order, parent_id } = req.body;
    const result = await adminService.createCategory(req.user.id, { name, description, icon, color, sort_order, parent_id });
    return ApiResponse.success(res, result, '版块创建成功', 201);
  }),

  updateCategory: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { name, description, icon, color, sort_order, parent_id, is_active } = req.body;
    const result = await adminService.updateCategory(req.user.id, Number(id), { name, description, icon, color, sort_order, parent_id, is_active });
    return ApiResponse.success(res, result, result.message);
  }),

  deleteCategory: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return ApiResponse.unauthorized(res);

    const { id } = req.params;
    const { force } = req.query;
    const result = await adminService.deleteCategory(req.user.id, Number(id), force === 'true');
    return ApiResponse.success(res, result, result.message);
  }),
};

export default adminController;
