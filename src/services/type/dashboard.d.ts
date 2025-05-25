/**
 * 仪表盘相关类型定义
 */

// 基础统计数据
export interface DashboardStats {
  // 知识文章总数
  totalKnowledge: number
  // 学习心得总数
  totalExperience: number
  // 待审核内容数量（仅管理员可见）
  pendingReviews: number
  // 活跃用户数量
  activeUsers: number
}

// 快速统计数据
export interface QuickStats {
  // 今日浏览量
  todayViews: number
  // 本周增长率（百分比）
  weeklyGrowth: number
  // 本月活跃用户数
  monthlyActive: number
}

// 仪表盘完整数据
export interface DashboardData {
  // 核心统计数据
  stats: DashboardStats
  // 快速统计数据
  quickStats: QuickStats
}

// 仪表盘响应数据
export interface DashboardResponse {
  // 响应码
  code: number
  // 响应消息
  message: string
  // 响应数据
  data: DashboardData
  // ISO格式的时间戳
  timestamp: string
}

// 获取仪表盘数据请求参数
export interface GetDashboardParams {
  // 是否为管理员请求（可选，后端也可通过鉴权确定）
  isAdmin?: boolean
  // 用户ID（可选，后端也可通过鉴权获取）
  userId?: number
} 