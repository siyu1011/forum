import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 需要先通过认证，再检查管理员权限
router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/unban', adminController.unbanUser);
router.put('/users/:id/role', adminController.updateUserRole);

router.get('/reports', adminController.getReports);
router.put('/reports/:id/handle', adminController.handleReport);

router.delete('/posts/:id', adminController.deletePost);
router.delete('/comments/:id', adminController.deleteComment);

router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getOperationLogs);

router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

export default router;
