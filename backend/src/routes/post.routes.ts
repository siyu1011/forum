import { Router } from 'express';
import postController from '../controllers/post.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', postController.getPosts);
router.get('/hot', postController.getHotPosts);
router.get('/latest', postController.getLatestPosts);
router.get('/search', postController.searchPosts);
router.get('/:id', postController.getPostById);

router.post('/', authMiddleware, postController.createPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

export default router;
