# 项目启动指南

> 社区论坛系统 - 本地开发环境搭建

## 前置要求

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | 18+ | 后端运行环境 |
| MySQL | 8.0+ | 主数据库 |
| Redis | 5.0+ | 缓存服务 |
| npm/yarn | 最新版 | 包管理器 |

---

## 第一步：克隆项目

```bash
git clone https://github.com/你的用户名/luntan.git
cd luntan
```

---

## 第二步：安装后端依赖

```bash
cd backend

# 安装依赖
npm install

# 或者使用 yarn
yarn install
```

---

## 第三步：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的配置
vim .env
```

### .env 配置示例

```env
# 节点环境
NODE_ENV=development

# 服务器配置
PORT=3000
API_PREFIX=/api/v1

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=luntan
DB_USER=root
DB_PASSWORD=your_password  # ← 修改为你的MySQL密码
DB_LOGGING=true

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=           # 如果有密码则填入

# JWT配置
JWT_SECRET=your_secret_key_here      # ← 修改为你的密钥
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 文件上传配置
UPLOAD_DIR=./uploads
UPLOAD_URL=/uploads
UPLOAD_MAX_SIZE=5242880

# 日志配置
LOG_LEVEL=debug
```

---

## 第四步：初始化数据库

### 方式一：使用 SQL 脚本（推荐）

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source /你的路径/luntan/database/init.sql

# 或者直接在命令行执行
mysql -u root -p luntan < database/init.sql
```

### 方式二：使用 Sequelize 自动同步

后端启动时会自动同步数据库模型（`alter: false`），但不会创建初始数据。

```bash
# 启动后端后，初始数据需要手动插入
```

### 验证数据库

```sql
-- 登录 MySQL 后执行
USE luntan;

-- 检查表是否创建成功
SHOW TABLES;

-- 应该看到以下表：
-- users, categories, posts, comments, tags, post_tags
-- user_follows, post_likes, favorites, attachments
-- notifications, operation_logs, reports
```

---

## 第五步：启动 Redis

```bash
# Linux/Mac
redis-server

# Windows (如果你使用WSL或Docker)
docker run -d -p 6379:6379 redis:alpine
```

**验证 Redis 启动成功：**

```bash
redis-cli ping
# 应该返回 PONG
```

---

## 第六步：启动后端

```bash
cd backend

# 开发模式（自动重启）
npm run dev

# 或者
npm run start
```

**启动成功后会看到：**

```
🚀 服务器运行在 http://localhost:3000
📚 API文档 http://localhost:3000/api/v1
✅ 数据库连接成功
✅ Redis缓存已启用（或 ⚠️ Redis未连接）
✅ 应用初始化成功
```

---

## 第七步：安装前端依赖

```bash
cd frontend

# 安装依赖
npm install
```

---

## 第八步：配置前端环境变量

```bash
# 开发环境
cp .env.development.example .env.development

# 生产环境（可选）
cp .env.production.example .env.production
```

### 前端 .env.development 配置

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_UPLOAD_URL=http://localhost:3000
```

---

## 第九步：启动前端

```bash
cd frontend

# 开发模式
npm run dev
```

**启动成功后访问：** http://localhost:5173

---

## 测试账号

| 用户名 | 邮箱 | 密码 | 角色 |
|--------|------|------|------|
| zhangsan | zhangsan@example.com | 123456 | 普通用户 |
| lisi | lisi@example.com | 123456 | 普通用户 |
| wangwu | wangwu@example.com | 123456 | 普通用户 |
| admin | admin@example.com | admin123 | 管理员 |

---

## 常见问题

### 1. MySQL 连接失败

**问题：** `ECONNREFUSED 127.0.0.1:3306`

**解决：**
```bash
# 检查 MySQL 服务是否启动
# Windows
net start mysql

# Mac
brew services start mysql

# Linux
sudo systemctl start mysql
```

### 2. Redis 连接失败

**问题：** `Redis connection failed`

**解决：**
```bash
# 启动 Redis 服务
redis-server

# 或者后端会自动降级（无缓存运行）
```

### 3. 端口被占用

**问题：** `Port 3000 is already in use`

**解决：**
```bash
# 修改 .env 中的 PORT=3001
```

### 4. 数据库表不存在

**解决：**
```bash
# 确保执行了 init.sql 脚本
mysql -u root -p luntan < database/init.sql
```

### 5. 依赖安装失败

**解决：**
```bash
# 删除 node_modules 和 lock 文件后重新安装
rm -rf node_modules package-lock.json
npm install
```

---

## 项目结构

```
luntan/
├── backend/                 # 后端
│   ├── src/
│   │   ├── config/         # 配置
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由
│   │   └── middlewares/     # 中间件
│   └── uploads/             # 上传文件目录
├── frontend/                # 前端
│   ├── src/
│   │   ├── api/             # API 封装
│   │   ├── components/      # 组件
│   │   ├── views/           # 页面
│   │   ├── stores/          # 状态管理
│   │   └── router/          # 路由
├── database/
│   └── init.sql            # 数据库初始化脚本
├── docs/                    # 文档
└── README.md               # 项目说明
```

---

## API 文档

启动后访问：http://localhost:3000/api/v1

---

## 下一步

1. 配置 Nginx（生产环境）
2. 设置 HTTPS 证书
3. 配置文件存储（如阿里云 OSS）
