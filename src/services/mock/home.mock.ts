/**
 * 首页Mock数据
 * 提供首页相关API的模拟实现
 */

import type {
  HomeExperienceListResponse,
  HomeKnowledgeListResponse,
  HomeStatisticsResponse,
  LatestExperienceItem,
  LatestExperienceParams,
  LatestKnowledgeItem,
  LatestKnowledgeParams,
  PlatformStatItem,
} from '../type/home'

// 模拟延迟函数
const mockDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms))

// 生成随机统计数据
const generateStatData = (): {
  knowledgeCount: PlatformStatItem
  categoryCount: PlatformStatItem
  experienceCount: PlatformStatItem
  userCount: PlatformStatItem
} => {
  return {
    knowledgeCount: {
      value: (Math.floor(Math.random() * 500) + 1000).toLocaleString(),
      trend: Math.floor(Math.random() * 20) + 5, // 5-25%
    },
    categoryCount: {
      value: (Math.floor(Math.random() * 10) + 20).toString(),
      trend: Math.floor(Math.random() * 15) + 3, // 3-18%
    },
    experienceCount: {
      value: (Math.floor(Math.random() * 1000) + 3000).toLocaleString(),
      trend: Math.floor(Math.random() * 30) + 10, // 10-40%
    },
    userCount: {
      value: (Math.floor(Math.random() * 5000) + 10000).toLocaleString(),
      trend: Math.floor(Math.random() * 25) + 8, // 8-33%
    },
  }
}

// 医疗知识分类
const medicalCategories = [
  { id: 1, name: '心血管疾病' },
  { id: 2, name: '内分泌疾病' },
  { id: 3, name: '皮肤科' },
  { id: 4, name: '神经内科' },
  { id: 5, name: '骨科' },
  { id: 6, name: '消化内科' },
  { id: 7, name: '呼吸内科' },
  { id: 8, name: '泌尿外科' },
  { id: 9, name: '妇产科' },
  { id: 10, name: '儿科' },
  { id: 11, name: '眼科' },
  { id: 12, name: '口腔科' },
]

// 知识标题库
const knowledgeTitles = [
  '高血压的预防与控制策略',
  '糖尿病患者的科学饮食指南',
  '常见皮肤病的识别与处理',
  '脑卒中的早期识别与急救',
  '骨折康复训练的正确方法',
  '慢性胃炎的预防和治疗',
  '哮喘患者的日常护理要点',
  '肾结石的形成原因与预防',
  '心律不齐的症状与注意事项',
  '甲状腺疾病的诊断与治疗',
  '湿疹的护理方法与注意事项',
  '帕金森病的康复训练指导',
  '关节炎患者的日常保养',
  '慢性胃炎的饮食调理',
  '慢阻肺的预防知识详解',
  '前列腺保健的常识指南',
  '妊娠期糖尿病的管理',
  '小儿感冒的预防与护理',
  '白内障手术后的注意事项',
  '口腔溃疡的治疗与预防',
  '失眠症的非药物治疗方法',
  '颈椎病的预防与康复',
  '乳腺增生的日常护理',
  '痛风患者的饮食管理',
]

// 总结库
const knowledgeSummaries = [
  '深入了解疾病的成因、症状及日常预防措施，提供科学、实用的治疗建议和生活指导',
  '基于最新医学研究，提供科学的饮食搭配方案，帮助患者更好地管理病情和改善生活质量',
  '详细介绍日常生活中常见问题的识别方法与正确处理步骤，避免延误最佳治疗时机',
  '掌握早期症状识别技巧和紧急处理措施，关键时刻能够及时应对，预防严重后果发生',
  '提供专业的康复训练指导方案，促进功能恢复，提高生活质量和自理能力',
  '全面解析预防和治疗方案，从根本上改善病情，提升患者的整体健康水平',
  '结合临床实践经验，提供个性化的护理建议，帮助患者建立科学的健康管理习惯',
  '基于循证医学证据，分享最新的诊疗进展和研究成果，为临床决策提供参考依据',
]

// 作者姓名库
const authorNames = [
  '张医生', '李教授', '王主任', '刘专家', '陈医师', '杨教授', '赵主任', '孙专家',
  '周医生', '吴教授', '徐主任', '朱医师', '高教授', '林主任', '何专家', '罗医生',
]

// 心得标题库
const experienceTitles = [
  '学习心血管疾病知识的深度感悟',
  '营养学学习笔记与实践心得分享',
  '健康生活方式的探索与体会',
  '临床实习中的珍贵经验总结',
  '医学基础知识学习的系统方法',
  '患者沟通技巧的实践心得',
  '急救知识学习的重要性体会',
  '药理学学习笔记与记忆技巧',
  '人体解剖学习的有效方法',
  '病理学实验的观察与思考',
  '内科学习中的难点突破',
  '外科技能训练的经验分享',
  '诊断学实践中的思维培养',
  '医学伦理学的深度思考',
  '临床思维能力的系统培养',
  '医患关系处理的实践经验',
  '预防医学理念的深化理解',
  '康复医学实践的创新思路',
  '中西医结合治疗的体会',
  '医学科研方法的学习心得',
]

