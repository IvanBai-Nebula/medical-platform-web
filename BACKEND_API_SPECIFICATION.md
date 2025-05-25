# 医疗学习平台后端API开发规范

## 目录
- [1. 数据库设计](#1-数据库设计)
- [2. API通用规范](#2-api通用规范)
- [3. 认证与授权](#3-认证与授权)
- [4. API模块实现](#4-api模块实现)
  - [4.1 认证模块](#41-认证模块)
  - [4.2 用户管理模块](#42-用户管理模块)
  - [4.3 医疗知识模块](#43-医疗知识模块)
  - [4.4 学习心得模块](#44-学习心得模块)
  - [4.5 首页统计模块](#45-首页统计模块)
  - [4.6 分类管理模块](#46-分类管理模块)

---

## 1. 数据库设计

### 1.1 用户相关表

#### 管理员表 (admins)
```sql
CREATE TABLE admins (
  admin_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  email VARCHAR(100) COMMENT '邮箱',
  avatar VARCHAR(500) COMMENT '头像URL',
  is_super_admin BOOLEAN DEFAULT FALSE COMMENT '是否超级管理员',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '账户状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';
```

#### 普通用户表 (users)
```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  email VARCHAR(100) COMMENT '邮箱',
  avatar VARCHAR(500) COMMENT '头像URL',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '账户状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='普通用户表';
```

### 1.2 知识管理相关表

#### 医疗分类表 (medical_categories)
```sql
CREATE TABLE medical_categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
  category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  sort_order INT DEFAULT 0 COMMENT '排序权重',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医疗分类表';
```

#### 医疗知识表 (medical_knowledge)
```sql
CREATE TABLE medical_knowledge (
  knowledge_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '知识ID',
  title VARCHAR(200) NOT NULL COMMENT '知识标题',
  introduction TEXT NOT NULL COMMENT '知识简介',
  content LONGTEXT NOT NULL COMMENT '知识内容(富文本)',
  cover_image VARCHAR(500) COMMENT '封面图片URL',
  video_url VARCHAR(500) COMMENT '视频URL',
  created_by INT NOT NULL COMMENT '创建者(管理员ID)',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at),
  INDEX idx_view_count (view_count),
  INDEX idx_like_count (like_count),
  FULLTEXT idx_search (title, introduction),
  
  FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医疗知识表';
```

#### 知识分类关联表 (knowledge_categories)
```sql
CREATE TABLE knowledge_categories (
  knowledge_id INT NOT NULL COMMENT '知识ID',
  category_id INT NOT NULL COMMENT '分类ID',
  
  PRIMARY KEY (knowledge_id, category_id),
  
  FOREIGN KEY (knowledge_id) REFERENCES medical_knowledge(knowledge_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES medical_categories(category_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识分类关联表';
```

#### 知识点赞记录表 (knowledge_likes)
```sql
CREATE TABLE knowledge_likes (
  user_id INT NOT NULL COMMENT '用户ID',
  knowledge_id INT NOT NULL COMMENT '知识ID',
  user_type ENUM('user', 'admin') NOT NULL COMMENT '用户类型',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  
  PRIMARY KEY (user_id, knowledge_id, user_type),
  INDEX idx_knowledge_id (knowledge_id),
  
  FOREIGN KEY (knowledge_id) REFERENCES medical_knowledge(knowledge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识点赞记录表';
```

### 1.3 学习心得相关表

#### 学习心得表 (learning_experiences)
```sql
CREATE TABLE learning_experiences (
  experience_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '心得ID',
  user_id INT NOT NULL COMMENT '用户ID',
  knowledge_id INT NOT NULL COMMENT '关联知识ID',
  title VARCHAR(200) NOT NULL COMMENT '心得标题',
  content LONGTEXT NOT NULL COMMENT '心得内容',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
  reviewer_id INT COMMENT '审核人ID',
  review_timestamp TIMESTAMP NULL COMMENT '审核时间',
  review_comments TEXT COMMENT '审核意见',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_user_id (user_id),
  INDEX idx_knowledge_id (knowledge_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_id) REFERENCES medical_knowledge(knowledge_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES admins(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习心得表';
```

#### 心得点赞记录表 (experience_likes)
```sql
CREATE TABLE experience_likes (
  user_id INT NOT NULL COMMENT '用户ID',
  experience_id INT NOT NULL COMMENT '心得ID',
  user_type ENUM('user', 'admin') NOT NULL COMMENT '用户类型',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  
  PRIMARY KEY (user_id, experience_id, user_type),
  INDEX idx_experience_id (experience_id),
  
  FOREIGN KEY (experience_id) REFERENCES learning_experiences(experience_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='心得点赞记录表';
```

---

## 2. API通用规范

### 2.1 基础信息
- **Base URL**: `http://localhost:3000` (开发环境)
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

### 2.2 统一响应格式

#### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据内容
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null,
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### 分页响应
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "data": [
      // 数据数组
    ],
    "pagination": {
      "total": 100,
      "current": 1,
      "pageSize": 10,
      "totalPages": 10,
      "hasMore": true
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2.3 HTTP状态码规范

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 请求成功处理 |
| 201 | 创建成功 | 资源创建成功 |
| 400 | 请求错误 | 参数验证失败 |
| 401 | 未认证 | 缺少或无效的认证信息 |
| 403 | 权限不足 | 有认证但权限不够 |
| 404 | 资源不存在 | 请求的资源不存在 |
| 409 | 资源冲突 | 资源已存在(如用户名重复) |
| 422 | 数据验证失败 | 数据格式正确但逻辑验证失败 |
| 500 | 服务器错误 | 服务器内部错误 |

### 2.4 错误码定义

```javascript
const ERROR_CODES = {
  // 通用错误
  INVALID_PARAMS: 'INVALID_PARAMS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // 认证相关
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 用户相关
  USERNAME_EXISTS: 'USERNAME_EXISTS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_BANNED: 'USER_BANNED',
  
  // 业务相关
  KNOWLEDGE_NOT_FOUND: 'KNOWLEDGE_NOT_FOUND',
  EXPERIENCE_NOT_FOUND: 'EXPERIENCE_NOT_FOUND',
  ALREADY_LIKED: 'ALREADY_LIKED',
  NOT_LIKED_YET: 'NOT_LIKED_YET'
};
```

---

## 3. 认证与授权

### 3.1 JWT Token结构
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": 123,
    "userType": "user",
    "username": "student1",
    "isSuperAdmin": false,
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

### 3.2 权限级别
- **游客**: 可查看已发布的知识和已通过的心得
- **普通用户**: 可创建心得、点赞、查看个人数据
- **管理员**: 可管理知识内容、审核心得、管理普通用户
- **超级管理员**: 拥有所有权限，包括管理其他管理员

### 3.3 认证中间件实现示例
```javascript
// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '缺少认证令牌',
      data: null
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌',
        data: null
      });
    }
    req.user = user;
    next();
  });
};

// 权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null
      });
    }
    next();
  };
};
```

---

## 4. API模块实现

## 4.1 认证模块

### 用户登录
```
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "student1",
  "password": "user123"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 101,
      "username": "student1",
      "email": "student1@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "role": "user"
  }
}
```

**实现要点**:
1. 用户名可以是管理员或普通用户
2. 密码使用bcrypt验证
3. 登录成功后生成JWT token
4. 记录登录时间和IP

### 用户注册
```
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "newuser",
  "password": "password123"
}
```

**响应**:
```json
{
  "code": 201,
  "message": "注册成功",
  "data": null
}
```

**实现要点**:
1. 检查用户名唯一性
2. 密码强度验证
3. 使用bcrypt加密密码
4. 默认状态为active

### 获取当前用户信息
```
GET /api/auth/profile
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": 101,
    "username": "student1",
    "email": "student1@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 4.2 用户管理模块

### 获取用户列表
```
GET /api/users?page=1&limit=10&role=all&status=active&search=student
Authorization: Bearer <admin_token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `role`: 角色筛选 (admin|user|all)
- `status`: 状态筛选 (active|inactive|banned)
- `search`: 搜索关键词 (用户名、邮箱)

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "data": [
      {
        "userId": 101,
        "username": "student1",
        "email": "student1@example.com",
        "avatar": "https://example.com/avatar.jpg",
        "status": "active",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "current": 1,
      "pageSize": 10,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

**SQL查询示例**:
```sql
SELECT u.*, 'user' as user_type FROM users u 
WHERE u.status = ? AND u.username LIKE ?
UNION ALL
SELECT a.admin_id as userId, a.username, a.email, a.avatar, a.status, a.created_at, a.updated_at, 'admin' as user_type 
FROM admins a 
WHERE a.status = ? AND a.username LIKE ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

### 创建用户
```
POST /api/users
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "newuser@example.com"
}
```

### 更新用户信息
```
PUT /api/users/:id
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

### 更新用户密码
```
PUT /api/users/:id/password
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

### 更新用户状态
```
PUT /api/users/:id/status
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "status": "banned"
}
```

### 删除用户
```
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

### 创建管理员
```
POST /api/users/admin
Authorization: Bearer <super_admin_token>
```

**请求体**:
```json
{
  "username": "newadmin",
  "password": "admin123",
  "email": "newadmin@example.com",
  "isSuperAdmin": false
}
```

### 检查超级管理员权限
```
GET /api/users/is-super-admin
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 200,
  "message": "检查成功",
  "data": {
    "isSuperAdmin": true
  }
}
```

## 4.3 医疗知识模块

### 获取知识列表
```
GET /api/knowledge?page=1&pageSize=10&categoryId=1&keyword=heart
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量  
- `categoryId`: 分类ID筛选
- `keyword`: 搜索关键词

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "data": [
      {
        "knowledgeId": 1,
        "title": "心脏解剖结构详解",
        "introduction": "详细介绍心脏的解剖结构和功能",
        "coverImage": "https://example.com/cover1.jpg",
        "categories": [
          {
            "categoryId": 1,
            "categoryName": "心血管科",
            "description": "心血管疾病相关知识"
          }
        ],
        "createdBy": 1,
        "viewCount": 150,
        "likeCount": 25,
        "isLiked": false,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "current": 1,
      "pageSize": 10,
      "totalPages": 10,
      "hasMore": true
    }
  }
}
```

**SQL查询示例**:
```sql
SELECT 
  mk.*,
  GROUP_CONCAT(
    JSON_OBJECT(
      'categoryId', mc.category_id,
      'categoryName', mc.category_name,
      'description', mc.description
    )
  ) as categories,
  CASE WHEN kl.user_id IS NOT NULL THEN true ELSE false END as isLiked
FROM medical_knowledge mk
LEFT JOIN knowledge_categories kc ON mk.knowledge_id = kc.knowledge_id
LEFT JOIN medical_categories mc ON kc.category_id = mc.category_id
LEFT JOIN knowledge_likes kl ON mk.knowledge_id = kl.knowledge_id AND kl.user_id = ? AND kl.user_type = ?
WHERE (? IS NULL OR kc.category_id = ?)
  AND (? IS NULL OR MATCH(mk.title, mk.introduction) AGAINST(? IN NATURAL LANGUAGE MODE))
GROUP BY mk.knowledge_id
ORDER BY mk.created_at DESC
LIMIT ? OFFSET ?
```

### 获取知识详情
```
GET /api/knowledge/:id
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "knowledgeId": 1,
    "title": "心脏解剖结构详解",
    "introduction": "详细介绍心脏的解剖结构和功能",
    "content": "心脏是人体循环系统的核心器官...",
    "coverImage": "https://example.com/cover1.jpg",
    "videoUrl": "https://example.com/video1.mp4",
    "categories": [
      {
        "categoryId": 1,
        "categoryName": "心血管科",
        "description": "心血管疾病相关知识"
      }
    ],
    "createdBy": 1,
    "viewCount": 151,
    "likeCount": 25,
    "isLiked": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 创建知识
```
POST /api/knowledge
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "title": "新的医疗知识",
  "introduction": "知识简介",
  "content": "详细的医疗知识内容...",
  "coverImage": "https://example.com/cover.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "categoryIds": [1, 2]
}
```

**实现要点**:
1. 在medical_knowledge表中插入知识记录
2. 在knowledge_categories表中插入分类关联记录
3. 使用数据库事务确保数据一致性

### 更新知识
```
PUT /api/knowledge/:id
Authorization: Bearer <admin_token>
```

### 删除知识
```
DELETE /api/knowledge/:id
Authorization: Bearer <admin_token>
```

**实现要点**:
1. 删除knowledge_categories关联记录 (CASCADE)
2. 删除knowledge_likes点赞记录 (CASCADE)
3. 删除相关的learning_experiences记录或设置为NULL

### 知识点赞
```
POST /api/knowledge/:id/like
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "success": true,
    "isLiked": true,
    "likeCount": 26
  }
}
```

**实现逻辑**:
```sql
-- 检查是否已点赞
SELECT COUNT(*) FROM knowledge_likes 
WHERE user_id = ? AND knowledge_id = ? AND user_type = ?

-- 如果未点赞，插入点赞记录
INSERT INTO knowledge_likes (user_id, knowledge_id, user_type) 
VALUES (?, ?, ?)

-- 如果已点赞，删除点赞记录
DELETE FROM knowledge_likes 
WHERE user_id = ? AND knowledge_id = ? AND user_type = ?

-- 更新知识表的点赞计数
UPDATE medical_knowledge 
SET like_count = (
  SELECT COUNT(*) FROM knowledge_likes WHERE knowledge_id = ?
) 
WHERE knowledge_id = ?
```

### 增加浏览量
```
POST /api/knowledge/:id/view
```

**响应**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "success": true,
    "viewCount": 152
  }
}
```

### 获取知识相关心得
```
GET /api/knowledge/:id/experiences?page=1&pageSize=10
```

## 4.4 学习心得模块

### 获取心得列表
```
GET /api/experience?page=1&pageSize=10&status=approved&userId=101&knowledgeId=1
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `status`: 状态筛选 (pending|approved|rejected)
- `userId`: 用户ID筛选
- `knowledgeId`: 关联知识ID筛选

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "data": [
      {
        "experienceId": 1,
        "userId": 101,
        "username": "student1",
        "avatar": "https://example.com/avatar.jpg",
        "knowledgeId": 1,
        "title": "心脏手术实习心得",
        "content": "在心脏手术实习过程中...",
        "status": "approved",
        "reviewerId": 1,
        "reviewerName": "admin1",
        "reviewTimestamp": "2024-01-01T09:00:00.000Z",
        "reviewComments": "内容详实，通过审核",
        "likeCount": 12,
        "isLiked": false,
        "createdAt": "2023-02-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "current": 1,
      "pageSize": 10,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

**SQL查询示例**:
```sql
SELECT 
  le.*,
  u.username,
  u.avatar,
  a.username as reviewerName,
  CASE WHEN el.user_id IS NOT NULL THEN true ELSE false END as isLiked
FROM learning_experiences le
JOIN users u ON le.user_id = u.user_id
LEFT JOIN admins a ON le.reviewer_id = a.admin_id
LEFT JOIN experience_likes el ON le.experience_id = el.experience_id 
  AND el.user_id = ? AND el.user_type = ?
WHERE (? IS NULL OR le.status = ?)
  AND (? IS NULL OR le.user_id = ?)
  AND (? IS NULL OR le.knowledge_id = ?)
ORDER BY le.created_at DESC
LIMIT ? OFFSET ?
```

### 获取心得详情
```
GET /api/experience/:id
```

### 创建心得
```
POST /api/experience
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "knowledgeId": 1,
  "title": "新的学习心得",
  "content": "详细的学习心得内容..."
}
```

**实现要点**:
1. 验证知识文章是否存在
2. 默认状态为pending
3. 自动填充用户ID

### 更新心得
```
PUT /api/experience/:id
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "content": "更新的心得内容..."
}
```

**权限检查**:
1. 只有心得作者本人可以编辑
2. 只能编辑pending状态的心得

### 删除心得
```
DELETE /api/experience/:id
Authorization: Bearer <token>
```

**权限检查**:
1. 心得作者本人可以删除
2. 管理员可以删除任何心得

### 审核心得
```
PUT /api/experience/:id/review
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "status": "approved",
  "reviewComments": "内容详实，通过审核"
}
```

**实现逻辑**:
```sql
UPDATE learning_experiences 
SET 
  status = ?,
  reviewer_id = ?,
  review_timestamp = NOW(),
  review_comments = ?
WHERE experience_id = ? AND status = 'pending'
```

### 获取我的心得
```
GET /api/experience/my?page=1&pageSize=10&status=all&knowledgeId=1
Authorization: Bearer <token>
```

### 获取特定知识的心得
```
GET /api/experience/knowledge/:knowledgeId?page=1&pageSize=10&status=approved
```

### 心得点赞
```
POST /api/experiences/:id/like
Authorization: Bearer <token>
```

## 4.5 首页统计模块

### 获取首页统计数据
```
GET /api/home/statistics
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "knowledgeCount": {
      "value": "150",
      "trend": 5.2
    },
    "categoryCount": {
      "value": "12",
      "trend": 0
    },
    "experienceCount": {
      "value": "89",
      "trend": 12.5
    },
    "userCount": {
      "value": "234",
      "trend": 8.3
    }
  }
}
```

**实现逻辑**:
```sql
-- 知识总数
SELECT COUNT(*) as knowledge_count FROM medical_knowledge;

-- 分类总数  
SELECT COUNT(*) as category_count FROM medical_categories;

-- 心得总数(已通过)
SELECT COUNT(*) as experience_count FROM learning_experiences WHERE status = 'approved';

-- 用户总数
SELECT COUNT(*) as user_count FROM users WHERE status = 'active';

-- 计算增长趋势(本月相比上月)
SELECT 
  COUNT(*) as current_month,
  (SELECT COUNT(*) FROM medical_knowledge 
   WHERE created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY), INTERVAL 1 MONTH)
   AND created_at < DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY)) as last_month
