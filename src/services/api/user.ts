/**
 * 用户服务模块
 * 提供所有用户相关的API请求
 */

import type {
  Admin,
  AdminWithStatus,
  CreateAdminParams,
  CreateUserParams,
  UpdateAdminParams,
  UpdateUserParams,
  User,
  UserListParams,
  UserListResponse,
  UserLoginParams,
  UserLoginResponseData,
  UserRegisterParams,
  UserWithStatus,
} from '../type/user'

import type { UserStatus } from '../type/user.d'

import { httpDelete, httpGet, httpPost, httpPut, withRetry } from '@/utils/requests'

// 开发模式 Mock API 导入
import {
  mockCreateAdminApi,
  mockCreateUserApi,
  mockDeleteUserApi,
  mockGetUserByIdApi,
  mockGetUserInfoApi,
  mockGetUsersApi,
  mockIsSuperAdminApi,
  mockLoginApi,
  mockUpdateAdminApi,
  mockUpdateUserApi,
  mockUpdateUserStatusApi,
} from '../mock/user.mock'

// ====== 配置 ======

// API路径配置
const API_CONFIG = {
  base: '/api/users',
  admin: '/api/users/admin',
  login: '/api/auth/login',
  register: '/api/auth/register',
  profile: '/api/auth/profile',
}

// 是否使用Mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

// 通用错误消息
const ERROR_MESSAGES = {
  login: '登录失败，请检查用户名和密码',
  register: '注册失败，该用户名可能已被使用',
  fetch: '无法获取用户数据',
  update: '更新用户数据失败',
  delete: '删除用户失败',
  createAdmin: '创建管理员失败',
}

// 管理员创建格式要求
export const ADMIN_FORMAT_REQUIREMENTS = {
  username: '3-50个字符，只能包含字母、数字、下划线和中文',
  password: '6-30个字符，必须包含大写字母、小写字母和数字',
  email: '可选，必须是有效的邮箱格式，最多100个字符',
  isSuperAdmin: '可选，布尔值，表示是否是超级管理员',
}

// ====== 核心API函数 ======

/**
 * 用户登录
 * @param credentials 登录凭证
 */
export async function login(credentials: UserLoginParams): Promise<UserLoginResponseData> {
  try {
    if (USE_MOCK_API) {
      return await mockLoginApi(credentials)
    }

    // 登录接口使用重试机制
    return await withRetry(() => httpPost<UserLoginResponseData>(API_CONFIG.login, credentials), {
      retries: 2,
      retryDelay: 1000,
    })
  }
  catch (error) {
    console.error('[用户服务] 登录失败:', error)
    throw new Error(ERROR_MESSAGES.login)
  }
}

/**
 * 用户注册
 * @param userData 注册信息
 */
