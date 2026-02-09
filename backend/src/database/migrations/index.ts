import { sequelize } from '../../config/database';

const initDatabase = async () => {
  try {
    console.log('🗄️  开始创建数据库表结构...');

    // 1. 创建用户表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50) NULL,
        avatar VARCHAR(255) NULL,
        bio TEXT NULL,
        role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        reputation INT DEFAULT 0,
        post_count INT DEFAULT 0,
        comment_count INT DEFAULT 0,
        last_login_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_username (username),
        UNIQUE KEY uk_email (email),
        KEY idx_status (status),
        KEY idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'
    `);
    console.log('✅ users 表创建成功');

    // 2. 创建版块分类表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        icon VARCHAR(255) NULL,
        color VARCHAR(20) NULL,
        sort_order INT DEFAULT 0,
        parent_id BIGINT UNSIGNED NULL,
        moderator_id BIGINT UNSIGNED NULL,
        rules TEXT NULL,
        post_count INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_parent_id (parent_id),
        KEY idx_moderator_id (moderator_id),
        KEY idx_sort_order (sort_order),
        KEY idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='版块分类表'
    `);
    console.log('✅ categories 表创建成功');

    // 3. 创建帖子表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        category_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        content_type ENUM('html', 'markdown') DEFAULT 'html',
        excerpt VARCHAR(500) NULL,
        cover_image VARCHAR(255) NULL,
        views INT UNSIGNED DEFAULT 0,
        likes INT UNSIGNED DEFAULT 0,
        comments_count INT UNSIGNED DEFAULT 0,
        favorites_count INT UNSIGNED DEFAULT 0,
        is_top TINYINT(1) DEFAULT 0,
        is_essence TINYINT(1) DEFAULT 0,
        status ENUM('published', 'draft', 'pending', 'rejected', 'deleted') DEFAULT 'published',
        published_at DATETIME NULL,
        last_comment_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_id (user_id),
        KEY idx_category_id (category_id),
        KEY idx_status (status),
        KEY idx_is_top (is_top),
        KEY idx_is_essence (is_essence),
        KEY idx_published_at (published_at),
        KEY idx_last_comment_at (last_comment_at),
        FULLTEXT KEY ft_title_content (title, content)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子表'
    `);
    console.log('✅ posts 表创建成功');

    // 4. 创建评论表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        post_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        parent_id BIGINT UNSIGNED NULL,
        root_id BIGINT UNSIGNED NULL,
        content TEXT NOT NULL,
        likes INT UNSIGNED DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_post_id (post_id),
        KEY idx_user_id (user_id),
        KEY idx_parent_id (parent_id),
        KEY idx_root_id (root_id),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表'
    `);
    console.log('✅ comments 表创建成功');

    // 5. 创建标签表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(255) NULL,
        color VARCHAR(20) NULL,
        icon VARCHAR(255) NULL,
        post_count INT UNSIGNED DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_name (name),
        KEY idx_post_count (post_count)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表'
    `);
    console.log('✅ tags 表创建成功');

    // 6. 创建帖子标签关联表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id BIGINT UNSIGNED NOT NULL,
        tag_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, tag_id),
        KEY idx_tag_id (tag_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子标签关联表'
    `);
    console.log('✅ post_tags 表创建成功');

    // 7. 创建用户关注表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_follows (
        follower_id BIGINT UNSIGNED NOT NULL,
        following_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        KEY idx_following_id (following_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注表'
    `);
    console.log('✅ user_follows 表创建成功');

    // 8. 创建帖子点赞表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        user_id BIGINT UNSIGNED NOT NULL,
        post_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, post_id),
        KEY idx_post_id (post_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子点赞表'
    `);
    console.log('✅ post_likes 表创建成功');

    // 9. 创建收藏表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        post_id BIGINT UNSIGNED NOT NULL,
        folder_name VARCHAR(100) DEFAULT '默认收藏夹',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_user_post (user_id, post_id),
        KEY idx_user_id (user_id),
        KEY idx_post_id (post_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表'
    `);
    console.log('✅ favorites 表创建成功');

    // 10. 创建附件表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        post_id BIGINT UNSIGNED NULL,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INT UNSIGNED NOT NULL,
        url VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NULL,
        is_image TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_id (user_id),
        KEY idx_post_id (post_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='附件表'
    `);
    console.log('✅ attachments 表创建成功');

    // 11. 创建消息通知表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        sender_id BIGINT UNSIGNED NULL,
        type ENUM('system', 'comment', 'reply', 'like', 'follow', 'mention') NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NULL,
        target_type VARCHAR(50) NULL,
        target_id BIGINT UNSIGNED NULL,
        is_read TINYINT(1) DEFAULT 0,
        read_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_id (user_id),
        KEY idx_type (type),
        KEY idx_is_read (is_read),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知表'
    `);
    console.log('✅ notifications 表创建成功');

    // 12. 创建私信表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        sender_id BIGINT UNSIGNED NOT NULL,
        receiver_id BIGINT UNSIGNED NOT NULL,
        content TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        read_at DATETIME NULL,
        is_deleted_by_sender TINYINT(1) DEFAULT 0,
        is_deleted_by_receiver TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_sender_id (sender_id),
        KEY idx_receiver_id (receiver_id),
        KEY idx_conversation (sender_id, receiver_id),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信表'
    `);
    console.log('✅ messages 表创建成功');

    // 13. 创建操作日志表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) NULL,
        target_id BIGINT UNSIGNED NULL,
        ip_address VARCHAR(50) NULL,
        user_agent VARCHAR(500) NULL,
        details JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_id (user_id),
        KEY idx_action (action),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表'
    `);
    console.log('✅ operation_logs 表创建成功');

    console.log('🎉 所有表结构创建完成！');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库表创建失败:', error);
    process.exit(1);
  }
};

initDatabase();
