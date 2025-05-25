/**
 * 用户服务Mock数据
 * 用于开发阶段模拟API响应，无需实际后端服务
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
  UserRole,
  UserWithStatus,
} from '../type/user'

import { UserStatus } from '../type/user.d'

// ====== Mock数据 ======

// 管理员列表
const mockAdminList: AdminWithStatus[] = [
  {
    adminId: 1,
    username: 'superadmin',
    email: 'superadmin@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
    isSuperAdmin: true,
    status: UserStatus.ACTIVE,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    adminId: 2,
    username: 'admin1',
    email: 'admin1@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1',
    isSuperAdmin: false,
    status: UserStatus.ACTIVE,
    createdAt: '2023-03-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    adminId: 3,
    username: 'admin2',
    email: 'admin2@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin2',
    isSuperAdmin: false,
    status: UserStatus.ACTIVE,
    createdAt: '2023-06-20T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
]

// 模拟的普通用户列表
const mockUserList: UserWithStatus[] = [
  {
    userId: 101,
    username: 'student1',
    email: 'student1@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1',
    status: UserStatus.ACTIVE,
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    userId: 102,
    username: 'student2',
    email: 'student2@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2',
    status: UserStatus.ACTIVE,
    createdAt: '2023-04-05T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
  },
  {
    userId: 103,
    username: 'doctor1',
    email: 'doctor1@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor1',
    status: UserStatus.ACTIVE,
    createdAt: '2023-05-12T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
  {
    userId: 104,
    username: 'nurse1',
    email: 'nurse1@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurse1',
    status: UserStatus.ACTIVE,
    createdAt: '2023-07-18T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    userId: 105,
    username: 'student3',
    email: 'student3@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student3',
    status: UserStatus.INACTIVE,
    createdAt: '2023-08-25T00:00:00Z',
    updatedAt: '2024-01-30T00:00:00Z',
  },
]

// 当前登录用户
let currentUser: AdminWithStatus | UserWithStatus | null = null

// 自动递增ID
let nextAdminId = 4
let nextUserId = 106

// ====== 工具函数 ======

// 模拟网络延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 生成随机Token
const generateMockToken = (username: string): string => {
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `mock_${username}_${randomPart}_${Date.now()}`
}

// ====== Mock API实现 ======

/**
 * 登录API Mock
 */
export const mockLoginApi = async (params: UserLoginParams): Promise<UserLoginResponseData> => {
  await delay(800) // 模拟网络延迟

  // 查找管理员账号
  const admin = mockAdminList.find(a => a.username === params.username)
  if (admin && params.password === 'admin123') {
    currentUser = admin
    return {
      token: generateMockToken(admin.username),
      user: admin,
      role: 'admin' as UserRole,
    }
  }

  // 查找普通用户账号
  const user = mockUserList.find(u => u.username === params.username)
  if (user && params.password === 'user123') {
    currentUser = user
    return {
      token: generateMockToken(user.username),
      user,
      role: 'user' as UserRole,
    }
  }

  // 其他登录失败
  throw new Error('用户名或密码错误')
}

/**
 * 获取当前用户信息API Mock
 */
export const mockGetUserInfoApi = async (): Promise<Admin | User> => {
  await delay()

  if (!currentUser) {
    // 模拟未登录或会话过期
    throw new Error('未登录或会话已过期')
  }

  return currentUser
}

/**
 * 获取用户列表API Mock
 */
export const mockGetUsersApi = async (params?: UserListParams): Promise<UserListResponse> => {
  await delay()

  let allUsers: (AdminWithStatus | UserWithStatus)[] = [...mockAdminList, ...mockUserList]

  // 筛选角色
  if (params?.role && params.role !== 'all') {
    if (params.role === 'admin') {
      allUsers = mockAdminList
    }
    else if (params.role === 'user') {
      allUsers = mockUserList
    }
  }

  // 筛选状态
  if (params?.status) {
    allUsers = allUsers.filter(user => user.status === params.status)
  }

  // 搜索
  if (params?.search) {
    const searchTerm = params.search.toLowerCase()
    allUsers = allUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm)
      || user.email?.toLowerCase().includes(searchTerm),
    )
  }

  // 分页
  const page = params?.page || 1
  const limit = params?.limit || 10
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  const paginatedUsers = allUsers.slice(startIndex, endIndex)

  return {
    users: paginatedUsers,
    total: allUsers.length,
    page,
    limit,
  }
}

/**
 * 根据ID获取用户API Mock
 */
