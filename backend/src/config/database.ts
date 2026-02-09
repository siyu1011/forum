import { Sequelize } from 'sequelize';
import { config } from './index';

export const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: config.nodeEnv === 'development' ? console.log : false,
    pool: {
      min: config.database.poolMin,
      max: config.database.poolMax,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
};
