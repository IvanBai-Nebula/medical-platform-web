/**
 * 医疗知识服务Mock数据
 * 用于开发阶段模拟API响应，无需实际后端服务
 */

import type {
  CategoryListResponse,
  CreateKnowledgeParams,
  KnowledgeDetailResponse,
  KnowledgeItem,
  KnowledgeListResponse,
  LikeResponse,
  MedicalCategory,
  PaginationData,
  UpdateKnowledgeParams,
} from '../type/knowledge'

import type {
  CreateExperienceParams,
  ExperienceListResponse,
  ExperienceItem,
} from '../type/experience'
import { getKnowledgeCover, createUserAvatarWithText, createKnowledgeCoverWithTitle } from '@/utils/images'

// ====== Mock数据 ======

// 模拟医疗类别数据
const mockCategories: MedicalCategory[] = [
  {
    categoryId: 1,
    categoryName: '心血管疾病',
    description: '关于心脏和血管系统疾病的知识',
  },
  {
    categoryId: 2,
    categoryName: '呼吸系统疾病',
    description: '关于肺部和呼吸系统相关疾病的知识',
  },
  {
    categoryId: 3,
    categoryName: '消化系统疾病',
    description: '关于胃肠道和消化器官疾病的知识',
  },
  {
    categoryId: 4,
    categoryName: '神经系统疾病',
    description: '关于大脑、脊髓及神经系统疾病的知识',
  },
  {
    categoryId: 5,
    categoryName: '常见病防治',
    description: '日常高发病的预防和治疗知识',
  },
]

// 模拟医疗知识数据
let mockKnowledgeList: KnowledgeItem[] = [
  {
    knowledgeId: 1,
    title: '高血压基础知识与管理',
    introduction: '高血压基础知识',
    content:
      '<p>高血压是指动脉血压持续升高，收缩压≥140mmHg和/或舒张压≥90mmHg。</p><p>主要危害包括：</p><ul><li>心脏损害</li><li>脑血管意外</li><li>肾脏损害</li></ul>',
    coverImage: createKnowledgeCoverWithTitle('高血压基础知识'),
    videoUrl: 'https://example.com/videos/hypertension.mp4',
    categories: [mockCategories[0], mockCategories[4]],
    createdBy: 1,
    createdAt: '2023-11-15T08:30:00Z',
    updatedAt: '2023-11-15T08:30:00Z',
    viewCount: 1248,
    likeCount: 89,
    isLiked: false,
  },
  {
    knowledgeId: 2,
    title: '糖尿病患者饮食指南',
    introduction: '糖尿病饮食指南',
    content:
      '<p>糖尿病患者饮食需控制总热量，合理安排三大营养素比例，定时定量。</p><h3>糖尿病饮食原则</h3><ol><li>控制总热量</li><li>减少碳水化合物摄入</li><li>适量蛋白质</li><li>限制脂肪</li></ol>',
    coverImage: createKnowledgeCoverWithTitle('糖尿病饮食指南'),
    categories: [mockCategories[4]],
    createdBy: 1,
    createdAt: '2023-11-20T10:15:00Z',
    updatedAt: '2023-11-25T14:30:00Z',
    viewCount: 956,
    likeCount: 67,
    isLiked: true,
  },
  {
    knowledgeId: 3,
    title: '肺炎的症状识别与预防措施',
    introduction: '肺炎的症状与预防',
    content:
      '<p>肺炎是肺部炎症，常见症状有发热、咳嗽、气促等。</p><p>预防措施：</p><ul><li>接种疫苗</li><li>勤洗手</li><li>避免接触感染者</li></ul>',
    coverImage: createKnowledgeCoverWithTitle('肺炎的症状与预防'),
    videoUrl: 'https://example.com/videos/pneumonia.mp4',
    categories: [mockCategories[1], mockCategories[4]],
    createdBy: 1,
    createdAt: '2023-12-01T09:20:00Z',
    updatedAt: '2023-12-01T09:20:00Z',
    viewCount: 732,
    likeCount: 45,
    isLiked: false,
  },
  {
    knowledgeId: 4,
    title: '胃食管反流病的诊断与治疗',
    introduction: '胃食管反流病的治疗',
    content:
      '<p>胃食管反流病(GERD)是胃内容物反流入食管引起的一系列症状和并发症。</p><h3>治疗方法</h3><ol><li>生活方式调整</li><li>药物治疗：质子泵抑制剂、H2受体拮抗剂</li><li>严重者考虑手术</li></ol>',
    coverImage: createKnowledgeCoverWithTitle('胃食管反流病'),
    categories: [mockCategories[2]],
    createdBy: 1,
    createdAt: '2023-12-10T11:00:00Z',
    updatedAt: '2023-12-15T16:45:00Z',
    viewCount: 423,
    likeCount: 32,
    isLiked: false,
  },
  {
    knowledgeId: 5,
    title: '中风急救：FAST识别法',
    introduction: '中风的紧急处理',
    content:
      '<p>中风是脑血管突然破裂或堵塞导致脑组织损伤的急症，需要紧急处理。</p><h3>如何识别中风</h3><p>使用FAST原则：</p><ul><li>Face (面部): 脸部是否出现单侧下垂</li><li>Arms (手臂): 一侧手臂是否无力</li><li>Speech (言语): 言语是否含糊</li><li>Time (时间): 发现这些症状立即呼叫急救</li></ul>',
    coverImage: createKnowledgeCoverWithTitle('中风的紧急处理'),
    videoUrl: 'https://example.com/videos/stroke.mp4',
    categories: [mockCategories[0], mockCategories[3]],
    createdBy: 1,
    createdAt: '2023-12-20T13:30:00Z',
    updatedAt: '2023-12-20T13:30:00Z',
    viewCount: 1156,
    likeCount: 78,
    isLiked: true,
  },
]