// 心得内容库
const experienceContents = [
  '通过系统学习和临床实践，我深刻认识到这一领域知识的重要性。在学习过程中，我不仅掌握了理论知识，更重要的是学会了如何将理论应用于实际工作中。希望通过分享这些心得，能够帮助更多的学习者建立正确的认知框架。',
  '在学习这门课程的过程中，我采用了多种学习方法，包括理论学习、案例分析、实践操作等。通过不断的学习和反思，我逐渐形成了自己的学习体系。这些经验和方法对我后续的学习和工作都产生了积极的影响。',
  '作为一名医学学习者，我深感责任重大。在学习过程中，我始终坚持严谨的态度，认真对待每一个知识点。通过与同学、老师的交流讨论，我不断完善自己的知识结构，提高专业素养。',
  '在实践中学习，在学习中实践，这是我最深的体会。理论知识固然重要，但只有通过实际操作和临床实践，才能真正理解和掌握所学内容。希望我的经验能为其他学习者提供一些参考。',
  '学习是一个持续的过程，需要保持好奇心和求知欲。在这个过程中，我学会了如何提出问题、分析问题和解决问题。这些能力不仅在学习中有用，在未来的职业生涯中也将发挥重要作用。',
]

// 学习者姓名库
const learnerNames = [
  '张同学', '李同学', '王同学', '刘同学', '陈同学', '杨同学', '赵同学', '孙同学',
  '周同学', '吴同学', '徐同学', '朱同学', '高同学', '林同学', '何同学', '罗同学',
  '郑同学', '谢同学', '韩同学', '唐同学', '冯同学', '于同学', '董同学', '萧同学',
]

// 生成随机日期（最近30天内）
const generateRandomDate = () => {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0]
}

// 生成医疗知识条目
const generateKnowledgeItem = (id: number): LatestKnowledgeItem => {
  const category = medicalCategories[Math.floor(Math.random() * medicalCategories.length)]
  
  return {
    id,
    title: knowledgeTitles[Math.floor(Math.random() * knowledgeTitles.length)],
    summary: knowledgeSummaries[Math.floor(Math.random() * knowledgeSummaries.length)],
    category: category.name,
    categoryId: category.id,
    createdAt: generateRandomDate(),
    readCount: Math.floor(Math.random() * 2000) + 100,
    likeCount: Math.floor(Math.random() * 300) + 20,
    // 管理员信息
    adminId: Math.floor(Math.random() * 10) + 1, // 管理员ID 1-10
    username: authorNames[Math.floor(Math.random() * authorNames.length)],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin${Math.floor(Math.random() * 10) + 1}`,
  }
}

// 生成学习心得条目
const generateExperienceItem = (id: number): LatestExperienceItem => {
  const userId = Math.floor(Math.random() * 200) + 101
  const username = learnerNames[Math.floor(Math.random() * learnerNames.length)]
  
  return {
    id,
    title: experienceTitles[Math.floor(Math.random() * experienceTitles.length)],
    content: experienceContents[Math.floor(Math.random() * experienceContents.length)],
    createdAt: generateRandomDate(),
    status: 'approved' as const,
    likeCount: Math.floor(Math.random() * 200) + 10,
    knowledgeId: Math.floor(Math.random() * 100) + 1,
    knowledgeTitle: knowledgeTitles[Math.floor(Math.random() * knowledgeTitles.length)],
    // 用户信息
    userId,
    username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${userId}`,
  }
}

/**
 * 获取首页统计数据
 */
export async function mockGetHomeStatistics(): Promise<HomeStatisticsResponse> {
  await mockDelay(500)
  
  return {
    data: generateStatData(),
  }
}

/**
 * 获取最新医疗知识列表
 */
export async function mockGetLatestKnowledge(
  params: LatestKnowledgeParams = {},
): Promise<HomeKnowledgeListResponse> {
  await mockDelay()
  
  const { page = 1, pageSize = 8, categoryId, sortBy = 'latest' } = params
  
  // 模拟总数据量
  const totalCount = 156
  const startIndex = (page - 1) * pageSize
  
  // 生成当前页数据
  const data = Array.from({ length: pageSize }, (_, index) => {
    const item = generateKnowledgeItem(startIndex + index + 1)
    
    // 如果指定了分类，过滤数据
    if (categoryId) {
      item.categoryId = categoryId
      item.category = medicalCategories.find(cat => cat.id === categoryId)?.name || '其他'
    }
    
    return item
  })
  
  // 根据排序方式调整数据
  if (sortBy === 'popular') {
    data.sort((a, b) => b.readCount - a.readCount)
  } else if (sortBy === 'trending') {
    data.sort((a, b) => b.likeCount - a.likeCount)
  }
  
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasMore = page < totalPages
  
  return {
    data,
    pagination: {
      total: totalCount,
      current: page,
      pageSize,
      totalPages,
      hasMore,
    },
  }
}

/**
 * 获取最新学习心得列表
 */
export async function mockGetLatestExperience(
  params: LatestExperienceParams = {},
): Promise<HomeExperienceListResponse> {
  await mockDelay()
  
  const { page = 1, pageSize = 6, status = 'approved', sortBy = 'latest' } = params
  
  // 模拟总数据量
  const totalCount = 128
  const startIndex = (page - 1) * pageSize
  
  // 生成当前页数据
  const data = Array.from({ length: pageSize }, (_, index) => {
    const item = generateExperienceItem(startIndex + index + 1)
    
    // 如果指定了状态，过滤数据
    if (status !== 'all') {
      item.status = status as any
    }
    
    return item
  })
  
  // 根据排序方式调整数据
  if (sortBy === 'popular') {
    data.sort((a, b) => b.likeCount - a.likeCount)
  }
  
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasMore = page < totalPages
  
  return {
    data,
    pagination: {
      total: totalCount,
      current: page,
      pageSize,
      totalPages,
      hasMore,
    },
  }
} 