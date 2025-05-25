/**
 * 医疗知识相关类型定义
 */

// 医疗类别类型
export interface MedicalCategory {
  // 兼容新旧API格式
  categoryId?: number
  id?: number
  categoryName: string
  description?: string
  createdAt?: string
  updatedAt?: string
  sortOrder?: number
  // 内联统计数据
  knowledgeCount?: number
  experienceCount?: number
}

// 医疗知识条目
export interface KnowledgeItem {
  knowledgeId: number
  title: string
  introduction: string
  coverImage?: string
  content: string
  videoUrl?: string
  categories?: MedicalCategory[]
  createdBy: number
  createdAt: string
  updatedAt: string
  viewCount: number
  likeCount: number
  isLiked?: boolean
}

// 分页数据接口
export interface PaginationData {
  total: number
  current: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

// 知识列表响应
export interface KnowledgeListResponse {
  data: KnowledgeItem[]
  pagination: PaginationData
}

// 知识详情响应
export interface KnowledgeDetailResponse {
  data: KnowledgeItem
}

// 知识创建参数
export interface CreateKnowledgeParams {
  title: string
  introduction: string
  content: string
  coverImage?: string
  videoUrl?: string
  categoryIds: number[]
}

// 知识更新参数
export interface UpdateKnowledgeParams {
  title?: string
  introduction?: string
  content?: string
  coverImage?: string
  videoUrl?: string
  categoryIds?: number[]
}

// 心得创建参数
export interface CreateExperienceParams {
  knowledgeId: number
  title: string
  content: string
}

// 心得更新参数
export interface UpdateExperienceParams {
  title?: string
  content?: string
}

// 医疗类别相关API响应
export interface CategoryListResponse {
  data: MedicalCategory[]
}

// 点赞操作响应
export interface LikeResponse {
  success: boolean
  isLiked: boolean
  likeCount: number
}
