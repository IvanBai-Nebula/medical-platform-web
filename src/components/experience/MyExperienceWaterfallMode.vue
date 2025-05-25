<template>
  <div class="my-experience-waterfall-mode">
    <!-- 心得卡片网格 -->
    <div class="experience-grid">
      <div 
        v-for="experience in experiences" 
        :key="experience.experienceId"
        class="experience-card"
        @click="handleCardClick(experience)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="status-section">
            <div :class="['status-badge', experience.status]">
              <Icon :icon="getStatusIcon(experience.status)" />
              <span>{{ getStatusText(experience.status) }}</span>
            </div>
            <div class="action-dropdown" @click.stop>
              <button class="action-menu-btn" @click="toggleActionMenu(experience.experienceId)">
                <Icon icon="fluent:more-horizontal-24-regular" />
              </button>
              <div 
                v-if="activeActionMenu === experience.experienceId" 
                class="action-menu"
                @click.stop
              >
                <button class="menu-item" @click="$emit('view-detail', experience.experienceId)">
                  <Icon icon="fluent:eye-24-regular" />
                  <span>查看详情</span>
                </button>
                <button 
                  v-if="canEdit(experience)" 
                  class="menu-item" 
                  @click="$emit('edit', experience)"
                >
                  <Icon icon="fluent:edit-24-regular" />
                  <span>编辑心得</span>
                </button>
                <button class="menu-item delete-item" @click="$emit('delete', experience)">
                  <Icon icon="fluent:delete-24-regular" />
                  <span>删除心得</span>
                </button>
              </div>
            </div>
          </div>
          
          <h3 class="experience-title">{{ experience.title }}</h3>
        </div>
        
        <!-- 卡片内容 -->
        <div class="card-content">
          <div class="content-preview" v-html="getContentPreview(experience.content)"></div>
        </div>
        
        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="meta-info">
            <div class="date-info">
              <Icon icon="fluent:calendar-24-regular" />
              <span>{{ formatRelativeDate(experience.createdAt) }}</span>
            </div>
            <div v-if="experience.updatedAt !== experience.createdAt" class="update-info">
              <Icon icon="fluent:edit-24-regular" />
              <span>{{ formatRelativeDate(experience.updatedAt) }}</span>
            </div>
          </div>
          
          <!-- 审核信息 -->
          <div v-if="experience.status === 'rejected' && experience.reviewComments" class="review-info">
            <div class="review-header">
              <Icon icon="fluent:warning-24-filled" />
              <span>驳回原因</span>
            </div>
            <p class="review-comment">{{ experience.reviewComments }}</p>
          </div>
          
          <!-- 快速操作 -->
          <div class="quick-actions">
            <button 
              class="quick-btn view-btn" 
              @click.stop="$emit('view-detail', experience.experienceId)"
              title="查看详情"
            >
              <Icon icon="fluent:eye-24-regular" />
            </button>
            <button 
              v-if="canEdit(experience)" 
              class="quick-btn edit-btn" 
              @click.stop="$emit('edit', experience)"
              title="编辑心得"
            >
              <Icon icon="fluent:edit-24-regular" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more-section">
      <div v-if="loading" class="loading-indicator">
        <Icon icon="fluent:spinner-ios-20-filled" class="spinning" />
        <span>加载更多心得...</span>
      </div>
      <button v-else class="load-more-btn" @click="$emit('load-more')">
        <Icon icon="fluent:arrow-down-24-regular" />
        <span>加载更多</span>
      </button>
    </div>

    <!-- 没有更多数据 -->
    <div v-else-if="experiences.length > 0" class="no-more-data">
      <Icon icon="fluent:checkmark-circle-24-filled" />
      <span>已显示全部心得</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, onMounted, onUnmounted } from 'vue'
import type { ExperienceItem } from '@/types'
import { ExperienceStatus } from '@/services/type/experience.d'
import { extractAndTruncateText, formatRelativeTime } from '@/utils'

// Props
defineProps<{
  experiences: ExperienceItem[]
  loading: boolean
  hasMore: boolean
}>()

