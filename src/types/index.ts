/**
 * 类型定义统一导出
 */

// 核心服务类型
export * from '../services/type/experience'
// 业务模块类型
export * from '../services/type/home'

// 知识相关类型（排除重复的PaginationData和Experience相关类型）
export type {
  CategoryListResponse,
  CreateKnowledgeParams,
  KnowledgeDetailResponse,
  KnowledgeItem,
  KnowledgeListResponse,
  LikeResponse,
  MedicalCategory,
  UpdateKnowledgeParams,
} from '../services/type/knowledge'

export * from '../services/type/user'
// 通用类型
export * from './common'

// 用户相关类型（预留）
// export * from './user'

// 其他模块类型（预留）
// export * from './knowledge'
