<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { getExperienceDetail, likeExperience } from '@/services'
import type { ExperienceItem } from '@/types'
import { ElMessage } from 'element-plus'
import { getUserAvatar } from '@/utils/images'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态
const experience = ref<ExperienceItem | null>(null)
const loading = ref(true)
const liking = ref(false)

// 计算属性
const experienceId = computed(() => route.params.id as string)

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化数字显示
const formatNumber = (num: number | undefined): string => {
  // 安全检查：如果 num 为 undefined 或 null，返回 '0'
  if (num === undefined || num === null || isNaN(num)) {
    return '0'
  }
  
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

// 加载心得详情
const loadExperienceDetail = async () => {
  try {
    loading.value = true
    const response = await getExperienceDetail(experienceId.value)
    experience.value = response.data
  } catch (err: any) {
    console.error('加载心得详情失败:', err)
    ElMessage.error('加载心得详情失败')
    router.push('/experience')
  } finally {
    loading.value = false
  }
}

// 点赞心得
const handleLike = async () => {
  if (!experience.value) return
  
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录后再进行操作')
    return
  }
  
  try {
    liking.value = true
    const response = await likeExperience(experienceId.value)
    
    // 更新本地状态
    experience.value.isLiked = response.isLiked
    experience.value.likeCount = response.likeCount
    
    ElMessage.success(response.isLiked ? '点赞成功' : '取消点赞')
  } catch (err: any) {
    console.error('点赞失败:', err)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    liking.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 查看关联知识
const viewKnowledge = () => {
  if (experience.value?.knowledgeId) {
    router.push(`/knowledge/${experience.value.knowledgeId}`)
  }
}

// 初始化
onMounted(() => {
  loadExperienceDetail()
})
</script>

<template>
  <div class="experience-detail-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton animated>
        <template #template>
          <div class="skeleton-detail">
            <el-skeleton-item variant="button" style="width: 120px; height: 40px; margin-bottom: 20px;" />
            <el-skeleton-item variant="h1" style="width: 70%; height: 40px; margin-bottom: 16px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 12px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 8px;" />
            <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 8px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 心得详情内容 -->
    <div v-else-if="experience" class="detail-content">
      <!-- 头部导航 -->
      <div class="detail-header">
        <button class="back-btn" @click="goBack">
          <Icon icon="fluent:arrow-left-24-regular" />
          <span>返回</span>
        </button>
      </div>

      <!-- 心得主体 -->
      <article class="experience-article">
        <!-- 心得头部信息 -->
        <header class="article-header">
          <h1 class="article-title">{{ experience.title }}</h1>
          <div class="article-meta">
            <div class="author-info">
              <img 
                :src="getUserAvatar(experience.avatar, 50)" 
                :alt="experience.username || '匿名用户'"
                class="author-avatar"
              />
              <div class="author-details">
                <span class="author-name">{{ experience.username || '匿名用户' }}</span>
                <span class="publish-date">{{ formatDate(experience.createdAt) }}</span>
              </div>
            </div>
            
            <div class="article-stats">
              <span class="meta-item">
                <Icon icon="fluent:heart-24-regular" />
                {{ formatNumber(experience.likeCount) }} 点赞
              </span>
            </div>
          </div>
        </header>

        <!-- 关联知识 -->
        <div v-if="experience.knowledgeId" class="related-knowledge">
          <div class="section-title">
            <Icon icon="fluent:book-24-regular" />
            关联知识
          </div>
          <button class="knowledge-link" @click="viewKnowledge">
            查看相关知识文章
            <Icon icon="fluent:arrow-right-24-regular" />
          </button>
        </div>

        <!-- 详细内容 -->
        <div class="article-content">
          <div class="section-title">
            <Icon icon="fluent:document-text-24-regular" />
            心得内容
          </div>
          <div class="content-body" v-html="experience.content">
          </div>
        </div>

        <!-- 文章底部信息 -->
        <footer class="article-footer">
          <div class="footer-info">
            <p class="update-time">
              <Icon icon="fluent:clock-24-regular" />
              最后更新：{{ formatDate(experience.updatedAt) }}
            </p>
          </div>
          
          <div class="footer-actions">
            <button 
              class="action-btn like-btn"
              :class="{ 'liked': experience.isLiked }"
              :disabled="liking"
              @click="handleLike"
            >
              <Icon v-if="liking" icon="fluent:spinner-ios-20-filled" class="spinning" />
              <Icon v-else-if="experience.isLiked" icon="fluent:heart-24-filled" />
              <Icon v-else icon="fluent:heart-24-regular" />
              <span>{{ experience.isLiked ? '已点赞' : '点赞' }} ({{ formatNumber(experience.likeCount) }})</span>
            </button>
          </div>
        </footer>
      </article>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <div class="error-content">
        <Icon icon="fluent:error-circle-24-filled" />
        <h2>加载失败</h2>
        <p>无法加载心得详情，请稍后重试</p>
        <button class="retry-btn" @click="loadExperienceDetail">
          <Icon icon="fluent:arrow-clockwise-24-regular" />
          重试
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.experience-detail-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 20px;
}

.loading-state {
  max-width: 800px;
  margin: 0 auto;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 32px;
}

.detail-content {
  max-width: 800px;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 32px;
  
  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-primary);
    border-radius: 12px;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;
    
    .iconify {
      font-size: 18px;
    }
    
    &:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateX(-2px);
    }
  }
}

