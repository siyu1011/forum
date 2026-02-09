import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AttachmentAttributes {
  id: number;
  user_id: number;
  post_id: number | null;
  filename: string;
  file_type: string;
  file_size: number;
  url: string;
  mime_type: string | null;
  is_image: boolean;
  created_at: Date;
}

export interface AttachmentCreationAttributes extends Optional<AttachmentAttributes, 'id' | 'created_at'> {}

export class Attachment extends Model<AttachmentAttributes, AttachmentCreationAttributes> implements AttachmentAttributes {
  public id!: number;
  public user_id!: number;
  public post_id!: number | null;
  public filename!: string;
  public file_type!: string;
  public file_size!: number;
  public url!: string;
  public mime_type!: string | null;
  public is_image!: boolean;
  public readonly created_at!: Date;
}

Attachment.init(
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
    post_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    is_image: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'attachments',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['post_id'] },
    ],
  }
);

export default Attachment;
