/**
 * 仪表盘Mock数据
 * 提供仪表盘相关API的模拟实现
 */

import type {
  DashboardData,
  DashboardResponse,
  GetDashboardParams
} from '../type/dashboard'

// 模拟延迟函数
const mockDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 生成仪表盘数据
 * 随机生成符合要求的数据结构
 */
const generateDashboardData = (isAdmin: boolean = false): DashboardData => {
  return {
    stats: {
      totalKnowledge: Math.floor(Math.random() * 100) + 50,
      totalExperience: Math.floor(Math.random() * 80) + 30,
      pendingReviews: isAdmin ? Math.floor(Math.random() * 5) + 1 : 0,
      activeUsers: Math.floor(Math.random() * 50) + 20
    },
    quickStats: {
      todayViews: Math.floor(Math.random() * 200) + 100,
      weeklyGrowth: Math.floor(Math.random() * 20) + 5,
      monthlyActive: Math.floor(Math.random() * 100) + 50
    }
  }
}

/**
 * 获取仪表盘数据 - Mock实现
 */
export async function mockGetDashboardData(params?: GetDashboardParams): Promise<DashboardResponse> {
  await mockDelay(600)
  
  const isAdmin = params?.isAdmin || false
  
  return {
    code: 200,
    message: "获取成功",
    data: generateDashboardData(isAdmin),
    timestamp: new Date().toISOString()
  }
}

/**
 * 获取待审核内容 - Mock实现
 */
export async function mockGetPendingReviews(): Promise<any> {
  await mockDelay(500)
  
  return {
    code: 200,
    message: "获取成功",
    data: {
      pendingKnowledge: Math.floor(Math.random() * 3),
      pendingExperience: Math.floor(Math.random() * 3) + 1,
      totalPending: Math.floor(Math.random() * 5) + 1,
      oldestPendingTimestamp: new Date(Date.now() - Math.floor(Math.random() * 3) * 86400000).toISOString()
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * 获取用户活动统计 - Mock实现
 */
export async function mockGetUserActivity(userId?: number): Promise<any> {
  await mockDelay(700)
  
  return {
    code: 200,
    message: "获取成功",
    data: {
      lastLoginTimestamp: new Date(Date.now() - Math.floor(Math.random() * 48) * 3600000).toISOString(),
      viewCount: Math.floor(Math.random() * 50) + 10,
      contributionCount: Math.floor(Math.random() * 10) + 1,
      favoriteCategories: ['心血管疾病', '内分泌疾病', '神经内科'].slice(0, Math.floor(Math.random() * 3) + 1)
    },
    timestamp: new Date().toISOString()
  }
} 