.experience-article {
  background: var(--color-bg-elevated);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border-primary);
}

.article-header {
  padding: 40px;
  border-bottom: 1px solid var(--color-border-secondary);
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px 0;
  line-height: 1.3;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .author-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--color-border-primary);
  }
  
  .author-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .author-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    
    .publish-date {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }
}

.article-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-text-muted);
    
    .iconify {
      font-size: 16px;
    }
  }
}

.related-knowledge {
  padding: 32px 40px;
  border-bottom: 1px solid var(--color-border-secondary);
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 16px;
    
    .iconify {
      font-size: 24px;
      color: var(--color-primary);
    }
  }
  
  .knowledge-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: 12px;
    color: var(--color-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;
    
    &:hover {
      background: var(--color-primary);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    }
  }
}

.article-content {
  padding: 40px;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 24px;
    
    .iconify {
      font-size: 24px;
      color: var(--color-primary);
    }
  }
  
  .content-body {
    font-size: 16px;
    line-height: 1.8;
    color: var(--color-text-primary);
    
    p {
      margin: 0 0 16px 0;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin: 24px 0 16px 0;
      color: var(--color-text-primary);
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    ul, ol {
      margin: 16px 0;
      padding-left: 24px;
      
      li {
        margin: 8px 0;
      }
    }
    
    blockquote {
      margin: 16px 0;
      padding: 16px 20px;
      background: var(--color-bg-secondary);
      border-left: 4px solid var(--color-primary);
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: var(--color-text-secondary);
    }
    
    code {
      background: var(--color-bg-secondary);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    
    pre {
      background: var(--color-bg-secondary);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
      
      code {
        background: none;
        padding: 0;
      }
    }
  }
}

.article-footer {
  padding: 32px 40px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.footer-info {
  .update-time {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0;
    
    .iconify {
      font-size: 16px;
    }
  }
}

.footer-actions {
  display: flex;
  gap: 16px;
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    border: 2px solid transparent;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    .iconify {
      font-size: 18px;
      transition: transform 0.3s ease;
    }
    
    &.like-btn {
      background: linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-secondary));
      color: var(--color-text-primary);
      border-color: var(--color-border-primary);
      
      &:hover {
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, var(--color-primary)));
        color: white;
        border-color: var(--color-primary);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(var(--color-primary-rgb), 0.3);
        
        .iconify {
          transform: scale(1.1);
        }
      }
      
      &.liked {
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, var(--color-primary)));
        color: white;
        border-color: var(--color-primary);
        
        &:hover {
          background: linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-secondary));
          color: var(--color-text-primary);
          border-color: var(--color-border-primary);
        }
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    }
    
    .spinning {
      animation: spin 1s linear infinite;
    }
  }
}

.error-state {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  padding: 80px 20px;
  
  .error-content {
    background: var(--color-bg-elevated);
    border-radius: 20px;
    padding: 60px 40px;
    border: 1px solid var(--color-border-primary);
    
    .iconify {
      font-size: 64px;
      color: #f56565;
      margin-bottom: 24px;
    }
    
    h2 {
      font-size: 24px;
      color: var(--color-text-primary);
      margin: 0 0 12px 0;
    }
    
    p {
      font-size: 16px;
      color: var(--color-text-secondary);
      margin: 0 0 32px 0;
    }
    
    .retry-btn {
      display: flex;
      align-items: center;
      justify-content: center;
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
      margin: 0 auto;
      
      &:hover {
        background: var(--color-primary-dark, var(--color-primary));
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
      }
    }
  }
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
  .experience-detail-page {
    padding: 16px;
  }
  
  .article-header {
    padding: 24px;
  }
  
  .article-title {
    font-size: 24px;
  }
  
  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .article-content {
    padding: 24px;
  }
  
  .article-footer {
    padding: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .related-knowledge {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .author-info {
    gap: 12px;
    
    .author-avatar {
      width: 40px;
      height: 40px;
    }
    
    .author-details {
      .author-name {
        font-size: 16px;
      }
    }
  }
  
  .article-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 