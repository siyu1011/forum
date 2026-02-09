# 生产环境部署文档

> 文档版本：v1.0  
> 更新日期：2026-02-09  
> 适用版本：社区论坛系统 v1.0

---

## 目录

1. [环境要求](#环境要求)
2. [服务器准备](#服务器准备)
3. [数据库部署](#数据库部署)
4. [后端部署](#后端部署)
5. [前端部署](#前端部署)
6. [Nginx配置](#nginx配置)
7. [PM2进程管理](#pm2进程管理)
8. [SSL证书配置](#ssl证书配置)
9. [备份策略](#备份策略)
10. [故障排查](#故障排查)

---

## 环境要求

### 服务器配置建议

| 配置项 | 最低配置 | 推荐配置 |
|--------|----------|----------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 50GB SSD | 100GB SSD |
| 带宽 | 5Mbps | 10Mbps+ |

### 软件版本要求

| 软件 | 版本要求 |
|------|----------|
| Node.js | >= 18.x |
| MySQL | >= 8.0 |
| Redis | >= 6.0 |
| Nginx | >= 1.18 |
| PM2 | >= 5.0 |

---

## 服务器准备

### 1. 系统更新（Ubuntu/Debian）

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 安装必要工具

```bash
sudo apt install -y git curl wget vim unzip
```

### 3. 安装 Node.js

```bash
# 使用 NVM 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 4. 安装 PM2

```bash
npm install -g pm2
```

---

## 数据库部署

### 1. 安装 MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### 2. 创建数据库

```bash
sudo mysql -u root -p
```

```sql
-- 创建数据库
CREATE DATABASE forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'forum_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- 授权
GRANT ALL PRIVILEGES ON forum.* TO 'forum_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 3. 安装 Redis

```bash
sudo apt install -y redis-server

# 配置Redis
sudo vim /etc/redis/redis.conf

# 修改以下配置
bind 127.0.0.1
requirepass your_redis_password
maxmemory 256mb
maxmemory-policy allkeys-lru

# 重启Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

---

## 后端部署

### 1. 拉取代码

```bash
cd /var/www
git clone https://your-repo-url.git forum
cd forum/backend
```

### 2. 安装依赖

```bash
npm install --production
```

### 3. 配置环境变量

```bash
cp .env.example .env
vim .env
```

```env
# 应用配置
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=forum
DB_USER=forum_user
DB_PASSWORD=your_strong_password
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置（请使用强密钥）
JWT_SECRET=your_super_secret_key_at_least_32_chars_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 文件上传
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=./uploads
UPLOAD_URL=/uploads

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs
```

### 4. 数据库迁移

```bash
npm run db:migrate
npm run db:seed
```

### 5. 构建项目

```bash
npm run build
```

### 6. 使用 PM2 启动

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'forum-api',
    script: './dist/server.js',
    instances: 'max',  // 根据CPU核心数启动多个实例
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s',
  }],
}
EOF

# 启动服务
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 7. 验证后端服务

```bash
curl http://localhost:3000/api/v1/categories
```

---

## 前端部署

### 1. 进入前端目录

```bash
cd /var/www/forum/frontend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
vim .env
```

```env
# API 基础URL
VITE_API_BASE_URL=https://your-domain.com/api/v1

# 其他配置
VITE_APP_TITLE=社区论坛
VITE_APP_DESCRIPTION=一个基于Vue3的社区论坛系统
```

### 4. 构建生产版本

```bash
npm run build
```

### 5. 配置 Nginx 服务

```bash
# 创建Nginx配置
sudo vim /etc/nginx/sites-available/forum
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /var/www/forum/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件
    location /uploads/ {
        alias /var/www/forum/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/forum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Nginx 配置

### 1. 安全配置

```nginx
# 在 server 块中添加

# 限制请求体大小
client_max_body_size 10M;

# 禁用服务器版本信息
server_tokens off;

# 安全响应头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 速率限制
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

### 2. 静态资源缓存

```nginx
# CSS/JS 文件缓存
location ~* \.(css|js)$ {
    root /var/www/forum/frontend/dist;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 图片文件缓存
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
    root /var/www/forum/frontend/dist;
    expires 6M;
    add_header Cache-Control "public, immutable";
}

# 字体文件缓存
location ~* \.(woff|woff2|ttf|otf|eot)$ {
    root /var/www/forum/frontend/dist;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## PM2 进程管理

### 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs forum-api
pm2 logs forum-api --lines 100

# 重启服务
pm2 restart forum-api

# 平滑重载（零停机）
pm2 reload forum-api

# 停止服务
pm2 stop forum-api

# 删除服务
pm2 delete forum-api

# 监控面板
pm2 monit
```

### 日志轮转

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
```

---

## SSL证书配置

### 使用 Certbot 申请免费证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run

# 查看续期定时任务
sudo systemctl status certbot.timer
```

### 配置 HTTP 自动跳转 HTTPS

Certbot 会自动配置，或手动添加：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 备份策略

### 1. 数据库备份脚本

```bash
sudo mkdir -p /opt/backup
cat > /opt/backup/backup.sh << 'EOF'
#!/bin/bash

# 配置
DB_NAME="forum"
DB_USER="forum_user"
DB_PASS="your_strong_password"
BACKUP_DIR="/opt/backup"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# 创建备份
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/forum_$DATE.sql.gz

# 删除旧备份
find $BACKUP_DIR -name "forum_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 记录日志
echo "[$DATE] Database backup completed" >> $BACKUP_DIR/backup.log
EOF

chmod +x /opt/backup/backup.sh
```

### 2. 定时备份任务

```bash
# 每天凌晨3点执行备份
crontab -e
```

```
0 3 * * * /opt/backup/backup.sh
```

### 3. 上传文件备份

```bash
# 添加到你的备份脚本
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/forum/backend uploads/
```

---

## 故障排查

### 1. 后端服务无法启动

```bash
# 检查日志
pm2 logs forum-api --lines 50

# 检查端口占用
sudo lsof -i :3000

# 检查数据库连接
mysql -uforum_user -p -e "SELECT 1"

# 检查Redis连接
redis-cli -a your_redis_password ping
```

### 2. Nginx 502 错误

```bash
# 检查后端服务是否运行
pm2 status

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查防火墙
sudo ufw status
sudo ufw allow 3000
```

### 3. 前端页面空白

```bash
# 检查构建是否成功
ls -la /var/www/forum/frontend/dist/

# 检查 Nginx 配置
sudo nginx -t

# 检查文件权限
sudo chown -R www-data:www-data /var/www/forum/frontend/dist
```

### 4. 数据库连接失败

```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 检查用户权限
mysql -u root -p -e "SHOW GRANTS FOR 'forum_user'@'localhost'"

# 检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES LIKE 'forum'"
```

---

## 监控与维护

### 1. 系统监控

```bash
# 安装 htop
sudo apt install -y htop

# 查看系统资源
htop

# 查看磁盘空间
df -h

# 查看内存使用
free -h
```

### 2. 日志分析

```bash
# 实时查看访问日志
sudo tail -f /var/log/nginx/access.log

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看后端日志
pm2 logs forum-api
```

### 3. 性能优化建议

1. **启用 MySQL 查询缓存**
2. **配置 Redis 持久化**
3. **使用 CDN 加速静态资源**
4. **定期清理日志文件**
5. **监控服务器资源使用情况**

---

## 更新部署

### 更新后端

```bash
cd /var/www/forum/backend
git pull
npm install
npm run build
pm2 reload forum-api
```

### 更新前端

```bash
cd /var/www/forum/frontend
git pull
npm install
npm run build
# Nginx 会自动重新加载静态文件
```

---

## 联系方式

如有部署问题，请联系开发团队。

---

**文档结束**
