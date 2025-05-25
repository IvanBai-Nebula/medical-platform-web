<template>
  <div class="my-experience-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="fluent:person-edit-24-filled" />
          我的心得
        </h1>
        <p class="page-subtitle">管理您发布的学习心得和分享内容</p>
      </div>
      
      <div class="header-actions">
        <!-- 发布心得按钮 -->
        <button class="create-btn" @click="createExperience">
          <Icon icon="fluent:add-24-regular" />
          <span>发布心得</span>
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

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">
            <Icon icon="fluent:document-text-24-filled" />
          </div>
          <div class="stat-content">
            <span class="stat-number">{{ totalCount }}</span>
            <span class="stat-label">总心得数</span>
          </div>
        </div>
        
        <div class="stat-card approved">
          <div class="stat-icon">
            <Icon icon="fluent:checkmark-circle-24-filled" />
          </div>
          <div class="stat-content">
            <span class="stat-number">{{ approvedCount }}</span>
            <span class="stat-label">已发布</span>
          </div>
        </div>
        
        <div class="stat-card pending">
          <div class="stat-icon">
            <Icon icon="fluent:clock-24-filled" />
          </div>
          <div class="stat-content">
            <span class="stat-number">{{ pendingCount }}</span>
            <span class="stat-label">待审核</span>
          </div>
        </div>
        
        <div class="stat-card rejected">
          <div class="stat-icon">
            <Icon icon="fluent:dismiss-circle-24-filled" />
          </div>
          <div class="stat-content">
            <span class="stat-number">{{ rejectedCount }}</span>
            <span class="stat-label">已驳回</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <div class="filter-controls">
        <div class="status-filter">
          <span class="filter-label">状态筛选：</span>
          <div class="filter-tabs">
            <button 
              v-for="tab in statusTabs" 
              :key="tab.value"
              :class="['filter-tab', { active: selectedStatus === tab.value }]"
              @click="handleStatusFilter(tab.value)"
            >
              <Icon :icon="tab.icon" />
              <span>{{ tab.label }}</span>
              <span v-if="tab.count !== undefined" class="tab-count">({{ tab.count }})</span>
            </button>
          </div>
        </div>
        
        <div class="search-filter">
          <div class="search-input-wrapper">
            <Icon icon="fluent:search-24-regular" class="search-icon" />
            <input 
              v-model="searchKeyword" 
              placeholder="搜索心得标题或内容..."
              class="search-input"
              @input="handleSearch"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-content">
          <Icon icon="fluent:spinner-ios-20-filled" class="spinning" />
          <span>加载中...</span>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <Icon icon="fluent:error-circle-24-filled" />
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadMyExperiences(true)">
          <Icon icon="fluent:arrow-clockwise-24-regular" />
          重试
        </button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredExperiences.length === 0" class="empty-state">
        <Icon icon="fluent:document-text-24-regular" />
        <h3>{{ getEmptyStateTitle() }}</h3>
        <p>{{ getEmptyStateDescription() }}</p>
        <button v-if="selectedStatus === 'all'" class="create-first-btn" @click="createExperience">
          发布第一篇心得
        </button>
      </div>

      <!-- 心得列表 -->
      <div v-else class="experience-content">
        <!-- 列表模式 -->
        <MyExperienceListMode
          v-if="viewMode === 'list'"
          :experiences="filteredExperiences"
          :loading="loading"
          :current-page="currentPage"
          :page-size="pageSize"
          :total-pages="totalPages"
          @view-detail="viewExperienceDetail"
          @edit="editExperience"
          @delete="handleDeleteExperience"
          @page-change="handlePageChange"
        />

        <!-- 瀑布流模式 -->
        <MyExperienceWaterfallMode
          v-else
          :experiences="filteredExperiences"
          :loading="loading"
          :has-more="hasMore"
          @view-detail="viewExperienceDetail"
          @edit="editExperience"
          @delete="handleDeleteExperience"
          @load-more="handleLoadMore"
        />
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="delete-confirm-overlay" @click="cancelDelete">
      <div class="delete-confirm-dialog" @click.stop>
        <div class="dialog-header">
          <Icon icon="fluent:warning-24-filled" />
          <h3>确认删除</h3>
        </div>
        <div class="dialog-content">
          <p>确定要删除这条学习心得吗？</p>
          <p class="warning-text">此操作不可恢复</p>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="cancelDelete" :disabled="deleting">取消</button>
          <button class="delete-btn" @click="confirmDelete" :disabled="deleting">
            <Icon v-if="deleting" icon="fluent:spinner-ios-20-filled" class="spinning" />
            {{ deleting ? '删除中...' : '确定删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { getMyExperiences, deleteExperience } from '@/services'
import type { ExperienceItem } from '@/types'
import { ExperienceStatus } from '@/services/type/experience.d'
import { ElMessage } from 'element-plus'
import { extractAndTruncateText } from '@/utils/text'

// 工具类
import { getDefaultViewMode, getViewModeTitle, getViewModeIcon } from '@/utils/viewMode'
import type { ViewMode } from '@/utils/viewMode'

// 子组件
import MyExperienceListMode from '@/components/experience/MyExperienceListMode.vue'
import MyExperienceWaterfallMode from '@/components/experience/MyExperienceWaterfallMode.vue'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const viewMode = ref<ViewMode>('waterfall') // 临时默认值，会在初始化时重新设置
const experienceList = ref<ExperienceItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 分页和筛选状态
const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = ref(0)
const hasMore = ref(true)
const selectedStatus = ref<string>('all')
const searchKeyword = ref('')

// 删除确认相关状态
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)
const deleting = ref(false)

// 计算属性
const isAdmin = computed(() => userStore.isAdmin)

// 统计数据
const totalCount = computed(() => Array.isArray(experienceList.value) ? experienceList.value.length : 0)
const approvedCount = computed(() => Array.isArray(experienceList.value) ? experienceList.value.filter(exp => exp.status === ExperienceStatus.APPROVED).length : 0)
const pendingCount = computed(() => Array.isArray(experienceList.value) ? experienceList.value.filter(exp => exp.status === ExperienceStatus.PENDING).length : 0)
const rejectedCount = computed(() => Array.isArray(experienceList.value) ? experienceList.value.filter(exp => exp.status === ExperienceStatus.REJECTED).length : 0)

// 状态筛选标签
const statusTabs = computed(() => [
  { value: 'all', label: '全部', icon: 'fluent:document-text-24-regular', count: totalCount.value },
  { value: 'approved', label: '已发布', icon: 'fluent:checkmark-circle-24-filled', count: approvedCount.value },
  { value: 'pending', label: '待审核', icon: 'fluent:clock-24-filled', count: pendingCount.value },
  { value: 'rejected', label: '已驳回', icon: 'fluent:dismiss-circle-24-filled', count: rejectedCount.value },
])

// 筛选后的心得列表
const filteredExperiences = computed(() => {
  // 确保experienceList.value是数组
  if (!experienceList.value || !Array.isArray(experienceList.value)) {
    return []
  }

  let filtered = experienceList.value

  // 状态筛选
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(exp => exp.status === selectedStatus.value)
  }

  // 关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    filtered = filtered.filter(exp => 
      exp.title.toLowerCase().includes(keyword) ||
      extractAndTruncateText(exp.content, 1000).toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 初始化默认状态
const initializeDefaults = () => {
  viewMode.value = getDefaultViewMode({ isAdmin: isAdmin.value })
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'waterfall' : 'list'
}

// 加载我的心得数据
const loadMyExperiences = async (reset = false) => {
  if (loading.value) return

  try {
    loading.value = true
    error.value = null

    const page = reset ? 1 : currentPage.value
    
    const response = await getMyExperiences({
      page,
      pageSize: pageSize.value,
    })

    // 处理嵌套的API响应结构
    const responseData = response.data?.data || response.data || []
    const pagination = response.data?.pagination || response.pagination || {
      total: 0,
      current: 1,
      pageSize: pageSize.value,
      totalPages: 0,
      hasMore: false
    }

    if (reset) {
      experienceList.value = responseData
      currentPage.value = 1
    } else {
      experienceList.value.push(...responseData)
    }

    totalPages.value = pagination.totalPages
    hasMore.value = currentPage.value < pagination.totalPages

    if (hasMore.value) {
      currentPage.value++
    }
  } catch (err: any) {
    error.value = err.message || '加载心得数据失败'
    console.error('加载心得数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 处理状态筛选
const handleStatusFilter = (status: string) => {
  selectedStatus.value = status
}

// 处理搜索
const handleSearch = () => {
  // 搜索时使用 computed 的 filteredExperiences，不需要额外处理
}

// 处理分页变化（列表模式）
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadMyExperiences(true)
}

// 处理无限滚动（瀑布流模式）
const handleLoadMore = () => {
  if (hasMore.value && !loading.value) {
    loadMyExperiences(false)
  }
}

// 创建新心得
const createExperience = () => {
  router.push('/experience/create')
}

// 查看心得详情
const viewExperienceDetail = (id: number) => {
  router.push(`/experience/${id}`)
}

// 编辑心得
const editExperience = (experience: ExperienceItem) => {
  router.push(`/experience/edit/${experience.experienceId}`)
}

// 删除心得
const handleDeleteExperience = (experience: ExperienceItem) => {
  showDeleteConfirm.value = true
  deleteTargetId.value = experience.experienceId
}

// 确认删除
const confirmDelete = async () => {
  if (!deleteTargetId.value) return
  
  try {
    deleting.value = true
    await deleteExperience(deleteTargetId.value)
    
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    deleteTargetId.value = null
    loadMyExperiences(true)
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

// 获取空状态标题
const getEmptyStateTitle = () => {
  switch (selectedStatus.value) {
    case 'approved':
      return '暂无已发布的心得'
    case 'pending':
      return '暂无待审核的心得'
    case 'rejected':
      return '暂无被驳回的心得'
    default:
      return '暂无心得内容'
  }
}

// 获取空状态描述
const getEmptyStateDescription = () => {
  if (searchKeyword.value.trim()) {
    return `没有找到包含"${searchKeyword.value}"的心得`
  }
  
  switch (selectedStatus.value) {
    case 'approved':
      return '您还没有已发布的心得，审核通过的心得将在这里显示'
    case 'pending':
      return '您没有待审核的心得，提交的心得将在这里等待审核'
    case 'rejected':
      return '您没有被驳回的心得，审核未通过的心得将在这里显示'
    default:
      return '开始分享您的学习心得吧！'
  }
}

// 监听路由参数变化
watch(() => router.currentRoute.value.query, (newQuery) => {
  if (newQuery.status) {
    selectedStatus.value = newQuery.status as string
  }
}, { immediate: true })

// 初始化数据
onMounted(async () => {
  // 权限检查
  if (!userStore.isAuthenticated) {
    ElMessage.error('请先登录')
    router.push('/login')
    return
  }
  
  // 初始化默认状态
  initializeDefaults()
  await loadMyExperiences(true)
})
</script>

<style lang="scss" scoped>
.my-experience-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;
}

.header-left {
  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 8px 0;
    
    .iconify {
      font-size: 36px;
      color: var(--color-primary);
    }
  }
  
  .page-subtitle {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0;
    max-width: 500px;
  }
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.create-btn {
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
  
  .iconify {
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    background: var(--color-primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  }
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

// 统计信息区域
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--color-border-primary);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconify {
      font-size: 24px;
    }
  }
  
  .stat-content {
    flex: 1;
    
    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1.2;
    }
    
    .stat-label {
      display: block;
      font-size: 14px;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }
  }
  
  &.total {
    .stat-icon {
      background: rgba(var(--color-primary-rgb), 0.1);
      
      .iconify {
        color: var(--color-primary);
      }
    }
  }
  
  &.approved {
    .stat-icon {
      background: rgba(40, 167, 69, 0.1);
      
      .iconify {
        color: #28a745;
      }
    }
  }
  
  &.pending {
    .stat-icon {
      background: rgba(255, 193, 7, 0.1);
      
      .iconify {
        color: #ffc107;
      }
    }
  }
  
  &.rejected {
    .stat-icon {
      background: rgba(220, 53, 69, 0.1);
      
      .iconify {
        color: #dc3545;
      }
    }
  }
}

// 筛选器区域
.filter-section {
  margin-bottom: 32px;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--color-border-primary);
}

.status-filter {
  .filter-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
    display: block;
  }
  
  .filter-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    
    .filter-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 1px solid var(--color-border-primary);
      background: var(--color-bg-primary);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      
      .iconify {
        font-size: 16px;
      }
      
      .tab-count {
        font-size: 12px;
        opacity: 0.7;
      }
      
      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
      
      &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }
    }
  }
}

