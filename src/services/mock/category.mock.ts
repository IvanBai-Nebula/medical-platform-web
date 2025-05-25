/**
 * 医疗分类管理Mock数据
 * 用于开发阶段模拟API响应，无需实际后端服务
 */

import type {
  CategoryListResponse,
  MedicalCategory,
} from '../type/knowledge'

// ====== Mock数据 ======

// 模拟医疗类别数据
let mockCategories: MedicalCategory[] = [
  {
    categoryId: 1,
    categoryName: '心血管疾病',
    description: '关于心脏和血管系统疾病的知识，包括高血压、冠心病、心律失常等',
    createdAt: '2023-10-01T08:00:00Z',
    updatedAt: '2023-10-01T08:00:00Z',
  },
  {
    categoryId: 2,
    categoryName: '呼吸系统疾病',
    description: '关于肺部和呼吸系统相关疾病的知识，包括哮喘、肺炎、慢阻肺等',
    createdAt: '2023-10-02T09:15:00Z',
    updatedAt: '2023-10-02T09:15:00Z',
  },
  {
    categoryId: 3,
    categoryName: '消化系统疾病',
    description: '关于胃肠道和消化器官疾病的知识，包括胃炎、肝炎、胆囊炎等',
    createdAt: '2023-10-03T10:30:00Z',
    updatedAt: '2023-10-03T10:30:00Z',
  },
  {
    categoryId: 4,
    categoryName: '神经系统疾病',
    description: '关于大脑、脊髓及神经系统疾病的知识，包括脑卒中、癫痫、帕金森病等',
    createdAt: '2023-10-04T11:45:00Z',
    updatedAt: '2023-10-04T11:45:00Z',
  },
  {
    categoryId: 5,
    categoryName: '常见病防治',
    description: '日常高发病的预防和治疗知识，包括感冒、发烧、头痛等常见症状',
    createdAt: '2023-10-05T13:00:00Z',
    updatedAt: '2023-10-05T13:00:00Z',
  },
  {
    categoryId: 6,
    categoryName: '内分泌疾病',
    description: '关于内分泌系统疾病的知识，包括糖尿病、甲状腺疾病、肾上腺疾病等',
    createdAt: '2023-10-06T14:15:00Z',
    updatedAt: '2023-10-06T14:15:00Z',
  },
  {
    categoryId: 7,
    categoryName: '骨科疾病',
    description: '关于骨骼、关节、肌肉系统疾病的知识，包括骨折、关节炎、腰椎间盘突出等',
    createdAt: '2023-10-07T15:30:00Z',
    updatedAt: '2023-10-07T15:30:00Z',
  },
  {
    categoryId: 8,
    categoryName: '皮肤科疾病',
    description: '关于皮肤疾病的知识，包括湿疹、皮炎、银屑病、痤疮等',
    createdAt: '2023-10-08T16:45:00Z',
    updatedAt: '2023-10-08T16:45:00Z',
  },
]

// ====== 工具函数 ======

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 获取下一个ID
const getNextId = (): number => {
  return Math.max(...mockCategories.map(c => c.categoryId)) + 1
}

// 验证分类名称是否重复
const isDuplicateName = (name: string, excludeId?: number): boolean => {
  return mockCategories.some(cat => 
    cat.categoryName === name && cat.categoryId !== excludeId
  )
}

// ====== Mock API函数 ======

/**
 * 获取医疗分类列表API Mock
 */
export const mockGetMedicalCategories = async (): Promise<CategoryListResponse> => {
  await delay(300)

  return {
    data: [...mockCategories],
  }
}

/**
 * 创建医疗分类API Mock
 */
