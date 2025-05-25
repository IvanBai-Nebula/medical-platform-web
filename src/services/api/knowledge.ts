/**
 * 医疗知识服务模块
 * 提供知识库相关的所有API请求
 */

import type {
  CategoryListResponse,
  CreateKnowledgeParams,
  KnowledgeDetailResponse,
  KnowledgeItem,
  KnowledgeListResponse,
  LikeResponse,
  UpdateKnowledgeParams,
} from '../type/knowledge'

import type {
  CreateExperienceParams,
  ExperienceListResponse,
} from '../type/experience'

import { httpDelete, httpGet, httpPost, httpPut } from '@/utils/requests'

// 引入模拟API
import {
  mockCreateKnowledge,
  mockCreateExperience,
  mockDeleteKnowledge,
  mockGetKnowledgeDetail,
  mockGetKnowledgeExperiences,
  mockGetKnowledgeList,
  mockGetMedicalCategories,
  mockIncrementViewCount,
  mockLikeKnowledge,
  mockLikeExperience,
  mockUpdateKnowledge,
} from '../mock/knowledge.mock'

// ====== 配置 ======

// API根路径前缀
const API_PREFIX = '/api/knowledge'

// 从环境变量读取是否使用 mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

// 通用错误消息
const ERROR_MESSAGES = {
  fetch: '获取知识数据失败',
  fetchDetail: '获取知识详情失败',
  create: '创建知识内容失败',
  update: '更新知识内容失败',
  delete: '删除知识内容失败',
  fetchCategories: '获取医疗类别失败',
}

// ====== 核心API函数 ======

/**
 * 获取知识列表
 * @param params 查询参数 (分类、分页、搜索关键词等)
 */
export async function getKnowledgeList(params?: {
  page?: number
  pageSize?: number
  categoryId?: number
  keyword?: string
}): Promise<KnowledgeListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetKnowledgeList(params)
    }
    return await httpGet<KnowledgeListResponse>(API_PREFIX, params)
  }
  catch (error) {
    console.error('[知识服务] 获取知识列表失败:', error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

/**
 * 获取知识详情
 * @param id 知识ID
 */
export async function getKnowledgeDetail(id: string | number): Promise<KnowledgeDetailResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetKnowledgeDetail(id)
    }
    return await httpGet<KnowledgeDetailResponse>(`${API_PREFIX}/${id}`)
  }
  catch (error) {
    console.error(`[知识服务] 获取知识详情失败 (ID: ${id}):`, error)
    throw new Error(ERROR_MESSAGES.fetchDetail)
  }
}

/**
 * 创建知识
 * @param data 知识数据
 */
export async function createKnowledge(
  data: CreateKnowledgeParams,
): Promise<KnowledgeDetailResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockCreateKnowledge(data)
    }
    return await httpPost<KnowledgeDetailResponse>(API_PREFIX, data)
  }
  catch (error) {
    console.error('[知识服务] 创建知识失败:', error)
    throw new Error(ERROR_MESSAGES.create)
  }
}

/**
 * 更新知识
 * @param id 知识ID
 * @param data 更新数据
 */
export async function updateKnowledge(
  id: string | number,
  data: UpdateKnowledgeParams,
): Promise<KnowledgeDetailResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockUpdateKnowledge(id, data)
    }
    return await httpPut<KnowledgeDetailResponse>(`${API_PREFIX}/${id}`, data)
  }
  catch (error) {
    console.error(`[知识服务] 更新知识失败 (ID: ${id}):`, error)
    throw new Error(ERROR_MESSAGES.update)
  }
}

/**
 * 删除知识
 * @param id 知识ID
 */
export async function deleteKnowledge(id: string | number): Promise<{ success: boolean }> {
  try {
    if (USE_MOCK_API) {
      return await mockDeleteKnowledge(id)
    }
    return await httpDelete<{ success: boolean }>(`${API_PREFIX}/${id}`)
  }
  catch (error) {
    console.error(`[知识服务] 删除知识失败 (ID: ${id}):`, error)
    throw new Error(ERROR_MESSAGES.delete)
  }
}

/**
 * 获取医疗类别列表
 */
export async function getMedicalCategories(): Promise<CategoryListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetMedicalCategories()
    }
    return await httpGet<CategoryListResponse>('/api/categories')
  }
  catch (error) {
    console.error('[知识服务] 获取医疗类别失败:', error)
    throw new Error(ERROR_MESSAGES.fetchCategories)
  }
}

/**
 * 获取知识相关心得列表
 * @param knowledgeId 知识ID
 * @param params 查询参数
 */
export async function getKnowledgeRelatedExperiences(
  knowledgeId: string | number,
  params?: {
    page?: number
    pageSize?: number
  }
): Promise<ExperienceListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetKnowledgeExperiences(knowledgeId, params)
    }
    return await httpGet<ExperienceListResponse>(`${API_PREFIX}/${knowledgeId}/experiences`, params)
  }
  catch (error) {
    console.error(`[知识服务] 获取心得列表失败 (Knowledge ID: ${knowledgeId}):`, error)
    throw new Error('获取心得列表失败')
  }
}

/**
 * 创建知识心得
 * @param data 心得数据
 */
export async function createKnowledgeExperience(
  data: CreateExperienceParams
): Promise<ExperienceListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockCreateExperience(data)
    }
    return await httpPost<ExperienceListResponse>(`${API_PREFIX}/${data.knowledgeId}/experiences`, data)
  }
  catch (error) {
    console.error('[知识服务] 创建心得失败:', error)
    throw new Error('创建心得失败')
  }
}

/**
 * 点赞知识
 * @param id 知识ID
 */
export async function likeKnowledge(id: string | number): Promise<LikeResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockLikeKnowledge(id)
    }
    return await httpPost<LikeResponse>(`${API_PREFIX}/${id}/like`)
  }
  catch (error) {
    console.error(`[知识服务] 点赞知识失败 (ID: ${id}):`, error)
    throw new Error('点赞失败')
  }
}

/**
 * 点赞心得
 * @param id 心得ID
 */
export async function likeExperience(id: string | number): Promise<LikeResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockLikeExperience(id)
    }
    return await httpPost<LikeResponse>(`/api/experiences/${id}/like`)
  }
  catch (error) {
    console.error(`[知识服务] 点赞心得失败 (ID: ${id}):`, error)
    throw new Error('点赞失败')
  }
}

/**
 * 增加知识浏览量
 * @param id 知识ID
 */
export async function incrementViewCount(id: string | number): Promise<{ success: boolean; viewCount: number }> {
  try {
    if (USE_MOCK_API) {
      return await mockIncrementViewCount(id)
    }
    return await httpPost<{ success: boolean; viewCount: number }>(`${API_PREFIX}/${id}/view`)
  }
  catch (error) {
    console.error(`[知识服务] 增加浏览量失败 (ID: ${id}):`, error)
    // 浏览量更新失败不应该影响用户体验，所以返回默认值
    return { success: false, viewCount: 0 }
  }
}

// 导出组合式API对象
export const knowledgeService = {
  getKnowledgeList,
  getKnowledgeDetail,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  getMedicalCategories,
  getKnowledgeRelatedExperiences,
  createKnowledgeExperience,
  likeKnowledge,
  likeExperience,
  incrementViewCount,
}