// 模拟心得数据
let mockExperienceList: ExperienceItem[] = [
  {
    experienceId: 1,
    knowledgeId: 1,
    userId: 101,
    username: '张医生',
    avatar: createUserAvatarWithText('张'),
    title: '高血压管理的实践体会',
    content: '在临床实践中，我发现患者教育是高血压管理的关键。除了药物治疗，生活方式的调整同样重要。建议患者定期监测血压，保持健康的饮食习惯。',
    likeCount: 23,
    isLiked: false,
    status: 'approved',
    createdAt: '2023-11-18T14:20:00Z',
    updatedAt: '2023-11-18T14:20:00Z',
  },
  {
    experienceId: 2,
    knowledgeId: 1,
    userId: 102,
    username: '李护士',
    avatar: createUserAvatarWithText('李'),
    title: '家庭血压监测的重要性',
    content: '作为护士，我经常指导患者进行家庭血压监测。正确的监测方法和定期记录对于医生调整治疗方案非常有帮助。患者在家中的血压数据往往更能反映真实情况。',
    likeCount: 18,
    isLiked: true,
    status: 'approved',
    createdAt: '2023-11-20T09:15:00Z',
    updatedAt: '2023-11-20T09:15:00Z',
  },
  {
    experienceId: 3,
    knowledgeId: 2,
    userId: 103,
    username: '王营养师',
    avatar: createUserAvatarWithText('王'),
    title: '糖尿病饮食计划制定经验',
    content: '作为营养师，我制定了许多糖尿病患者的饮食计划。关键是要根据患者的具体情况，包括血糖控制水平、体重、运动量等因素来个性化调整。',
    likeCount: 31,
    isLiked: false,
    status: 'approved',
    createdAt: '2023-11-22T16:30:00Z',
    updatedAt: '2023-11-22T16:30:00Z',
  },
]

// ====== 工具函数 ======

