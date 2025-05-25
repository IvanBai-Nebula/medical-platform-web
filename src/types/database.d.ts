// 医疗知识学习平台数据库表结构定义

/**
 * 用户相关表
 */

// 管理员表
export interface AdminTable {
  adminId: number // 管理员编号，主键，自增
  username: string // 用户名，唯一，用于登录
  password_hash: string // 密码，加密存储
  email?: string // 邮箱，用于找回密码
  avatar?: string // 头像URL地址
  isSuperAdmin: boolean // 是否为超级管理员
  created_at: Date // 创建时间
  updated_at: Date // 更新时间
}

// 普通用户表（原学员表）
export interface UserTable {
  userId: number // 用户编号，主键，自增
  username: string // 用户名，唯一，用于登录
  password_hash: string // 密码，加密存储
  email?: string // 邮箱，用于找回密码
  avatar?: string // 头像URL地址
  created_at: Date // 创建时间
  updated_at: Date // 更新时间
}

/**
 * 知识管理表
 */

// 医疗类别表
export interface MedicalCategoryTable {
  categoryId: number // 类别编号，主键，自增
  categoryName: string // 类别名称，如"心血管疾病"
  description?: string // 类别详细说明
  created_at: Date // 创建时间
  updated_at: Date // 更新时间
}

// 医疗知识表
export interface MedicalKnowledgeTable {
  knowledgeId: number // 知识编号，主键，自增
  introduction: string // 知识简介/摘要
  coverImage?: string // 封面图片URL
  content: string // 富文本内容，存储HTML格式
  videoUrl?: string // 视频文件URL
  created_by: number // 创建人ID，关联管理员表
  created_at: Date // 创建时间
  updated_at: Date // 更新时间
}

// 知识_类别_关联表（多对多关系）
export interface KnowledgeCategoryRelationTable {
  knowledgeId: number // 知识编号，外键，关联医疗知识表
  categoryId: number // 类别编号，外键，关联医疗类别表
  // 联合主键 (knowledgeId, categoryId)
}

/**
 * 心得管理表
 */

// 学习心得状态枚举
export enum FeedbackStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 通过
  REJECTED = 'rejected', // 驳回
}

// 学习心得表
export interface LearningFeedbackTable {
  feedbackId: number // 心得编号，主键，自增
  userId: number // 用户编号，外键，关联用户表
  content: string // 富文本内容（含图文）
  status: FeedbackStatus // 审核状态：待审核/通过/驳回
  reviewerId?: number // 审核人员编号，外键，关联管理员表（可为空）
  reviewTimestamp?: Date // 审核时间
  reviewComments?: string // 审核意见，工作人员填写的修改建议
  created_at: Date // 创建时间
  updated_at: Date // 更新时间
}
