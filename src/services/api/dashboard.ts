/**
 * 仪表盘服务模块
 * 提供仪表盘相关的所有API请求
 */

import type {
  DashboardResponse,
  GetDashboardParams
} from '../type/dashboard'

import { httpGet } from '@/utils/requests'

// 引入模拟API
import {
  mockGetDashboardData,
  mockGetPendingReviews,
  mockGetUserActivity
} from '../mock/dashboard.mock'

// ====== 配置 ======

// API根路径前缀
const API_PREFIX = '/api/dashboard'

// 从环境变量读取是否使用 mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

// 请求选项配置
const requestOptions = {
  // 重试配置：网络错误或服务器错误时重试
  retry: {
    retries: 2,
    retryDelay: 1000,
  },
}

// ====== 核心API函数 ======

/**
 * 获取仪表盘数据
 * 包括统计数据、快速统计和其他仪表盘信息
 * 
 * @param params 请求参数（可选）
 * @returns 仪表盘数据响应
 */
export async function getDashboardData(params?: GetDashboardParams): Promise<DashboardResponse> {
  // 确保isAdmin参数是布尔值类型
  const sanitizedParams = params ? {
    ...params,
    isAdmin: params.isAdmin !== undefined ? Boolean(params.isAdmin) : undefined
  } : undefined;
  
  if (USE_MOCK_API) {
    return await mockGetDashboardData(sanitizedParams)
  }
  return await httpGet<DashboardResponse>(`${API_PREFIX}/stats`, sanitizedParams, requestOptions)
}

/**
 * 获取仪表盘待审核内容（仅管理员）
 * 
 * @returns 待审核内容的详细统计信息
 */
export async function getPendingReviews(): Promise<any> {
  if (USE_MOCK_API) {
    return await mockGetPendingReviews()
  }
  return await httpGet<any>(`${API_PREFIX}/pending-reviews`, undefined, requestOptions)
}

/**
 * 获取用户活动统计
 * 
 * @param userId 用户ID（可选，不传则获取当前登录用户）
 * @returns 用户活动统计数据
 */
export async function getUserActivity(userId?: number): Promise<any> {
  if (USE_MOCK_API) {
    return await mockGetUserActivity(userId)
  }
  return await httpGet<any>(`${API_PREFIX}/user-activity`, { userId }, requestOptions)
}

// 导出组合式API对象
export const dashboardService = {
  getDashboardData,
  getPendingReviews,
  getUserActivity
}

// 默认导出
export default dashboardService 