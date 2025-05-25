/**
 * 首页服务模块
 * 提供首页相关的所有API请求
 */

import type {
  HomeExperienceListResponse,
  HomeKnowledgeListResponse,
  HomeStatisticsResponse,
  LatestExperienceParams,
  LatestKnowledgeParams,
} from '@/types'

import type { RequestOptions } from '@/utils/requests'
import { httpGet } from '@/utils/requests'

// 引入模拟API
import {
  mockGetHomeStatistics,
  mockGetLatestExperience,
  mockGetLatestKnowledge,
} from '../mock/home.mock'

// ====== 配置 ======

// API根路径前缀
const API_PREFIX = '/api/home'

// 从环境变量读取是否使用 mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

// 请求选项配置
const requestOptions: RequestOptions = {
  // 重试配置：网络错误或服务器错误时重试
  retry: {
    retries: 2,
    retryDelay: 1000,
  },
}

// ====== 核心API函数 ======

/**
 * 获取首页统计数据
 * 包括平台知识数量、用户数量、心得数量等统计信息
 */
export async function getHomeStatistics(): Promise<HomeStatisticsResponse> {
  if (USE_MOCK_API) {
    return await mockGetHomeStatistics()
  }
  return await httpGet<HomeStatisticsResponse>(`${API_PREFIX}/statistics`, undefined, requestOptions)
}

/**
 * 获取最新医疗知识列表（用于首页瀑布流）
 * @param params 查询参数：分页、分类、排序等
 */
export async function getLatestKnowledge(
  params: LatestKnowledgeParams = {},
): Promise<HomeKnowledgeListResponse> {
  if (USE_MOCK_API) {
    return await mockGetLatestKnowledge(params)
  }
  return await httpGet<HomeKnowledgeListResponse>(`${API_PREFIX}/knowledge/latest`, params)
}

/**
 * 获取最新学习心得列表（用于首页瀑布流）
 * @param params 查询参数：分页、状态、排序等
 */
export async function getLatestExperience(
  params: LatestExperienceParams = {},
): Promise<HomeExperienceListResponse> {
  if (USE_MOCK_API) {
    return await mockGetLatestExperience(params)
  }
  return await httpGet<HomeExperienceListResponse>(`${API_PREFIX}/experience/latest`, params)
}

/**
 * 获取热门医疗知识（按阅读量排序）
 * @param params 查询参数
 */
export async function getPopularKnowledge(
  params: LatestKnowledgeParams = {},
): Promise<HomeKnowledgeListResponse> {
  const paramsWithSort = { ...params, sortBy: 'popular' as const }
  return getLatestKnowledge(paramsWithSort)
}

/**
 * 获取热门学习心得（按点赞数排序）
 * @param params 查询参数
 */
export async function getPopularExperience(
  params: LatestExperienceParams = {},
): Promise<HomeExperienceListResponse> {
  const paramsWithSort = { ...params, sortBy: 'popular' as const }
  return getLatestExperience(paramsWithSort)
}

/**
 * 获取特定分类的最新知识
 * @param categoryId 分类ID
 * @param params 其他查询参数
 */
export async function getKnowledgeByCategory(
  categoryId: number,
  params: Omit<LatestKnowledgeParams, 'categoryId'> = {},
): Promise<HomeKnowledgeListResponse> {
  const paramsWithCategory = { ...params, categoryId }
  return getLatestKnowledge(paramsWithCategory)
}

// 导出组合式API对象
export const homeService = {
  getHomeStatistics,
  getLatestKnowledge,
  getLatestExperience,
  getPopularKnowledge,
  getPopularExperience,
  getKnowledgeByCategory,
}

// 默认导出
export default homeService
