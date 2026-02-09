import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface PostLikeAttributes {
  user_id: number;
  post_id: number;
  created_at: Date;
}

export class PostLike extends Model<PostLikeAttributes> implements PostLikeAttributes {
  public user_id!: number;
  public post_id!: number;
  public readonly created_at!: Date;
}

PostLike.init(
  {
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'post_likes',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['post_id'] },
    ],
  }
);

export default PostLike;
