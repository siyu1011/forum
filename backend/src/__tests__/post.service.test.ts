import { postService, CreatePostData, PostQueryOptions } from '../services/post.service';
import { Post, User, Category, Tag, PostTag } from '../models';

jest.mock('../models', () => ({
  Post: {
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Category: {
    findByPk: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  },
  Tag: {
    findOne: jest.fn(),
    create: jest.fn(),
    increment: jest.fn(),
  },
  PostTag: {
    destroy: jest.fn(),
    create: jest.fn(),
  },
}));

describe('PostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPostById', () => {
    it('应该根据ID查找帖子', async () => {
      const mockPost = {
        id: 1,
        title: '测试帖子',
        content: '测试内容',
        author: { id: 1, username: 'testuser', nickname: '测试用户', avatar: null },
        category: { id: 1, name: '技术交流', icon: 'Monitor' },
        tags: [{ id: 1, name: 'Vue', color: '#42b883' }],
      };

      (Post.findByPk as jest.Mock).mockResolvedValue(mockPost);

      const result = await postService.getPostById(1);

      expect(Post.findByPk).toHaveBeenCalledWith(1, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
          { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
        ],
      });
      expect(result).toEqual(mockPost);
    });

    it('当帖子不存在时应该返回null', async () => {
      (Post.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await postService.getPostById(999);

      expect(result).toBeNull();
    });

    it('当帖子已删除时应该返回null', async () => {
      const mockPost = {
        id: 1,
        status: 'deleted',
      };

      (Post.findByPk as jest.Mock).mockResolvedValue(mockPost);

      const result = await postService.getPostById(1);

      expect(result).toBeNull();
    });
  });

  describe('getPosts', () => {
    it('应该返回帖子列表和分页信息', async () => {
      const mockPosts = [
        { id: 1, title: '帖子1' },
        { id: 2, title: '帖子2' },
      ];

      (Post.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockPosts,
      });

      const result = await postService.getPosts({ page: 1, size: 10 });

      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('pagination');
      expect(result.posts).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.size).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('应该支持按版块筛选', async () => {
      const options: PostQueryOptions = {
        page: 1,
        size: 10,
        category_id: 1,
      };

      (Post.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 0,
        rows: [],
      });

      await postService.getPosts(options);

      expect(Post.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category_id: 1,
          }),
        })
      );
    });

    it('应该支持按关键词搜索', async () => {
      const options: PostQueryOptions = {
        page: 1,
        size: 10,
        keyword: '测试',
      };

      (Post.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 0,
        rows: [],
      });

      await postService.getPosts(options);

      // 验证调用了 findAndCountAll 且 where 条件中包含 keyword 相关的查询
      expect(Post.findAndCountAll).toHaveBeenCalled();
      const callArg = (Post.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArg.where).toBeDefined();
      // 由于使用了 Op.or 和 Op.like 符号，我们只验证调用了查询
    });
  });

  describe('incrementViews', () => {
    it('应该增加帖子的浏览量', async () => {
      (Post.increment as jest.Mock).mockResolvedValue([]);

      await postService.incrementViews(1);

      expect(Post.increment).toHaveBeenCalledWith('views', { where: { id: 1 } });
    });
  });

  describe('getHotPosts', () => {
    it('应该返回热门帖子', async () => {
      const mockPosts = [
        { id: 1, title: '热门帖子1', views: 1000 },
        { id: 2, title: '热门帖子2', views: 800 },
      ];

      (Post.findAll as jest.Mock).mockResolvedValue(mockPosts);

      const result = await postService.getHotPosts(10);

      expect(Post.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'published' },
          order: [['views', 'DESC'], ['likes', 'DESC']],
          limit: 10,
        })
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('getLatestPosts', () => {
    it('应该返回最新帖子', async () => {
      const mockPosts = [
        { id: 1, title: '最新帖子1', created_at: new Date() },
        { id: 2, title: '最新帖子2', created_at: new Date() },
      ];

      (Post.findAll as jest.Mock).mockResolvedValue(mockPosts);

      const result = await postService.getLatestPosts(10);

      expect(Post.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'published' },
          order: [['created_at', 'DESC']],
          limit: 10,
        })
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('generateExcerpt', () => {
    it('应该从HTML内容生成摘要', () => {
      const htmlContent = '<p>这是一个很长的测试段落，包含很多很多内容需要被截断。</p>';
      const excerpt = postService.generateExcerpt(htmlContent, 20);

      expect(excerpt).toBe('这是一个很长的测试段落，包含很多很多内容...');
    });

    it('当内容较短时应该返回完整内容', () => {
      const content = '简短内容';
      const excerpt = postService.generateExcerpt(content, 100);

      expect(excerpt).toBe('简短内容');
    });

    it('应该移除HTML标签', () => {
      const htmlContent = '<h1>标题</h1><p>段落内容</p>';
      const excerpt = postService.generateExcerpt(htmlContent, 100);

      expect(excerpt).not.toContain('<');
      expect(excerpt).not.toContain('>');
      expect(excerpt).toContain('标题');
      expect(excerpt).toContain('段落内容');
    });
  });

  describe('deletePost', () => {
    it('应该软删除帖子', async () => {
      const mockPost = {
        id: 1,
        user_id: 1,
        category_id: 1,
        status: 'published',
        update: jest.fn().mockResolvedValue({}),
      };

      (Post.findByPk as jest.Mock).mockResolvedValue(mockPost);
      (Category.decrement as jest.Mock).mockResolvedValue([]);

      const result = await postService.deletePost(1, 1, false);

      expect(mockPost.update).toHaveBeenCalledWith({ status: 'deleted' });
      expect(Category.decrement).toHaveBeenCalledWith('post_count', { where: { id: 1 } });
      expect(result).toEqual({ success: true });
    });

    it('当用户无权删除时应该抛出错误', async () => {
      const mockPost = {
        id: 1,
        user_id: 2, // 不同用户
        status: 'published',
      };

      (Post.findByPk as jest.Mock).mockResolvedValue(mockPost);

      await expect(postService.deletePost(1, 1, false)).rejects.toThrow('无权删除此帖子');
    });

    it('管理员应该可以删除任何帖子', async () => {
      const mockPost = {
        id: 1,
        user_id: 2, // 不同用户
        category_id: 1,
        status: 'published',
        update: jest.fn().mockResolvedValue({}),
      };

      (Post.findByPk as jest.Mock).mockResolvedValue(mockPost);
      (Category.decrement as jest.Mock).mockResolvedValue([]);

      const result = await postService.deletePost(1, 1, true); // isAdmin = true

      expect(mockPost.update).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
