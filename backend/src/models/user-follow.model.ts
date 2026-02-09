import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserFollowAttributes {
  follower_id: number;
  following_id: number;
  created_at: Date;
}

export class UserFollow extends Model<UserFollowAttributes> implements UserFollowAttributes {
  public follower_id!: number;
  public following_id!: number;
  public readonly created_at!: Date;
}

UserFollow.init(
  {
    follower_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
    following_id: {
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
    tableName: 'user_follows',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['following_id'] },
    ],
  }
);

export default UserFollow;