FROM medical_knowledge 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY);
```

### 获取最新知识列表
```
GET /api/home/knowledge/latest?page=1&pageSize=10&categoryId=1&sortBy=latest
```

**查询参数**:
- `sortBy`: 排序方式 (latest|popular)

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "data": [
      {
        "id": 1,
        "title": "心脏解剖结构详解",
        "summary": "详细介绍心脏的解剖结构和功能",
        "category": "心血管科",
        "categoryId": 1,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "readCount": 150,
        "likeCount": 25,
        "coverImage": "https://example.com/cover1.jpg",
        "adminId": 1,
        "username": "admin1",
        "avatar": "https://example.com/admin-avatar.jpg"
      }
    ],
    "pagination": {
      "total": 100,
      "current": 1,
      "pageSize": 10,
      "totalPages": 10,
      "hasMore": true
    }
  }
}
```

### 获取最新心得列表
```
GET /api/home/experience/latest?page=1&pageSize=10&status=approved&sortBy=latest
```

## 4.6 分类管理模块

### 获取医疗分类列表
```
GET /api/categories
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "categoryId": 1,
      "categoryName": "心血管疾病",
      "description": "关于心脏和血管系统疾病的知识，包括高血压、冠心病、心律失常等",
      "createdAt": "2023-10-01T08:00:00.000Z",
      "updatedAt": "2023-10-01T08:00:00.000Z"
    },
    {
      "categoryId": 2,
      "categoryName": "呼吸系统疾病", 
      "description": "关于肺部和呼吸系统相关疾病的知识，包括哮喘、肺炎、慢阻肺等",
      "createdAt": "2023-10-02T09:15:00.000Z",
      "updatedAt": "2023-10-02T09:15:00.000Z"
    }
  ]
}
```

