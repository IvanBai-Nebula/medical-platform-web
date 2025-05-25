<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, onMounted, onUnmounted } from 'vue'
import type { ExperienceItem } from '@/types'
import { getUserAvatar } from '@/utils/images'
import { extractAndTruncateText } from '@/utils/text'

const props = defineProps<{
  experiences: ExperienceItem[]
  loading?: boolean
  hasMore?: boolean
  canManage?: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-detail', id: number): void
  (e: 'edit', experience: ExperienceItem): void
  (e: 'delete', experience: ExperienceItem): void
  (e: 'load-more'): void
}>()

// 无限滚动相关
const isLoadingMore = ref(false)

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 格式化状态
const getStatusInfo = (status: string) => {
  const statusMap = {
    'approved': { label: '已发布', class: 'status-approved', icon: 'fluent:checkmark-circle-24-filled' },
    'pending': { label: '待审核', class: 'status-pending', icon: 'fluent:clock-24-filled' },
    'rejected': { label: '已驳回', class: 'status-rejected', icon: 'fluent:dismiss-circle-24-filled' },
  }
  return statusMap[status as keyof typeof statusMap] || { 
    label: '未知', 
    class: 'status-unknown', 
    icon: 'fluent:question-circle-24-filled' 
  }
}

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

// 截取内容（解析HTML）
const truncateContent = (content: string, maxLength = 150): string => {
  return extractAndTruncateText(content, maxLength)
}

// 权限检查
const canEdit = (experience: ExperienceItem) => {
  return props.isAdmin || experience.userId === 101 // 假设当前用户ID为101
}

const canDelete = (experience: ExperienceItem) => {
  return props.isAdmin || experience.userId === 101 // 假设当前用户ID为101
}

// 无限滚动
const handleScroll = () => {
  if (isLoadingMore.value || !props.hasMore) return
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // 距离底部 200px 时触发加载
  if (scrollTop + windowHeight >= documentHeight - 200) {
    isLoadingMore.value = true
    emit('load-more')
    // 重置加载状态
    setTimeout(() => {
      isLoadingMore.value = false
    }, 1000)
  }
}

// 添加和移除滚动监听
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="experience-waterfall-mode">
    <!-- 瀑布流头部 -->
    <div class="waterfall-header">
      <h3 class="waterfall-title">
        <Icon icon="fluent:grid-24-filled" />
        瀑布流视图
      </h3>
      <div class="waterfall-stats">
        <span class="stats-text">共 {{ experiences.length }} 条心得</span>
      </div>
    </div>

    <!-- 心得卡片网格 -->
    <div class="experience-grid">
      <!-- 心得卡片 -->
      <div
        v-for="experience in experiences"
        :key="experience.experienceId"
        class="experience-card"
        @click="emit('view-detail', experience.experienceId)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="author-info">
            <img 
              :src="getUserAvatar(experience.avatar, 40)" 
              :alt="experience.username"
              class="author-avatar"
            />
            <div class="author-details">
              <span class="author-name">{{ experience.username || '匿名用户' }}</span>
              <span class="publish-date">{{ formatDate(experience.createdAt) }}</span>
            </div>
          </div>
          
          <!-- 状态标识 -->
          <div class="status-indicator">
            <Icon 
              :icon="getStatusInfo(experience.status).icon" 
              :class="getStatusInfo(experience.status).class"
              :title="getStatusInfo(experience.status).label"
            />
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <h4 class="experience-title">{{ experience.title }}</h4>
          <p class="experience-content">{{ truncateContent(experience.content) }}</p>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="engagement-stats">
            <div class="stat-item likes">
              <Icon icon="fluent:heart-24-regular" />
              <span>{{ formatNumber(experience.likeCount) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="canManage" class="card-actions" @click.stop>
            <button
              v-if="canEdit(experience)"
              class="action-btn edit-btn"
              @click="emit('edit', experience)"
              title="编辑"
            >
              <Icon icon="fluent:edit-24-regular" />
            </button>
            <button
              v-if="canDelete(experience)"
              class="action-btn delete-btn"
              @click="emit('delete', experience)"
              title="删除"
            >
              <Icon icon="fluent:delete-24-regular" />
            </button>
          </div>
        </div>

        <!-- 悬停效果覆盖层 -->
        <div class="card-overlay">
          <div class="overlay-content">
            <Icon icon="fluent:eye-24-filled" />
            <span>查看详情</span>
          </div>
        </div>
      </div>

      <!-- 加载中的骨架屏 -->
      <div
        v-if="loading"
        v-for="i in 6"
        :key="`skeleton-${i}`"
        class="experience-card skeleton-card"
      >
        <div class="card-header">
          <div class="author-info">
            <div class="skeleton-avatar"></div>
            <div class="author-details">
              <div class="skeleton-line skeleton-name"></div>
              <div class="skeleton-line skeleton-date"></div>
            </div>
          </div>
        </div>

        <div class="card-content">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-content-1"></div>
          <div class="skeleton-line skeleton-content-2"></div>
        </div>

        <div class="card-footer">
          <div class="skeleton-line skeleton-stats"></div>
        </div>
      </div>
    </div>

    <!-- 加载更多状态 -->
    <div v-if="isLoadingMore || (hasMore && !loading)" class="load-more-section">
      <div v-if="isLoadingMore" class="loading-indicator">
        <Icon icon="fluent:spinner-ios-20-filled" class="spinning" />
        <span>加载中...</span>
      </div>
      <div v-else-if="hasMore" class="load-more-tip">
        <Icon icon="fluent:arrow-down-24-regular" />
        <span>向下滚动加载更多</span>
      </div>
    </div>

    <!-- 无更多内容 -->
    <div v-if="!hasMore && !loading && experiences.length > 0" class="no-more-content">
      <Icon icon="fluent:checkmark-circle-24-filled" />
      <span>已加载全部心得</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.experience-waterfall-mode {
  background: transparent;
}

.waterfall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 8px;
}

.waterfall-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  
  .iconify {
    font-size: 20px;
    color: var(--color-primary);
  }
}

