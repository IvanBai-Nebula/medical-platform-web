 # 医疗学习平台 API 详细文档

## 文档说明

本文档基于前端 `src/types` 和 `src/services` 目录下的类型定义和API服务实现，为后端开发者提供准确的接口规范。

## 目录
- [1. 认证模块 (Authentication)](#1-认证模块-authentication)
- [2. 用户管理模块 (User Management)](#2-用户管理模块-user-management)
- [3. 医疗知识模块 (Knowledge)](#3-医疗知识模块-knowledge)
- [4. 学习心得模块 (Experience)](#4-学习心得模块-experience)
- [5. 首页统计模块 (Home Statistics)](#5-首页统计模块-home-statistics)
- [6. 分类管理模块 (Categories)](#6-分类管理模块-categories)
- [7. 通用响应格式](#7-通用响应格式)

---

## 1. 认证模块 (Authentication)

### 1.1 用户登录

**端点**: `POST /api/auth/login`

**请求参数** (`UserLoginParams`):
```typescript
{
  username: string  // 用户名
  password: string  // 密码
}
```

**响应数据** (`UserLoginResponseData`):
```typescript
{
  token: string           // JWT认证令牌
  user: Admin | User      // 用户信息（管理员或普通用户）
  role: UserRole          // 用户角色 ('admin' | 'user')
}
```

**用户类型定义**:
```typescript
interface Admin {
  adminId: number
  username: string
  email?: string
  avatar?: string
  isSuperAdmin?: boolean
}

interface User {
  userId: number
  username: string
  email?: string
  avatar?: string
}
```

**示例**:
```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "password": "admin123"
  }'
```

### 1.2 用户注册

**端点**: `POST /api/auth/register`

**请求参数** (`UserRegisterParams`):
```typescript
{
  username: string  // 用户名
  password: string  // 密码
}
```

**响应**: 成功消息

### 1.3 获取当前用户信息

**端点**: `GET /api/auth/profile`
**认证**: 需要Bearer Token

**响应数据**: `Admin | User`

### 1.4 检查超级管理员权限

**端点**: `GET /api/users/is-super-admin`
**认证**: 需要Bearer Token

**响应数据**:
```typescript
{
  isSuperAdmin: boolean
}
```

---

## 2. 用户管理模块 (User Management)

### 2.1 获取用户列表

**端点**: `GET /api/users`
**认证**: 需要管理员权限

**查询参数** (`UserListParams`):
```typescript
{
  page?: number         // 页码，默认1
  limit?: number        // 每页数量，默认10  
  search?: string       // 搜索关键词
  role?: 'admin' | 'user' | 'all'  // 角色筛选
  status?: UserStatus   // 状态筛选
}
```

**用户状态枚举**:
```typescript
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  BANNED = 'banned'
}
```

**响应数据** (`UserListResponse`):
```typescript
{
  users: (AdminWithStatus | UserWithStatus)[]
  total: number
  page: number
  limit: number
}
```

**扩展用户类型**:
```typescript
interface UserWithStatus extends User {
  status: UserStatus
  createdAt: string
  updatedAt: string
}

interface AdminWithStatus extends Admin {
  status: UserStatus  
  createdAt: string
  updatedAt: string
}
```

### 2.2 获取单个用户信息

**端点**: `GET /api/users/:id`
**认证**: 需要Bearer Token

**响应数据**: `Admin | User | null`

### 2.3 创建用户

**端点**: `POST /api/users`
**认证**: 需要管理员权限

**请求参数** (`CreateUserParams`):
```typescript
{
  username: string
  password: string
  email?: string
  avatar?: string
}
```

**响应数据**: `User`

### 2.4 更新用户信息

**端点**: `PUT /api/users/:id`
**认证**: 需要Bearer Token（本人或管理员）

**请求参数** (`UpdateUserParams`):
```typescript
{
  username?: string
  email?: string
  avatar?: string
}
```

**响应数据**: `Admin | User | null`

### 2.5 更新用户密码

**端点**: `PUT /api/users/:id/password`
**认证**: 需要Bearer Token（本人或管理员）

**请求参数**:
```typescript
{
  oldPassword: string
  newPassword: string
}
```

**响应数据**: `boolean`

### 2.6 更新用户状态

**端点**: `PUT /api/users/:id/status`
**认证**: 需要管理员权限

**请求参数**:
```typescript
{
  status: UserStatus
}
```

**响应数据**: `boolean`

### 2.7 删除用户

**端点**: `DELETE /api/users/:id`
**认证**: 需要管理员权限

**响应数据**: `boolean`

### 2.8 创建管理员

**端点**: `POST /api/users/admin`
**认证**: 需要超级管理员权限

**请求参数** (`CreateAdminParams`):
```typescript
{
  username: string
  password: string
  email?: string
  isSuperAdmin?: boolean
}
```

**响应数据**: `AdminWithStatus`

---

## 3. 医疗知识模块 (Knowledge)

### 3.1 获取知识列表

**端点**: `GET /api/knowledge`

**查询参数**:
```typescript
{
  page?: number         // 页码
  pageSize?: number     // 每页数量
  categoryId?: number   // 分类ID筛选
  keyword?: string      // 搜索关键词
}
```

**响应数据** (`KnowledgeListResponse`):
```typescript
{
  data: KnowledgeItem[]
  pagination: PaginationData
}
```

**知识条目类型** (`KnowledgeItem`):
```typescript
{
  knowledgeId: number
  title: string
  introduction: string        // 知识简介/摘要
  coverImage?: string        // 封面图片URL
  content: string            // 富文本内容
  videoUrl?: string          // 视频文件URL
  categories?: MedicalCategory[]  // 关联的医疗类别
  createdBy: number          // 创建人ID
  createdAt: string
  updatedAt: string
  viewCount: number          // 浏览次数
  likeCount: number          // 点赞数
  isLiked?: boolean          // 当前用户是否已点赞
}
```

**分页数据类型** (`PaginationData`):
```typescript
{
  total: number
  current: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}
```

### 3.2 获取知识详情

**端点**: `GET /api/knowledge/:id`

**响应数据** (`KnowledgeDetailResponse`):
```typescript
{
  data: KnowledgeItem
}
```

### 3.3 创建知识

**端点**: `POST /api/knowledge`
**认证**: 需要管理员权限

**请求参数** (`CreateKnowledgeParams`):
```typescript
{
  title: string
  introduction: string
  content: string
  coverImage?: string
  videoUrl?: string
  categoryIds: number[]      // 关联的类别ID数组
}
```

**响应数据**: `KnowledgeDetailResponse`

### 3.4 更新知识

**端点**: `PUT /api/knowledge/:id`
**认证**: 需要管理员权限

**请求参数** (`UpdateKnowledgeParams`):
```typescript
{
  title?: string
  introduction?: string
  content?: string
  coverImage?: string
  videoUrl?: string
  categoryIds?: number[]
}
```

**响应数据**: `KnowledgeDetailResponse`

### 3.5 删除知识

**端点**: `DELETE /api/knowledge/:id`
**认证**: 需要管理员权限

**响应数据**:
```typescript
{
  success: boolean
}
```

### 3.6 知识点赞

**端点**: `POST /api/knowledge/:id/like`
**认证**: 需要Bearer Token

**响应数据** (`LikeResponse`):
```typescript
{
  success: boolean
  isLiked: boolean         // 当前点赞状态
  likeCount: number        // 最新点赞数
}
```

### 3.7 增加浏览量

**端点**: `POST /api/knowledge/:id/view`

**响应数据**:
```typescript
{
  success: boolean
  viewCount: number        // 最新浏览量
}
```

### 3.8 获取知识相关心得

**端点**: `GET /api/knowledge/:id/experiences`

**查询参数**:
```typescript
{
  page?: number
  pageSize?: number
}
```

**响应数据**: `ExperienceListResponse`

---

## 4. 学习心得模块 (Experience)

### 4.1 获取心得列表

**端点**: `GET /api/experience`

**查询参数**:
```typescript
{
  page?: number
  pageSize?: number
  status?: ExperienceStatus    // 状态筛选
  userId?: number              // 用户ID筛选
  knowledgeId?: number         // 关联知识ID筛选
}
```

**心得状态枚举**:
```typescript
enum ExperienceStatus {
  PENDING = 'pending',    // 待审核
  APPROVED = 'approved',  // 通过
  REJECTED = 'rejected'   // 驳回
}
```

**响应数据** (`ExperienceListResponse`):
```typescript
{
  data: ExperienceItem[]
  pagination: PaginationData
}
```

**心得条目类型** (`ExperienceItem`):
```typescript
{
  experienceId: number
  userId: number
  username?: string           // 用户名
  avatar?: string            // 用户头像
  knowledgeId: number        // 关联的知识文章ID
  title: string
  content: string
  likeCount: number          // 点赞数
  isLiked?: boolean          // 当前用户是否已点赞
  status: StatusType         // 审核状态
  reviewerId?: number        // 审核人员ID
  reviewerName?: string      // 审核人员姓名
  reviewTimestamp?: string   // 审核时间
  reviewComments?: string    // 审核意见
  createdAt: string
  updatedAt: string
}
```

### 4.2 获取心得详情

**端点**: `GET /api/experience/:id`

**响应数据** (`ExperienceDetailResponse`):
```typescript
{
  data: ExperienceItem
}
```

### 4.3 创建心得

**端点**: `POST /api/experience`
**认证**: 需要Bearer Token

**请求参数** (`CreateExperienceParams`):
```typescript
{
  knowledgeId: number      // 关联的知识文章ID
  title: string
  content: string
}
```

**响应数据**: `ExperienceDetailResponse`

### 4.4 更新心得

**端点**: `PUT /api/experience/:id`
**认证**: 需要Bearer Token（作者本人）

**请求参数** (`UpdateExperienceParams`):
```typescript
{
  content: string          // 注意：只能更新内容，不能更新标题
}
```

**响应数据**: `ExperienceDetailResponse`

### 4.5 删除心得

**端点**: `DELETE /api/experience/:id`
**认证**: 需要Bearer Token（作者本人或管理员）

**响应数据**:
```typescript
{
  success: boolean
}
```

### 4.6 审核心得

**端点**: `PUT /api/experience/:id/review`
**认证**: 需要管理员权限

**请求参数** (`ReviewExperienceParams`):
```typescript
{
  status: StatusType        // 审核结果
  reviewComments?: string   // 审核意见
}
```

**响应数据**: `ExperienceDetailResponse`

### 4.7 获取我的心得

**端点**: `GET /api/experience/my`
**认证**: 需要Bearer Token

**查询参数**:
```typescript
{
  page?: number
  pageSize?: number
  status?: ExperienceStatus
  knowledgeId?: number
}
```

**响应数据**: `ExperienceListResponse`

### 4.8 获取特定知识的心得

**端点**: `GET /api/experience/knowledge/:knowledgeId`

**查询参数**:
```typescript
{
  page?: number
  pageSize?: number
  status?: ExperienceStatus
}
```

**响应数据**: `ExperienceListResponse`

### 4.9 心得点赞

**端点**: `POST /api/experiences/:id/like`
**认证**: 需要Bearer Token

**响应数据**: `LikeResponse`

---

## 5. 首页统计模块 (Home Statistics)

### 5.1 获取首页统计数据

**端点**: `GET /api/home/statistics`

**响应数据** (`HomeStatisticsResponse`):
```typescript
{
  data: {
    knowledgeCount: PlatformStatItem    // 知识数量统计
    categoryCount: PlatformStatItem     // 分类数量统计
    experienceCount: PlatformStatItem   // 心得数量统计
    userCount: PlatformStatItem         // 用户数量统计
  }
}
```

**统计数据项类型** (`PlatformStatItem`):
```typescript
{
  value: string        // 统计数值
  trend?: number       // 增长趋势百分比
}
```

### 5.2 获取最新知识列表

**端点**: `GET /api/home/knowledge/latest`

**查询参数** (`LatestKnowledgeParams`):
```typescript
{
  page?: number
  pageSize?: number
  categoryId?: number    // 分类筛选
  sortBy?: SortType      // 排序方式
}
```

**排序类型**:
```typescript
type SortType = 'latest' | 'popular' | 'trending' | 'asc' | 'desc'
```

**响应数据** (`HomeKnowledgeListResponse`):
```typescript
{
  data: LatestKnowledgeItem[]
  pagination: PaginationData
}
```

**最新知识条目类型** (`LatestKnowledgeItem`):
```typescript
{
  id: number
  title: string
  summary: string          // 知识摘要
  category: string         // 分类名称
  categoryId: number       // 分类ID
  createdAt: string
  readCount: number        // 阅读次数
  likeCount: number        // 点赞数
  coverImage?: string      // 封面图片
  adminId?: number         // 管理员ID
  username?: string        // 管理员用户名
  avatar?: string          // 管理员头像
}
```

### 5.3 获取最新心得列表

**端点**: `GET /api/home/experience/latest`

**查询参数** (`LatestExperienceParams`):
```typescript
{
  page?: number
  pageSize?: number
  status?: StatusType | 'all'  // 状态筛选
  sortBy?: SortType            // 排序方式
}
```

**响应数据** (`HomeExperienceListResponse`):
```typescript
{
  data: LatestExperienceItem[]
  pagination: PaginationData
}
```

**最新心得条目类型** (`LatestExperienceItem`):
```typescript
{
  id: number
  title: string
  content: string
  createdAt: string
  status: StatusType         // 审核状态
  likeCount: number          // 点赞数
  knowledgeId?: number       // 关联知识ID
  knowledgeTitle?: string    // 关联知识标题
  userId: number             // 用户ID
  username?: string          // 用户名
  avatar?: string            // 用户头像
}
```

---

## 6. 分类管理模块 (Categories)

### 6.1 获取医疗分类列表

**端点**: `GET /api/categories`

**响应数据** (`CategoryListResponse`):
```typescript
{
  data: MedicalCategory[]
}
```

**医疗分类类型** (`MedicalCategory`):
```typescript
{
  categoryId: number
  categoryName: string      // 分类名称
  description?: string      // 分类描述
}
```

---

## 7. 通用响应格式

### 7.1 API响应格式

所有API响应都遵循统一格式 (`ApiResponse`):
```typescript
{
  code: number         // 响应状态码
  message: string      // 响应消息
  data: T              // 响应数据（泛型）
}
```

### 7.2 分页响应格式

分页相关的API使用 (`PaginatedResponse`):
```typescript
{
  data: T[]                    // 数据数组
  pagination: PaginationData   // 分页信息
}
```

### 7.3 错误响应格式

错误情况下的响应格式:
```typescript
{
  code: number         // 错误状态码
  message: string      // 错误消息
  data: null           // 数据为空
}
```

### 7.4 HTTP状态码

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 8. 数据库映射关系

基于 `src/types/database.d.ts` 的表结构定义：

### 8.1 用户相关表

- **AdminTable** → Admin 类型
- **UserTable** → User 类型

### 8.2 知识相关表

- **MedicalCategoryTable** → MedicalCategory 类型
- **MedicalKnowledgeTable** → KnowledgeItem 类型
- **KnowledgeCategoryRelationTable** → 多对多关系表

### 8.3 心得相关表

- **LearningFeedbackTable** → ExperienceItem 类型

### 8.4 状态枚举映射

- **FeedbackStatus** → ExperienceStatus 枚举

---

## 9. 开发注意事项

1. **认证机制**: 使用JWT Bearer Token认证
2. **权限控制**: 区分普通用户、管理员、超级管理员权限
3. **数据验证**: 严格按照TypeScript类型定义进行数据验证
4. **错误处理**: 统一错误响应格式，提供清晰的错误信息
5. **分页处理**: 使用统一的分页参数和响应格式
6. **状态管理**: 心得审核状态的流转控制
7. **关联查询**: 知识与心得、用户与角色的关联关系处理

---

**文档版本**: v2.0.0  
**基于前端代码版本**: 当前最新版本  
**最后更新**: 2024-01-01  
**维护者**: 开发团队