**SQL查询示例**:
```sql
SELECT 
  category_id as categoryId, 
  category_name as categoryName, 
  description,
  created_at as createdAt,
  updated_at as updatedAt
FROM medical_categories 
ORDER BY sort_order ASC, created_at DESC
```

### 创建医疗分类
```
POST /api/categories
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "categoryName": "内分泌疾病",
  "description": "关于内分泌系统疾病的知识，包括糖尿病、甲状腺疾病、肾上腺疾病等"
}
```

**响应**:
```json
{
  "code": 201,
  "message": "分类创建成功",
  "data": {
    "categoryId": 9,
    "categoryName": "内分泌疾病",
    "description": "关于内分泌系统疾病的知识，包括糖尿病、甲状腺疾病、肾上腺疾病等",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**参数验证**:
```javascript
const createCategorySchema = {
  categoryName: Joi.string().min(2).max(50).required().messages({
    'string.min': '分类名称至少需要2个字符',
    'string.max': '分类名称不能超过50个字符',
    'any.required': '分类名称不能为空'
  }),
  description: Joi.string().max(200).optional().messages({
    'string.max': '分类描述不能超过200个字符'
  })
}
```

**实现要点**:
1. 检查分类名称唯一性
2. 参数验证和清理
3. 自动设置创建时间和更新时间
4. 权限验证（仅管理员可操作）

**SQL实现**:
```sql
-- 检查名称唯一性
SELECT COUNT(*) FROM medical_categories WHERE category_name = ?

