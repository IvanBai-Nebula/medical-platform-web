/**
 * 首页相关类型定义
 */

import type { PaginatedResponse, PaginationData, PaginationParams, SortType, StatusType } from '@/types/common'

// 平台统计数据项（API返回的动态数据）
export interface PlatformStatItem {
  value: string // 统计数值
  trend?: number // 增长趋势百分比
}

// 平台统计数据完整结构（前端使用）
export interface PlatformStatConfig {
  key: string // 数据标识
  label: string
  icon: string
  iconColor: string
  bgColor: string
  description?: string // 描述信息，可为空，将动态生成
}

// 首页统计数据响应
export interface HomeStatisticsResponse {
  data: {
    knowledgeCount: PlatformStatItem
    categoryCount: PlatformStatItem
    experienceCount: PlatformStatItem
    userCount: PlatformStatItem
  }
}

// 最新医疗知识条目（首页简化版本）
export interface LatestKnowledgeItem {
  id: number
  title: string
  summary: string
  category: string
  categoryId: number
  createdAt: string
  readCount: number
  likeCount: number
  coverImage?: string
  adminId?: number // 管理员ID
  username?: string // 管理员用户名
  avatar?: string // 管理员头像
}

// 最新学习心得条目（首页简化版本）
export interface LatestExperienceItem {
  id: number
  title: string
  content: string
  createdAt: string
  status: StatusType
  likeCount: number
  knowledgeId?: number
  knowledgeTitle?: string
  userId: number // 用户ID
  username?: string // 用户名
  avatar?: string // 用户头像
}

// 最新医疗知识列表响应
export interface HomeKnowledgeListResponse extends PaginatedResponse<LatestKnowledgeItem> {}

// 最新学习心得列表响应
export interface HomeExperienceListResponse extends PaginatedResponse<LatestExperienceItem> {}

// 获取最新知识的查询参数
export interface LatestKnowledgeParams extends PaginationParams {
  categoryId?: number
  sortBy?: SortType
}

// 获取最新心得的查询参数
export interface LatestExperienceParams extends PaginationParams {
  status?: StatusType | 'all'
  sortBy?: SortType
}