export async function register(userData: UserRegisterParams): Promise<void> {
  try {
    if (USE_MOCK_API) {
      return await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (userData.username === 'admin' || userData.username === 'testuser') {
            reject(new Error('用户名已存在'))
          }
          else {
            resolve()
          }
        }, 800)
      })
    }

    await httpPost<void>(API_CONFIG.register, userData)
  }
  catch (error) {
    console.error('[用户服务] 注册失败:', error)
    throw new Error(ERROR_MESSAGES.register)
  }
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser(): Promise<Admin | User> {
  try {
    if (USE_MOCK_API) {
      return await mockGetUserInfoApi()
    }

    return await httpGet<Admin | User>(API_CONFIG.profile)
  }
  catch (error) {
    console.error('[用户服务] 获取用户信息失败:', error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

/**
 * 获取用户列表
 * @param params 查询参数 (分页、筛选等)
 */
export async function getUsers(params?: UserListParams): Promise<UserListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetUsersApi(params)
    }

    return await httpGet<UserListResponse>(API_CONFIG.base, params)
  }
  catch (error) {
    console.error('[用户服务] 获取用户列表失败:', error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

/**
 * 根据ID获取用户
 * @param userId 用户ID
 */
export async function getUserById(userId: number): Promise<Admin | User | null> {
  try {
    if (USE_MOCK_API) {
      return await mockGetUserByIdApi(userId)
    }

    return await httpGet<Admin | User | null>(`${API_CONFIG.base}/${userId}`)
  }
  catch (error) {
    console.error(`[用户服务] 获取用户 ${userId} 失败:`, error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

/**
 * 创建新用户 (仅管理员可操作)
 * @param userData 用户信息
 */
export async function createUser(
  userData: Omit<User, 'userId' | 'avatar'> & { avatar?: string },
): Promise<User> {
  try {
    if (USE_MOCK_API) {
      return await mockCreateUserApi(userData)
    }

    return await httpPost<User>(API_CONFIG.base, userData)
  }
  catch (error) {
    console.error('[用户服务] 创建用户失败:', error)
    throw new Error(ERROR_MESSAGES.update)
  }
}

/**
 * 更新用户信息
 * @param userId 用户ID
 * @param userData 要更新的用户数据
 */
export async function updateUser(
  userId: number,
  userData: UpdateUserParams,
): Promise<User | null> {
  try {
    if (USE_MOCK_API) {
      return await mockUpdateUserApi(userId, userData)
    }

    // 使用新的用户更新API路径
    return await httpPut<User | null>(`${API_CONFIG.base}/${userId}`, userData)
  }
  catch (error) {
    console.error(`[用户服务] 更新用户 ${userId} 失败:`, error)
    throw new Error(ERROR_MESSAGES.update)
  }
}

/**
 * 更新管理员信息
 * @param adminId 管理员ID
 * @param adminData 要更新的管理员数据
 */
export async function updateAdmin(
  adminId: number,
  adminData: UpdateAdminParams,
): Promise<Admin | null> {
  try {
    if (USE_MOCK_API) {
      return await mockUpdateAdminApi(adminId, adminData)
    }

    // 使用新的管理员更新API路径
    return await httpPut<Admin | null>(`${API_CONFIG.admin}/${adminId}`, adminData)
  }
  catch (error) {
    console.error(`[用户服务] 更新管理员 ${adminId} 失败:`, error)
    throw new Error(ERROR_MESSAGES.update)
  }
}

/**
 * 删除用户 (仅管理员可操作)
 * @param userId 用户ID
 */
export async function deleteUser(userId: number): Promise<boolean> {
  try {
    if (USE_MOCK_API) {
      return await mockDeleteUserApi(userId)
    }

    return await httpDelete<boolean>(`${API_CONFIG.base}/${userId}`)
  }
  catch (error) {
    console.error(`[用户服务] 删除用户 ${userId} 失败:`, error)
    throw new Error(ERROR_MESSAGES.delete)
  }
}

/**
 * 更新用户密码
 * @param userId 用户ID
 * @param data 密码信息
 */
export async function updatePassword(
  userId: number,
  data: {
    oldPassword: string
    newPassword: string
  },
): Promise<boolean> {
  try {
    if (USE_MOCK_API) {
      return await new Promise((resolve) => {
        setTimeout(() => resolve(true), 500)
      })
    }

    return await httpPut<boolean>(`${API_CONFIG.base}/${userId}/password`, data)
  }
  catch (error) {
    console.error('[用户服务] 更新密码失败:', error)
    throw new Error('密码更新失败，请确认当前密码是否正确')
  }
}

/**
 * 创建新管理员 (仅超级管理员可操作)
 * @param adminData 管理员信息
 */
export async function createAdmin(adminData: CreateAdminParams): Promise<AdminWithStatus> {
  try {
    // 验证用户名格式
    if (!validateAdminUsername(adminData.username)) {
      throw new Error(`用户名格式不正确: ${ADMIN_FORMAT_REQUIREMENTS.username}`)
    }

    // 验证密码格式
    if (!validateAdminPassword(adminData.password)) {
      throw new Error(`密码格式不正确: ${ADMIN_FORMAT_REQUIREMENTS.password}`)
    }

    // 验证邮箱格式(如果提供)
    if (adminData.email && !validateAdminEmail(adminData.email)) {
      throw new Error(`邮箱格式不正确: ${ADMIN_FORMAT_REQUIREMENTS.email}`)
    }

    if (USE_MOCK_API) {
      return await mockCreateAdminApi(adminData)
    }

    // 使用专用的管理员创建API端点
    return await httpPost<AdminWithStatus>(API_CONFIG.admin, adminData)
  }
  catch (error: any) {
    console.error('[用户服务] 创建管理员失败:', error)

    // 如果是API返回的格式错误，可能包含formatRequirements字段
    if (error.response?.data?.formatRequirements) {
      throw new Error(`管理员创建失败: ${error.response.data.message || '输入格式不正确'}`)
    }

    throw new Error(error.message || ERROR_MESSAGES.createAdmin)
  }
}

/**
 * 更新用户状态
 * @param userId 用户ID
 * @param status 新状态
 */
export async function updateUserStatus(userId: number, status: UserStatus): Promise<boolean> {
  try {
    if (USE_MOCK_API) {
      return await mockUpdateUserStatusApi(userId, status)
    }

    return await httpPut<boolean>(`${API_CONFIG.base}/${userId}/status`, { status })
  }
  catch (error) {
    console.error(`[用户服务] 更新用户 ${userId} 状态失败:`, error)
    throw new Error('更新用户状态失败')
  }
}

/**
 * 检查当前用户是否为超级管理员
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    if (USE_MOCK_API) {
      return await mockIsSuperAdminApi()
    }

    return await httpGet<boolean>('/api/auth/is-super-admin')
  }
  catch (error) {
    console.error('[用户服务] 检查超级管理员权限失败:', error)
    return false
  }
}

// ====== 验证函数 ======

/**
 * 验证管理员用户名
 * 3-50个字符，只能包含字母、数字、下划线和中文
 */
function validateAdminUsername(username: string): boolean {
  const regex = /^[\u4E00-\u9FA5\w]{3,50}$/
  return regex.test(username)
}

/**
 * 验证管理员密码
 * 6-30个字符，必须包含大写字母、小写字母和数字
 */
function validateAdminPassword(password: string): boolean {
  // 长度检查
  if (password.length < 6 || password.length > 30) {
    return false
  }

  // 检查是否包含大写字母
  if (!/[A-Z]/.test(password)) {
    return false
  }

  // 检查是否包含小写字母
  if (!/[a-z]/.test(password)) {
    return false
  }

  // 检查是否包含数字
  if (!/\d/.test(password)) {
    return false
  }

  return true
}

/**
 * 验证管理员邮箱
 * 必须是有效的邮箱格式，最多100个字符
 */
function validateAdminEmail(email: string): boolean {
  if (email.length > 100) {
    return false
  }

  const regex = /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  return regex.test(email)
}

// ====== 导出组合式API对象 (用于Vue组件) ======

export const userService = {
  login,
  register,
  getCurrentUser,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateAdmin,
  deleteUser,
  updatePassword,
  createAdmin,
  updateUserStatus,
  isSuperAdmin,
  ADMIN_FORMAT_REQUIREMENTS,
}
