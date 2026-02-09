import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PostAttributes {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  content: string;
  content_type: 'html' | 'markdown';
  excerpt: string | null;
  cover_image: string | null;
  views: number;
  likes: number;
  comments_count: number;
  favorites_count: number;
  is_top: boolean;
  is_essence: boolean;
  status: 'published' | 'draft' | 'pending' | 'rejected' | 'deleted';
  published_at: Date | null;
  last_comment_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: number;
  public user_id!: number;
  public category_id!: number;
  public title!: string;
  public content!: string;
  public content_type!: 'html' | 'markdown';
  public excerpt!: string | null;
  public cover_image!: string | null;
  public views!: number;
  public likes!: number;
  public comments_count!: number;
  public favorites_count!: number;
  public is_top!: boolean;
  public is_essence!: boolean;
  public status!: 'published' | 'draft' | 'pending' | 'rejected' | 'deleted';
  public published_at!: Date | null;
  public last_comment_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Post.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [5, 255],
      },
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    content_type: {
      type: DataTypes.ENUM('html', 'markdown'),
      defaultValue: 'html',
    },
    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    views: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    likes: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    comments_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    favorites_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    is_top: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_essence: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('published', 'draft', 'pending', 'rejected', 'deleted'),
      defaultValue: 'published',
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_comment_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['category_id'] },
      { fields: ['status'] },
      { fields: ['is_top'] },
      { fields: ['is_essence'] },
      { fields: ['published_at'] },
      { fields: ['last_comment_at'] },
      { fields: ['title', 'content'], type: 'FULLTEXT' },
    ],
  }
);

export default Post;
