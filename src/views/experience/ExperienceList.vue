<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { getExperienceList, deleteExperience as deleteExperienceAPI } from '@/services'
import type { ExperienceItem } from '@/types'
import { ElMessage } from 'element-plus'

// 子组件
import ExperienceListMode from '@/components/experience/ExperienceListMode.vue'
import ExperienceWaterfallMode from '@/components/experience/ExperienceWaterfallMode.vue'
import ExperienceFilter from '@/components/experience/ExperienceFilter.vue'
import IconTest from '@/components/common/IconTest.vue'

// 工具类
import { getDefaultViewMode, getViewModeTitle, getViewModeIcon } from '@/utils/viewMode'
import type { ViewMode } from '@/utils/viewMode'

const userStore = useUserStore()
const router = useRouter()

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
const selectedStatus = ref<string | undefined>(undefined)
const searchKeyword = ref('')

// 计算属性
const isAdmin = computed(() => userStore.isAdmin)
const canManageExperience = computed(() => userStore.isAuthenticated)

// 初始化默认状态（只在首次加载时设置）
const initializeDefaults = () => {
  // 使用工具类获取默认视图模式
  viewMode.value = getDefaultViewMode({ isAdmin: isAdmin.value })
  
  // 设置默认筛选状态
  if (selectedStatus.value === undefined) {
    selectedStatus.value = isAdmin.value ? 'pending' : 'approved'
  }
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'waterfall' : 'list'
  // 切换模式时重新加载数据
  loadExperienceData(true)
}

// 加载心得数据
const loadExperienceData = async (reset = false) => {
  if (loading.value) return

  try {
    loading.value = true
    error.value = null

    const page = reset ? 1 : currentPage.value
    
    const response = await getExperienceList({
      page,
      pageSize: pageSize.value,
      status: selectedStatus.value as any,
    })

    // 处理嵌套的API响应结构
    const experienceData = response.data?.data || response.data || []
    const paginationData = response.data?.pagination || response.pagination

    if (!paginationData) {
      throw new Error('无效的分页数据')
    }

    if (reset) {
      experienceList.value = experienceData
      currentPage.value = 1
    } else {
      experienceList.value.push(...experienceData)
    }

    totalPages.value = paginationData.totalPages
    hasMore.value = currentPage.value < totalPages.value

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

// 处理筛选变化
const handleFilterChange = (filters: { status?: string; keyword: string }) => {
  selectedStatus.value = filters.status
  searchKeyword.value = filters.keyword
  loadExperienceData(true)
}

// 处理分页变化（列表模式）
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadExperienceData(true)
}

// 处理无限滚动（瀑布流模式）
const handleLoadMore = () => {
  if (hasMore.value && !loading.value) {
    loadExperienceData(false)
  }
}

// 查看心得详情
const viewExperienceDetail = (id: number) => {
  router.push(`/experience/${id}`)
}

// 编辑心得（仅管理员或作者）
const editExperience = (experience: ExperienceItem) => {
  const currentUserId = userStore.userInfo && 'adminId' in userStore.userInfo 
    ? userStore.userInfo.adminId 
    : userStore.userInfo?.userId
  
  if (isAdmin.value || experience.userId === currentUserId) {
    router.push(`/experience/edit/${experience.experienceId}`)
  }
}

// 删除心得（仅管理员或作者）
const handleDeleteExperience = async (experience: ExperienceItem) => {
  const currentUserId = userStore.userInfo && 'adminId' in userStore.userInfo 
    ? userStore.userInfo.adminId 
    : userStore.userInfo?.userId
    
  if (!isAdmin.value && experience.userId !== currentUserId) return

  // 使用自定义确认对话框
  showDeleteConfirm.value = true
  deleteTargetId.value = experience.experienceId
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
    await deleteExperienceAPI(deleteTargetId.value)
    
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    deleteTargetId.value = null
    loadExperienceData(true)
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
  // 初始化默认状态
  initializeDefaults()
  await loadExperienceData(true)
})
</script>

<template>
  <div class="experience-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="fluent:people-community-24-filled" />
          学习心得
        </h1>
        <p class="page-subtitle">分享学习体验，交流医疗健康知识感悟</p>
      </div>
      
      <div class="header-actions">
        <!-- 发布心得按钮 -->
        <button 
          v-if="canManageExperience" 
          class="create-btn" 
          @click="router.push('/experience/create')"
          title="发布学习心得"
        >
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

    <!-- 筛选器 -->
    <div class="filter-section">
      <ExperienceFilter 
        @filter-change="handleFilterChange"
        :loading="loading"
        :defaultStatus="selectedStatus"
      />
    </div>

    <!-- 图标测试（开发环境） -->
    <IconTest v-if="false" />

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 错误状态 -->
      <div v-if="error" class="error-state">
        <Icon icon="fluent:error-circle-24-filled" />
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadExperienceData(true)">
          <Icon icon="fluent:arrow-clockwise-24-regular" />
          重试
        </button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && experienceList.length === 0" class="empty-state">
        <Icon icon="fluent:document-text-24-regular" />
        <h3>暂无心得</h3>
        <p>还没有用户分享学习心得</p>
      </div>

      <!-- 心得列表 -->
      <div v-else class="experience-content">
        <!-- 列表模式 -->
        <ExperienceListMode
          v-if="viewMode === 'list'"
          :experiences="experienceList"
          :loading="loading"
          :current-page="currentPage - 1"
          :page-size="pageSize"
          :total-pages="totalPages"
          :can-manage="canManageExperience"
          :is-admin="isAdmin"
          @view-detail="viewExperienceDetail"
          @edit="editExperience"
          @delete="handleDeleteExperience"
          @page-change="handlePageChange"
        />

        <!-- 瀑布流模式 -->
        <ExperienceWaterfallMode
          v-else
          :experiences="experienceList"
          :loading="loading"
          :has-more="hasMore"
          :can-manage="canManageExperience"
          :is-admin="isAdmin"
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

<style lang="scss" scoped>
.experience-page {
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

.filter-section {
  margin-bottom: 32px;
}

.content-area {
  margin-top: 32px;
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

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .experience-page {
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
  
  .delete-confirm-dialog {
    min-width: auto;
    margin: 20px;
    max-width: calc(100vw - 40px);
  }
}
</style>