<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { 
  getKnowledgeDetail, 
  deleteKnowledge, 
  likeKnowledge,
  incrementViewCount,
  getKnowledgeRelatedExperiences,
  likeExperience
} from '@/services'
import type { KnowledgeItem, ExperienceItem } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserAvatar } from '@/utils/images'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态
const knowledge = ref<KnowledgeItem | null>(null)
const loading = ref(true)
const deleting = ref(false)
const liking = ref(false)
const experiences = ref<ExperienceItem[]>([])
const experiencesLoading = ref(false)
const experienceLiking = ref<Set<number>>(new Set())


// 计算属性
const knowledgeId = computed(() => route.params.id as string)
const canEdit = computed(() => userStore.hasRole('admin'))

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

// 加载知识详情
const loadKnowledgeDetail = async () => {
  try {
    loading.value = true
    const response = await getKnowledgeDetail(knowledgeId.value)
    knowledge.value = response.data
    
    // 增加浏览量
    await incrementViewCount(knowledgeId.value)
    
    // 同时加载心得
    await loadExperiences()
  } catch (err: any) {
    console.error('加载知识详情失败:', err)
    ElMessage.error('加载知识详情失败')
    router.push('/knowledge')
  } finally {
    loading.value = false
  }
}

// 加载心得列表
const loadExperiences = async () => {
  try {
    experiencesLoading.value = true
    const response = await getKnowledgeRelatedExperiences(Number(knowledgeId.value), { page: 1, pageSize: 10 })
    
    // 处理嵌套的API响应结构
    experiences.value = response.data?.data || response.data || []
  } catch (err: any) {
    console.error('加载心得失败:', err)
    // 心得加载失败不阻断主要功能
  } finally {
    experiencesLoading.value = false
  }
}

// 点赞知识
const handleLike = async () => {
  if (!knowledge.value) return
  
  try {
    liking.value = true
    const response = await likeKnowledge(knowledgeId.value)
    
    // 更新本地状态
    knowledge.value.isLiked = response.isLiked
    knowledge.value.likeCount = response.likeCount
    
    ElMessage.success(response.isLiked ? '点赞成功' : '取消点赞')
  } catch (err: any) {
    console.error('点赞失败:', err)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    liking.value = false
  }
}

// 点赞心得
const handleExperienceLike = async (experienceId: number) => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录后再进行操作')
    return
  }
  
  if (experienceLiking.value.has(experienceId)) return
  
  try {
    experienceLiking.value.add(experienceId)
    const response = await likeExperience(experienceId)
    
    // 更新本地状态
    const experience = experiences.value.find(exp => exp.experienceId === experienceId)
    if (experience) {
      experience.isLiked = response.isLiked
      experience.likeCount = response.likeCount
    }
    
    ElMessage.success(response.isLiked ? '点赞成功' : '取消点赞')
  } catch (err: any) {
    console.error('点赞心得失败:', err)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    experienceLiking.value.delete(experienceId)
  }
}

// 查看心得详情
const viewExperienceDetail = (experienceId: number) => {
  router.push(`/experience/${experienceId}`)
}

// 跳转到心得编辑页面
const goToCreateExperience = () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录后再发布心得')
    return
  }
  
  // 跳转到心得编辑页面，并传递知识文章ID
  router.push({
    path: '/experience/create',
    query: {
      knowledgeId: knowledgeId.value
    }
  })
}



// 格式化数字显示
const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) {
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

// 编辑知识
const editKnowledge = () => {
  router.push(`/knowledge/edit/${knowledgeId.value}`)
}

// 删除知识
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇知识吗？此操作不可恢复', '确认删除', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    })
    
    deleting.value = true
    await deleteKnowledge(knowledgeId.value)
    ElMessage.success('删除成功')
    router.push('/knowledge')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  } finally {
    deleting.value = false
  }
}

// 返回列表
const goBack = () => {
  router.push('/knowledge')
}

// 初始化
onMounted(() => {
  loadKnowledgeDetail()
})
</script>