export const mockCreateCategory = async (data: {
  categoryName: string
  description?: string
}): Promise<{ data: MedicalCategory }> => {
  await delay(800)

  // 验证分类名称
  if (!data.categoryName.trim()) {
    throw new Error('分类名称不能为空')
  }

  if (data.categoryName.length > 50) {
    throw new Error('分类名称不能超过50个字符')
  }

  if (isDuplicateName(data.categoryName.trim())) {
    throw new Error('分类名称已存在')
  }

  // 创建新分类
  const newCategory: MedicalCategory = {
    categoryId: getNextId(),
    categoryName: data.categoryName.trim(),
    description: data.description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 添加到列表
  mockCategories.push(newCategory)

  return {
    data: newCategory,
  }
}

/**
 * 更新医疗分类API Mock
 */
export const mockUpdateCategory = async (
  id: number,
  data: {
    categoryName?: string
    description?: string
  }
): Promise<{ data: MedicalCategory }> => {
  await delay(700)

  const index = mockCategories.findIndex(cat => cat.categoryId === id)

  if (index === -1) {
    throw new Error(`分类不存在 (ID: ${id})`)
  }

  // 验证分类名称
  if (data.categoryName !== undefined) {
    if (!data.categoryName.trim()) {
      throw new Error('分类名称不能为空')
    }

    if (data.categoryName.length > 50) {
      throw new Error('分类名称不能超过50个字符')
    }

    if (isDuplicateName(data.categoryName.trim(), id)) {
      throw new Error('分类名称已存在')
    }
  }

  // 获取要更新的分类
  const category = mockCategories[index]

  // 更新字段
  const updatedCategory: MedicalCategory = {
    ...category,
    ...(data.categoryName !== undefined && { categoryName: data.categoryName.trim() }),
    ...(data.description !== undefined && { description: data.description.trim() || undefined }),
    updatedAt: new Date().toISOString(),
  }

  // 更新列表
  mockCategories[index] = updatedCategory

  return {
    data: updatedCategory,
  }
}

/**
 * 删除医疗分类API Mock
 */
export const mockDeleteCategory = async (id: number): Promise<{ success: boolean }> => {
  await delay(600)

  const index = mockCategories.findIndex(cat => cat.categoryId === id)

  if (index === -1) {
    throw new Error(`分类不存在 (ID: ${id})`)
  }

  // 检查是否有关联的知识内容
  const hasKnowledge = Math.random() > 0.7 // 30% 概率有关联内容
  if (hasKnowledge) {
    const knowledgeCount = Math.floor(Math.random() * 10) + 1
    throw new Error(`该分类下还有 ${knowledgeCount} 个知识内容，请先移除相关内容后再删除分类`)
  }

  // 从列表中移除
  mockCategories.splice(index, 1)

  return {
    success: true,
  }
}

/**
 * 获取分类统计信息API Mock
 */
export const mockGetCategoryStats = async (categoryId: number): Promise<{
  knowledgeCount: number
  experienceCount: number
}> => {
  await delay(200)

  const category = mockCategories.find(cat => cat.categoryId === categoryId)
  
  if (!category) {
    throw new Error(`分类不存在 (ID: ${categoryId})`)
  }

  // 模拟统计数据
  return {
    knowledgeCount: Math.floor(Math.random() * 50) + 1,
    experienceCount: Math.floor(Math.random() * 30) + 1,
  }
}

/**
 * 批量删除分类API Mock
 */
export const mockBatchDeleteCategories = async (ids: number[]): Promise<{
  success: boolean
  deletedCount: number
  failedIds: number[]
}> => {
  await delay(1000)

  const deletedIds: number[] = []
  const failedIds: number[] = []

  for (const id of ids) {
    const index = mockCategories.findIndex(cat => cat.categoryId === id)
    
    if (index === -1) {
      failedIds.push(id)
      continue
    }

    // 模拟部分分类有关联内容无法删除
    const hasKnowledge = Math.random() > 0.8
    if (hasKnowledge) {
      failedIds.push(id)
      continue
    }

    mockCategories.splice(index, 1)
    deletedIds.push(id)
  }

  return {
    success: failedIds.length === 0,
    deletedCount: deletedIds.length,
    failedIds,
  }
}

/**
 * 重置Mock数据（用于测试）
 */
export const resetMockCategories = (): void => {
  mockCategories = [
    {
      categoryId: 1,
      categoryName: '心血管疾病',
      description: '关于心脏和血管系统疾病的知识',
      createdAt: '2023-10-01T08:00:00Z',
      updatedAt: '2023-10-01T08:00:00Z',
    },
    {
      categoryId: 2,
      categoryName: '呼吸系统疾病',
      description: '关于肺部和呼吸系统相关疾病的知识',
      createdAt: '2023-10-02T09:15:00Z',
      updatedAt: '2023-10-02T09:15:00Z',
    },
    {
      categoryId: 3,
      categoryName: '消化系统疾病',
      description: '关于胃肠道和消化器官疾病的知识',
      createdAt: '2023-10-03T10:30:00Z',
      updatedAt: '2023-10-03T10:30:00Z',
    },
    {
      categoryId: 4,
      categoryName: '神经系统疾病',
      description: '关于大脑、脊髓及神经系统疾病的知识',
      createdAt: '2023-10-04T11:45:00Z',
      updatedAt: '2023-10-04T11:45:00Z',
    },
    {
      categoryId: 5,
      categoryName: '常见病防治',
      description: '日常高发病的预防和治疗知识',
      createdAt: '2023-10-05T13:00:00Z',
      updatedAt: '2023-10-05T13:00:00Z',
    },
  ]
} 