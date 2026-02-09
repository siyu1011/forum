import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 公开接口
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/:id', userController.getUserById);

// 需要认证的接口
router.get('/me', authMiddleware, userController.getCurrentUser);
router.put('/me', authMiddleware, userController.updateCurrentUser);

export default router;
