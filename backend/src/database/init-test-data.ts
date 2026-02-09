import { sequelize } from '../config/database';
import { User, Category } from '../models';

async function initTestData() {
  try {
    console.log('开始初始化测试数据...');
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 检查是否已有测试用户
    const existingUser = await User.findOne({ where: { email: 'admin@example.com' } });
    if (existingUser) {
      console.log('✅ 测试用户已存在');
    } else {
      // 创建测试用户
      await User.bulkCreate([
        {
          username: 'zhangsan',
          email: 'zhangsan@example.com',
          password: '123456',
          nickname: '张三',
          role: 'user',
          status: 'active',
          reputation: 10,
          post_count: 5,
          comment_count: 10,
        },
        {
          username: 'lisi',
          email: 'lisi@example.com',
          password: '123456',
          nickname: '李四',
          role: 'user',
          status: 'active',
          reputation: 5,
          post_count: 3,
          comment_count: 5,
        },
        {
          username: 'wangwu',
          email: 'wangwu@example.com',
          password: '123456',
          nickname: '王五',
          role: 'user',
          status: 'active',
          reputation: 8,
          post_count: 2,
          comment_count: 8,
        },
        {
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123',
          nickname: '管理员',
          role: 'admin',
          status: 'active',
          reputation: 100,
          post_count: 10,
          comment_count: 20,
        },
      ], {
        validate: true,
        ignoreDuplicates: true,
      });
      console.log('✅ 测试用户创建成功');
    }
    
    // 检查是否已有版块
    const existingCategory = await Category.findOne({ where: { name: '技术交流' } });
    if (existingCategory) {
      console.log('✅ 版块数据已存在');
    } else {
      await Category.bulkCreate([
        {
          name: '技术交流',
          description: '编程技术、框架、语言等相关讨论',
          icon: 'Monitor',
          color: '#409eff',
          sort_order: 1,
          is_active: true,
          post_count: 0,
        },
        {
          name: '生活分享',
          description: '日常生活、兴趣爱好、旅行等话题',
          icon: 'Dish',
          color: '#67c23a',
          sort_order: 2,
          is_active: true,
          post_count: 0,
        },
        {
          name: '问答求助',
          description: '问题求助、技术问答、经验分享',
          icon: 'ChatDotRound',
          color: '#e6a23c',
          sort_order: 3,
          is_active: true,
          post_count: 0,
        },
        {
          name: '资源分享',
          description: '工具推荐、资源下载、教程分享',
          icon: 'FolderOpened',
          color: '#909399',
          sort_order: 4,
          is_active: true,
          post_count: 0,
        },
      ], {
        validate: true,
        ignoreDuplicates: true,
      });
      console.log('✅ 版块数据创建成功');
    }
    
    console.log('✅ 测试数据初始化完成');
    console.log('\n测试账号：');
    console.log('  管理员: admin@example.com / admin123');
    console.log('  普通用户: zhangsan@example.com / 123456');
    console.log('  普通用户: lisi@example.com / 123456');
    console.log('  普通用户: wangwu@example.com / 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

initTestData();
