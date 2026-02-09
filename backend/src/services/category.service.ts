import { Category, Post, User } from '../models';
import { cacheService, withCache } from '../utils/cache';

const CATEGORIES_CACHE_KEY = 'categories:all';
const CATEGORIES_CACHE_TTL = 60 * 10; // 10 minutes

export const categoryService = {
  async getCategories(activeOnly = true) {
    return await withCache(
      `${CATEGORIES_CACHE_KEY}:${activeOnly}`,
      async () => {
        const where: any = {};
        if (activeOnly) {
          where.is_active = true;
        }

        return await Category.findAll({
          where,
          include: [
            { model: Category, as: 'children', where: { is_active: true }, required: false },
            { model: User, as: 'moderator', attributes: ['id', 'username', 'nickname', 'avatar'] },
          ],
          order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
        });
      },
      CATEGORIES_CACHE_TTL
    );
  },

  async getCategoryById(id: number) {
    return await Category.findByPk(id, {
      include: [
        { model: User, as: 'moderator', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
    });
  },

  async getCategoryPosts(categoryId: number, options: { page: number; size: number; sort: string; order: 'ASC' | 'DESC' }) {
    const { page, size, sort, order } = options;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new Error('版块不存在');
    }

    const orderOption: any[] = [];
    
    if (sort === 'top') {
      orderOption.push(['is_top', 'DESC']);
    } else if (sort === 'views') {
      orderOption.push(['views', 'DESC']);
    } else if (sort === 'likes') {
      orderOption.push(['likes', 'DESC']);
    } else {
      orderOption.push([sort, order]);
    }
    
    orderOption.push(['created_at', 'DESC']);

    const { count, rows } = await Post.findAndCountAll({
      where: { category_id: categoryId, status: 'published' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
      ],
      order: orderOption,
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      category,
      posts: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },
};

export default categoryService;
