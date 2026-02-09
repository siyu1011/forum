import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FavoriteAttributes {
  id: number;
  user_id: number;
  post_id: number;
  folder_name: string;
  created_at: Date;
}

export interface FavoriteCreationAttributes extends Optional<FavoriteAttributes, 'id' | 'created_at'> {}

export class Favorite extends Model<FavoriteAttributes, FavoriteCreationAttributes> implements FavoriteAttributes {
  public id!: number;
  public user_id!: number;
  public post_id!: number;
  public folder_name!: string;
  public readonly created_at!: Date;
}

Favorite.init(
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
      allowNull: false,
    },
    folder_name: {
      type: DataTypes.STRING(100),
      defaultValue: '默认收藏夹',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'favorites',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id', 'post_id'], unique: true },
      { fields: ['user_id'] },
      { fields: ['post_id'] },
    ],
  }
);

export default Favorite;
