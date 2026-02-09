import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface NotificationAttributes {
  id: number;
  user_id: number;
  sender_id: number | null;
  type: 'system' | 'comment' | 'reply' | 'like' | 'follow' | 'mention';
  title: string;
  content: string | null;
  target_type: string | null;
  target_id: number | null;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'created_at'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public user_id!: number;
  public sender_id!: number | null;
  public type!: 'system' | 'comment' | 'reply' | 'like' | 'follow' | 'mention';
  public title!: string;
  public content!: string | null;
  public target_type!: string | null;
  public target_id!: number | null;
  public is_read!: boolean;
  public read_at!: Date | null;
  public readonly created_at!: Date;
}

Notification.init(
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
    sender_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('system', 'comment', 'reply', 'like', 'follow', 'mention'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    target_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    target_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Notification;