// 模拟网络延迟
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// 生成下一个ID
const getNextId = (): number => {
  const maxId = Math.max(...mockKnowledgeList.map(item => item.knowledgeId), 0)
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

// 过滤函数
const filterKnowledge = (
  data: KnowledgeItem[],
  params?: {
    categoryId?: number
    keyword?: string
  },
): KnowledgeItem[] => {
  if (!params) { return [...data] }

  return data.filter((item) => {
    // 类别过滤
    if (params.categoryId && !item.categories?.some(cat => cat.categoryId === params.categoryId)) {
      return false
    }

    // 关键词过滤
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.introduction.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)
      )
    }

    return true
  })
}

// ====== Mock API实现 ======

/**
 * 获取知识列表API Mock
 */
export const mockGetKnowledgeList = async (params?: {
  page?: number
  pageSize?: number
  categoryId?: number
  keyword?: string
}): Promise<KnowledgeListResponse> => {
  await delay()

  const page = params?.page || 1
  const pageSize = params?.pageSize || 10

  // 应用过滤
  const filteredData = filterKnowledge(mockKnowledgeList, params)

  // 应用分页
  const { items, pagination } = paginateData(filteredData, page, pageSize)

  return {
    data: items,
    pagination,
  }
}

/**
 * 获取知识详情API Mock
 */
export const mockGetKnowledgeDetail = async (
  id: string | number,
): Promise<KnowledgeDetailResponse> => {
  await delay()

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const knowledge = mockKnowledgeList.find(item => item.knowledgeId === numericId)

  if (!knowledge) {
    throw new Error(`知识不存在 (ID: ${id})`)
  }

  return {
    data: { ...knowledge },
  }
}

/**
 * 创建知识API Mock
 */
export const mockCreateKnowledge = async (
  data: CreateKnowledgeParams,
): Promise<KnowledgeDetailResponse> => {
  await delay(800)

  // 获取关联的类别
  const categories = data.categoryIds
    .map(id => mockCategories.find(cat => cat.categoryId === id))
    .filter((cat): cat is MedicalCategory => cat !== undefined)

  // 创建新知识项
  const newKnowledge: KnowledgeItem = {
    knowledgeId: getNextId(),
    title: data.title,
    introduction: data.introduction,
    content: data.content,
    coverImage: data.coverImage,
    videoUrl: data.videoUrl,
    categories,
    createdBy: 1, // 假设当前用户ID为1
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    likeCount: 0,
    isLiked: false,
  }

  // 添加到列表
  mockKnowledgeList.push(newKnowledge)

  return {
    data: newKnowledge,
  }
}

/**
 * 更新知识API Mock
 */
export const mockUpdateKnowledge = async (
  id: string | number,
  data: UpdateKnowledgeParams,
): Promise<KnowledgeDetailResponse> => {
  await delay(700)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const index = mockKnowledgeList.findIndex(item => item.knowledgeId === numericId)

  if (index === -1) {
    throw new Error(`知识不存在 (ID: ${id})`)
  }

  // 获取要更新的知识
  const knowledge = mockKnowledgeList[index]

  // 更新字段
  const updatedKnowledge: KnowledgeItem = {
    ...knowledge,
    ...(data.title && { title: data.title }),
    ...(data.introduction && { introduction: data.introduction }),
    ...(data.content && { content: data.content }),
    ...(data.coverImage && { coverImage: data.coverImage }),
    ...(data.videoUrl && { videoUrl: data.videoUrl }),
    updatedAt: new Date().toISOString(),
    viewCount: knowledge.viewCount,
    likeCount: knowledge.likeCount,
    isLiked: knowledge.isLiked,
  }

  // 如果更新分类
  if (data.categoryIds) {
    updatedKnowledge.categories = data.categoryIds
      .map(id => mockCategories.find(cat => cat.categoryId === id))
      .filter((cat): cat is MedicalCategory => cat !== undefined)
  }

  // 更新列表
  mockKnowledgeList[index] = updatedKnowledge

  return {
    data: updatedKnowledge,
  }
}

/**
 * 删除知识API Mock
 */
