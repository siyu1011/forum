import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ReportAttributes {
  id: number;
  reporter_id: number;
  target_type: 'post' | 'comment' | 'user';
  target_id: number;
  reason: string;
  description: string | null;
  status: 'pending' | 'handled' | 'dismissed';
  handler_id: number | null;
  handled_at: Date | null;
  created_at: Date;
}

export interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status' | 'handler_id' | 'handled_at' | 'created_at'> {}

export class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public reporter_id!: number;
  public target_type!: 'post' | 'comment' | 'user';
  public target_id!: number;
  public reason!: string;
  public description!: string | null;
  public status!: 'pending' | 'handled' | 'dismissed';
  public handler_id!: number | null;
  public handled_at!: Date | null;
  public readonly created_at!: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    reporter_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    target_type: {
      type: DataTypes.ENUM('post', 'comment', 'user'),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'handled', 'dismissed'),
      defaultValue: 'pending',
    },
    handler_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    handled_at: {
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
    tableName: 'reports',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['target_type', 'target_id'] },
      { fields: ['status'] },
      { fields: ['reporter_id'] },
    ],
  }
);

export default Report;
