/**
 * 学习心得服务Mock数据
 * 用于开发阶段模拟API响应，无需实际后端服务
 */

import type {
  CreateExperienceParams,
  ExperienceDetailResponse,
  ExperienceItem,
  ExperienceListResponse,
  PaginationData,
  ReviewExperienceParams,
  UpdateExperienceParams,
} from '@/types'

import { getUserAvatar } from '@/utils/images'
import { ExperienceStatus } from '../type/experience.d'

// ====== Mock数据 ======

// 模拟的学习心得数据
let mockExperienceList: ExperienceItem[] = [
  {
    experienceId: 1,
    userId: 101,
    username: 'student1',
    avatar: getUserAvatar('student1', 40),
    knowledgeId: 1, // 高血压知识
    title: '高血压学习心得',
    content:
      '<p>通过学习高血压相关知识，我了解到控制饮食、规律作息对血压的重要性。</p><p>我爷爷有高血压，以前总是不按时吃药，现在我会提醒他按时服药并减少盐的摄入。</p><p>希望能够再提供一些适合老年人的血压管理建议。</p>',
    likeCount: 15,
    isLiked: false,
    status: ExperienceStatus.APPROVED,
    reviewerId: 1,
    reviewerName: 'admin',
    reviewTimestamp: '2023-11-20T14:30:00Z',
    reviewComments: '内容真实，表达个人学习收获，已批准发布。',
    createdAt: '2023-11-18T09:20:00Z',
    updatedAt: '2023-11-20T14:30:00Z',
  },
  {
    experienceId: 2,
    userId: 102,
    username: 'student2',
    avatar: getUserAvatar('student2', 40),
    knowledgeId: 2, // 糖尿病知识
    title: '糖尿病饮食管理心得',
    content:
      '<p>学习了糖尿病饮食指南后，我给父亲制定了一份合理的饮食计划。</p><p>减少碳水化合物的摄入，控制总热量，多吃蔬菜水果。</p><p>经过一个月的调整，父亲的血糖有所稳定，感谢平台提供的专业知识。</p>',
    likeCount: 8,
    isLiked: true,
    status: ExperienceStatus.PENDING,
    createdAt: '2023-12-05T10:15:00Z',
    updatedAt: '2023-12-05T10:15:00Z',
  },
  {
    experienceId: 3,
    userId: 103,
    username: 'doctor1',
    avatar: getUserAvatar('doctor1', 40),
    knowledgeId: 3, // 中风急救知识
    title: '中风急救知识实践心得',
    content:
      '<p>作为一名基层医生，我非常感谢平台提供的中风急救知识。</p><p>这些信息非常实用，我已经将FAST原则教给了社区居民，希望能够帮助更多人及时识别中风症状并采取措施。</p><p>建议平台能够提供更多适合基层医疗机构的培训资料。</p>',
    likeCount: 23,
    isLiked: false,
    status: ExperienceStatus.REJECTED,
    reviewerId: 1,
    reviewerName: 'admin',
    reviewTimestamp: '2023-12-10T16:45:00Z',
    reviewComments: '内容涉及专业医疗建议，请修改后重新提交，避免专业医疗建议可能带来的风险。',
    createdAt: '2023-12-08T11:30:00Z',
    updatedAt: '2023-12-10T16:45:00Z',
  },
  {
    experienceId: 4,
    userId: 101,
    username: 'student1',
    avatar: getUserAvatar('student1', 40),
    knowledgeId: 4, // 胃食管反流病
    title: '胃食管反流病自我管理心得',
    content:
      '<p>最近学习了胃食管反流病的相关知识，我自己就有这方面的困扰。</p><p>按照建议调整了生活方式，晚餐后不马上躺下，睡前3小时不进食，症状有明显改善。</p><p>希望平台能提供更多消化系统疾病的自我管理方法。</p>',
    likeCount: 12,
    isLiked: true,
    status: ExperienceStatus.APPROVED,
    reviewerId: 1,
    reviewerName: 'admin',
    reviewTimestamp: '2023-12-15T09:10:00Z',
    reviewComments: '分享了实际应用效果，有价值的反馈。',
    createdAt: '2023-12-12T14:25:00Z',
    updatedAt: '2023-12-15T09:10:00Z',
  },
  {
    experienceId: 5,
    userId: 102,
    username: 'student2',
    avatar: getUserAvatar('student2', 40),
    knowledgeId: 5, // 肺炎
    title: '肺炎预防知识学习心得',
    content:
      '<p>肺炎的症状与预防这篇文章写得非常好，尤其是关于疫苗接种的部分。</p><p>我是一名教师，已经将这些预防知识分享给我的学生们，教会他们正确洗手和咳嗽礼仪。</p><p>希望平台能提供更多适合儿童的健康知识。</p>',
    likeCount: 6,
    isLiked: false,
    status: ExperienceStatus.PENDING,
    createdAt: '2023-12-18T13:40:00Z',
    updatedAt: '2023-12-18T13:40:00Z',
  },
]

// ====== 工具函数 ======

// 模拟网络延迟
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// 生成下一个ID
const getNextId = (): number => {
  const maxId = Math.max(...mockExperienceList.map(item => item.experienceId), 0)
  return maxId + 1
}

