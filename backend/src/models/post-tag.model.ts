import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface PostTagAttributes {
  post_id: number;
  tag_id: number;
  created_at: Date;
}

export class PostTag extends Model<PostTagAttributes> implements PostTagAttributes {
  public post_id!: number;
  public tag_id!: number;
  public readonly created_at!: Date;
}

PostTag.init(
  {
    post_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
    tag_id: {
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
    tableName: 'post_tags',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tag_id'] },
    ],
  }
);

export default PostTag;
