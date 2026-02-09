import { sequelize } from '../config/database';
import { User } from '../models';
import bcrypt from 'bcryptjs';

async function syncUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    const expectedUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        nickname: '管理员',
        role: 'admin',
        bio: '社区管理员',
        reputation: 100,
        post_count: 0,
        comment_count: 0,
        status: 'active'
      },
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'user123',
        nickname: '测试用户',
        role: 'user',
        bio: '这是一个测试用户',
        reputation: 10,
        post_count: 0,
        comment_count: 0,
        status: 'active'
      }
    ];

    console.log('📝 开始同步用户信息...\n');

    for (const expectedUser of expectedUsers) {
      const existingUser = await User.findOne({
        where: { username: expectedUser.username }
      });

      const hashedPassword = await bcrypt.hash(expectedUser.password, 10);

      if (existingUser) {
        const updates: any = {};

        if (existingUser.email !== expectedUser.email) {
          updates.email = expectedUser.email;
          console.log(`⚠️  用户 ${expectedUser.username} 邮箱不一致: ${existingUser.email} -> ${expectedUser.email}`);
        }

        if (existingUser.nickname !== expectedUser.nickname) {
          updates.nickname = expectedUser.nickname;
          console.log(`⚠️  用户 ${expectedUser.username} 昵称不一致: ${existingUser.nickname} -> ${expectedUser.nickname}`);
        }

        if (existingUser.role !== expectedUser.role) {
          updates.role = expectedUser.role;
          console.log(`⚠️  用户 ${expectedUser.username} 角色不一致: ${existingUser.role} -> ${expectedUser.role}`);
        }

        if (existingUser.reputation !== expectedUser.reputation) {
          updates.reputation = expectedUser.reputation;
          console.log(`⚠️  用户 ${expectedUser.username} 声望不一致: ${existingUser.reputation} -> ${expectedUser.reputation}`);
        }

        if (existingUser.bio !== expectedUser.bio) {
          updates.bio = expectedUser.bio;
          console.log(`⚠️  用户 ${expectedUser.username} 简介不一致: ${existingUser.bio} -> ${expectedUser.bio}`);
        }

        if (existingUser.post_count !== expectedUser.post_count) {
          updates.post_count = expectedUser.post_count;
          console.log(`⚠️  用户 ${expectedUser.username} 帖子数不一致: ${existingUser.post_count} -> ${expectedUser.post_count}`);
        }

        if (existingUser.comment_count !== expectedUser.comment_count) {
          updates.comment_count = expectedUser.comment_count;
          console.log(`⚠️  用户 ${expectedUser.username} 评论数不一致: ${existingUser.comment_count} -> ${expectedUser.comment_count}`);
        }

        if (Object.keys(updates).length > 0) {
          await User.update(updates, { where: { id: existingUser.id } });
          console.log(`✅ 用户 ${expectedUser.username} 信息已更新\n`);
        } else {
          console.log(`✅ 用户 ${expectedUser.username} 信息已一致，无需更新\n`);
        }
      } else {
        await User.create({
          ...expectedUser,
          password: hashedPassword
        } as any);
        console.log(`✅ 用户 ${expectedUser.username} 已创建\n`);
      }
    }

    console.log('📊 同步后的用户信息：');
    console.log('='.repeat(80));

    const users = await User.findAll({
      where: {
        username: ['admin', 'testuser', 'zhangsan', 'lisi', 'wangwu']
      },
      attributes: ['id', 'username', 'email', 'nickname', 'role', 'status', 'reputation', 'post_count', 'comment_count']
    });

    for (const user of users) {
      const u = user.toJSON();
      console.log(`ID: ${u.id} | 用户名: ${u.username} | 邮箱: ${u.email}`);
      console.log(`角色: ${u.role} | 声望: ${u.reputation} | 帖子: ${u.post_count} | 评论: ${u.comment_count}`);
      console.log('-'.repeat(80));
    }

    console.log('\n✅ 用户信息同步完成');
    await sequelize.close();
  } catch (error) {
    console.error('❌ 同步失败:', error);
    process.exit(1);
  }
}

syncUsers();