.waterfall-stats {
  .stats-text {
    font-size: 14px;
    color: var(--color-text-muted);
  }
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.experience-card {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--color-border-primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    
    .card-overlay {
      opacity: 1;
    }
  }
  
  &.skeleton-card {
    cursor: default;
    
    &:hover {
      transform: none;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      
      .card-overlay {
        opacity: 0;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border-primary);
}

.author-details {
  flex: 1;
  min-width: 0;
  
  .author-name {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .publish-date {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

.status-indicator {
  .iconify {
    font-size: 18px;
    
    &.status-approved {
      color: #28a745;
    }
    
    &.status-pending {
      color: #ffc107;
    }
    
    &.status-rejected {
      color: #dc3545;
    }
    
    &.status-unknown {
      color: var(--color-text-muted);
    }
  }
}

.card-content {
  margin-bottom: 16px;
}

.experience-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  &:hover {
    color: var(--color-primary);
  }
}

.experience-content {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.engagement-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 13px;
  
  .iconify {
    font-size: 14px;
  }
  
  &.likes {
    color: var(--color-text-muted);
  }
}

.card-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  .experience-card:hover & {
    opacity: 1;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 14px;
  }
  
  &.edit-btn {
    color: #f39c12;
    
    &:hover {
      background: #f39c12;
      color: white;
      border-color: #f39c12;
    }
  }
  
  &.delete-btn {
    color: #e74c3c;
    
    &:hover {
      background: #e74c3c;
      color: white;
      border-color: #e74c3c;
    }
  }
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--color-primary-rgb), 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: white;
  
  .iconify {
    font-size: 24px;
  }
  
  span {
    font-size: 14px;
    font-weight: 500;
  }
}

// 骨架屏样式
.skeleton-avatar,
.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-name {
  width: 80px;
  height: 14px;
  margin-bottom: 4px;
}

.skeleton-date {
  width: 60px;
  height: 12px;
}

.skeleton-title {
  width: 100%;
  height: 16px;
  margin-bottom: 12px;
}

.skeleton-content-1 {
  width: 100%;
  height: 14px;
  margin-bottom: 8px;
}

.skeleton-content-2 {
  width: 80%;
  height: 14px;
}

.skeleton-stats {
  width: 60px;
  height: 14px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.load-more-section,
.no-more-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .spinning {
    animation: spin 1s linear infinite;
  }
}

.load-more-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.7;
}

.no-more-content {
  color: var(--color-primary);
  
  .iconify {
    color: var(--color-primary);
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
  .experience-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .experience-card {
    padding: 16px;
  }
  
  .waterfall-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .experience-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .experience-card {
    padding: 16px;
  }
  
  .author-info {
    gap: 8px;
  }
  
  .author-avatar {
    width: 36px;
    height: 36px;
  }
  
  .experience-title {
    font-size: 15px;
  }
  
  .experience-content {
    font-size: 13px;
    -webkit-line-clamp: 3;
  }
  
  .card-actions {
    opacity: 1; // 在移动设备上始终显示
  }
}
</style> 