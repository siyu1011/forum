import { Router } from 'express';
import categoryController from '../controllers/category.controller';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/posts', categoryController.getCategoryPosts);

export default router;