-- 插入新分类
INSERT INTO medical_categories (category_name, description, created_at, updated_at)
VALUES (?, ?, NOW(), NOW())
```

### 更新医疗分类
```
PUT /api/categories/:id
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "categoryName": "内分泌系统疾病",
  "description": "关于内分泌系统各种疾病的专业医疗知识"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "分类更新成功",
  "data": {
    "categoryId": 9,
    "categoryName": "内分泌系统疾病",
    "description": "关于内分泌系统各种疾病的专业医疗知识",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:30:00.000Z"
  }
}
```

**参数验证**:
```javascript
const updateCategorySchema = {
  categoryName: Joi.string().min(2).max(50).optional(),
  description: Joi.string().max(200).optional().allow('')
}
```

**实现要点**:
1. 验证分类是否存在
2. 检查新名称的唯一性（排除当前分类）
3. 只更新提供的字段
4. 自动更新修改时间

**SQL实现**:
```sql
-- 检查分类存在性
SELECT * FROM medical_categories WHERE category_id = ?

-- 检查名称唯一性（排除当前分类）
SELECT COUNT(*) FROM medical_categories 
WHERE category_name = ? AND category_id != ?

-- 更新分类
UPDATE medical_categories 
SET 
  category_name = COALESCE(?, category_name),
  description = COALESCE(?, description),
  updated_at = NOW()