<template>
  <div class="knowledge-detail-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton animated>
        <template #template>
          <div class="skeleton-detail">
            <el-skeleton-item variant="button" style="width: 120px; height: 40px; margin-bottom: 20px;" />
            <el-skeleton-item variant="h1" style="width: 70%; height: 40px; margin-bottom: 16px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 12px;" />
            <el-skeleton-item variant="image" style="width: 100%; height: 300px; margin-bottom: 24px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 8px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 8px;" />
            <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 8px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 知识详情内容 -->
    <div v-else-if="knowledge" class="detail-content">
      <!-- 头部导航 -->
      <div class="detail-header">
        <button class="back-btn" @click="goBack">
          <Icon icon="fluent:arrow-left-24-regular" />
          <span>返回列表</span>
        </button>
        
        <div v-if="canEdit" class="header-actions">
          <button class="action-btn edit-btn" @click="editKnowledge">
            <Icon icon="fluent:edit-24-regular" />
            <span>编辑</span>
          </button>
          <button 
            class="action-btn delete-btn" 
            :disabled="deleting"
            @click="handleDelete"
          >
            <Icon v-if="deleting" icon="fluent:spinner-ios-20-filled" class="spinning" />
            <Icon v-else icon="fluent:delete-24-regular" />
            <span>{{ deleting ? '删除中...' : '删除' }}</span>
          </button>
        </div>
      </div>

      <!-- 知识主体 -->
      <article class="knowledge-article">
        <!-- 知识头部信息 -->
        <header class="article-header">
          <h1 class="article-title">{{ knowledge.title }}</h1>
          <div class="article-meta">
            <span class="meta-item">
              <Icon icon="fluent:person-24-regular" />
              管理员
            </span>
            <span class="meta-item">
              <Icon icon="fluent:calendar-24-regular" />
              {{ formatDate(knowledge.createdAt) }}
            </span>
            <span class="meta-item">
              <Icon icon="fluent:eye-24-regular" />
              {{ formatNumber(knowledge.viewCount) }} 浏览
            </span>
            <span class="meta-item">
              <Icon icon="fluent:heart-24-regular" />
              {{ formatNumber(knowledge.likeCount) }} 点赞
            </span>
            <span v-if="knowledge.videoUrl" class="meta-item video-tag">
              <Icon icon="fluent:video-24-regular" />
              包含视频
            </span>
          </div>
          
          <!-- 分类标签 -->
          <div v-if="knowledge.categories?.length" class="category-tags">
            <span
              v-for="category in knowledge.categories"
              :key="category.categoryId"
              class="category-tag"
            >
              <Icon icon="fluent:tag-24-regular" />
              {{ category.categoryName }}
            </span>
          </div>
        </header>

        <!-- 简介 -->
        <div class="article-introduction">
          <h2 class="section-title">
            <Icon icon="fluent:text-description-24-regular" />
            内容简介
          </h2>
          <p class="introduction-text">{{ knowledge.introduction }}</p>
        </div>

        <!-- 封面图片 -->
        <div v-if="knowledge.coverImage" class="article-media">
          <h2 class="section-title">
            <Icon icon="fluent:image-24-regular" />
            封面图片
          </h2>
          <div class="cover-image-wrapper">
            <img :src="knowledge.coverImage" :alt="knowledge.title" class="cover-image" />
          </div>
        </div>

        <!-- 视频内容 -->
        <div v-if="knowledge.videoUrl" class="article-media">
          <h2 class="section-title">
            <Icon icon="fluent:video-24-regular" />
            相关视频
          </h2>
          <div class="video-wrapper">
            <video 
              :src="knowledge.videoUrl" 
              controls 
              preload="metadata"
              class="knowledge-video"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>

        <!-- 详细内容 -->
        <div class="article-content">
          <h2 class="section-title">
            <Icon icon="fluent:document-text-24-regular" />
            详细内容
          </h2>
          <div class="content-body" v-html="knowledge.content">
          </div>
        </div>

        <!-- 相关心得 -->
        <div class="experiences-section">
          <h2 class="section-title">
            <Icon icon="fluent:people-community-24-regular" />
            相关心得 
            <span class="experience-count">({{ experiences.length }})</span>
          </h2>

          <!-- 心得列表 -->
          <div v-if="experiencesLoading" class="experiences-loading">
            <el-skeleton animated>
              <template #template>
                <div v-for="i in 3" :key="i" class="experience-skeleton">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <el-skeleton-item variant="circle" style="width: 40px; height: 40px;" />
                    <div style="flex: 1;">
                      <el-skeleton-item variant="text" style="width: 120px; margin-bottom: 6px;" />
                      <el-skeleton-item variant="text" style="width: 80px;" />
                    </div>
                  </div>
                  <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 8px;" />
                  <el-skeleton-item variant="text" style="width: 80%;" />
                </div>
              </template>
            </el-skeleton>
          </div>
          
          <div v-else-if="experiences.length > 0" class="experiences-list">
            <div 
              v-for="experience in experiences" 
              :key="experience.experienceId"
              class="experience-item"
            >
              <div class="experience-header">
                <div class="user-info">
                  <img 
                    :src="getUserAvatar(experience.avatar, 40)" 
                    :alt="experience.username"
                    class="user-avatar"
                  />
                  <div class="user-details">
                    <span class="user-name">{{ experience.username }}</span>
                    <div class="experience-meta">
                      <span class="experience-date">{{ formatDate(experience.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="experience-content" @click="viewExperienceDetail(experience.experienceId)">
                <h4 class="experience-title">{{ experience.title }}</h4>
                <p class="experience-text">{{ experience.content }}</p>
              </div>
              
              <div class="experience-actions">
                <button 
                  class="experience-like-btn" 
                  :class="{ 'liked': experience.isLiked, 'loading': experienceLiking.has(experience.experienceId) }"
                  :disabled="experienceLiking.has(experience.experienceId)"
                  @click="handleExperienceLike(experience.experienceId)"
                >
                  <Icon 
                    v-if="experienceLiking.has(experience.experienceId)"
                    icon="fluent:spinner-ios-20-filled" 
                    class="spinning" 
                  />
                  <Icon 
                    v-else
                    :icon="experience.isLiked ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'" 
                  />
                  <span>{{ experience.likeCount }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="no-experiences">
            <Icon icon="fluent:document-text-24-regular" />
            <p>暂无相关心得</p>
            <p class="no-experiences-tip">成为第一个分享心得的人吧！</p>
          </div>
        </div>

        <!-- 文章底部信息 -->
        <footer class="article-footer">
          <div class="footer-info">
            <p class="update-time">
              <Icon icon="fluent:clock-24-regular" />
              最后更新：{{ formatDate(knowledge.updatedAt) }}
            </p>
          </div>
          
          <div class="footer-actions">
            <button 
              class="action-btn like-btn"
              :class="{ 'liked': knowledge.isLiked }"
              :disabled="liking"
              @click="handleLike"
            >
              <Icon v-if="liking" icon="fluent:spinner-ios-20-filled" class="spinning" />
              <Icon v-else-if="knowledge.isLiked" icon="fluent:heart-24-filled" />
              <Icon v-else icon="fluent:heart-24-regular" />
              <span>{{ knowledge.isLiked ? '已点赞' : '点赞' }} ({{ formatNumber(knowledge.likeCount) }})</span>
            </button>
            <button class="action-btn experience-btn" @click="goToCreateExperience">
              <Icon icon="fluent:edit-24-regular" />
              <span>发布心得</span>
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
        <p>无法加载知识详情，请稍后重试</p>
        <button class="retry-btn" @click="loadKnowledgeDetail">
          <Icon icon="fluent:arrow-clockwise-24-regular" />
          重试
        </button>
      </div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.knowledge-detail-page {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  
  .iconify {
    font-size: 16px;
  }
  
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  .iconify {
    font-size: 16px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.edit-btn {
    background: #f39c12;
    color: white;
    
    &:hover:not(:disabled) {
      background: #e67e22;
      transform: translateY(-1px);
    }
  }
  
  &.delete-btn {
    background: #e74c3c;
    color: white;
    
    &:hover:not(:disabled) {
      background: #c0392b;
      transform: translateY(-1px);
    }
  }
  
  &.share-btn, &.favorite-btn {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border-color: var(--color-border-primary);
    
    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
}

.knowledge-article {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-secondary);
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.3;
  margin: 0 0 16px 0;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-text-secondary);
    
    .iconify {
      font-size: 16px;
    }
    
    &.video-tag {
      color: var(--color-primary);
      font-weight: 500;
    }
  }
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  .category-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: var(--color-primary);
    color: white;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    
    .iconify {
      font-size: 14px;
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  
  .iconify {
    font-size: 24px;
    color: var(--color-primary);
  }
}

.article-introduction {
  margin-bottom: 32px;
  
  .introduction-text {
    font-size: 16px;
    line-height: 1.6;
    color: var(--color-text-secondary);
    margin: 0;
    padding: 20px;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    border-left: 4px solid var(--color-primary);
  }
}

.article-media {
  margin-bottom: 32px;
  
  .cover-image-wrapper, .video-wrapper {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  .cover-image {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .knowledge-video {
    width: 100%;
    height: auto;
    display: block;
  }
}

.article-content {
  margin-bottom: 32px;
  
  .content-body {
    font-size: 16px;
    line-height: 1.8;
    color: var(--color-text-primary);
    
    // 为HTML内容添加样式
    :deep(p) {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    :deep(h1, h2, h3, h4, h5, h6) {
      margin: 24px 0 16px 0;
      font-weight: 600;
      color: var(--color-text-primary);
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    :deep(h3) {
      font-size: 18px;
      color: var(--color-primary);
    }
    
    :deep(ul, ol) {
      margin: 16px 0;
      padding-left: 24px;
      
      li {
        margin-bottom: 8px;
        line-height: 1.6;
      }
    }
    
    :deep(ul) {
      list-style-type: disc;
    }
    
    :deep(ol) {
      list-style-type: decimal;
    }
    
    :deep(strong) {
      font-weight: 600;
      color: var(--color-text-primary);
    }
    
    :deep(em) {
      font-style: italic;
    }
  }
}

.experiences-section {
  margin-bottom: 32px;
  
  .experience-count {
    font-size: 16px;
    color: var(--color-text-secondary);
    font-weight: normal;
  }
}

.experiences-loading {
  margin-bottom: 16px;
  
  .experience-skeleton {
    padding: 16px;
    background: var(--color-bg-elevated);
    border-radius: 12px;
    margin-bottom: 16px;
  }
}

.experiences-list {
  .experience-item {
    margin-bottom: 16px;
    padding: 20px;
    background: var(--color-bg-elevated);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--color-border-secondary);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
    
    .experience-header {
      margin-bottom: 16px;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--color-border-primary);
        }
        
        .user-details {
          flex: 1;
          
          .user-name {
            display: block;
            font-size: 16px;
            font-weight: 600;
            color: var(--color-text-primary);
            margin-bottom: 4px;
          }
          
          .experience-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .experience-date {
              font-size: 13px;
              color: var(--color-text-muted);
            }
          }
        }
      }
    }
    
    .experience-content {
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 8px;
      padding: 8px;
      margin: -8px;
      
      &:hover {
        background: var(--color-bg-secondary);
        transform: translateY(-1px);
      }
      
      .experience-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 0 0 8px 0;
        line-height: 1.4;
        
        &:hover {
          color: var(--color-primary);
        }
      }
      
      .experience-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--color-text-secondary);
        margin: 0;
      }
    }
    
    .experience-actions {
      display: flex;
      justify-content: flex-end;
      
      .experience-like-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-primary);
        border-radius: 20px;
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 13px;
        
        .iconify {
          font-size: 14px;
        }
        
        &:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        &.liked {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        
        &.loading,
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}

.no-experiences {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
  
  .iconify {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin: 0 0 8px 0;
    font-size: 16px;
    
    &.no-experiences-tip {
      font-size: 14px;
      opacity: 0.8;
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

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-secondary);
  
  .footer-info {
    .update-time {
      display: flex;
      align-items: center;
      gap: 6px;
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
    gap: 12px;
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 1px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      .iconify {
        font-size: 16px;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &.like-btn {
        background: var(--color-bg-elevated);
        color: var(--color-text-primary);
        border-color: var(--color-border-primary);
        
        &:hover:not(:disabled) {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        &.liked {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          
          &:hover:not(:disabled) {
            background: var(--color-primary-dark, #1976d2);
          }
        }
      }
      
      &.experience-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      }
      
      .spinning {
        animation: spin 1s linear infinite;
      }
    }
  }
}

// 对话框样式
:deep(.el-dialog) {
  // 删除 rating-text 样式，因为已经去除了 rating 功能
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  
  .error-content {
    text-align: center;
    padding: 40px;
    background: var(--color-bg-elevated);
    border-radius: 16px;
    
    .iconify {
      font-size: 64px;
      color: var(--color-danger);
      margin-bottom: 16px;
    }
    
    h2 {
      font-size: 24px;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }
    
    p {
      font-size: 16px;
      color: var(--color-text-secondary);
      margin: 0 0 24px 0;
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
      margin: 0 auto;
      
      .iconify {
        font-size: 16px;
      }
      
      &:hover {
        background: var(--color-primary-dark, #1976d2);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .knowledge-detail-page {
    padding: 16px;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .knowledge-article {
    padding: 24px 20px;
  }
  
  .article-title {
    font-size: 24px;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .article-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    
    .footer-actions {
      justify-content: center;
    }
  }
}
</style>
