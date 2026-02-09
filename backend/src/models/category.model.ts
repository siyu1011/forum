import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CategoryAttributes {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  parent_id: number | null;
  moderator_id: number | null;
  rules: string | null;
  post_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public icon!: string | null;
  public color!: string | null;
  public sort_order!: number;
  public parent_id!: number | null;
  public moderator_id!: number | null;
  public rules!: string | null;
  public post_count!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    parent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    moderator_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    post_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['parent_id'] },
      { fields: ['moderator_id'] },
      { fields: ['sort_order'] },
      { fields: ['is_active'] },
    ],
  }
);

export default Category;