WHERE category_id = ?
```

### 删除医疗分类
```
DELETE /api/categories/:id
Authorization: Bearer <admin_token>
```

**响应**:
```json
{
  "code": 200,
  "message": "分类删除成功",
  "data": {
    "success": true
  }
}
```

**错误响应示例**:
```json
{
  "code": 409,
  "message": "该分类下还有5个知识内容，请先移除相关内容后再删除分类",
  "data": {
    "success": false,
    "knowledgeCount": 5
  }
}
```

**实现要点**:
1. 验证分类是否存在
2. 检查分类下是否有关联的知识内容
3. 使用数据库事务确保数据一致性
4. 级联删除相关的关联记录

**SQL实现**:
```sql
-- 检查分类存在性
SELECT * FROM medical_categories WHERE category_id = ?

-- 检查关联的知识数量
SELECT COUNT(*) as knowledge_count
FROM knowledge_categories kc 
JOIN medical_knowledge mk ON kc.knowledge_id = mk.knowledge_id
WHERE kc.category_id = ?

-- 如果没有关联内容，执行删除
BEGIN;
  DELETE FROM knowledge_categories WHERE category_id = ?;
  DELETE FROM medical_categories WHERE category_id = ?;
COMMIT;
```

### 获取分类统计信息
```
GET /api/categories/:id/stats
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "knowledgeCount": 15,
    "experienceCount": 8
  }
}
```

**实现要点**:
1. 统计该分类下的知识数量
2. 统计该分类相关的心得数量
3. 缓存统计结果以提高性能

**SQL实现**:
```sql
-- 统计知识数量
SELECT COUNT(*) as knowledge_count
FROM knowledge_categories kc
JOIN medical_knowledge mk ON kc.knowledge_id = mk.knowledge_id
WHERE kc.category_id = ?

