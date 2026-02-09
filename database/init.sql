-- ===========================================
-- 社区论坛系统 - 数据库初始化脚本
-- ===========================================
-- 创建日期: 2026-02-10
-- 数据库: luntan
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
-- ===========================================

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS luntan 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE luntan;

-- ===========================================
-- 2. 用户表
-- ===========================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
    `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `bio` TEXT DEFAULT NULL COMMENT '个人简介',
    `role` ENUM('user', 'moderator', 'admin') DEFAULT 'user' COMMENT '角色',
    `status` ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
    `reputation` INT UNSIGNED DEFAULT 0 COMMENT '声望值',
    `post_count` INT UNSIGNED DEFAULT 0 COMMENT '发帖数',
    `comment_count` INT UNSIGNED DEFAULT 0 COMMENT '评论数',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_username` (`username`),
    UNIQUE KEY `unique_email` (`email`),
    INDEX `idx_status` (`status`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ===========================================
-- 3. 版块表
-- ===========================================
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL COMMENT '版块名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '版块描述',
    `icon` VARCHAR(100) DEFAULT NULL COMMENT '版块图标',
    `color` VARCHAR(20) DEFAULT '#409EFF' COMMENT '主题色',
    `sort_order` INT UNSIGNED DEFAULT 0 COMMENT '排序',
    `parent_id` INT UNSIGNED DEFAULT NULL COMMENT '父版块ID',
    `moderator_id` INT UNSIGNED DEFAULT NULL COMMENT '版主ID',
    `rules` TEXT DEFAULT NULL COMMENT '版块规则',
    `post_count` INT UNSIGNED DEFAULT 0 COMMENT '帖子数量',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_parent` (`parent_id`),
    INDEX `idx_active` (`is_active`),
    INDEX `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='版块表';

-- ===========================================
-- 4. 帖子表
-- ===========================================
CREATE TABLE IF NOT EXISTS `posts` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '作者ID',
    `category_id` INT UNSIGNED NOT NULL COMMENT '版块ID',
    `title` VARCHAR(200) NOT NULL COMMENT '标题',
    `content` LONGTEXT NOT NULL COMMENT '内容(富文本)',
    `content_type` ENUM('html', 'markdown') DEFAULT 'html' COMMENT '内容类型',
    `excerpt` VARCHAR(500) DEFAULT NULL COMMENT '摘要',
    `cover_image` VARCHAR(500) DEFAULT NULL COMMENT '封面图URL',
    `views` INT UNSIGNED DEFAULT 0 COMMENT '浏览量',
    `likes` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
    `comments_count` INT UNSIGNED DEFAULT 0 COMMENT '评论数',
    `favorites_count` INT UNSIGNED DEFAULT 0 COMMENT '收藏数',
    `is_top` TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
    `is_essence` TINYINT(1) DEFAULT 0 COMMENT '是否精华',
    `status` ENUM('draft', 'pending', 'published', 'deleted') DEFAULT 'published' COMMENT '状态',
    `published_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_comment_at` DATETIME DEFAULT NULL COMMENT '最后评论时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_category` (`category_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_top` (`is_top`),
    INDEX `idx_published` (`published_at`),
    INDEX `idx_views` (`views`),
    INDEX `idx_likes` (`likes`),
    FULLTEXT INDEX `idx_fulltext` (`title`, `content`) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- ===========================================
-- 5. 评论表
-- ===========================================
CREATE TABLE IF NOT EXISTS `comments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `post_id` INT UNSIGNED NOT NULL COMMENT '帖子ID',
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `parent_id` INT UNSIGNED DEFAULT NULL COMMENT '父评论ID',
    `root_id` INT UNSIGNED DEFAULT NULL COMMENT '根评论ID',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `likes` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
    `is_deleted` TINYINT(1) DEFAULT 0 COMMENT '是否删除',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_post` (`post_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_root` (`root_id`),
    INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ===========================================
-- 6. 标签表
-- ===========================================
CREATE TABLE IF NOT EXISTS `tags` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL COMMENT '标签名',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `color` VARCHAR(20) DEFAULT '#909399' COMMENT '颜色',
    `icon` VARCHAR(100) DEFAULT NULL COMMENT '图标',
    `post_count` INT UNSIGNED DEFAULT 0 COMMENT '帖子数量',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_name` (`name`),
    INDEX `idx_count` (`post_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ===========================================
-- 7. 帖子标签关联表
-- ===========================================
CREATE TABLE IF NOT EXISTS `post_tags` (
    `post_id` INT UNSIGNED NOT NULL,
    `tag_id` INT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`post_id`, `tag_id`),
    INDEX `idx_tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子标签关联表';

-- ===========================================
-- 8. 用户关注关联表
-- ===========================================
CREATE TABLE IF NOT EXISTS `user_follows` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `follower_id` INT UNSIGNED NOT NULL COMMENT '关注者ID',
    `following_id` INT UNSIGNED NOT NULL COMMENT '被关注者ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_follow` (`follower_id`, `following_id`),
    INDEX `idx_follower` (`follower_id`),
    INDEX `idx_following` (`following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注关联表';

-- ===========================================
-- 9. 帖子点赞关联表
-- ===========================================
CREATE TABLE IF NOT EXISTS `post_likes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `post_id` INT UNSIGNED NOT NULL COMMENT '帖子ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_like` (`user_id`, `post_id`),
    INDEX `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞关联表';

-- ===========================================
-- 10. 收藏表
-- ===========================================
CREATE TABLE IF NOT EXISTS `favorites` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `post_id` INT UNSIGNED NOT NULL COMMENT '帖子ID',
    `folder_name` VARCHAR(50) DEFAULT '默认收藏夹' COMMENT '收藏夹名称',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_favorite` (`user_id`, `post_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ===========================================
-- 11. 附件表
-- ===========================================
CREATE TABLE IF NOT EXISTS `attachments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED DEFAULT NULL COMMENT '上传者ID',
    `post_id` INT UNSIGNED DEFAULT NULL COMMENT '关联帖子ID',
    `filename` VARCHAR(255) NOT NULL COMMENT '文件名',
    `original_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
    `mime_type` VARCHAR(100) NOT NULL COMMENT 'MIME类型',
    `size` INT UNSIGNED NOT NULL COMMENT '文件大小(字节)',
    `url` VARCHAR(500) NOT NULL COMMENT '访问URL',
    `path` VARCHAR(500) NOT NULL COMMENT '存储路径',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='附件表';

-- ===========================================
-- 12. 通知表
-- ===========================================
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '接收者ID',
    `sender_id` INT UNSIGNED DEFAULT NULL COMMENT '发送者ID',
    `type` ENUM('system', 'comment', 'reply', 'like', 'follow', 'mention') NOT NULL COMMENT '通知类型',
    `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
    `content` TEXT DEFAULT NULL COMMENT '通知内容',
    `target_type` ENUM('post', 'comment', 'user') DEFAULT NULL COMMENT '目标类型',
    `target_id` INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
    `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_read` (`is_read`),
    INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ===========================================
-- 13. 操作日志表
-- ===========================================
CREATE TABLE IF NOT EXISTS `operation_logs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED DEFAULT NULL COMMENT '用户ID',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `target_type` VARCHAR(50) DEFAULT NULL COMMENT '目标类型',
    `target_id` INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '操作描述',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` TEXT DEFAULT NULL COMMENT 'User Agent',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_target` (`target_type`, `target_id`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ===========================================
-- 14. 举报表
-- ===========================================
CREATE TABLE IF NOT EXISTS `reports` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reporter_id` INT UNSIGNED NOT NULL COMMENT '举报者ID',
    `target_type` ENUM('post', 'comment', 'user') NOT NULL COMMENT '举报目标类型',
    `target_id` INT UNSIGNED NOT NULL COMMENT '举报目标ID',
    `reason` VARCHAR(50) NOT NULL COMMENT '举报原因',
    `description` TEXT DEFAULT NULL COMMENT '详细描述',
    `status` ENUM('pending', 'reviewed', 'dismissed', 'resolved') DEFAULT 'pending' COMMENT '处理状态',
    `handler_id` INT UNSIGNED DEFAULT NULL COMMENT '处理人ID',
    `result` TEXT DEFAULT NULL COMMENT '处理结果',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `handled_at` DATETIME DEFAULT NULL COMMENT '处理时间',
    PRIMARY KEY (`id`),
    INDEX `idx_target` (`target_type`, `target_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_reporter` (`reporter_id`),
    INDEX `idx_handler` (`handler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报表';

-- ===========================================
-- 外键约束
-- ===========================================
ALTER TABLE `categories`
    ADD CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_category_moderator` FOREIGN KEY (`moderator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `posts`
    ADD CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_post_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

ALTER TABLE `comments`
    ADD CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_comment_root` FOREIGN KEY (`root_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

ALTER TABLE `post_tags`
    ADD CONSTRAINT `fk_post_tag_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_post_tag_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_follows`
    ADD CONSTRAINT `fk_follow_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_follow_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `post_likes`
    ADD CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_like_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

ALTER TABLE `favorites`
    ADD CONSTRAINT `fk_favorite_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_favorite_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

ALTER TABLE `attachments`
    ADD CONSTRAINT `fk_attachment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_attachment_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE SET NULL;

ALTER TABLE `notifications`
    ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_notification_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `operation_logs`
    ADD CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `reports`
    ADD CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_report_handler` FOREIGN KEY (`handler_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- ===========================================
-- 初始数据
-- ===========================================

-- 插入初始版块
INSERT INTO `categories` (`name`, `description`, `icon`, `color`, `sort_order`, `is_active`) VALUES
('技术讨论', '分享技术心得、讨论编程问题', 'code', '#409EFF', 1, 1),
('前端开发', 'HTML、CSS、JavaScript、Vue、React等', 'browser', '#67C23A', 2, 1),
('后端开发', 'Node.js、Python、Java、Go等', 'server', '#E6A23C', 3, 1),
('数据库', 'MySQL、Redis、MongoDB等', 'coin', '#909399', 4, 1),
('职场话题', '求职面试、工作经验、职业规划', 'office-building', '#F56C6C', 5, 1),
('资源共享', '开源项目、工具推荐、学习资源', 'present', '#909399', 6, 1);

-- 插入初始标签
INSERT INTO `tags` (`name`, `description`, `color`) VALUES
('Vue3', 'Vue 3相关', '#67C23A'),
('TypeScript', 'TypeScript相关', '#3178C6'),
('Node.js', 'Node.js相关', '#68A063'),
('React', 'React相关', '#61DAFB'),
('Python', 'Python相关', '#3776AB'),
('MySQL', 'MySQL相关', '#4479A1'),
('Redis', 'Redis相关', '#D82C20'),
('Docker', 'Docker相关', '#2496ED'),
('面试', '面试相关', '#E6A23C'),
('性能优化', '性能优化相关', '#F56C6C');

-- 插入测试用户 (密码: 123456)
INSERT INTO `users` (`username`, `email`, `password`, `nickname`, `role`) VALUES
('zhangsan', 'zhangsan@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/nMskyB.M0aUB/LQCGmWCe', '张三', 'user'),
('lisi', 'lisi@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/nMskyB.M0aUB/LQCGmWCe', '李四', 'user'),
('wangwu', 'wangwu@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/nMskyB.M0aUB/LQCGmWCe', '王五', 'user'),
('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/nMskyB.M0aUB/LQCGmWCe', '管理员', 'admin');

-- 设置版主
UPDATE `categories` SET moderator_id = 4 WHERE `name` = '技术讨论';
UPDATE `categories` SET moderator_id = 4 WHERE `name` = '前端开发';
UPDATE `categories` SET moderator_id = 4 WHERE `name` = '后端开发';
