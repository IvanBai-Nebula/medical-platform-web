<template>
  <div class="category-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="ep:folder" class="title-icon" />
          医疗分类管理
        </h1>
        <p class="page-description">管理医疗知识分类，维护分类体系结构</p>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary"
          @click="openCreateDialog"
        >
          <Icon icon="ep:plus" />
          新增分类
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="ep:folder" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalCategories }}</div>
          <div class="stat-label">总分类数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="ep:document" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalKnowledge }}</div>
          <div class="stat-label">关联知识</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="ep:trend-charts" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ activeCategories }}</div>
          <div class="stat-label">活跃分类</div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类名称或描述..."
          clearable
          @clear="clearSearch"
        >
          <template #prefix>
            <Icon icon="ep:search" />
          </template>
        </el-input>
      </div>
      <div class="filter-actions">
        <el-button 
          :loading="loading"
          @click="refreshData"
        >
          <Icon icon="ep:refresh" />
          刷新
        </el-button>
        <div class="view-toggle">
          <el-button-group>
            <el-button 
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <Icon icon="ep:grid" />
            </el-button>
            <el-button 
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
            >
              <Icon icon="ep:list" />
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="categories-section">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredCategories.length === 0" class="empty-state">
        <el-empty
          :image-size="120"
          :description="searchKeyword ? '未找到匹配的分类' : '暂无分类'"
        >
          <template #image>
            <Icon icon="ep:folder-add" />
          </template>
          <el-button 
            v-if="!searchKeyword"
            type="primary"
            @click="openCreateDialog"
          >
            创建分类
          </el-button>
        </el-empty>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="categories-grid">
        <div 
          v-for="category in filteredCategories"
          :key="category.id || category.categoryId"
          class="category-card"
        >
          <div class="card-header">
            <div class="category-icon">
              <Icon icon="ep:folder" />
            </div>
            <div class="card-actions">
              <el-button 
                size="small"
                type="primary"
                link
                @click="openEditDialog(category)"
              >
                <Icon icon="ep:edit" />
              </el-button>
              <el-button 
                size="small"
                type="danger"
                link
                @click="confirmDelete(category)"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
          </div>
          <div class="card-content">
            <h3 class="category-name">{{ category.categoryName }}</h3>
            <p class="category-description">
              {{ category.description || '暂无描述' }}
            </p>
          </div>
          <div class="card-footer">
            <div class="category-stats">
              <el-tag size="small" type="info">
                <Icon icon="ep:document" />
                {{ category.knowledgeCount !== undefined 
                   ? category.knowledgeCount 
                   : getCategoryKnowledgeCount(Number(category.categoryId || category.id || 0)) }} 知识
              </el-tag>
              <span class="create-date">
                <Icon icon="ep:calendar" />
                {{ formatDate(category.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="categories-table">
        <el-table 
          :data="filteredCategories"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="categoryName" label="分类名称" min-width="150">
            <template #default="{ row }">
              <div class="name-cell">
                <Icon icon="ep:folder" class="folder-icon" />
                <span class="name">{{ row.categoryName }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="description" label="描述" min-width="200">
            <template #default="{ row }">
              <span class="description">{{ row.description || '暂无描述' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="关联知识" width="120" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">
                {{ getCategoryKnowledgeCount(Number(row.categoryId || row.id || 0)) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createdAt" label="创建时间" width="120">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  size="small"
                  type="primary"
                  link
                  @click="openEditDialog(row)"
                >
                  <Icon icon="ep:edit" />
                </el-button>
                <el-button 
                  size="small"
                  type="danger"
                  link
                  @click="confirmDelete(row)"
                >
                  <Icon icon="ep:delete" />
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建/编辑分类对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="isEditing ? '编辑分类' : '新增分类'"
      width="500px"
      @close="closeDialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="categoryName">
          <el-input
            v-model="formData.categoryName"
            placeholder="请输入分类名称"
            maxlength="50"
            show-word-limit
          />
          <div class="form-tip">分类名称应简洁明确，便于用户理解</div>
        </el-form-item>
        
        <el-form-item label="分类描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入分类描述（可选）"
            :rows="4"
            maxlength="200"
            show-word-limit
          />
          <div class="form-tip">详细描述该分类包含的医疗知识范围</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button 
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="确认删除"
      width="400px"
      @close="closeDeleteDialog"
    >
      <div class="delete-warning">
        <div class="warning-content">
          <Icon icon="ep:warning" class="warning-icon" />
          <div class="warning-text">
            <p class="warning-title">您确定要删除分类"{{ categoryToDelete?.categoryName }}"吗？</p>
            <p class="warning-description">
              删除后该分类下的所有知识将失去分类关联，此操作不可撤销。
            </p>
            <div v-if="categoryToDelete && getCategoryKnowledgeCount(Number(categoryToDelete.id || categoryToDelete.categoryId || 0)) > 0" class="warning-stats">
              <el-tag type="warning" size="small">
                该分类下有 {{ getCategoryKnowledgeCount(Number(categoryToDelete.id || categoryToDelete.categoryId || 0)) }} 个知识内容
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDeleteDialog">取消</el-button>
          <el-button 
            type="danger"
            :loading="deleting"
            @click="handleDelete"
          >
            确认删除
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { MedicalCategory } from '@/types'
import { 
  getMedicalCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  getCategoryStats
} from '@/services/api/category'

// 数据状态
const loading = ref(false)
const categories = ref<MedicalCategory[]>([])
const searchKeyword = ref('')
const viewMode = ref<'grid' | 'list'>('grid')

// 对话框状态
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)

// 表单数据
const formData = reactive({
  categoryName: '',
  description: ''
})

// 删除相关
const categoryToDelete = ref<MedicalCategory | null>(null)

// 编辑中的分类
const editingCategory = ref<MedicalCategory | null>(null)

// 分类统计数据缓存
const categoryStats = ref<Record<number, { knowledgeCount: number; experienceCount: number }>>({})

// 表单验证规则
const formRules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const formRef = ref()

// 计算属性
const filteredCategories = computed(() => {
  if (!categories.value || !Array.isArray(categories.value)) {
    return []
  }

  if (!searchKeyword.value.trim()) {
    return categories.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return categories.value.filter(category => 
    category.categoryName.toLowerCase().includes(keyword) ||
    (category.description && category.description.toLowerCase().includes(keyword))
  )
})

const totalCategories = computed(() => {
  return Array.isArray(categories.value) ? categories.value.length : 0
})

const activeCategories = computed(() => {
  if (!Array.isArray(categories.value)) return 0
  // 使用getCategoryKnowledgeCount函数，它已经兼容新旧API格式
  return categories.value.filter(cat => {
    // 确保返回数字类型的ID
    const catId = cat.id ? Number(cat.id) : Number(cat.categoryId || 0)
    return getCategoryKnowledgeCount(catId) > 0
  }).length
})

const totalKnowledge = computed(() => {
  if (!Array.isArray(categories.value)) return 0
  // 使用getCategoryKnowledgeCount函数，它已经兼容新旧API格式
  return categories.value.reduce((sum, cat) => {
    // 确保返回数字类型的ID
    const catId = cat.id ? Number(cat.id) : Number(cat.categoryId || 0)
    return sum + getCategoryKnowledgeCount(catId)
  }, 0)
})

// 方法
const loadCategories = async () => {
  try {
    loading.value = true
    
    const response = await getMedicalCategories()
    
    // 确保categories是一个数组
    categories.value = Array.isArray(response.data) ? response.data : []
    
    // 由于新API已经包含统计数据，不需要再单独获取统计
    // 如果是旧格式API，才需要单独加载
    if (categories.value.length > 0 && 
        categories.value[0].id !== undefined && 
        categories.value[0].knowledgeCount === undefined) {
      await loadCategoryStats()
    }
  } catch (error: any) {
    console.error('加载分类失败:', error)
    ElMessage.error(error.message || '加载分类数据失败')
    categories.value = [] // 确保失败时也设置为空数组
  } finally {
    loading.value = false
  }
}

// 加载分类统计数据
const loadCategoryStats = async () => {
  if (!Array.isArray(categories.value)) {
    return
  }
  
  for (const category of categories.value) {
    // 确保分类ID有效
    if (!category || category.categoryId === undefined || category.categoryId === null) {
      console.warn('跳过无效的分类ID:', category)
      continue
    }
    
    try {
      const stats = await getCategoryStats(category.categoryId)
      categoryStats.value[category.categoryId] = stats
    } catch (error) {
      console.error(`获取分类 ${category.categoryId} 统计失败:`, error)
      categoryStats.value[category.categoryId] = { knowledgeCount: 0, experienceCount: 0 }
    }
  }
}

// 获取分类ID (兼容新旧API格式)
const getCategoryId = (category: any): number => {
  // 新API使用id字段
  if (category.id !== undefined) {
    return Number(category.id)
  }
  // 旧API使用categoryId字段
  return Number(category.categoryId || 0)
}

const getCategoryKnowledgeCount = (categoryId: number): number => {
  // 查找分类
  const category = categories.value.find(cat => 
    Number(cat.id || cat.categoryId) === categoryId
  )
  
  // 新API直接在分类对象中包含知识计数
  if (category && category.knowledgeCount !== undefined) {
    return Number(category.knowledgeCount)
  }
  
  // 兼容旧方式：从单独获取的统计数据中读取
  return categoryStats.value[categoryId]?.knowledgeCount || 0
}

const refreshData = () => {
  loadCategories()
}

const clearSearch = () => {
  searchKeyword.value = ''
}

const openCreateDialog = () => {
  isEditing.value = false
  editingCategory.value = null
  formData.categoryName = ''
  formData.description = ''
  showDialog.value = true
}

const openEditDialog = (category: MedicalCategory) => {
  isEditing.value = true
  editingCategory.value = category
  formData.categoryName = category.categoryName
  formData.description = category.description || ''
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  isEditing.value = false
  editingCategory.value = null
  formData.categoryName = ''
  formData.description = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEditing.value && editingCategory.value) {
      // 更新分类
      const categoryId = getCategoryId(editingCategory.value)
      await updateCategory(categoryId, formData)
      ElMessage.success('分类更新成功')
    } else {
      // 创建分类
      await createCategory(formData)
      ElMessage.success('分类创建成功')
    }
    
    closeDialog()
    await loadCategories()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (category: MedicalCategory) => {
  categoryToDelete.value = category
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  categoryToDelete.value = null
}

const handleDelete = async () => {
  if (!categoryToDelete.value) return

  try {
    deleting.value = true
    const categoryId = getCategoryId(categoryToDelete.value)
    await deleteCategory(categoryId)
    ElMessage.success('分类删除成功')
    closeDeleteDialog()
    await loadCategories()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return '未知'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '未知'
  }
}

// API调用函数
const createCategory = async (data: { categoryName: string; description: string }) => {
  const response = await apiCreateCategory(data)
  return response.data
}

const updateCategory = async (id: number, data: { categoryName: string; description: string }) => {
  const response = await apiUpdateCategory(id, data)
  return response.data
}

const deleteCategory = async (id: number) => {
  const response = await apiDeleteCategory(id)
  return response.success
}

// 生命周期
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-management-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--color-bg-primary);
  min-height: calc(100vh - 120px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.title-icon {
  font-size: 28px;
  color: var(--color-primary);
}

.page-description {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 14px;
}

/* 搜索区域 */
.search-section {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
}

.search-bar {
  flex: 1;
  max-width: 400px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-toggle {
  margin-left: 8px;
}

/* 分类区域 */
.categories-section {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* 状态样式 */
.loading-state,
.empty-state {
  padding: 40px 20px;
}

.empty-state {
  text-align: center;
}

.empty-state :deep(.el-empty__image svg) {
  width: 120px;
  height: 120px;
  color: var(--color-text-muted);
}

/* 网格视图 */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 24px;
}

.category-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.category-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.card-content {
  margin-bottom: 16px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.category-description {
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  font-size: 14px;
}

.card-footer {
  border-top: 1px solid var(--color-border-secondary);
  padding-top: 16px;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 12px;
}

/* 列表视图 */
.categories-table {
  padding: 24px;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-icon {
  color: var(--color-primary);
  font-size: 16px;
}

.name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.description {
  color: var(--color-text-secondary);
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-tip {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* 删除警告 */
.delete-warning {
  padding: 16px 0;
}

.warning-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 24px;
  color: var(--color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-text {
  flex: 1;
}

.warning-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.warning-description {
  color: var(--color-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.warning-stats {
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-management-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .search-section {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filter-actions {
    justify-content: space-between;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  
  .categories-table {
    padding: 16px;
  }
}
</style>