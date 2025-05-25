import type {
  Admin,
  User,
  UserLoginParams,
  UserRegisterParams,
  UserRole,
} from '@/services/type/user'
import { defineStore } from 'pinia'
import { userService } from '@/services'

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(null)
  const userInfo = ref<Admin | User | null>(null)
  const role = ref<UserRole | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => userInfo.value)
  const currentUserRole = computed(() => role.value)
  const isAdmin = computed(() => role.value === 'admin')

  // 检查用户是否具有指定角色
  function hasRole(targetRole: UserRole): boolean {
    return role.value === targetRole
  }

  // 确定用户角色
  function determineUserRole(info: any): void {
    if (!info) {
      role.value = null
      return
    }

    // 多重条件判断管理员身份
    if (
      // 检查adminId
      ('adminId' in info)
      // 检查role字段
      || (info.role === 'admin')
      // 检查userType字段
      || (info.userType === 'admin')
      // 检查isSuperAdmin字段
      || (info.isSuperAdmin === true)
    ) {
      role.value = 'admin'
    }
    // 普通用户判断
    else if ('userId' in info || info.role === 'user') {
      role.value = 'user'
    }
    else {
      console.warn('无法从用户信息确定用户角色', info)
      role.value = null
    }
  }

  // 登录操作
  async function login(loginParams: UserLoginParams): Promise<any> {
    try {
      // 获取登录响应
      const response = await userService.login(loginParams)
      console.log('登录原始响应:', response)

      // 检查是否有response.data.token和response.data.user结构
      if (response && typeof response === 'object') {
        // 如果是嵌套的响应结构 {code, message, data: {token, user}}
        if ('code' in response && response.data && typeof response.data === 'object') {
          if ('token' in response.data && 'user' in response.data) {
            const { token: newToken, user } = response.data as { token: string, user: Admin | User }

            // 更新store状态
            token.value = newToken
            userInfo.value = user

            // 确定用户角色
            determineUserRole(user)

            console.log('登录成功，用户信息:', {
              token: token.value ? '存在' : '不存在',
              userInfo: userInfo.value,
              role: role.value,
              isAdmin: role.value === 'admin',
            })

            // 将token保存到localStorage
            if (token.value) {
              localStorage.setItem('medical-app-token', token.value)
            }

            return response
          }
        }
        // 如果是直接的响应结构 {token, user, role}
        else if ('token' in response && 'user' in response) {
          const { token: newToken, user } = response as { token: string, user: Admin | User, role?: UserRole }

          // 更新store状态
          token.value = newToken
          userInfo.value = user

          // 如果API返回了role，直接使用
          if ('role' in response && typeof response.role === 'string') {
            role.value = response.role as UserRole
          }
          else {
            // 否则使用determineUserRole方法判断
            determineUserRole(user)
          }

          console.log('登录成功，用户信息:', {
            token: token.value ? '存在' : '不存在',
            userInfo: userInfo.value,
            role: role.value,
            isAdmin: role.value === 'admin',
          })

          // 将token保存到localStorage
          if (token.value) {
            localStorage.setItem('medical-app-token', token.value)
          }

          return response
        }
      }

      // 如果都不符合预期的响应格式，抛出错误
      console.error('登录响应格式无效:', response)
      throw new Error('登录响应格式错误')
    }
    catch (error) {
      logout()
      console.error('登录失败:', error)
      throw error
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUserInfo(): Promise<Admin | User | null> {
    if (!token.value) {
      console.warn('无token，无法获取用户信息')
      return null
    }

    try {
      const response = await userService.getCurrentUser()

      // 处理可能的嵌套响应格式
      const userProfile = typeof response === 'object' && 'data' in response
        ? response.data as Admin | User
        : response as Admin | User

      userInfo.value = userProfile
      determineUserRole(userProfile)

      return userProfile
    }
    catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
      return null
    }
  }

  // 登出操作
  function logout() {
    token.value = null
    userInfo.value = null
    role.value = null

    // 删除本地存储的token
    localStorage.removeItem('medical-app-token')
  }

  // 应用初始化时调用，恢复状态并获取用户信息
  async function initStore() {
    // 从localStorage恢复token
    const storedToken = localStorage.getItem('medical-app-token')

    if (storedToken && !token.value) {
      token.value = storedToken
    }

    if (token.value) {
      await fetchCurrentUserInfo()

      // 如果用户信息存在但角色未正确设置，尝试从userInfo推断
      if (userInfo.value && !role.value) {
        determineUserRole(userInfo.value)
      }
    }
  }

  // 手动设置管理员角色
  function setAdminRole() {
    role.value = 'admin'
  }

  // 更新密码
  async function updatePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    if (!userInfo.value) {
      throw new Error('用户未登录')
    }

    const userId = 'adminId' in userInfo.value
      ? userInfo.value.adminId
      : (userInfo.value as User).userId

    return await userService.updatePassword(userId, {
      oldPassword,
      newPassword,
    })
  }

  // 返回所有状态和方法
  return {
    // 状态
    token,
    userInfo,
    role,

    // Getters
    isAuthenticated,
    currentUser,
    currentUserRole,
    isAdmin,

    // 方法
    hasRole,
    login,
    logout,
    register: async (params: UserRegisterParams) => {
      try {
        await userService.register(params)
      }
      catch (error) {
        console.error('注册失败:', error)
        throw error
      }
    },
    fetchCurrentUserInfo,
    initStore,
    setAdminRole,
    updatePassword,
    determineUserRole,
  }
}, {
  persist: true,
})
