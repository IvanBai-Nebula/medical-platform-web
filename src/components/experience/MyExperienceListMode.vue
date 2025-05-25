<template>
  <div class="my-experience-list-mode">
    <!-- 心得列表表格 -->
    <div class="experience-table">
      <div class="table-header">
        <div class="header-cell title-cell">标题</div>
        <div class="header-cell status-cell">状态</div>
        <div class="header-cell date-cell">创建时间</div>
        <div class="header-cell date-cell">更新时间</div>
        <div class="header-cell actions-cell">操作</div>
      </div>
      
      <div class="table-body">
        <div 
          v-for="experience in experiences" 
          :key="experience.experienceId" 
          class="table-row"
          @click="handleRowClick(experience)"
        >
          <!-- 标题列 -->
          <div class="table-cell title-cell">
            <div class="title-content">
              <h3 class="experience-title">{{ experience.title }}</h3>
              <p class="experience-preview">{{ getContentPreview(experience.content) }}</p>
            </div>
          </div>
          
          <!-- 状态列 -->
          <div class="table-cell status-cell">
            <div :class="['status-badge', experience.status]">
              <Icon :icon="getStatusIcon(experience.status)" />
              <span>{{ getStatusText(experience.status) }}</span>
            </div>
            <div v-if="experience.status === 'rejected' && experience.reviewComments" class="review-reason">
              <Icon icon="fluent:info-24-regular" />
              <span>{{ experience.reviewComments }}</span>
            </div>
          </div>
          
          <!-- 创建时间列 -->
          <div class="table-cell date-cell">
            <div class="date-info">
              <span class="date-text">{{ formatDate(experience.createdAt) }}</span>
              <span class="time-text">{{ formatTime(experience.createdAt) }}</span>
            </div>
          </div>
          
          <!-- 更新时间列 -->
          <div class="table-cell date-cell">
            <div class="date-info">
              <span class="date-text">{{ formatDate(experience.updatedAt) }}</span>
              <span class="time-text">{{ formatTime(experience.updatedAt) }}</span>
            </div>
          </div>
          
          <!-- 操作列 -->
          <div class="table-cell actions-cell" @click.stop>
            <div class="action-buttons">
              <button 
                class="action-btn view-btn" 
                @click="$emit('view-detail', experience.experienceId)"
                title="查看详情"
              >
                <Icon icon="fluent:eye-24-regular" />
              </button>
              
              <button 
                v-if="canEdit(experience)" 
                class="action-btn edit-btn" 
                @click="$emit('edit', experience)"
                title="编辑心得"
              >
                <Icon icon="fluent:edit-24-regular" />
              </button>
              
              <button 
                class="action-btn delete-btn" 
                @click="$emit('delete', experience)"
                title="删除心得"
              >
                <Icon icon="fluent:delete-24-regular" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页器 -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
      <div class="pagination">
        <button 
          class="page-btn prev-btn" 
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          <Icon icon="fluent:chevron-left-24-regular" />
          上一页
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            :class="['page-number', { active: page === currentPage }]"
            @click="handlePageChange(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="page-btn next-btn" 
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          下一页
          <Icon icon="fluent:chevron-right-24-regular" />
        </button>
      </div>
      
      <div class="pagination-info">
        <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      </div>
    </div>

    <!-- 加载更多状态 -->
    <div v-if="loading" class="loading-more">
      <Icon icon="fluent:spinner-ios-20-filled" class="spinning" />
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import type { ExperienceItem } from '@/types'
import { ExperienceStatus } from '@/services/type/experience.d'
import { formatDateTime, extractAndTruncateText } from '@/utils'

// Props
const props = defineProps<{
  experiences: ExperienceItem[]
  loading: boolean
  currentPage: number
  pageSize: number
  totalPages: number
}>()

// 计算可见的分页按钮
const visiblePages = computed(() => {
  const delta = 2 // 当前页面前后显示的页数
  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, props.currentPage - delta); 
       i <= Math.min(props.totalPages - 1, props.currentPage + delta); 
       i++) {
    range.push(i)
  }

  if (props.currentPage - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (props.currentPage + delta < props.totalPages - 1) {
    rangeWithDots.push('...', props.totalPages)
  } else if (props.totalPages > 1) {
    rangeWithDots.push(props.totalPages)
  }

  return rangeWithDots
})

