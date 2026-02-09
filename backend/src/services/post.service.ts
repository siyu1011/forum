import { Post, User, Category, Tag, PostTag, Comment } from '../models';
import { Op } from 'sequelize';
import { cacheService, withCache } from '../utils/cache';

export interface CreatePostData {
  user_id: number;
  title: string;
  content: string;
  category_id: number;
  tags?: string[];
  cover_image?: string;
  excerpt?: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  category_id?: number;
  tags?: string[];
  cover_image?: string;
  excerpt?: string;
}

export interface PostQueryOptions {
  page?: number;
  size?: number;
  category_id?: number;
  tag?: string;
  user_id?: number;
  status?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  keyword?: string;
}

export const postService = {
  async create(data: CreatePostData) {
    const { tags, ...postData } = data;
    
    const post = await Post.create({
      ...postData,
      status: 'published',
      published_at: new Date(),
      excerpt: data.excerpt || this.generateExcerpt(data.content),
      content_type: 'html',
      views: 0,
      likes: 0,
      comments_count: 0,
      favorites_count: 0,
      is_top: false,
      is_essence: false,
    } as any);

    if (tags && tags.length > 0) {
      await this.addTagsToPost(post.id, tags);
    }

    await Category.increment('post_count', { where: { id: data.category_id } });

    return this.getPostById(post.id);
  },

  async getPostById(id: number) {
    const post = await Post.findByPk(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
    });

    if (!post || post.status === 'deleted') {
      return null;
    }

    return post;
  },

  async getPosts(options: PostQueryOptions = {}) {
    const {
      page = 1,
      size = 20,
      category_id,
      tag,
      user_id,
      status = 'published',
      sort = 'created_at',
      order = 'DESC',
      keyword,
    } = options;

    const where: any = {};
    
    if (category_id) where.category_id = category_id;
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;
    
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const orderOption: any[] = [];
    
    if (sort === 'top') {
      orderOption.push(['is_top', 'DESC']);
    } else if (sort === 'essence') {
      orderOption.push(['is_essence', 'DESC']);
    } else if (sort === 'views') {
      orderOption.push(['views', 'DESC']);
    } else if (sort === 'likes') {
      orderOption.push(['likes', 'DESC']);
    } else {
      orderOption.push([sort, order]);
    }
    
    orderOption.push(['created_at', 'DESC']);

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      order: orderOption,
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      posts: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async updatePost(id: number, userId: number, data: UpdatePostData) {
    const post = await Post.findByPk(id);

    if (!post) {
      throw new Error('帖子不存在');
    }

    if (post.user_id !== userId) {
      throw new Error('无权修改此帖子');
    }

    if (post.status === 'deleted') {
      throw new Error('帖子已删除');
    }

    const { tags, ...updateData } = data;

    if (tags) {
      await PostTag.destroy({ where: { post_id: id } });
      await this.addTagsToPost(id, tags);
    }

    await post.update({
      ...updateData,
      excerpt: updateData.excerpt || this.generateExcerpt(updateData.content || post.content),
    });

    return this.getPostById(id);
  },

  async deletePost(id: number, userId: number, isAdmin = false) {
    const post = await Post.findByPk(id);

    if (!post) {
      throw new Error('帖子不存在');
    }

    if (!isAdmin && post.user_id !== userId) {
      throw new Error('无权删除此帖子');
    }

    await post.update({ status: 'deleted' });

    await Category.decrement('post_count', { where: { id: post.category_id } });

    return { success: true };
  },

  async incrementViews(id: number) {
    await Post.increment('views', { where: { id } });
  },

  async getPostsByTag(tagName: string, page = 1, size = 20) {
    const tag = await Tag.findOne({ where: { name: tagName } });

    if (!tag) {
      return { posts: [], pagination: { total: 0, page, size, totalPages: 0 } };
    }

    const { count, rows } = await Post.findAndCountAll({
      include: [
        {
          model: Tag,
          as: 'tags',
          where: { id: tag.id },
          attributes: [],
        },
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
      ],
      where: { status: 'published' },
      order: [['created_at', 'DESC']],
      offset: (page - 1) * size,
      limit: size,
    });

    return {
      posts: rows,
      pagination: {
        total: count,
        page,
        size,
        totalPages: Math.ceil(count / size),
      },
    };
  },

  async getHotPosts(limit = 10) {
    return await withCache(
      `posts:hot:${limit}`,
      async () => {
        return await Post.findAll({
          where: { status: 'published' },
          include: [
            { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
            { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
          ],
          order: [['views', 'DESC'], ['likes', 'DESC']],
          limit,
        });
      },
      60 * 5 // 5 minutes cache
    );
  },

  async getLatestPosts(limit = 10) {
    return await withCache(
      `posts:latest:${limit}`,
      async () => {
        return await Post.findAll({
          where: { status: 'published' },
          include: [
            { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
            { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
          ],
          order: [['created_at', 'DESC']],
          limit,
        });
      },
      60 * 5 // 5 minutes cache
    );
  },

  async addTagsToPost(postId: number, tagNames: string[]) {
    for (const tagName of tagNames) {
      let tag = await Tag.findOne({ where: { name: tagName } });

      if (!tag) {
        tag = await Tag.create({ name: tagName, post_count: 0 } as any);
      } else {
        await Tag.increment('post_count', { where: { id: tag.id } });
      }

      await PostTag.create({
        post_id: postId,
        tag_id: tag.id,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
    }
  },

  generateExcerpt(content: string, maxLength = 200): string {
    const text = content.replace(/<[^>]*>/g, '');
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  },
};

export default postService;
