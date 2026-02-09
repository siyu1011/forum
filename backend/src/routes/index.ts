import { Router } from 'express';
import userRoutes from './user.routes';
import postRoutes from './post.routes';
import categoryRoutes from './category.routes';
import commentRoutes from './comment.routes';
import uploadRoutes from './upload.routes';
import interactionRoutes from './interaction.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/categories', categoryRoutes);
router.use('/comments', commentRoutes);
router.use('/upload', uploadRoutes);
router.use('/interactions', interactionRoutes);
router.use('/admin', adminRoutes);

export default router;