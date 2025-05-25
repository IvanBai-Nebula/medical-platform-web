/**
 * 学习心得服务模块
 * 提供心得相关的所有API请求
 */

import type {
  CreateExperienceParams,
  ExperienceDetailResponse,
  ExperienceListResponse,
  ExperienceStatus,
  ReviewExperienceParams,
  UpdateExperienceParams,
} from '../type/experience'

import { httpDelete, httpGet, httpPost, httpPut } from '@/utils/requests'

// 引入模拟API
import {
  mockCreateExperience,
  mockDeleteExperience,
  mockGetExperienceDetail,
  mockGetExperienceList,
  mockGetMyExperiences,
  mockReviewExperience,
  mockUpdateExperience,
} from '../mock/experience.mock'

// ====== 配置 ======

// API根路径前缀
const API_PREFIX = '/api/experience'

// 从环境变量读取是否使用 mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

// 通用错误消息
const ERROR_MESSAGES = {
  fetch: '获取学习心得失败',
  fetchDetail: '获取心得详情失败',
  create: '提交学习心得失败',
  update: '更新学习心得失败',
  delete: '删除学习心得失败',
  review: '审核学习心得失败',
}

// ====== 核心API函数 ======

/**
 * 获取学习心得列表
 * @param params 查询参数 (状态、分页等)
 */
export async function getExperienceList(params?: {
  page?: number
  pageSize?: number
  status?: ExperienceStatus
  userId?: number
  knowledgeId?: number
}): Promise<ExperienceListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetExperienceList(params)
    }
    return await httpGet<ExperienceListResponse>(API_PREFIX, params)
  }
  catch (error) {
    console.error('[心得服务] 获取学习心得列表失败:', error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

/**
 * 获取学习心得详情
 * @param id 心得ID
 */
export async function getExperienceDetail(id: string | number): Promise<ExperienceDetailResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetExperienceDetail(id)
    }
    return await httpGet<ExperienceDetailResponse>(`${API_PREFIX}/${id}`)
  }
  catch (error) {
    console.error(`[心得服务] 获取心得详情失败 (ID: ${id}):`, error)
    throw new Error(ERROR_MESSAGES.fetchDetail)
  }
}

/**
 * 创建学习心得
 * @param data 心得内容
 */
export async function createExperience(
  data: CreateExperienceParams,
): Promise<ExperienceDetailResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockCreateExperience(data)
    }
    return await httpPost<ExperienceDetailResponse>(API_PREFIX, data)
  }
  catch (error) {
    console.error('[心得服务] 创建学习心得失败:', error)
    throw new Error(ERROR_MESSAGES.create)
  }
}

/**
 * 更新学习心得
 * @param id 心得ID
 * @param data 更新数据
 */
export async function updateExperience(
  id: string | number,
  data: UpdateExperienceParams,
): Promise<ExperienceDetailResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockUpdateExperience(id, data)
    }
    return await httpPut<ExperienceDetailResponse>(`${API_PREFIX}/${id}`, data)
  }
  catch (error) {
    console.error(`[心得服务] 更新心得失败 (ID: ${id}):`, error)
    throw new Error(ERROR_MESSAGES.update)
  }
}

/**
 * 删除学习心得
 * @param id 心得ID
 */
export async function deleteExperience(id: string | number): Promise<{ success: boolean }> {
  try {
    if (USE_MOCK_API) {
      return await mockDeleteExperience(id)
    }
    return await httpDelete<{ success: boolean }>(`${API_PREFIX}/${id}`)
  }
  catch (error) {
    console.error(`[心得服务] 删除心得失败 (ID: ${id}):`, error)
    throw new Error(ERROR_MESSAGES.delete)
  }
}

/**
 * 审核学习心得 (管理员操作)
 * @param id 心得ID
 * @param data 审核结果
 */
export async function reviewExperience(
  id: string | number,
  data: ReviewExperienceParams,
): Promise<ExperienceDetailResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockReviewExperience(id, data)
    }
    return await httpPut<ExperienceDetailResponse>(`${API_PREFIX}/${id}/review`, data)
  }
  catch (error) {
    console.error(`[心得服务] 审核心得失败 (ID: ${id}):`, error)
    throw new Error(ERROR_MESSAGES.review)
  }
}

/**
 * 获取我的学习心得
 */
export async function getMyExperiences(params?: {
  page?: number
  pageSize?: number
  status?: ExperienceStatus
  knowledgeId?: number
}): Promise<ExperienceListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetMyExperiences(params)
    }
    return await httpGet<ExperienceListResponse>(`${API_PREFIX}/my`, params)
  }
  catch (error) {
    console.error('[心得服务] 获取我的学习心得失败:', error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

/**
 * 获取特定知识文章的学习心得
 * @param knowledgeId 知识ID
 */
export async function getKnowledgeExperiences(
  knowledgeId: number,
  params?: {
    page?: number
    pageSize?: number
    status?: ExperienceStatus
  },
): Promise<ExperienceListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetExperienceList({
        ...params,
        knowledgeId,
      })
    }
    return await httpGet<ExperienceListResponse>(`${API_PREFIX}/knowledge/${knowledgeId}`, params)
  }
  catch (error) {
    console.error(`[心得服务] 获取知识文章心得失败 (ID: ${knowledgeId}):`, error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

// 导出组合式API对象
export const experienceService = {
  getExperienceList,
  getExperienceDetail,
  createExperience,
  updateExperience,
  deleteExperience,
  reviewExperience,
  getMyExperiences,
  getKnowledgeExperiences,
}
