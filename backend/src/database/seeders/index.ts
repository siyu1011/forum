import { sequelize } from '../../config/database';
import {
  User,
  Category,
  Post,
  Comment,
  Tag,
  PostTag,
  syncModels,
} from '../../models';

const seedData = async () => {
  try {
    console.log('🌱 开始创建种子数据...');

    // 1. 创建管理员用户
    const admin = await User.create({
      username: 'admin',
      email: 'admin@forum.com',
      password: 'admin123',
      nickname: '管理员',
      role: 'admin',
      bio: '社区管理员',
      status: 'active',
      reputation: 0,
      post_count: 0,
      comment_count: 0,
    });
    console.log('✅ 管理员账号创建成功');

    // 2. 创建普通用户
    const users = await User.bulkCreate([
      {
        username: 'zhangsan',
        email: 'zhangsan@example.com',
        password: 'password123',
        nickname: '张三',
        bio: '热爱技术的前端开发者',
        role: 'user',
        status: 'active',
        reputation: 0,
        post_count: 0,
        comment_count: 0,
      },
      {
        username: 'lisi',
        email: 'lisi@example.com',
        password: 'password123',
        nickname: '李四',
        bio: '全栈工程师',
        role: 'user',
        status: 'active',
        reputation: 0,
        post_count: 0,
        comment_count: 0,
      },
      {
        username: 'wangwu',
        email: 'wangwu@example.com',
        password: 'password123',
        nickname: '王五',
        bio: '后端开发爱好者',
        role: 'user',
        status: 'active',
        reputation: 0,
        post_count: 0,
        comment_count: 0,
      },
    ]);
    console.log('✅ 普通用户创建成功');

    // 3. 创建版块分类
    const categories = await Category.bulkCreate([
      {
        name: '技术交流',
        description: '技术分享、经验交流、问题讨论',
        icon: 'Monitor',
        color: '#409eff',
        sort_order: 1,
        post_count: 0,
        is_active: true,
      },
      {
        name: '前端开发',
        description: 'Vue、React、HTML、CSS等前端技术',
        icon: 'Picture',
        color: '#67c23a',
        sort_order: 2,
        parent_id: 1,
        post_count: 0,
        is_active: true,
      },
      {
        name: '后端开发',
        description: 'Node.js、Java、Python等后端技术',
        icon: 'Server',
        color: '#e6a23c',
        sort_order: 3,
        parent_id: 1,
        post_count: 0,
        is_active: true,
      },
      {
        name: '生活分享',
        description: '日常生活、兴趣爱好、心情随笔',
        icon: 'Coffee',
        color: '#f56c6c',
        sort_order: 4,
        post_count: 0,
        is_active: true,
      },
      {
        name: '求职招聘',
        description: '招聘信息、求职经验、面试分享',
        icon: 'Briefcase',
        color: '#909399',
        sort_order: 5,
        post_count: 0,
        is_active: true,
      },
    ]);
    console.log('✅ 版块分类创建成功');

    // 4. 创建标签
    const tags = await Tag.bulkCreate([
      { name: 'Vue', description: 'Vue.js框架', color: '#42b883', post_count: 0 },
      { name: 'React', description: 'React框架', color: '#61dafb', post_count: 0 },
      { name: 'Node.js', description: 'Node.js后端', color: '#339933', post_count: 0 },
      { name: 'TypeScript', description: 'TypeScript语言', color: '#3178c6', post_count: 0 },
      { name: '前端', description: '前端开发', color: '#ff6b6b', post_count: 0 },
      { name: '后端', description: '后端开发', color: '#4ecdc4', post_count: 0 },
      { name: '数据库', description: '数据库技术', color: '#95e1d3', post_count: 0 },
      { name: '面试', description: '面试经验', color: '#f38181', post_count: 0 },
    ]);
    console.log('✅ 标签创建成功');

    // 5. 创建示例帖子
    const posts = await Post.bulkCreate([
      {
        user_id: users[0].id,
        category_id: 2,
        title: 'Vue 3 组合式 API 最佳实践总结',
        content: '<p>Vue 3 引入了组合式 API (Composition API)，为我们提供了更灵活的代码组织方式...</p>',
        content_type: 'html',
        excerpt: '本文总结了使用 Vue 3 Composition API 的最佳实践，包括 setup 函数的使用、响应式 API 的选择等',
        views: 1234,
        likes: 56,
        comments_count: 12,
        favorites_count: 0,
        is_top: false,
        is_essence: false,
        status: 'published',
        published_at: new Date(),
      },
      {
        user_id: users[1].id,
        category_id: 3,
        title: 'Node.js 性能优化指南',
        content: '<p>在高并发场景下，Node.js 的性能优化尤为重要。本文将从多个维度介绍优化策略...</p>',
        content_type: 'html',
        excerpt: '从事件循环、内存管理、数据库连接等方面详细介绍 Node.js 性能优化技巧',
        views: 890,
        likes: 34,
        comments_count: 8,
        favorites_count: 0,
        is_top: false,
        is_essence: false,
        status: 'published',
        published_at: new Date(),
      },
      {
        user_id: users[2].id,
        category_id: 2,
        title: 'TypeScript 高级类型详解',
        content: '<p>TypeScript 的类型系统非常强大，掌握高级类型可以让我们的代码更加健壮...</p>',
        content_type: 'html',
        excerpt: '深入讲解 TypeScript 的高级类型系统，包括泛型、条件类型、映射类型等',
        views: 756,
        likes: 28,
        comments_count: 6,
        favorites_count: 0,
        is_top: false,
        is_essence: true,
        status: 'published',
        published_at: new Date(),
      },
      {
        user_id: users[0].id,
        category_id: 4,
        title: '程序员的周末生活',
        content: '<p>作为一名程序员，工作之余的生活同样重要。分享我的周末安排...</p>',
        content_type: 'html',
        excerpt: '分享程序员的周末生活，包括学习、运动、娱乐等方面的平衡',
        views: 432,
        likes: 45,
        comments_count: 15,
        favorites_count: 0,
        is_top: false,
        is_essence: false,
        status: 'published',
        published_at: new Date(),
      },
      {
        user_id: users[1].id,
        category_id: 5,
        title: '2024年前端面试经验分享',
        content: '<p>最近参加了多家公司的面试，总结了一些面试经验和技巧，希望对大家有所帮助...</p>',
        content_type: 'html',
        excerpt: '总结2024年前端面试的经验，包括技术问题、项目介绍、薪资谈判等',
        views: 2100,
        likes: 128,
        comments_count: 45,
        favorites_count: 0,
        is_top: true,
        is_essence: true,
        status: 'published',
        published_at: new Date(),
      },
    ]);
    console.log('✅ 示例帖子创建成功');

    // 6. 为帖子添加标签关联
    await PostTag.bulkCreate([
      { post_id: posts[0].id, tag_id: 1, created_at: new Date() },
      { post_id: posts[0].id, tag_id: 4, created_at: new Date() },
      { post_id: posts[0].id, tag_id: 5, created_at: new Date() },
      { post_id: posts[1].id, tag_id: 3, created_at: new Date() },
      { post_id: posts[1].id, tag_id: 6, created_at: new Date() },
      { post_id: posts[2].id, tag_id: 4, created_at: new Date() },
      { post_id: posts[2].id, tag_id: 5, created_at: new Date() },
      { post_id: posts[4].id, tag_id: 5, created_at: new Date() },
      { post_id: posts[4].id, tag_id: 8, created_at: new Date() },
    ]);
    console.log('✅ 帖子标签关联创建成功');

    // 7. 创建示例评论
    await Comment.bulkCreate([
      {
        post_id: posts[0].id,
        user_id: users[1].id,
        content: '写得很详细，学到了很多！',
        likes: 5,
      },
      {
        post_id: posts[0].id,
        user_id: users[2].id,
        content: '请问 ref 和 reactive 在什么场景下选择使用更好？',
        likes: 3,
      },
      {
        post_id: posts[0].id,
        user_id: users[0].id,
        content: '回复 @王五：一般来说，基本类型用 ref，对象类型用 reactive。',
        parent_id: 2,
        root_id: 2,
        likes: 8,
      },
      {
        post_id: posts[1].id,
        user_id: users[0].id,
        content: 'Redis 缓存那一节讲得很实用，感谢分享！',
        likes: 4,
      },
      {
        post_id: posts[4].id,
        user_id: users[2].id,
        content: '非常有价值的分享，正在准备面试，很有帮助！',
        likes: 12,
      },
    ]);
    console.log('✅ 示例评论创建成功');

    // 8. 更新统计数据
    await Category.update(
      { post_count: 3 },
      { where: { id: 2 } }
    );
    await Category.update(
      { post_count: 1 },
      { where: { id: 3 } }
    );
    await Category.update(
      { post_count: 1 },
      { where: { id: 4 } }
    );
    await Category.update(
      { post_count: 1 },
      { where: { id: 5 } }
    );

    console.log('✅ 统计数据更新成功');
    console.log('🎉 所有种子数据创建完成！');
    console.log('');
    console.log('测试账号:');
    console.log('  管理员: admin@forum.com / admin123');
    console.log('  用户1: zhangsan@example.com / password123');
    console.log('  用户2: lisi@example.com / password123');
    console.log('  用户3: wangwu@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    process.exit(1);
  }
};

// 执行种子数据
const run = async () => {
  try {
    // 先同步模型
    await syncModels(false);
    
    // 清空现有数据
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Comment.destroy({ where: {}, truncate: true });
    await PostTag.destroy({ where: {}, truncate: true });
    await Post.destroy({ where: {}, truncate: true });
    await Category.destroy({ where: {}, truncate: true });
    await Tag.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('🗑️  已清空旧数据');
    
    // 创建种子数据
    await seedData();
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
};

run();