// Emits
defineEmits<{
  'view-detail': [id: number]
  'edit': [experience: ExperienceItem]
  'delete': [experience: ExperienceItem]
  'load-more': []
}>()

// 响应式数据
const activeActionMenu = ref<number | null>(null)

// 处理卡片点击
const handleCardClick = (experience: ExperienceItem) => {
  // 点击卡片跳转到详情页
  window.open(`/experience/${experience.experienceId}`, '_blank')
}

// 切换操作菜单
const toggleActionMenu = (experienceId: number) => {
  activeActionMenu.value = activeActionMenu.value === experienceId ? null : experienceId
}

// 关闭操作菜单
const closeActionMenu = () => {
  activeActionMenu.value = null
}

// 获取内容预览
const getContentPreview = (content: string) => {
  return extractAndTruncateText(content, 150)
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

// 格式化相对时间
const formatRelativeDate = (dateString: string) => {
  return formatRelativeTime(dateString)
}

// 判断是否可以编辑
const canEdit = (experience: ExperienceItem) => {
  return experience.status === ExperienceStatus.PENDING || 
         experience.status === ExperienceStatus.REJECTED
}

// 监听点击事件关闭菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.action-dropdown')) {
    closeActionMenu()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.my-experience-waterfall-mode {
  width: 100%;
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.experience-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border-color: var(--color-primary);
  }
}

.card-header {
  margin-bottom: 16px;
  
  .status-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 16px;
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
  
  .action-dropdown {
    position: relative;
    
    .action-menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-border-primary);
      background: var(--color-bg-primary);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      .iconify {
        font-size: 16px;
        color: var(--color-text-secondary);
      }
      
      &:hover {
        background: var(--color-bg-secondary);
        border-color: var(--color-primary);
        
        .iconify {
          color: var(--color-primary);
        }
      }
    }
    
    .action-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-primary);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 10;
      overflow: hidden;
      min-width: 140px;
      
      .menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 12px 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: var(--color-text-primary);
        transition: all 0.3s ease;
        
        .iconify {
          font-size: 16px;
        }
        
        &:hover {
          background: var(--color-bg-secondary);
        }
        
        &.delete-item {
          color: #dc3545;
          
          &:hover {
            background: rgba(220, 53, 69, 0.1);
          }
        }
      }
    }
  }
  
  .experience-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.card-content {
  margin-bottom: 20px;
  
  .content-preview {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.card-footer {
  .meta-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    
    .date-info, .update-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text-muted);
      
      .iconify {
        font-size: 14px;
      }
    }
    
    .update-info {
      .iconify {
        color: #28a745;
      }
    }
  }
  
  .review-info {
    background: rgba(220, 53, 69, 0.05);
    border: 1px solid rgba(220, 53, 69, 0.2);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    
    .review-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #dc3545;
      margin-bottom: 8px;
      
      .iconify {
        font-size: 14px;
      }
    }
    
    .review-comment {
      font-size: 12px;
      line-height: 1.4;
      color: #dc3545;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  
  .quick-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    
    .quick-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border-primary);
      background: var(--color-bg-primary);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      .iconify {
        font-size: 18px;
      }
      
      &:hover {
        transform: translateY(-1px);
      }
      
      &.view-btn {
        color: var(--color-primary);
        
        &:hover {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
      }
      
      &.edit-btn {
        color: #28a745;
        
        &:hover {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }
      }
    }
  }
}

// 加载更多区域
.load-more-section {
  display: flex;
  justify-content: center;
  margin: 32px 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
  
  .iconify {
    font-size: 20px;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 16px;
  }
  
  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  }
}

.no-more-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 14px;
  
  .iconify {
    font-size: 16px;
    color: #28a745;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 768px) {
  .experience-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .experience-card {
    padding: 20px;
  }
  
  .card-header {
    .status-section {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .action-dropdown {
      align-self: flex-end;
    }
  }
  
  .meta-info {
    flex-direction: column;
    align-items: flex-start !important;
  }
}

@media (max-width: 480px) {
  .experience-card {
    padding: 16px;
  }
  
  .experience-title {
    font-size: 16px;
  }
}
</style> 