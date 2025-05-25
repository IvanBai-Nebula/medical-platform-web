<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { getKnowledgeList, getMedicalCategories, deleteKnowledge as deleteKnowledgeAPI } from '@/services'
import type { KnowledgeItem, MedicalCategory } from '@/types'
import { ElMessage } from 'element-plus'

// 子组件
import KnowledgeListMode from '@/components/knowledge/KnowledgeListMode.vue'
import KnowledgeWaterfallMode from '@/components/knowledge/KnowledgeWaterfallMode.vue'
import KnowledgeFilter from '@/components/knowledge/KnowledgeFilter.vue'

// 工具类
import { getDefaultViewMode, getViewModeTitle, getViewModeIcon } from '@/utils/viewMode'
import type { ViewMode } from '@/utils/viewMode'

const userStore = useUserStore()
const router = useRouter()

// 响应式数据
const viewMode = ref<ViewMode>('waterfall') // 临时默认值，会在初始化时重新设置
const knowledgeList = ref<KnowledgeItem[]>([])
const categories = ref<MedicalCategory[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 分页和筛选状态
const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = ref(0)
const hasMore = ref(true)
const selectedCategoryId = ref<number | undefined>(undefined)
const searchKeyword = ref('')

// 计算属性
const isAdmin = computed(() => userStore.isAdmin)
const canCreateKnowledge = computed(() => userStore.isAuthenticated && isAdmin.value)

// 初始化默认视图模式
const initializeViewMode = () => {
  viewMode.value = getDefaultViewMode({ isAdmin: isAdmin.value })
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'waterfall' : 'list'
  // 切换模式时重新加载数据
  loadKnowledgeData(true)
}

// 加载医疗分类
const loadCategories = async () => {
  try {
    const response = await getMedicalCategories()
    categories.value = response.data
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

// 加载知识列表数据
const loadKnowledgeData = async (reset: boolean = false) => {
  try {
    loading.value = true
    error.value = null

    const page = reset ? 1 : currentPage.value
    
    const response = await getKnowledgeList({
      page,
      pageSize: pageSize.value,
      categoryId: selectedCategoryId.value,
      keyword: searchKeyword.value.trim() || undefined,
    })

    // 处理嵌套的API响应结构
    const knowledgeData = response.data?.data || response.data || []
    const paginationData = response.data?.pagination || response.pagination

    if (!paginationData) {
      throw new Error('无效的分页数据')
    }

    if (reset) {
      knowledgeList.value = knowledgeData
      currentPage.value = 1
    } else {
      knowledgeList.value.push(...knowledgeData)
    }

    totalPages.value = paginationData.totalPages
    hasMore.value = currentPage.value < totalPages.value

    if (hasMore.value) {
      currentPage.value++
    }
  } catch (err: any) {
    error.value = err.message || '加载知识数据失败'
    console.error('加载知识数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 处理筛选变化
const handleFilterChange = (filters: { categoryId?: number; keyword: string }) => {
  selectedCategoryId.value = filters.categoryId
  searchKeyword.value = filters.keyword
  loadKnowledgeData(true)
}

// 处理分页变化（列表模式）
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadKnowledgeData(true)
}

// 处理无限滚动（瀑布流模式）
const handleLoadMore = () => {
  if (hasMore.value && !loading.value) {
    loadKnowledgeData(false)
  }
}

// 创建新知识
const createKnowledge = () => {
  router.push('/knowledge/create')
}

// 查看知识详情
const viewKnowledgeDetail = (id: number) => {
  router.push(`/knowledge/${id}`)
}

// 编辑知识（仅管理员）
const editKnowledge = (id: number) => {
  if (canCreateKnowledge.value) {
    router.push(`/knowledge/edit/${id}`)
  }
}

// 删除知识（仅管理员）
const handleDeleteKnowledge = async (id: number) => {
  if (!canCreateKnowledge.value) return

  // 使用自定义确认对话框
  showDeleteConfirm.value = true
  deleteTargetId.value = id
}

// 删除确认相关状态
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)
const deleting = ref(false)

// 确认删除
const confirmDelete = async () => {
  if (!deleteTargetId.value) return
  
  try {
    deleting.value = true
    await deleteKnowledgeAPI(deleteTargetId.value)
    
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    deleteTargetId.value = null
    loadKnowledgeData(true)
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

// 初始化数据
onMounted(async () => {
  // 初始化视图模式
  initializeViewMode()
  
  await Promise.all([
    loadCategories(),
    loadKnowledgeData(true)
  ])
})
</script>

<template>
  <div class="knowledge-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="fluent:book-24-filled" />
          医疗知识库
        </h1>
        <p class="page-subtitle">浏览和管理平台的医疗健康知识</p>
      </div>
      
      <div class="header-actions">
        <!-- 创建按钮 -->
        <button 
          v-if="canCreateKnowledge"
          class="create-btn"
          @click="createKnowledge"
        >
          <Icon icon="fluent:add-24-filled" />
          <span>创建知识</span>
          <div class="btn-shine"></div>
        </button>
        
        <!-- 视图模式切换 -->
        <button 
          class="view-toggle-btn" 
          @click="toggleViewMode" 
          :title="getViewModeTitle(viewMode)"
        >
          <Icon :icon="getViewModeIcon(viewMode)" />
        </button>
      </div>
    </div>

    <!-- 筛选组件 -->
    <KnowledgeFilter
      :categories="categories"
      :loading="loading"
      @filter-change="handleFilterChange"
    />

    <!-- 错误状态 -->
    <div v-if="error" class="error-state">
      <Icon icon="fluent:warning-24-filled" />
      <span>{{ error }}</span>
      <button class="retry-btn" @click="loadKnowledgeData(true)">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && knowledgeList.length === 0" class="empty-state">
      <Icon icon="fluent:book-24-regular" />
      <h3>暂无知识内容</h3>
      <p>{{ searchKeyword || selectedCategoryId ? '没有找到匹配的知识内容' : '还没有发布任何知识内容' }}</p>
      <button v-if="canCreateKnowledge" class="create-first-btn" @click="createKnowledge">
        创建第一篇知识
      </button>
    </div>

    <!-- 内容区域 -->
    <div v-else class="knowledge-content">
      <!-- 列表模式 -->
      <KnowledgeListMode
        v-if="viewMode === 'list'"
        :knowledge-list="knowledgeList"
        :loading="loading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :can-edit="canCreateKnowledge"
        @view-detail="viewKnowledgeDetail"
        @edit="editKnowledge"
        @delete="handleDeleteKnowledge"
        @page-change="handlePageChange"
      />

      <!-- 瀑布流模式 -->
      <KnowledgeWaterfallMode
        v-else
        :knowledge-list="knowledgeList"
        :loading="loading"
        :has-more="hasMore"
        @view-detail="viewKnowledgeDetail"
        @load-more="handleLoadMore"
      />
    </div>

    <!-- 自定义删除确认对话框 -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="delete-confirm-overlay" @click="cancelDelete">
        <div class="delete-confirm-modal" @click.stop>
          <div class="modal-header">
            <div class="warning-icon">
              <Icon icon="fluent:warning-24-filled" />
            </div>
            <h3>确认删除</h3>
            <p>删除后无法恢复，确定要删除这篇知识文章吗？</p>
          </div>
          
          <div class="modal-actions">
            <button class="cancel-btn" @click="cancelDelete" :disabled="deleting">
              取消
            </button>
            <button class="delete-btn" @click="confirmDelete" :disabled="deleting">
              <Icon v-if="deleting" icon="fluent:spinner-ios-20-filled" class="spinning" />
              <Icon v-else icon="fluent:delete-24-regular" />
              <span>{{ deleting ? '删除中...' : '确认删除' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-page {
  padding: 32px;
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 24px;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;

  .iconify {
    color: var(--color-primary);
  }
}

.page-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 20px;
  }
  
  &:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
  }
}

.knowledge-content {
  margin-top: 24px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  text-align: center;

  .iconify {
    font-size: 64px;
    color: #f56c6c;
    margin-bottom: 16px;
  }

  span {
    font-size: 18px;
    color: var(--color-text-secondary);
    margin-bottom: 24px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 20px;
  text-align: center;

  .iconify {
    font-size: 80px;
    color: var(--color-text-muted);
    margin-bottom: 24px;
    opacity: 0.5;
  }

  h3 {
    font-size: 24px;
    color: var(--color-text-primary);
    margin: 0 0 12px 0;
  }

  p {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0 0 32px 0;
    max-width: 400px;
    line-height: 1.6;
  }
}

.create-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid var(--color-primary);
  background: var(--color-bg-elevated);
  color: var(--color-primary);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  overflow: hidden;
  
  .iconify {
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  
  .btn-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: var(--color-primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    
    .btn-shine {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
}

.retry-btn, .create-first-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 2px solid var(--color-primary);
  background: var(--color-bg-elevated);
  color: var(--color-primary);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--color-primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  }
}

// 删除确认对话框样式
.delete-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.delete-confirm-modal {
  background: var(--color-bg-elevated);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 32px 24px;
  text-align: center;
  
  .warning-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconify {
      font-size: 28px;
      color: white;
    }
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
  
  .cancel-btn, .delete-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .iconify {
      font-size: 16px;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .cancel-btn {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-primary);
    
    &:hover:not(:disabled) {
      background: var(--color-bg-tertiary);
    }
  }
  
  .delete-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #ee5a24, #c23616);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(238, 90, 36, 0.4);
    }
    
    .spinning {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 768px) {
  .knowledge-page {
  padding: 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  .header-actions {
    justify-content: space-between;
  }

  .page-title {
    font-size: 28px;
  }
}
</style>
