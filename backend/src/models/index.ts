import { sequelize } from '../config/database';

// 导入所有模型
import User from './user.model';
import Category from './category.model';
import Post from './post.model';
import Comment from './comment.model';
import Tag from './tag.model';
import PostTag from './post-tag.model';
import UserFollow from './user-follow.model';
import PostLike from './post-like.model';
import Favorite from './favorite.model';
import Attachment from './attachment.model';
import Notification from './notification.model';
import OperationLog from './operation-log.model';
import Report from './report.model';

// 定义模型关联关系
// User 和 Post
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// User 和 Comment
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// Category 和 Post
Category.hasMany(Post, { foreignKey: 'category_id', as: 'posts' });
Post.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Category 自关联（父子版块）
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Category 和 User（版主）
Category.belongsTo(User, { foreignKey: 'moderator_id', as: 'moderator' });

// Post 和 Comment
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// Comment 自关联（回复）
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

// Comment 根评论
Comment.belongsTo(Comment, { foreignKey: 'root_id', as: 'root' });

// Post 和 Tag（多对多）
Post.belongsToMany(Tag, { through: PostTag, foreignKey: 'post_id', as: 'tags' });
Tag.belongsToMany(Post, { through: PostTag, foreignKey: 'tag_id', as: 'posts' });

// UserFollow 关联
UserFollow.belongsTo(User, { foreignKey: 'follower_id', as: 'followerInfo' });
UserFollow.belongsTo(User, { foreignKey: 'following_id', as: 'followingInfo' });
User.hasMany(UserFollow, { foreignKey: 'follower_id', as: 'following' });
User.hasMany(UserFollow, { foreignKey: 'following_id', as: 'followers' });

// PostLike 关联
User.belongsToMany(Post, { through: PostLike, foreignKey: 'user_id', as: 'likedPosts' });
Post.belongsToMany(User, { through: PostLike, foreignKey: 'post_id', as: 'likedBy' });

// Favorite 关联 (通过中间表模型)
User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Post.hasMany(Favorite, { foreignKey: 'post_id', as: 'favorites' });
Favorite.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// Attachment 关联
User.hasMany(Attachment, { foreignKey: 'user_id', as: 'attachments' });
Attachment.belongsTo(User, { foreignKey: 'user_id', as: 'uploader' });

Post.hasMany(Attachment, { foreignKey: 'post_id', as: 'attachments' });
Attachment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// Notification 关联
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'receiver' });

Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// OperationLog 关联
User.hasMany(OperationLog, { foreignKey: 'user_id', as: 'logs' });
OperationLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Report 关联
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

Report.belongsTo(User, { foreignKey: 'handler_id', as: 'handler' });

// 导出所有模型
export {
  User,
  Category,
  Post,
  Comment,
  Tag,
  PostTag,
  UserFollow,
  PostLike,
  Favorite,
  Attachment,
  Notification,
  OperationLog,
  Report,
};

// 同步所有模型
export const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: false });
    console.log('✅ 数据库模型同步成功');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error);
    throw error;
  }
};
