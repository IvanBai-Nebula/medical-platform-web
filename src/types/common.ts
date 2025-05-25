/**
 * 通用类型定义
 * 包含项目中通用的接口和类型
 */

// ====== API相关通用类型 ======

/**
 * 通用API响应格式
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/**
 * 分页数据信息
 */
export interface PaginationData {
  total: number
  current: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

/**
 * 带分页的API响应
 */
export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: PaginationData
}

// ====== 业务相关通用类型 ======

/**
 * 基础实体接口
 */
export interface BaseEntity {
  id: number
  createdAt: string
  updatedAt?: string
}

/**
 * 用户基础信息
 */
export interface UserBasicInfo {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

/**
 * 状态类型
 */
export type StatusType = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'

/**
 * 排序方式
 */
export type SortType = 'latest' | 'popular' | 'trending' | 'asc' | 'desc'

// ====== 表单相关通用类型 ======

/**
 * 表单验证规则
 */
export interface FormRule {
  required?: boolean
  message?: string
  trigger?: string | string[]
  validator?: (rule: any, value: any, callback: any) => void
}

/**
 * 选项接口
 */
export interface Option<T = any> {
  label: string
  value: T
  disabled?: boolean
}

// ====== 文件上传相关类型 ======

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

// ====== 其他通用类型 ======

/**
 * 键值对类型
 */
export interface KeyValue<T = any> {
  [key: string]: T
}

/**
 * 坐标点
 */
export interface Point {
  x: number
  y: number
}

/**
 * 尺寸
 */
export interface Size {
  width: number
  height: number
} 