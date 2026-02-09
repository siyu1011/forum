import { sequelize, testConnection } from '../config/database';
import { syncModels } from '../models';
import { User, Category, Tag, Post } from '../models';
import bcrypt from 'bcryptjs';

const initializeDatabase = async () => {
  try {
    console.log('🚀 开始初始化数据库...\n');

    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    await testConnection();
    console.log('   ✅ 数据库连接成功\n');

    // 2. 同步数据库模型
    console.log('2. 同步数据库模型...');
    await syncModels(true);
    console.log('   ✅ 模型同步完成\n');

    // 3. 检查是否已有数据
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('3. 数据库已有数据，跳过种子数据插入');
      console.log('   ✅ 初始化完成\n');
      process.exit(0);
    }

    // 4. 插入种子数据
    console.log('3. 插入种子数据...');

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      nickname: '管理员',
      bio: '社区管理员',
      role: 'admin',
      status: 'active',
      reputation: 100,
      post_count: 0,
      comment_count: 0,
    } as any);
    console.log('   ✅ 创建管理员用户: admin/admin123');

    // 创建测试用户
    const userPassword = await bcrypt.hash('user123', 10);
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: userPassword,
      nickname: '测试用户',
      bio: '这是一个测试用户',
      role: 'user',
      status: 'active',
      reputation: 10,
      post_count: 0,
      comment_count: 0,
    } as any);
    console.log('   ✅ 创建测试用户: testuser/user123');

    // 创建版块
    const categories = await Promise.all([
      Category.create({
        name: '技术交流',
        description: '分享技术文章、讨论编程问题',
        icon: 'Monitor',
        color: '#409EFF',
        sort_order: 1,
        post_count: 5,
        is_active: true,
      } as any),
      Category.create({
        name: '生活分享',
        description: '分享生活点滴、兴趣爱好',
        icon: 'Coffee',
        color: '#67C23A',
        sort_order: 2,
        post_count: 3,
        is_active: true,
      } as any),
      Category.create({
        name: '求职招聘',
        description: '发布招聘信息、寻找工作机会',
        icon: 'Briefcase',
        color: '#E6A23C',
        sort_order: 3,
        post_count: 2,
        is_active: true,
      } as any),
      Category.create({
        name: '问题求助',
        description: '遇到问题？来这里寻求帮助',
        icon: 'QuestionFilled',
        color: '#F56C6C',
        sort_order: 4,
        post_count: 4,
        is_active: true,
      } as any),
      Category.create({
        name: '资源分享',
        description: '分享优质资源、工具、教程',
        icon: 'Gift',
        color: '#909399',
        sort_order: 5,
        post_count: 2,
        is_active: true,
      } as any),
    ]);
    console.log(`   ✅ 创建 ${categories.length} 个版块`);

    // 创建标签
    const tags = await Promise.all([
      Tag.create({ name: 'Vue', description: 'Vue.js相关', color: '#42b883', post_count: 3 } as any),
      Tag.create({ name: 'React', description: 'React相关', color: '#61dafb', post_count: 2 } as any),
      Tag.create({ name: 'Node.js', description: 'Node.js相关', color: '#68a063', post_count: 2 } as any),
      Tag.create({ name: 'TypeScript', description: 'TypeScript相关', color: '#3178c6', post_count: 1 } as any),
      Tag.create({ name: '前端', description: '前端开发相关', color: '#f7df1e', post_count: 5 } as any),
      Tag.create({ name: '后端', description: '后端开发相关', color: '#4caf50', post_count: 3 } as any),
      Tag.create({ name: '数据库', description: '数据库相关', color: '#00758f', post_count: 1 } as any),
      Tag.create({ name: '面试', description: '面试相关', color: '#ff6b6b', post_count: 1 } as any),
      Tag.create({ name: '职场', description: '职场相关', color: '#845ec2', post_count: 1 } as any),
      Tag.create({ name: '生活', description: '生活相关', color: '#ffc75f', post_count: 2 } as any),
    ]);
    console.log(`   ✅ 创建 ${tags.length} 个标签`);

    // 创建示例帖子
    await Post.create({
      user_id: testUser.id,
      category_id: categories[0].id,
      title: 'Vue 3 组合式 API 最佳实践分享',
      content: `<h2>前言</h2>
<p>Vue 3 带来了全新的组合式 API，让我们来看看如何更好地使用它。</p>
<h3>1. 使用 setup 语法糖</h3>
<p>Vue 3.2+ 支持 <code>script setup</code> 语法糖，让代码更加简洁。</p>
<h3>2. 合理拆分逻辑</h3>
<p>将相关逻辑提取到独立的函数中，实现更好的复用和测试。</p>
<h3>3. 使用响应式引用</h3>
<p>正确使用 ref 和 reactive，避免响应式丢失问题。</p>
<p>希望对大家有帮助！</p>`,
      content_type: 'html',
      excerpt: 'Vue 3 带来了全新的组合式 API，让我们来看看如何更好地使用它。本文分享了一些最佳实践...',
      views: 1234,
      likes: 56,
      comments_count: 3,
      favorites_count: 12,
      is_top: false,
      is_essence: true,
      status: 'published',
      published_at: new Date(),
    } as any);

    await Post.create({
      user_id: admin.id,
      category_id: categories[0].id,
      title: 'Node.js 性能优化指南',
      content: `<h2>性能优化重要性</h2>
<p>在高并发场景下，性能优化至关重要。</p>
<h3>1. 使用异步操作</h3>
<p>Node.js 是单线程的，要充分利用异步 I/O。</p>
<h3>2. 合理使用缓存</h3>
<p>使用 Redis 等缓存热点数据。</p>
<h3>3. 集群模式</h3>
<p>利用 cluster 模块充分利用多核 CPU。</p>`,
      content_type: 'html',
      excerpt: '在高并发场景下，性能优化至关重要。本文介绍了 Node.js 性能优化的几个关键点...',
      views: 890,
      likes: 34,
      comments_count: 2,
      favorites_count: 8,
      is_top: true,
      is_essence: false,
      status: 'published',
      published_at: new Date(Date.now() - 86400000),
    } as any);

    await Post.create({
      user_id: testUser.id,
      category_id: categories[0].id,
      title: 'TypeScript 高级类型详解',
      content: `<h2>TypeScript 高级类型</h2>
<p>让我们深入了解 TypeScript 的高级类型系统。</p>
<h3>1. 联合类型和交叉类型</h3>
<p>了解如何组合多种类型。</p>
<h3>2. 条件类型</h3>
<p>实现类型层面的条件判断。</p>
<h3>3. 映射类型</h3>
<p>批量转换类型。</p>`,
      content_type: 'html',
      excerpt: 'TypeScript 的高级类型系统非常强大，本文将详细介绍条件类型、映射类型等高级用法...',
      views: 756,
      likes: 28,
      comments_count: 1,
      favorites_count: 5,
      is_top: false,
      is_essence: false,
      status: 'published',
      published_at: new Date(Date.now() - 172800000),
    } as any);

    await Post.create({
      user_id: testUser.id,
      category_id: categories[3].id,
      title: '求助：React hooks 闭包陷阱怎么解决？',
      content: `<p>在使用 React hooks 时遇到了闭包陷阱的问题。</p>
<p>代码示例：</p>
<pre><code>function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 这里始终是 0
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return &lt;div&gt;{count}&lt;/div&gt;;
}</code></pre>
<p>如何正确获取最新的 count 值？</p>`,
      content_type: 'html',
      excerpt: '在使用 React hooks 时遇到了闭包陷阱的问题，setInterval 中始终获取不到最新的 count 值...',
      views: 567,
      likes: 15,
      comments_count: 5,
      favorites_count: 3,
      is_top: false,
      is_essence: false,
      status: 'published',
      published_at: new Date(Date.now() - 259200000),
    } as any);

    await Post.create({
      user_id: admin.id,
      category_id: categories[1].id,
      title: '周末爬山日记',
      content: `<p>上周六去爬了西山，天气特别好。</p>
<p>山上空气清新，风景优美。下次准备去爬华山！</p>
<p>附上几张照片：</p>
<p>🏔️ 累并快乐着！</p>`,
      content_type: 'html',
      excerpt: '上周六去爬了西山，天气特别好。山上空气清新，风景优美...',
      views: 345,
      likes: 42,
      comments_count: 8,
      favorites_count: 6,
      is_top: false,
      is_essence: false,
      status: 'published',
      published_at: new Date(Date.now() - 345600000),
    } as any);

    console.log('   ✅ 创建 5 篇示例帖子');

    console.log('\n🎉 数据库初始化完成！\n');
    console.log('📝 登录信息：');
    console.log('   管理员: admin / admin123');
    console.log('   测试用户: testuser / user123');
    console.log('');

  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// 运行初始化
initializeDatabase();