-- 统计心得数量
SELECT COUNT(*) as experience_count
FROM knowledge_categories kc
JOIN medical_knowledge mk ON kc.knowledge_id = mk.knowledge_id
JOIN learning_experiences le ON mk.knowledge_id = le.knowledge_id
WHERE kc.category_id = ? AND le.status = 'approved'
```

### 批量删除分类
```
DELETE /api/categories/batch
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "categoryIds": [5, 6, 7]
}
```

**响应**:
```json
{
  "code": 200,
  "message": "批量删除完成",
  "data": {
    "success": true,
    "deletedCount": 2,
    "failedIds": [6],
    "failedReasons": {
      "6": "该分类下有3个知识内容，无法删除"
    }
  }
}
```

**实现要点**:
1. 批量检查分类是否存在
2. 逐一检查是否有关联内容
3. 记录成功和失败的操作
4. 使用数据库事务保证原子性

### 分类排序更新
```
PUT /api/categories/sort
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "sortData": [
    { "categoryId": 1, "sortOrder": 1 },
    { "categoryId": 2, "sortOrder": 2 },
    { "categoryId": 3, "sortOrder": 3 }
  ]
}
```

**响应**:
```json
{
  "code": 200,
  "message": "排序更新成功",
  "data": {
    "success": true
  }
}
```

**SQL实现**:
```sql
-- 批量更新排序
UPDATE medical_categories 
SET sort_order = CASE category_id
  WHEN ? THEN ?
  WHEN ? THEN ?
  WHEN ? THEN ?
  ELSE sort_order