export const mockGetUserByIdApi = async (id: number): Promise<AdminWithStatus | UserWithStatus | null> => {
  await delay()

  // 先检查是否为管理员ID
  const admin = mockAdminList.find(admin => admin.adminId === id)
  if (admin) {
    return admin
  }

  // 然后在用户列表中查找
  const user = mockUserList.find(user => user.userId === id)
  return user || null
}

/**
 * 更新用户API Mock
 */
export const mockUpdateUserApi = async (
  id: number,
  userData: Partial<User>,
): Promise<AdminWithStatus | UserWithStatus | null> => {
  await delay()

  // 管理员更新
  const adminIndex = mockAdminList.findIndex(admin => admin.adminId === id)
  if (adminIndex !== -1) {
    Object.assign(mockAdminList[adminIndex], userData, { updatedAt: new Date().toISOString() })
    return mockAdminList[adminIndex]
  }

  // 普通用户更新
  const userIndex = mockUserList.findIndex(user => user.userId === id)
  if (userIndex === -1) {
    return null
  }

  // 更新用户信息
  mockUserList[userIndex] = {
    ...mockUserList[userIndex],
    ...userData,
    updatedAt: new Date().toISOString(),
  }
  return mockUserList[userIndex]
}

/**
 * 删除用户API Mock
 */
export const mockDeleteUserApi = async (id: number): Promise<boolean> => {
  await delay()

  // 查找管理员
  const adminIndex = mockAdminList.findIndex(admin => admin.adminId === id)
  if (adminIndex !== -1) {
    // 不允许删除超级管理员
    if (mockAdminList[adminIndex].isSuperAdmin) {
      throw new Error('不能删除超级管理员账号')
    }
    mockAdminList.splice(adminIndex, 1)
    return true
  }

  // 查找并删除普通用户
  const userIndex = mockUserList.findIndex(user => user.userId === id)
  if (userIndex === -1) {
    return false
  }

  mockUserList.splice(userIndex, 1)
  return true
}

/**
 * 创建管理员API Mock
 */
export const mockCreateAdminApi = async (adminData: CreateAdminParams): Promise<AdminWithStatus> => {
  await delay()

  // 检查用户名是否已存在
  const existingAdmin = mockAdminList.find(admin => admin.username === adminData.username)
  const existingUser = mockUserList.find(user => user.username === adminData.username)

  if (existingAdmin || existingUser) {
    throw new Error('用户名已存在')
  }

  const newAdmin: AdminWithStatus = {
    adminId: nextAdminId++,
    username: adminData.username,
    email: adminData.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminData.username}`,
    isSuperAdmin: adminData.isSuperAdmin || false,
    status: UserStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockAdminList.push(newAdmin)
  return newAdmin
}

/**
 * 创建普通用户API Mock
 */
export const mockCreateUserApi = async (userData: CreateUserParams): Promise<UserWithStatus> => {
  await delay()

  // 检查用户名是否已存在
  const existingAdmin = mockAdminList.find(admin => admin.username === userData.username)
  const existingUser = mockUserList.find(user => user.username === userData.username)

  if (existingAdmin || existingUser) {
    throw new Error('用户名已存在')
  }

  const newUser: UserWithStatus = {
    userId: nextUserId++,
    username: userData.username,
    email: userData.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
    status: UserStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockUserList.push(newUser)
  return newUser
}

/**
 * 更新用户状态API Mock
 */
export const mockUpdateUserStatusApi = async (id: number, status: UserStatus): Promise<boolean> => {
  await delay()

  // 查找管理员
  const admin = mockAdminList.find(admin => admin.adminId === id)
  if (admin) {
    admin.status = status
    admin.updatedAt = new Date().toISOString()
    return true
  }

  // 查找普通用户
  const user = mockUserList.find(user => user.userId === id)
  if (user) {
    user.status = status
    user.updatedAt = new Date().toISOString()
    return true
  }

  return false
}

/**
 * 检查是否为超级管理员API Mock
 */
export const mockIsSuperAdminApi = async (): Promise<boolean> => {
  await delay()

  if (!currentUser) {
    return false
  }

  // 只有管理员才可能是超级管理员
  if ('adminId' in currentUser) {
    return currentUser.isSuperAdmin || false
  }

  return false
}

/**
 * 更新管理员API Mock
 */
export const mockUpdateAdminApi = async (
  id: number,
  adminData: Partial<Admin>,
): Promise<AdminWithStatus | null> => {
  await delay()

  // 查找管理员
  const adminIndex = mockAdminList.findIndex(admin => admin.adminId === id)
  if (adminIndex === -1) {
    return null
  }

  // 更新管理员信息
  mockAdminList[adminIndex] = {
    ...mockAdminList[adminIndex],
    ...adminData,
    updatedAt: new Date().toISOString(),
  }
  return mockAdminList[adminIndex]
}
