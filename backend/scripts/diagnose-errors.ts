/**
 * 后端错误诊断脚本
 * 检查 /users/me 接口 500 错误的具体原因
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const logDir = './logs';
const errorLogFile = join(logDir, 'error.log');
const combinedLogFile = join(logDir, 'combined.log');

console.log('🔍 开始诊断后端错误...\n');

// 检查错误日志文件是否存在
try {
  const errorLog = readFileSync(errorLogFile, 'utf-8');
  const lines = errorLog.split('\n').filter(line => line.trim());
  
  // 查找最近的 /users/me 500 错误
  const recentErrors = lines
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(log => log && log.path === '/users/me' && log.statusCode >= 500)
    .slice(-5); // 最近5条
  
  if (recentErrors.length > 0) {
    console.log('❌ 发现 /users/me 接口 500 错误:\n');
    recentErrors.forEach((error, index) => {
      console.log(`错误 #${index + 1}:`);
      console.log(`  时间: ${error.timestamp || '未知'}`);
      console.log(`  状态码: ${error.statusCode}`);
      console.log(`  错误信息: ${error.message}`);
      console.log(`  堆栈: ${error.stack ? error.stack.split('\n')[0] : '无'}`);
      console.log('');
    });
  } else {
    console.log('✅ 未在错误日志中发现 /users/me 500 错误\n');
  }
} catch (error) {
  console.log('⚠️ 无法读取错误日志文件:', error.message);
}

// 检查数据库连接
try {
  const combinedLog = readFileSync(combinedLogFile, 'utf-8');
  const lines = combinedLog.split('\n');
  
  // 查找数据库连接相关错误
  const dbErrors = lines.filter(line => 
    line.includes('database') || 
    line.includes('ECONNREFUSED') || 
    line.includes('Connection refused') ||
    line.includes('SequelizeConnectionError')
  ).slice(-3);
  
  if (dbErrors.length > 0) {
    console.log('⚠️ 发现数据库连接相关日志:\n');
    dbErrors.forEach(line => console.log(`  ${line}`));
    console.log('');
  }
} catch (error) {
  console.log('⚠️ 无法读取综合日志文件\n');
}

console.log('💡 诊断建议:');
console.log('1. 如果看到 "id" 类型相关错误，说明 JWT Token 中的用户ID格式有问题');
console.log('2. 如果看到数据库连接错误，请检查 MySQL 服务是否正常运行');
console.log('3. 如果看到 "Cannot read property" 错误，说明 req.user 为 undefined');
console.log('4. 检查后端是否已经应用了最新的修复（用户ID类型转换）');
console.log('\n如需更详细的日志，请查看:', errorLogFile);