END,
updated_at = NOW()
WHERE category_id IN (?, ?, ?)
```

### 获取分类详细信息
```
GET /api/categories/:id
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "categoryId": 1,
    "categoryName": "心血管疾病",
    "description": "关于心脏和血管系统疾病的知识",
    "sortOrder": 1,
    "knowledgeCount": 15,
    "experienceCount": 8,
    "createdAt": "2023-10-01T08:00:00.000Z",
    "updatedAt": "2023-10-01T08:00:00.000Z",
    "recentKnowledge": [
      {
        "knowledgeId": 1,
        "title": "高血压的预防与治疗",
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ]
  }
}
```

### 错误处理规范

#### 分类不存在
```json
{
  "code": 404,
  "message": "分类不存在",
  "data": {
    "categoryId": 999
  }
}
```

#### 分类名称重复
```json
{
  "code": 409,
  "message": "分类名称已存在",
  "data": {
    "categoryName": "心血管疾病",
    "existingCategoryId": 1
  }
}
```

#### 权限不足
```json
{
  "code": 403,
  "message": "权限不足，仅管理员可操作",
  "data": null
}
```

#### 参数验证失败
```json
{
  "code": 400,
  "message": "参数验证失败",
  "data": null,
  "errors": [
    {
      "field": "categoryName",
      "message": "分类名称不能为空"
    },
    {
      "field": "description",
      "message": "分类描述不能超过200个字符"
    }
  ]
}
```

### 业务逻辑说明

#### 分类关联检查
- 删除分类前必须检查是否有关联的知识内容
- 如果有关联内容，应该返回具体的数量信息
- 建议提供强制删除的选项（管理员确认后级联删除）

#### 分类命名规范
- 分类名称必须唯一
- 名称长度限制：2-50个字符
- 支持中文、英文、数字和常用标点符号
- 不允许纯空格或特殊字符

#### 缓存策略
```javascript
// Redis缓存Key设计
const CACHE_KEYS = {
  CATEGORY_LIST: 'categories:list',
  CATEGORY_DETAIL: 'categories:detail:',
  CATEGORY_STATS: 'categories:stats:',
  CATEGORY_KNOWLEDGE: 'categories:knowledge:'
}

