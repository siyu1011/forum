import { sequelize } from '../config/database';
import { User } from '../models';

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    const users = await User.findAll({
      where: {
        username: ['admin', 'testuser', 'zhangsan', 'lisi', 'wangwu']
      },
      attributes: ['id', 'username', 'email', 'nickname', 'role', 'status', 'reputation', 'post_count', 'comment_count', 'created_at']
    });

    console.log('📊 数据库中的用户信息：');
    console.log('=' .repeat(80));

    for (const user of users) {
      const u = user.toJSON();
      console.log(`ID: ${u.id}`);
      console.log(`用户名: ${u.username}`);
      console.log(`邮箱: ${u.email}`);
      console.log(`昵称: ${u.nickname}`);
      console.log(`角色: ${u.role}`);
      console.log(`状态: ${u.status}`);
      console.log(`声望: ${u.reputation}`);
      console.log(`帖子数: ${u.post_count}`);
      console.log(`评论数: ${u.comment_count}`);
      console.log(`创建时间: ${u.created_at}`);
      console.log('-'.repeat(80));
    }

    console.log('\n✅ 查询完成');
    await sequelize.close();
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

checkUsers();
