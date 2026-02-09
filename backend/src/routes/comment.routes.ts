import { Router } from 'express';
import commentController from '../controllers/comment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/post/:post_id', commentController.getCommentsByPostId);
router.post('/', authMiddleware, commentController.createComment);
router.put('/:id', authMiddleware, commentController.updateComment);
router.delete('/:id', authMiddleware, commentController.deleteComment);

export default router;
