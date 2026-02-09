import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CommentAttributes {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  root_id: number | null;
  content: string;
  likes: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'likes' | 'is_deleted' | 'created_at' | 'updated_at'> {}

export class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: number;
  public post_id!: number;
  public user_id!: number;
  public parent_id!: number | null;
  public root_id!: number | null;
  public content!: string;
  public likes!: number;
  public is_deleted!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    root_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
      },
    },
    likes: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'comments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['post_id'] },
      { fields: ['user_id'] },
      { fields: ['parent_id'] },
      { fields: ['root_id'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Comment;
