/**
 * 学习心得相关类型定义
 */

import type { PaginatedResponse, PaginationData, StatusType } from '@/types/common'

// 心得状态枚举
export enum ExperienceStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 通过
  REJECTED = 'rejected', // 驳回
}

// 学习心得项
export interface ExperienceItem {
  experienceId: number
  userId: number
  username?: string
  avatar?: string
  knowledgeId: number // 关联的知识文章ID
  title: string
  content: string
  likeCount: number // 点赞数
  isLiked?: boolean // 是否已点赞
  status: StatusType
  reviewerId?: number
  reviewerName?: string
  reviewTimestamp?: string
  reviewComments?: string
  createdAt: string
  updatedAt: string
}

// 心得列表响应
export interface ExperienceListResponse extends PaginatedResponse<ExperienceItem> {}

// 心得详情响应
export interface ExperienceDetailResponse {
  data: ExperienceItem
}

// 创建心得参数
export interface CreateExperienceParams {
  knowledgeId: number // 关联的知识文章ID
  title: string
  content: string
}

// 更新心得参数
export interface UpdateExperienceParams {
  content: string
}

// 审核心得参数
export interface ReviewExperienceParams {
  status: StatusType
  reviewComments?: string
}
