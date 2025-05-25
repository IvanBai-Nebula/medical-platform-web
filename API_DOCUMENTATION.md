# 医疗学习平台 API 文档

## 目录
- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [数据库设计](#数据库设计)
- [认证系统](#认证系统)
- [API接口规范](#api接口规范)
- [错误处理](#错误处理)
- [数据字典](#数据字典)

## 项目概述

医疗学习平台是一个面向医疗从业者和学生的知识分享与学习交流平台。平台支持医疗知识管理、学习心得分享、用户管理等核心功能。

### 主要功能模块
- 用户认证与权限管理 (admin/user 角色)
- 医疗知识库管理
- 学习心得分享与审核
- 首页统计数据展示
- 分类管理

## 技术栈

### 前端技术栈
- Vue 3 + TypeScript
- Vite 构建工具
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理

### 后端技术栈（推荐）
- Node.js + Express / Koa
- TypeScript
- MySQL / PostgreSQL
- Redis（缓存）
- JWT 认证
- bcrypt 密码加密

## 数据库设计

### 1. 用户表 (users)
```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  avatar VARCHAR(500),
  status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
);
```

### 2. 管理员表 (admins)
```sql
CREATE TABLE admins (
  admin_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  avatar VARCHAR(500),
  is_super_admin BOOLEAN DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_is_super_admin (is_super_admin)
);
```

### 3. 医疗知识表 (knowledge)
```sql
CREATE TABLE knowledge (
  knowledge_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR(500),
  category_id INT,
  author_id INT,
  author_type ENUM('USER', 'ADMIN') NOT NULL,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category_id (category_id),
  INDEX idx_author (author_id, author_type),
  INDEX idx_created_at (created_at),
  FULLTEXT idx_search (title, content, summary)
);
```

### 4. 学习心得表 (experiences)
```sql
CREATE TABLE experiences (
  experience_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  knowledge_id INT,
  user_id INT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_knowledge_id (knowledge_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(knowledge_id) ON DELETE SET NULL
);
```

### 5. 医疗分类表 (categories)
```sql
CREATE TABLE categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_sort_order (sort_order)
);
```

## 认证系统

### JWT Token 结构
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": 123,
    "userType": "USER", // USER | ADMIN
    "username": "student1",
    "isSuperAdmin": false, // 仅管理员有此字段
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

### 权限级别
- **普通用户 (user)**: 可查看知识、创建心得、管理个人资料
- **管理员 (admin)**: 可管理所有内容和用户
- **超级管理员**: 拥有所有权限，包括管理其他管理员

## API接口规范

### 基础配置
- **Base URL**: `https://api.medical-platform.com`
- **Content-Type**: `application/json`
- **认证方式**: JWT Bearer Token

### 响应格式
```typescript
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: string[]
  timestamp: string
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

## 1. 认证相关 API

### 1.1 用户登录
```
POST /api/auth/login
```

**请求体:**
```json
{
  "username": "student1",
  "password": "user123"
}
```

**响应:**
```json
{
  "success": true,
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
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 1.2 用户注册
```
POST /api/auth/register
```

**请求体:**
```json
{
  "username": "newuser",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "message": "注册成功",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 1.3 获取当前用户信息
```
GET /api/auth/profile
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "userId": 101,
    "username": "student1",
    "email": "student1@example.com",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

## 2. 用户管理 API

### 2.1 获取用户列表
```
GET /api/users?page=1&limit=10&role=all&status=active&search=student
Authorization: Bearer <admin_token>
```

**查询参数:**
- `page` (number): 页码，默认 1
- `limit` (number): 每页数量，默认 10
- `role` (string): 角色筛选 (admin|user|all)
- `status` (string): 状态筛选 (active|inactive|banned)
- `search` (string): 搜索关键词

**响应:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": 101,
        "username": "student1",
        "email": "student1@example.com",
        "avatar": "https://example.com/avatar.jpg",
        "status": "active",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

### 2.2 获取单个用户信息
```
GET /api/users/:id
Authorization: Bearer <token>
```

### 2.3 创建用户
```
POST /api/users
Authorization: Bearer <admin_token>
```

**请求体:**
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "newuser@example.com",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 2.4 更新用户信息
```
PUT /api/users/:id
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

### 2.5 更新用户密码
```
PUT /api/users/:id/password
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

### 2.6 更新用户状态
```
PUT /api/users/:id/status
Authorization: Bearer <admin_token>
```

**请求体:**
```json
{
  "status": "banned"
}
```

### 2.7 删除用户
```
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

### 2.8 创建管理员
```
POST /api/users/admin
Authorization: Bearer <super_admin_token>
```

**请求体:**
```json
{
  "username": "newadmin",
  "password": "admin123",
  "email": "newadmin@example.com",
  "isSuperAdmin": false
}
```

### 2.9 检查是否为超级管理员
```
GET /api/users/is-super-admin
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "isSuperAdmin": true
  }
}
```

## 3. 医疗知识 API

### 3.1 获取知识列表
```
GET /api/knowledge?page=1&pageSize=10&categoryId=1&keyword=heart
```

**查询参数:**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `categoryId` (number): 分类ID
- `keyword` (string): 搜索关键词

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "knowledgeId": 1,
        "title": "心脏解剖结构详解",
        "summary": "详细介绍心脏的解剖结构和功能",
        "categoryId": 1,
        "author": {
          "id": 1,
          "username": "admin1",
          "type": "ADMIN"
        },
        "viewCount": 150,
        "likeCount": 25,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 3.2 获取知识详情
```
GET /api/knowledge/:id
```

**响应:**
```json
{
  "success": true,
  "data": {
    "knowledgeId": 1,
    "title": "心脏解剖结构详解",
    "content": "心脏是人体循环系统的核心器官...",
    "summary": "详细介绍心脏的解剖结构和功能",
    "categoryId": 1,
    "author": {
      "id": 1,
      "username": "admin1",
      "type": "ADMIN",
      "avatar": "https://example.com/avatar.jpg"
    },
    "viewCount": 151,
    "likeCount": 25,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.3 创建知识
```
POST /api/knowledge
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "title": "新的医疗知识",
  "content": "详细的医疗知识内容...",
  "summary": "知识摘要",
  "categoryId": 1
}
```

### 3.4 更新知识
```
PUT /api/knowledge/:id
Authorization: Bearer <token>
```

### 3.5 删除知识
```
DELETE /api/knowledge/:id
Authorization: Bearer <token>
```

### 3.6 知识点赞
```
POST /api/knowledge/:id/like
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 26
  }
}
```

### 3.7 增加浏览量
```
POST /api/knowledge/:id/view
```

**响应:**
```json
{
  "success": true,
  "data": {
    "viewCount": 152
  }
}
```

### 3.8 获取知识相关心得
```
GET /api/knowledge/:id/experiences?page=1&pageSize=10
```

## 4. 学习心得 API

### 4.1 获取心得列表
```
GET /api/experience?page=1&pageSize=10&status=approved&userId=101&knowledgeId=1
```

**查询参数:**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `status` (string): 状态筛选 (pending|approved|rejected)
- `userId` (number): 用户ID筛选
- `knowledgeId` (number): 关联知识ID筛选

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "experienceId": 1,
        "title": "心脏手术实习心得",
        "content": "在心脏手术实习过程中...",
        "knowledgeId": 1,
        "user": {
          "userId": 101,
          "username": "student1"
        },
        "status": "approved",
        "viewCount": 89,
        "likeCount": 12,
        "createdAt": "2023-02-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4.2 获取心得详情
```
GET /api/experience/:id
```

### 4.3 创建心得
```
POST /api/experience
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "title": "新的学习心得",
  "content": "详细的学习心得内容...",
  "knowledgeId": 1
}
```

### 4.4 更新心得
```
PUT /api/experience/:id
Authorization: Bearer <token>
```

### 4.5 删除心得
```
DELETE /api/experience/:id
Authorization: Bearer <token>
```

### 4.6 审核心得 (管理员)
```
PUT /api/experience/:id/review
Authorization: Bearer <admin_token>
```

**请求体:**
```json
{
  "status": "approved",
  "reviewComment": "审核通过"
}
```

### 4.7 获取我的心得
```
GET /api/experience/my?page=1&pageSize=10&status=all&knowledgeId=1
Authorization: Bearer <token>
```

### 4.8 心得点赞
```
POST /api/experience/:id/like
Authorization: Bearer <token>
```

## 5. 分类管理 API

### 5.1 获取医疗分类列表
```
GET /api/categories
```

**响应:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "categoryId": 1,
        "name": "心血管科",
        "description": "心血管疾病相关知识",
        "parentId": null,
        "sortOrder": 1
      },
      {
        "categoryId": 2,
        "name": "神经科",
        "description": "神经系统疾病相关知识",
        "parentId": null,
        "sortOrder": 2
      }
    ]
  }
}
```

## 6. 首页统计 API

### 6.1 获取首页统计数据
```
GET /api/home/statistics
```

**响应:**
```json
{
  "success": true,
  "data": {
    "totalKnowledge": 150,
    "totalExperiences": 89,
    "totalUsers": 234,
    "totalViews": 5678,
    "recentActivities": [
      {
        "id": 1,
        "type": "knowledge_created",
        "title": "新知识：心脏疾病诊断",
        "user": "admin1",
        "timestamp": "2024-01-01T10:30:00Z"
      }
    ]
  }
}
```

### 6.2 获取最新知识列表
```
GET /api/home/knowledge/latest?page=1&pageSize=10&categoryId=1&sortBy=latest
```

**查询参数:**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `categoryId` (number): 分类筛选
- `sortBy` (string): 排序方式 (latest|popular)

### 6.3 获取最新心得列表
```
GET /api/home/experience/latest?page=1&pageSize=10&status=approved&sortBy=latest
```

**查询参数:**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `status` (string): 状态筛选 (approved|all)
- `sortBy` (string): 排序方式 (latest|popular)

## 错误处理

### HTTP 状态码
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `422` - 数据验证失败
- `500` - 服务器内部错误

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "errors": [
    {
      "field": "username",
      "message": "用户名已存在"
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 数据字典

### 用户状态 (UserStatus)
- `active` - 活跃
- `inactive` - 未激活
- `banned` - 已封禁

### 心得状态 (ExperienceStatus)
- `pending` - 待审核
- `approved` - 已通过
- `rejected` - 已拒绝

### 用户角色 (UserRole)
- `user` - 普通用户
- `admin` - 管理员

### 作者类型 (AuthorType)
- `USER` - 普通用户
- `ADMIN` - 管理员

### 排序方式 (SortBy)
- `latest` - 最新
- `popular` - 热门

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-01  
**维护者**: 开发团队 