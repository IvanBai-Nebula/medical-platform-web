/**
 * 医疗分类管理服务模块
 * 提供分类管理相关的所有API请求
 */

import type {
  CategoryListResponse,
  MedicalCategory,
} from '../type/knowledge'

import { httpDelete, httpGet, httpPost, httpPut } from '@/utils/requests'

// 引入模拟API
import {
  mockCreateCategory,
  mockDeleteCategory,
  mockGetMedicalCategories,
  mockUpdateCategory,
} from '../mock/category.mock'

// ====== 配置 ======

// API根路径前缀
const API_PREFIX = '/api/categories'

// 从环境变量读取是否使用 mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

// 通用错误消息
const ERROR_MESSAGES = {
  fetch: '获取分类数据失败',
  create: '创建分类失败',
  update: '更新分类失败',
  delete: '删除分类失败',
}

// ====== 核心API函数 ======

/**
 * 获取医疗分类列表
 */
export async function getMedicalCategories(): Promise<CategoryListResponse> {
  try {
    if (USE_MOCK_API) {
      return await mockGetMedicalCategories()
    }
    
    const response = await httpGet(API_PREFIX)
    
    // 根据返回格式处理响应
    if (response && typeof response === 'object') {
      // 处理 {code, message, data} 格式的响应
      if ('code' in response && 'data' in response) {
        // 检查是否成功
        if (response.code >= 200 && response.code < 300) {
          return { data: Array.isArray(response.data) ? response.data : [] }
        } else {
          throw new Error(response.message || ERROR_MESSAGES.fetch)
        }
      }
      // 如果已经是扁平的数据格式，直接返回
      else {
        return response as CategoryListResponse
      }
    }
    
    return { data: [] }  // 默认返回空数组
  } catch (error) {
    console.error('[分类服务] 获取分类列表失败:', error)
    throw new Error(ERROR_MESSAGES.fetch)
  }
}

/**
 * 创建医疗分类
 * @param data 分类数据
 */
export async function createCategory(data: {
  categoryName: string
  description?: string
}): Promise<{ data: MedicalCategory }> {
  try {
    if (USE_MOCK_API) {
      return await mockCreateCategory(data)
    }
    return await httpPost<{ data: MedicalCategory }>(API_PREFIX, data)
  } catch (error) {
    console.error('[分类服务] 创建分类失败:', error)
    throw new Error(ERROR_MESSAGES.create)
  }
}

/**
 * 更新医疗分类
 * @param id 分类ID
 * @param data 更新数据
 */
export async function updateCategory(
  id: number,
  data: {
    categoryName?: string
    description?: string
  }
): Promise<{ data: MedicalCategory }> {
  try {
    if (USE_MOCK_API) {
      return await mockUpdateCategory(id, data)
    }
    return await httpPut<{ data: MedicalCategory }>(`${API_PREFIX}/${id}`, data)
  } catch (error) {
    console.error('[分类服务] 更新分类失败:', error)
    throw new Error(ERROR_MESSAGES.update)
  }
}

/**
 * 删除医疗分类
 * @param id 分类ID
 */
export async function deleteCategory(id: number): Promise<{ success: boolean }> {
  try {
    if (USE_MOCK_API) {
      return await mockDeleteCategory(id)
    }
    return await httpDelete<{ success: boolean }>(`${API_PREFIX}/${id}`)
  } catch (error) {
    console.error('[分类服务] 删除分类失败:', error)
    throw new Error(ERROR_MESSAGES.delete)
  }
}

/**
 * 获取分类统计信息
 * @param categoryId 分类ID
 */
export async function getCategoryStats(categoryId: number): Promise<{
  knowledgeCount: number
  experienceCount: number
}> {
  try {
    // 验证分类ID
    if (categoryId === undefined || categoryId === null || isNaN(Number(categoryId))) {
      console.error('[分类服务] 无效的分类ID:', categoryId)
      return { knowledgeCount: 0, experienceCount: 0 }
    }
    
    if (USE_MOCK_API) {
      // 模拟统计数据
      return {
        knowledgeCount: Math.floor(Math.random() * 50) + 1,
        experienceCount: Math.floor(Math.random() * 30) + 1,
      }
    }

    const response = await httpGet(`${API_PREFIX}/${categoryId}/stats`)

    // 处理可能的嵌套响应
    if (response && typeof response === 'object') {
      // 处理 {code, message, data} 格式
      if ('code' in response && 'data' in response && response.code >= 200 && response.code < 300) {
        return response.data
      }
      // 如果已经是扁平的数据，直接使用
      else if ('knowledgeCount' in response || 'experienceCount' in response) {
        return response as { knowledgeCount: number; experienceCount: number }
      }
    }

    // 返回默认值
    return {
      knowledgeCount: 0,
      experienceCount: 0,
    }
  } catch (error) {
    console.error('[分类服务] 获取分类统计失败:', error)
    return {
      knowledgeCount: 0,
      experienceCount: 0,
    }
  }
}

// 导出组合式API对象
export const categoryService = {
  getMedicalCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} 