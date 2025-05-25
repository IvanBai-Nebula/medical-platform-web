# 医疗学习平台 - 后端开发指南

## 快速开始

### 1. 项目概述
这是一个医疗学习平台的后端API文档，前端使用Vue 3 + TypeScript构建，需要配套的后端API服务。

### 2. 测试账号
为了方便前端测试，以下是可用的测试账号：

**管理员账号:**
- 用户名: `superadmin` / 密码: `admin123` (超级管理员)
- 用户名: `admin1` / 密码: `admin123` (普通管理员)
- 用户名: `admin2` / 密码: `admin123` (普通管理员)

**普通用户账号:**
- 用户名: `student1` / 密码: `user123`
- 用户名: `student2` / 密码: `user123`
- 用户名: `doctor1` / 密码: `user123`
- 用户名: `nurse1` / 密码: `user123`

### 3. 核心功能模块

#### 3.1 用户认证系统
- 用户/管理员登录注册
- JWT Token 认证
- 密码加密存储
- 权限控制

#### 3.2 医疗知识管理
- 知识的增删改查
- 分类标签管理
- 内容搜索
- 浏览量统计

#### 3.3 学习心得管理
- 心得的增删改查
- 关联知识点
- 个人心得管理

#### 3.4 用户管理
- 用户列表查询
- 用户状态管理
- 管理员创建

#### 3.5 文件上传
- 头像上传
- 内容图片上传

### 4. 技术栈建议

#### 4.1 推荐技术栈
```
后端框架: Node.js + Express/Koa + TypeScript
数据库: MySQL 8.0+ / PostgreSQL 13+
缓存: Redis 6.0+
认证: JWT
密码加密: bcrypt
文件上传: multer
ORM: TypeORM / Prisma / Sequelize
```

#### 4.2 项目结构建议
```
backend/
├── src/
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由
│   ├── utils/           # 工具函数
│   ├── config/          # 配置文件
│   └── types/           # TypeScript 类型定义
├── tests/               # 测试文件
├── uploads/             # 上传文件目录
├── package.json
└── README.md
```

### 5. 环境配置

#### 5.1 环境变量 (.env)
```bash
# 服务配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medical_platform
DB_USER=root
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-very-secure-secret-key-here
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp

# CORS配置
CORS_ORIGIN=http://localhost:5173

# 安全配置
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

#### 5.2 数据库初始化
```sql
-- 创建数据库
CREATE DATABASE medical_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE medical_platform;

-- 执行建表SQL (参考 API_DOCUMENTATION.md 中的数据库设计)
```

### 6. 开发步骤

#### 6.1 初始化项目
```bash
# 创建项目目录
mkdir medical-platform-backend
cd medical-platform-backend

# 初始化 npm 项目
npm init -y

# 安装依赖
npm install express cors helmet morgan bcryptjs jsonwebtoken multer mysql2 redis
npm install -D @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/multer typescript ts-node nodemon

# 创建 TypeScript 配置
npx tsc --init
```

#### 6.2 实现核心功能

**优先级1: 认证系统**
1. 用户登录 POST `/auth/login`
2. 管理员登录 POST `/auth/admin/login`
3. 获取当前用户 GET `/auth/me`
4. 用户注册 POST `/auth/register`

**优先级2: 基础CRUD**
1. 知识管理 API
2. 心得管理 API
3. 用户管理 API

**优先级3: 高级功能**
1. 文件上传
2. 搜索功能
3. 统计数据
4. 日志记录

### 7. API 测试

#### 7.1 使用 Postman
1. 导入 `API_Postman_Collection.json` 文件
2. 设置环境变量 `baseUrl` 为你的后端地址
3. 先执行登录接口获取token
4. 测试其他接口

#### 7.2 快速验证
```bash
# 测试服务器是否启动
curl http://localhost:3000/v1/config/public

# 测试登录
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"user123"}'
```

### 8. 安全注意事项

#### 8.1 必须实现的安全措施
- [ ] 密码使用bcrypt加密，不要明文存储
- [ ] JWT Token设置合理的过期时间
- [ ] 实现API限流，防止暴力破解
- [ ] 输入验证，防止SQL注入和XSS
- [ ] 文件上传类型和大小限制
- [ ] CORS正确配置
- [ ] 生产环境使用HTTPS

#### 8.2 权限控制
```typescript
// 示例中间件
export const requireAuth = (req, res, next) => {
  // 验证JWT Token
};

export const requireAdmin = (req, res, next) => {
  // 验证管理员权限
};

export const requireSuperAdmin = (req, res, next) => {
  // 验证超级管理员权限
};
```

### 9. 响应格式标准

```typescript
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: string[]
  timestamp: string
  requestId: string
}
```

### 10. 错误处理

```typescript
// HTTP状态码使用建议
200 - 成功
201 - 创建成功
400 - 请求参数错误
401 - 未认证
403 - 权限不足
404 - 资源不存在
409 - 资源冲突(如用户名已存在)
422 - 数据验证失败
429 - 请求过于频繁
500 - 服务器内部错误
```

### 11. 开发调试

#### 11.1 日志配置
```javascript
// 建议使用 winston 或 pino
const logger = require('winston');

// 记录所有API请求
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  next();
});
```

#### 11.2 开发脚本
```json
{
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "npx prisma db seed"
  }
}
```

### 12. 测试建议

#### 12.1 单元测试
```javascript
// 使用 Jest + Supertest
describe('Auth API', () => {
  test('POST /auth/login - 成功登录', async () => {
    const response = await request(app)
      .post('/v1/auth/login')
      .send({
        username: 'student1',
        password: 'user123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### 13. 部署建议

#### 13.1 Docker 配置
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 13.2 生产环境检查清单
- [ ] 环境变量配置
- [ ] 数据库连接池配置
- [ ] 日志级别设置
- [ ] 错误监控 (如 Sentry)
- [ ] 健康检查端点
- [ ] 进程管理 (PM2)
- [ ] 反向代理 (Nginx)
- [ ] SSL 证书配置

### 14. 联系方式

如有问题，请联系前端开发团队或查阅完整的API文档 `API_DOCUMENTATION.md`。

---

**版本**: v1.0.0  
**更新时间**: 2024-01-01  
**前端仓库**: [Vue3医疗平台前端项目] 