.search-filter {
  .search-input-wrapper {
    position: relative;
    max-width: 400px;
    
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: var(--color-text-muted);
    }
    
    .search-input {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      font-size: 14px;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
      }
      
      &::placeholder {
        color: var(--color-text-muted);
      }
    }
  }
}

.content-area {
  margin-top: 32px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  
  .iconify {
    font-size: 32px;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  
  .iconify {
    font-size: 64px;
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
  }
}

.error-state {
  .iconify {
    color: #f56565;
  }
  
  .retry-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      background: var(--color-primary-dark, var(--color-primary));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    }
  }
}

.empty-state {
  .iconify {
    color: var(--color-text-muted);
  }
  
  .create-first-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      background: var(--color-primary-dark, var(--color-primary));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    }
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
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.delete-confirm-dialog {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 0;
  min-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--color-border-secondary);
  
  .iconify {
    font-size: 24px;
    color: #f56565;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
}

.dialog-content {
  padding: 16px 24px 24px 24px;
  
  p {
    margin: 0 0 8px 0;
    color: var(--color-text-primary);
    
    &.warning-text {
      color: var(--color-text-muted);
      font-size: 14px;
    }
  }
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px 24px;
  justify-content: flex-end;
  
  button {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &.cancel-btn {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-primary);
      
      &:hover:not(:disabled) {
        background: var(--color-bg-primary);
      }
    }
    
    &.delete-btn {
      background: #f56565;
      color: white;
      border: 1px solid #f56565;
      display: flex;
      align-items: center;
      gap: 6px;
      
      &:hover:not(:disabled) {
        background: #e53e3e;
        border-color: #e53e3e;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .my-experience-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    
    .header-actions {
      justify-content: center;
    }
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }
  
  .filter-controls {
    padding: 20px;
  }
  
  .filter-tabs {
    justify-content: center;
  }
  
  .delete-confirm-dialog {
    min-width: auto;
    margin: 20px;
    max-width: calc(100vw - 40px);
  }
}
</style>