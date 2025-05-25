import type { ApiResponse } from '@/utils/requests'

// 用户角色类型
export type UserRole = 'admin' | 'user'

// 用户相关类型
export interface Admin {
  // 管理员信息
  adminId: number
  username: string
  email?: string
  avatar?: string
  isSuperAdmin?: boolean
}

export interface User {
  // 普通用户信息
  userId: number
  username: string
  email?: string
  avatar?: string
}

// 登录接口参数和响应
export interface UserLoginParams {
  username: string // 用户名
  password: string // 密码
}

// 注册接口参数
export interface UserRegisterParams {
  username: string
  password: string // 密码
}

// 创建管理员接口参数
export interface CreateAdminParams {
  username: string
  password: string
  email?: string
  isSuperAdmin?: boolean
}

// 创建普通用户接口参数
export interface CreateUserParams {
  username: string
  password: string
  email?: string
}

// 更新用户信息接口参数
export interface UpdateUserParams {
  username?: string
  email?: string
  avatar?: string
}

// 更新管理员信息接口参数
export interface UpdateAdminParams {
  username?: string
  email?: string
  avatar?: string
  isSuperAdmin?: boolean
}

// 用户状态
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

// 扩展的用户接口（包含状态和时间戳）
export interface UserWithStatus extends User {
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// 扩展的管理员接口（包含状态和时间戳）
export interface AdminWithStatus extends Admin {
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// 用户列表查询参数
export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: 'admin' | 'user' | 'all'
  status?: UserStatus
}

// 用户列表响应
export interface UserListResponse {
  users: (AdminWithStatus | UserWithStatus)[]
  total: number
  page: number
  limit: number
}

// 用户登录响应类型更新，匹配实际的后端API格式
export interface UserProfileDetail extends Admin, User {
  // 扩充用户详情
  role?: UserRole
  status?: UserStatus
  createdAt?: string
  updatedAt?: string
  isSuperAdmin?: boolean
}

/** 用户登录响应数据 - 适配双层嵌套结构 */
export interface UserLoginResponseData {
  code: number
  message: string
  data: {
    token: string
    user: UserProfileDetail
  }
  timestamp?: string
}

/** 获取用户信息响应数据 */
export type UserProfileResponse = Admin | User

export type UserLoginResponse = ApiResponse<UserLoginResponseData> // 登录响应

// 注册接口响应
export type UserRegisterResponse = ApiResponse<{ message: string }>
