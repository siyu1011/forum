import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface TagAttributes {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  post_count: number;
  created_at: Date;
}

export interface TagCreationAttributes extends Optional<TagAttributes, 'id' | 'created_at'> {}

export class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public color!: string | null;
  public icon!: string | null;
  public post_count!: number;
  public readonly created_at!: Date;
}

Tag.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50],
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    post_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'tags',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['post_count'] },
    ],
  }
);

export default Tag;
