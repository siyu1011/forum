import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface OperationLogAttributes {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: Date;
}

export interface OperationLogCreationAttributes extends Optional<OperationLogAttributes, 'id' | 'created_at'> {}

export class OperationLog extends Model<OperationLogAttributes, OperationLogCreationAttributes> implements OperationLogAttributes {
  public id!: number;
  public user_id!: number | null;
  public action!: string;
  public target_type!: string | null;
  public target_id!: number | null;
  public ip_address!: string | null;
  public user_agent!: string | null;
  public details!: any;
  public readonly created_at!: Date;
}

OperationLog.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    target_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    target_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'operation_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  }
);

export default OperationLog;