// 分页函数
const paginateData = <T>(
  data: T[],
  page: number = 1,
  pageSize: number = 10,
): { items: T[], pagination: PaginationData } => {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const items = data.slice(startIndex, endIndex)
  const totalPages = Math.ceil(data.length / pageSize)

  return {
    items,
    pagination: {
      total: data.length,
      current: page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}

// 过滤函数 - 根据条件过滤心得
const filterExperiences = (
  data: ExperienceItem[],
  params?: {
    status?: ExperienceStatus
    userId?: number
    knowledgeId?: number
  },
): ExperienceItem[] => {
  if (!params) { return [...data] }

  return data.filter((item) => {
    // 状态过滤
    if (params.status && item.status !== params.status) {
      return false
    }

    // 用户ID过滤
    if (params.userId && item.userId !== params.userId) {
      return false
    }

    // 知识ID过滤
    if (params.knowledgeId && item.knowledgeId !== params.knowledgeId) {
      return false
    }

    return true
  })
}

// ====== Mock API实现 ======

/**
 * 获取学习心得列表API Mock
 */
export const mockGetExperienceList = async (params?: {
  page?: number
  pageSize?: number
  status?: ExperienceStatus
  userId?: number
  knowledgeId?: number
}): Promise<ExperienceListResponse> => {
  await delay()

  const page = params?.page || 1
  const pageSize = params?.pageSize || 10

  // 应用过滤
  const filteredData = filterExperiences(mockExperienceList, params)

  // 应用分页
  const { items, pagination } = paginateData(filteredData, page, pageSize)

  return {
    data: items,
    pagination,
  }
}

/**
 * 获取学习心得详情API Mock
 */
export const mockGetExperienceDetail = async (
  id: string | number,
): Promise<ExperienceDetailResponse> => {
  await delay()

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const experience = mockExperienceList.find(item => item.experienceId === numericId)

  if (!experience) {
    throw new Error(`心得不存在 (ID: ${id})`)
  }

  return {
    data: experience,
  }
}

/**
 * 创建学习心得API Mock
 */
export const mockCreateExperience = async (
  data: CreateExperienceParams,
): Promise<ExperienceDetailResponse> => {
  await delay(800)

  // 模拟当前用户ID (实际应用中会从store或token中获取)
  const currentUserId = 101 // student1
  const currentUserName = 'student1'
  const currentUserAvatar = getUserAvatar('student1', 40)

  // 创建新心得
  const newExperience: ExperienceItem = {
    experienceId: getNextId(),
    userId: currentUserId,
    username: currentUserName,
    avatar: currentUserAvatar,
    knowledgeId: data.knowledgeId, // 添加知识文章ID
    title: data.title,
    content: data.content,
    likeCount: 0, // 新创建的心得默认0点赞
    isLiked: false, // 新创建的心得默认未点赞
    status: ExperienceStatus.PENDING, // 新创建的心得默认为待审核状态
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 添加到列表
  mockExperienceList.push(newExperience)

  return {
    data: newExperience,
  }
}

/**
 * 更新学习心得API Mock
 */
export const mockUpdateExperience = async (
  id: string | number,
  data: UpdateExperienceParams,
): Promise<ExperienceDetailResponse> => {
  await delay(700)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const index = mockExperienceList.findIndex(item => item.experienceId === numericId)

  if (index === -1) {
    throw new Error(`心得不存在 (ID: ${id})`)
  }

  // 获取要更新的心得
  const experience = mockExperienceList[index]

  // 再次确认experience存在
  if (!experience) {
    throw new Error(`心得不存在 (ID: ${id})`)
  }

  // 只有待审核状态或被驳回的心得可以更新
  if (experience.status === ExperienceStatus.APPROVED) {
    throw new Error('已审核通过的心得无法更新')
  }

  // 更新字段
  const updatedExperience: ExperienceItem = {
    ...experience,
    content: data.content,
    status: ExperienceStatus.PENDING, // 更新后状态重置为待审核
    updatedAt: new Date().toISOString(),
    // 清除之前的审核信息（如果有）
    reviewComments: undefined,
    reviewTimestamp: undefined,
  }

  // 更新列表
  mockExperienceList[index] = updatedExperience

  return {
    data: updatedExperience,
  }
}

/**
 * 删除学习心得API Mock
 */
export const mockDeleteExperience = async (id: string | number): Promise<{ success: boolean }> => {
  await delay(600)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const originalLength = mockExperienceList.length

  mockExperienceList = mockExperienceList.filter(item => item.experienceId !== numericId)

  return {
    success: mockExperienceList.length < originalLength,
  }
}

/**
 * 审核学习心得API Mock
 */
export const mockReviewExperience = async (
  id: string | number,
  data: ReviewExperienceParams,
): Promise<ExperienceDetailResponse> => {
  await delay(900)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const index = mockExperienceList.findIndex(item => item.experienceId === numericId)

  if (index === -1) {
    throw new Error(`心得不存在 (ID: ${id})`)
  }

  // 获取要审核的心得
  const experience = mockExperienceList[index]

  // 确保experience存在
  if (!experience) {
    throw new Error(`心得不存在 (ID: ${id})`)
  }

  // 模拟管理员信息
  const adminId = 1
  const adminName = 'admin'

  // 更新审核字段
  const reviewedExperience: ExperienceItem = {
    ...experience,
    status: data.status,
    reviewerId: adminId,
    reviewerName: adminName,
    reviewTimestamp: new Date().toISOString(),
    reviewComments: data.reviewComments,
    updatedAt: new Date().toISOString(),
  }

  // 更新列表
  mockExperienceList[index] = reviewedExperience

  return {
    data: reviewedExperience,
  }
}

/**
 * 获取当前用户的学习心得API Mock
 */
export const mockGetMyExperiences = async (params?: {
  page?: number
  pageSize?: number
  status?: ExperienceStatus
  knowledgeId?: number
}): Promise<ExperienceListResponse> => {
  await delay()

  // 模拟当前用户ID
  const currentUserId = 101 // student1

  // 合并查询参数
  const queryParams = {
    ...params,
    userId: currentUserId,
  }

  // 复用获取心得列表API
  return mockGetExperienceList(queryParams)
}