export const mockDeleteKnowledge = async (id: string | number): Promise<{ success: boolean }> => {
  await delay(600)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const originalLength = mockKnowledgeList.length
  
  // 使用findIndex和splice来正确删除元素
  const index = mockKnowledgeList.findIndex(item => item.knowledgeId === numericId)
  
  if (index === -1) {
    throw new Error(`知识不存在 (ID: ${id})`)
  }
  
  mockKnowledgeList.splice(index, 1)

  return {
    success: mockKnowledgeList.length < originalLength,
  }
}

/**
 * 获取医疗类别API Mock
 */
export const mockGetMedicalCategories = async (): Promise<CategoryListResponse> => {
  await delay(300)

  return {
    data: [...mockCategories],
  }
}

/**
 * 获取知识相关心得API Mock
 */
export const mockGetKnowledgeExperiences = async (
  knowledgeId: string | number,
  params?: {
    page?: number
    pageSize?: number
  }
): Promise<ExperienceListResponse> => {
  await delay(400)

  const numericId = typeof knowledgeId === 'string' ? Number.parseInt(knowledgeId) : knowledgeId
  
  // 过滤指定知识的心得
  const knowledgeExperiences = mockExperienceList.filter(exp => exp.knowledgeId === numericId)
  
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  
  // 应用分页
  const { items, pagination } = paginateData(knowledgeExperiences, page, pageSize)

  return {
    data: items,
    pagination,
  }
}

/**
 * 创建心得API Mock
 */
export const mockCreateExperience = async (
  data: CreateExperienceParams
): Promise<ExperienceListResponse> => {
  await delay(600)

  const newExperience: ExperienceItem = {
    experienceId: Math.max(...mockExperienceList.map(exp => exp.experienceId), 0) + 1,
    knowledgeId: data.knowledgeId,
    userId: 1, // 假设当前用户ID为1
    username: '当前用户',
    avatar: createUserAvatarWithText('我'),
    title: data.title,
    content: data.content,
    likeCount: 0,
    isLiked: false,
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 添加到列表
  mockExperienceList.push(newExperience)

  // 返回该知识的所有心得
  return await mockGetKnowledgeExperiences(data.knowledgeId)
}

/**
 * 点赞知识API Mock
 */
export const mockLikeKnowledge = async (
  id: string | number
): Promise<LikeResponse> => {
  await delay(300)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const knowledge = mockKnowledgeList.find(item => item.knowledgeId === numericId)

  if (!knowledge) {
    throw new Error(`知识不存在 (ID: ${id})`)
  }

  // 切换点赞状态
  knowledge.isLiked = !knowledge.isLiked
  knowledge.likeCount += knowledge.isLiked ? 1 : -1

  return {
    success: true,
    isLiked: knowledge.isLiked,
    likeCount: knowledge.likeCount,
  }
}

/**
 * 点赞心得API Mock
 */
export const mockLikeExperience = async (
  id: string | number
): Promise<LikeResponse> => {
  await delay(300)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const experience = mockExperienceList.find(item => item.experienceId === numericId)

  if (!experience) {
    throw new Error(`心得不存在 (ID: ${id})`)
  }

  // 切换点赞状态
  experience.isLiked = !experience.isLiked
  experience.likeCount += experience.isLiked ? 1 : -1

  return {
    success: true,
    isLiked: experience.isLiked,
    likeCount: experience.likeCount,
  }
}

/**
 * 增加浏览量API Mock
 */
export const mockIncrementViewCount = async (
  id: string | number
): Promise<{ success: boolean; viewCount: number }> => {
  await delay(100)

  const numericId = typeof id === 'string' ? Number.parseInt(id) : id
  const knowledge = mockKnowledgeList.find(item => item.knowledgeId === numericId)

  if (!knowledge) {
    throw new Error(`知识不存在 (ID: ${id})`)
  }

  knowledge.viewCount += 1

  return {
    success: true,
    viewCount: knowledge.viewCount,
  }
}
