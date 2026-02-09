import app, { initializeApp } from './app';
import { config } from './config';
import logger from './utils/logger';

const startServer = async () => {
  try {
    // 初始化应用（数据库连接等）
    await initializeApp();
    
    // 启动服务器
    app.listen(config.port, () => {
      console.log(`🚀 服务器运行在 http://localhost:${config.port}`);
      console.log(`📚 API文档 http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`服务器启动成功，端口: ${config.port}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  logger.error('未处理的Promise拒绝:', { reason, promise });
});

startServer();