// 缓存时间设置
const CACHE_TTL = {
  CATEGORY_LIST: 300,     // 5分钟
  CATEGORY_DETAIL: 600,   // 10分钟
  CATEGORY_STATS: 180     // 3分钟
}
```

#### 搜索和过滤支持
```
GET /api/categories?search=心血管&status=active&sortBy=name&order=asc
```

**查询参数**:
- `search`: 搜索关键词（分类名称或描述）
- `status`: 状态筛选（预留字段）
- `sortBy`: 排序字段（name|created_at|knowledge_count）
- `order`: 排序方向（asc|desc）

### 权限控制详细说明

#### 操作权限矩阵
| 操作 | 游客 | 普通用户 | 管理员 | 超级管理员 |
|------|------|----------|--------|------------|
| 查看分类列表 | ✅ | ✅ | ✅ | ✅ |
| 查看分类详情 | ✅ | ✅ | ✅ | ✅ |
| 创建分类 | ❌ | ❌ | ✅ | ✅ |
| 更新分类 | ❌ | ❌ | ✅ | ✅ |
| 删除分类 | ❌ | ❌ | ✅ | ✅ |
| 批量操作 | ❌ | ❌ | ✅ | ✅ |
| 排序调整 | ❌ | ❌ | ✅ | ✅ |

#### 中间件实现示例
```javascript
// 分类管理权限中间件
const requireCategoryPermission = (action) => {
  return [
    authenticateToken,
    requireRole(['admin']),
    async (req, res, next) => {
      // 记录操作日志
      console.log(`User ${req.user.userId} attempting ${action} on category`)
      next()
    }
  ]
}

// 路由配置
app.get('/api/categories', getCategories)
app.post('/api/categories', requireCategoryPermission('create'), createCategory)
app.put('/api/categories/:id', requireCategoryPermission('update'), updateCategory)
app.delete('/api/categories/:id', requireCategoryPermission('delete'), deleteCategory)
```

---

## 5. 开发实施建议

### 5.1 技术栈推荐
- **Node.js + Express** 或 **Koa**
- **MySQL** 数据库
- **Redis** 缓存
- **JWT** 认证
- **bcrypt** 密码加密
- **joi** 参数验证

### 5.2 项目结构建议
```
project/
├── src/
│   ├── controllers/     # 控制器
│   ├── models/          # 数据模型
│   ├── middlewares/     # 中间件
│   ├── services/        # 业务逻辑
│   ├── routes/          # 路由配置
│   ├── utils/           # 工具函数
│   └── config/          # 配置文件
├── tests/               # 测试文件
└── docs/                # 文档
```

### 5.3 环境配置示例
```javascript
// config/database.js
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'medical_platform',
    dialect: 'mysql',
    timezone: '+08:00'
  }
};

// config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '24h'
};
```

### 5.4 部署注意事项
1. 数据库连接池配置
2. Redis连接配置
3. 日志记录和监控
4. API限流和防护
5. 文件上传安全性
6. CORS配置
7. HTTPS配置

---

**文档版本**: v3.0.0  
**最后更新**: 2024-01-01  
**维护者**: 后端开发团队 