// 处理行点击
const handleRowClick = (experience: ExperienceItem) => {
  // 点击行跳转到详情页
  window.open(`/experience/${experience.experienceId}`, '_blank')
}

// 处理分页变化
const emit = defineEmits<{
  'view-detail': [id: number]
  'edit': [experience: ExperienceItem]
  'delete': [experience: ExperienceItem]
  'page-change': [page: number]
}>()

const handlePageChange = (page: number) => {
  if (page !== props.currentPage && page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}

// 获取内容预览
const getContentPreview = (content: string) => {
  return extractAndTruncateText(content, 100)
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case ExperienceStatus.APPROVED:
      return 'fluent:checkmark-circle-24-filled'
    case ExperienceStatus.PENDING:
      return 'fluent:clock-24-filled'
    case ExperienceStatus.REJECTED:
      return 'fluent:dismiss-circle-24-filled'
    default:
      return 'fluent:question-circle-24-regular'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case ExperienceStatus.APPROVED:
      return '已发布'
    case ExperienceStatus.PENDING:
      return '待审核'
    case ExperienceStatus.REJECTED:
      return '已驳回'
    default:
      return '未知'
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return formatDateTime(dateString, 'date')
}

// 格式化时间
const formatTime = (dateString: string) => {
  return formatDateTime(dateString, 'time')
}

// 判断是否可以编辑
const canEdit = (experience: ExperienceItem) => {
  // 待审核和已驳回的心得可以编辑
  return experience.status === ExperienceStatus.PENDING || 
         experience.status === ExperienceStatus.REJECTED
}
</script>

<style lang="scss" scoped>
.my-experience-list-mode {
  width: 100%;
}

.experience-table {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 120px 120px 120px 120px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
  
  .header-cell {
    padding: 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    text-align: left;
    
    &.title-cell {
      padding-left: 24px;
    }
    
    &.actions-cell {
      text-align: center;
    }
  }
}

.table-body {
  .table-row {
    display: grid;
    grid-template-columns: 2fr 120px 120px 120px 120px;
    border-bottom: 1px solid var(--color-border-secondary);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: var(--color-bg-secondary);
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .table-cell {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      
      &.title-cell {
        padding-left: 24px;
        align-items: flex-start;
        padding-top: 20px;
      }
      
      &.actions-cell {
        justify-content: center;
      }
    }
  }
}

.title-content {
  width: 100%;
  
  .experience-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .experience-preview {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  .iconify {
    font-size: 14px;
  }
  
  &.approved {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }
  
  &.pending {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
  }
  
  &.rejected {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
}

.review-reason {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(220, 53, 69, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: #dc3545;
  
  .iconify {
    font-size: 12px;
    flex-shrink: 0;
  }
  
  span {
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .date-text {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: 500;
  }
  
  .time-text {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .iconify {
      font-size: 16px;
    }
    
    &.view-btn {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.2);
      
      &:hover {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
    }
    
    &.edit-btn {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      border-color: rgba(34, 197, 94, 0.2);
      
      &:hover {
        background: #22c55e;
        color: white;
        border-color: #22c55e;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
      }
    }
    
    &.delete-btn {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.2);
      
      &:hover {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }
    }
  }
}

// 分页器样式
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 0 8px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .page-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid var(--color-border-primary);
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    
    .iconify {
      font-size: 16px;
    }
    
    &:hover:not(:disabled) {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-numbers {
    display: flex;
    gap: 4px;
    margin: 0 8px;
    
    .page-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border-primary);
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
      
      &:hover {
        background: var(--color-bg-secondary);
      }
      
      &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }
    }
  }
}

.pagination-info {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-muted);
  
  .iconify {
    font-size: 20px;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 2fr 100px 100px 100px 100px;
  }
  
  .table-cell {
    padding: 16px 12px;
    
    &.title-cell {
      padding-left: 16px;
    }
  }
  
  .header-cell {
    padding: 16px 12px;
    
    &.title-cell {
      padding-left: 16px;
    }
  }
}

@media (max-width: 768px) {
  .experience-table {
    overflow-x: auto;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 250px 100px 100px 100px 100px;
    min-width: 650px;
  }
  
  .pagination-wrapper {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
  
  .pagination {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>