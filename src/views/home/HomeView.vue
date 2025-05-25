<script setup lang="ts">
// 医疗知识学习平台首页
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { ElLoading, ElMessage } from 'element-plus'

// 导入API服务和类型
import { getHomeStatistics, getLatestKnowledge, getLatestExperience } from '@/services'
import type {
  LatestKnowledgeItem,
  LatestExperienceItem,
  PlatformStatItem,
  PlatformStatConfig,
} from '@/types'

const router = useRouter()
const userStore = useUserStore()

// 统计数据配置（前端静态配置）
const statsConfig: PlatformStatConfig[] = [
  {
    key: 'knowledgeCount',
    label: '医疗知识',
    icon: 'fluent:document-24-filled',
    iconColor: '#1976d2',
    bgColor: 'rgba(25, 118, 210, 0.1)',
    description: '', // 将动态计算
  },
  {
    key: 'categoryCount',
    label: '知识分类',
    icon: 'fluent:folder-24-regular',
    iconColor: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    description: '覆盖主要医学科室',
  },
  {
    key: 'experienceCount',
    label: '学习心得',
    icon: 'fluent:chat-24-regular',
    iconColor: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    description: '', // 将动态计算
  },
  {
    key: 'userCount',
    label: '注册用户',
    icon: 'fluent:people-24-regular',
    iconColor: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    description: '', // 将动态计算
  },
]

// 动态计算description的函数
const generateDescription = (key: string, value: string, trend?: number): string => {
  const numValue = parseInt(value.replace(/,/g, '')) // 移除千分位分隔符
  
  switch (key) {
    case 'knowledgeCount':
      // 检查trend是否为0，是则显示"本月新增0篇"
      if (trend === 0) {
        return `本月新增0篇`
      }
      const monthlyIncrease = Math.round(numValue * (trend || 14) / 100)
      return `本月新增${monthlyIncrease}篇`
    
    case 'categoryCount':
      return '覆盖主要医学类别'
    
    case 'experienceCount':
      // 检查trend是否为0，是则显示"本月新增0条"
      if (trend === 0) {
        return `本月新增0条`
      }
      const experienceIncrease = Math.round(numValue * (trend || 13) / 100)
      return `本月新增${experienceIncrease}条`
    
    case 'userCount':
      const activeUsers = Math.round(numValue * 0.75) // 假设75%的用户是活跃的
      return `活跃用户${activeUsers.toLocaleString()}人`
    
    default:
      return ''
  }
}

// 主要功能入口
const mainFeatures = ref([
      {
    title: '浏览医疗知识',
    desc: '查看各类医疗健康知识',
    icon: 'fluent:book-open-24-filled',
    iconColor: '#1976d2',
    route: '/knowledge',
      },
      {
    title: '学习心得',
    desc: '分享学习经验和心得',
    icon: 'fluent:chat-sparkle-24-filled',
    iconColor: '#4caf50',
    route: '/experience',
  },
])

// 响应式数据
const platformStats = ref<(PlatformStatConfig & PlatformStatItem)[]>([])
const knowledgeList = ref<LatestKnowledgeItem[]>([])
const feedbackList = ref<LatestExperienceItem[]>([])

// 加载状态管理
const statsLoading = ref(false)
const knowledgeLoading = ref(false)
const feedbackLoading = ref(false)

// 分页管理
const knowledgePage = ref(1)
const feedbackPage = ref(1)
const hasMoreKnowledge = ref(true)
const hasMoreFeedback = ref(true)

// 错误状态
const statsError = ref<string | null>(null)
const knowledgeError = ref<string | null>(null)
const feedbackError = ref<string | null>(null)

// 获取首页统计数据
const loadStatistics = async () => {
  try {
    statsLoading.value = true
    statsError.value = null
    
    const response = await getHomeStatistics()
    
    // 处理嵌套的API响应结构
    const statsData = response.data || response
    
    // 合并静态配置和动态数据，并生成动态description
    platformStats.value = statsConfig.map(config => {
      // 获取API数据，适应新旧两种格式
      const apiData = statsData[config.key as keyof typeof statsData] || {}
      const dynamicDescription = generateDescription(config.key, apiData.value || '0', apiData.trend)
      
      return {
        ...config,
        ...apiData,
        description: dynamicDescription || config.description, // 优先使用动态生成的description
      }
    })
  }
  catch (error) {
    console.error('获取统计数据失败:', error)
    statsError.value = '获取统计数据失败，请刷新重试'
    // requests.ts已经处理了错误提示，这里不需要重复显示
  }
  finally {
    statsLoading.value = false
  }
}

// 加载医疗知识数据
const loadKnowledgeData = async (reset = false) => {
  if (knowledgeLoading.value || (!hasMoreKnowledge.value && !reset)) return
  
  try {
    knowledgeLoading.value = true
    knowledgeError.value = null
    
    const currentPage = reset ? 1 : knowledgePage.value
    
    const response = await getLatestKnowledge({
      page: currentPage,
      pageSize: 8,
      sortBy: 'latest',
    })
    
    // 处理嵌套的API响应结构
    // 使用类型断言处理响应
    const responseAny = response as any
    const responseData = responseAny.data?.data || responseAny.data || []
    const pagination = responseAny.data?.pagination || responseAny.pagination || {
      hasMore: false,
      current: 1,
      totalPages: 0
    }
    
    if (reset) {
      knowledgeList.value = responseData
      knowledgePage.value = 1
    } else {
      knowledgeList.value.push(...responseData)
    }
    
    hasMoreKnowledge.value = pagination.hasMore
    if (pagination.hasMore) {
      knowledgePage.value = currentPage + 1
    }
  }
  catch (error) {
    console.error('获取医疗知识失败:', error)
    knowledgeError.value = '获取医疗知识失败，请重试'
    // requests.ts已经处理了错误提示，这里不需要重复显示
  }
  finally {
    knowledgeLoading.value = false
  }
}

// 加载学习心得数据
const loadFeedbackData = async (reset = false) => {
  if (feedbackLoading.value || (!hasMoreFeedback.value && !reset)) return
  
  try {
    feedbackLoading.value = true
    feedbackError.value = null
    
    const currentPage = reset ? 1 : feedbackPage.value
    
    const response = await getLatestExperience({
      page: currentPage,
      pageSize: 6,
      status: 'approved',
      sortBy: 'latest',
    })
    
    // 处理嵌套的API响应结构
    // 使用类型断言处理响应
    const responseAny = response as any
    const responseData = responseAny.data?.data || responseAny.data || []
    const pagination = responseAny.data?.pagination || responseAny.pagination || {
      hasMore: false,
      current: 1,
      totalPages: 0
    }
    
    if (reset) {
      feedbackList.value = responseData
      feedbackPage.value = 1
    } else {
      feedbackList.value.push(...responseData)
    }
    
    hasMoreFeedback.value = pagination.hasMore
    if (pagination.hasMore) {
      feedbackPage.value = currentPage + 1
    }
  }
  catch (error) {
    console.error('获取学习心得失败:', error)
    feedbackError.value = '获取学习心得失败，请重试'
    // requests.ts已经处理了错误提示，这里不需要重复显示
  }
  finally {
    feedbackLoading.value = false
  }
}

// 无限滚动监听
const knowledgeContainer = ref<HTMLElement>()
const feedbackContainer = ref<HTMLElement>()

const setupInfiniteScroll = (container: Ref<HTMLElement | undefined>, loadFunction: () => void) => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadFunction()
    }
  }, {
    threshold: 0.1
  })
  
  if (container.value) {
    const loadingTrigger = container.value.querySelector('.loading-trigger')
    if (loadingTrigger) {
      observer.observe(loadingTrigger)
    }
  }
  
  return observer
}

// 刷新数据
const refreshData = async () => {
  await Promise.all([
    loadStatistics(),
    loadKnowledgeData(true),
    loadFeedbackData(true),
  ])
}

// 组件挂载时初始化数据和监听器
onMounted(async () => {
  // 初始加载数据
  await Promise.all([
    loadStatistics(),
    loadKnowledgeData(true),
    loadFeedbackData(true),
  ])
  
  // 设置无限滚动
  nextTick(() => {
    setupInfiniteScroll(knowledgeContainer, () => loadKnowledgeData(false))
    setupInfiniteScroll(feedbackContainer, () => loadFeedbackData(false))
  })
})

// 功能导航
const navigateToFeature = (route: string) => {
  if (route === '/experience' && !userStore.isAuthenticated) {
    ElMessage.warning('请先登录后再查看学习心得')
    router.push('/login')
    return
  }
  router.push(route)
}

// 查看知识详情
const viewKnowledge = (id: number) => {
  router.push(`/knowledge/${id}`)
}

// 查看心得详情
const viewFeedback = (id: number) => {
  router.push(`/experience/${id}`)
}

// 重试加载函数
const retryLoadKnowledge = () => {
  knowledgeError.value = null
  loadKnowledgeData(true)
}

const retryLoadFeedback = () => {
  feedbackError.value = null
  loadFeedbackData(true)
}

const retryLoadStatistics = () => {
  statsError.value = null
  loadStatistics()
}
</script>

<template>
  <div class="home-page">
    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-bg-decoration">
        <div class="decoration-circle circle-1" />
        <div class="decoration-circle circle-2" />
        <div class="decoration-circle circle-3" />
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <Icon icon="fluent:star-24-filled" style="font-size: 16px; color: #ffd700;" />
          专业医疗知识平台
        </div>
        <h1 class="hero-title">
          医疗知识学习平台
          <span class="title-highlight">Learning Hub</span>
        </h1>
        <p class="hero-subtitle">
          汇聚专业医疗知识，促进学习交流<br>
          让医疗知识更好地服务大众健康
        </p>
        <div class="hero-buttons">
          <el-button
            type="primary"
            size="large"
            class="hero-btn-primary"
            @click="router.push('/knowledge')"
          >
            <Icon icon="fluent:book-open-24-filled" style="font-size: 18px; margin-right: 8px;" />
            开始学习
          </el-button>
          <el-button
            v-if="!userStore.isAuthenticated"
            size="large"
            class="hero-btn-secondary"
            @click="router.push('/login')"
          >
            <Icon icon="fluent:person-add-24-filled" style="font-size: 18px; margin-right: 8px;" />
            立即注册
          </el-button>
        </div>
      </div>
    </section>

    <!-- 平台统计 -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-header">
          <h2 class="section-title">平台数据概览</h2>
          <p class="section-subtitle">实时更新的平台核心数据</p>
            </div>
        
        <!-- 错误状态 -->
        <div v-if="statsError" class="error-state">
          <Icon icon="fluent:warning-24-filled" />
          <span>{{ statsError }}</span>
          <el-button type="primary" size="small" @click="retryLoadStatistics">重试</el-button>
            </div>
        
        <!-- 加载状态 -->
        <div v-else-if="statsLoading" class="loading-state">
          <el-skeleton :rows="1" animated>
            <template #template>
              <div class="stats-skeleton">
                <el-skeleton-item v-for="i in 4" :key="i" variant="rect" style="width: 280px; height: 120px; border-radius: 20px;" />
            </div>
            </template>
          </el-skeleton>
            </div>
        
        <!-- 统计卡片 -->
        <div v-else class="stats-grid">
          <div
            v-for="(stat, index) in platformStats"
            :key="stat.label"
            class="stat-card"
            :class="`stat-card-${index + 1}`"
          >
            <div class="stat-icon-wrapper">
              <div class="stat-icon" :style="{ backgroundColor: stat.bgColor }">
                <Icon :icon="stat.icon" :style="{ fontSize: '32px', color: stat.iconColor }" />
            </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div v-if="stat.description" class="stat-description">{{ stat.description }}</div>
            </div>
            <div v-if="stat.trend" class="stat-trend">
              <Icon icon="fluent:arrow-trending-24-filled" style="font-size: 18px; color: #4caf50;" />
              <span class="trend-value">+{{ stat.trend }}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 主要功能 -->
    <section class="features-section">
      <div class="container">
        <div class="features-header">
          <h2 class="section-title">核心功能</h2>
          <p class="section-subtitle">探索平台的主要学习功能</p>
        </div>
        <div class="features-grid">
          <div
            v-for="feature in mainFeatures"
            :key="feature.title"
            class="feature-card"
            @click="navigateToFeature(feature.route)"
          >
            <div class="feature-card-bg" />
            <div class="feature-content">
              <div class="feature-icon-wrapper">
                <div class="feature-icon">
                  <Icon :icon="feature.icon" :style="{ fontSize: '40px', color: feature.iconColor }" />
                </div>
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-desc">{{ feature.desc }}</p>
              <div class="feature-arrow">
                <Icon icon="fluent:arrow-circle-right-24-filled" style="font-size: 24px; color: var(--color-primary);" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 最新内容 - 瀑布流布局 -->
    <section class="latest-section">
      <div class="container">
        <div class="latest-header">
          <h2 class="section-title">最新动态</h2>
          <p class="section-subtitle">查看平台最新的知识和心得分享</p>
      </div>

        <div class="waterfall-container">
          <!-- 最新医疗知识瀑布流 -->
          <div class="waterfall-column knowledge-column" ref="knowledgeContainer">
            <div class="column-header">
              <div class="column-title-wrapper">
                <Icon icon="fluent:document-24-filled" style="font-size: 28px; color: var(--color-primary);" />
                <h3 class="column-title">最新医疗知识</h3>
            </div>
              <el-button text type="primary" @click="router.push('/knowledge')">
                查看更多
                <Icon icon="fluent:arrow-right-24-filled" style="font-size: 16px; margin-left: 4px;" />
        </el-button>
      </div>

            <!-- 错误状态 -->
            <div v-if="knowledgeError" class="error-state">
              <Icon icon="fluent:warning-24-filled" />
              <span>{{ knowledgeError }}</span>
              <el-button type="primary" size="small" @click="retryLoadKnowledge">重试</el-button>
            </div>
            
            <!-- 知识列表 -->
            <div v-else class="waterfall-grid">
              <div
                v-for="item in knowledgeList"
                :key="item.id"
                class="waterfall-card knowledge-card"
                @click="viewKnowledge(item.id)"
              >
                <div class="card-header">
                  <h4 class="card-title">{{ item.title }}</h4>
                  <span class="card-category">{{ item.category }}</span>
                </div>
                <p class="card-summary">{{ item.summary }}</p>
                <div class="card-stats">
                  <div class="stat-item">
                    <Icon icon="fluent:eye-24-regular" />
                    <span>{{ item.readCount }}</span>
                  </div>
                  <div class="stat-item">
                    <Icon icon="fluent:heart-24-regular" />
                    <span>{{ item.likeCount }}</span>
                  </div>
                </div>
                <div class="card-footer">
                  <div class="author-info" v-if="item.username">
                    <Icon icon="fluent:person-24-filled" />
                    <span>{{ item.username }}</span>
                  </div>
                  <span class="card-date">{{ item.createdAt }}</span>
                  <Icon icon="fluent:arrow-right-24-regular" class="card-arrow" />
                </div>
              </div>
            </div>
            
            <!-- 加载触发器 -->
            <div v-if="hasMoreKnowledge && !knowledgeError" class="loading-trigger">
              <div v-if="knowledgeLoading" class="loading-state">
                <ElSkeleton animated :rows="1" />
              </div>
              <div v-else class="load-more-hint">滚动加载更多内容</div>
            </div>
            <div v-else-if="!knowledgeError" class="no-more-data">
              <Icon icon="fluent:checkmark-circle-24-filled" />
              <span>暂无更多内容</span>
            </div>
          </div>

          <!-- 最新学习心得瀑布流 -->
          <div class="waterfall-column feedback-column" ref="feedbackContainer">
            <div class="column-header">
              <div class="column-title-wrapper">
                <Icon icon="fluent:chat-sparkle-24-filled" style="font-size: 28px; color: #4caf50;" />
                <h3 class="column-title">最新学习心得</h3>
              </div>
              <el-button text type="primary" @click="router.push('/experience')">
                查看更多
                <Icon icon="fluent:arrow-right-24-filled" style="font-size: 16px; margin-left: 4px;" />
        </el-button>
      </div>

            <!-- 错误状态 -->
            <div v-if="feedbackError" class="error-state">
              <Icon icon="fluent:warning-24-filled" />
              <span>{{ feedbackError }}</span>
              <el-button type="primary" size="small" @click="retryLoadFeedback">重试</el-button>
            </div>
            
            <!-- 心得列表 -->
            <div v-else class="waterfall-grid">
              <div
                v-for="item in feedbackList"
                :key="item.id"
                class="waterfall-card feedback-card"
                @click="viewFeedback(item.id)"
        >
                <div class="card-header">
                  <h4 class="card-title">{{ item.title }}</h4>
                  <el-tag type="success" size="small" effect="light">已审核</el-tag>
            </div>
                <p class="card-content">{{ item.content }}</p>
                <div class="card-stats">
                  <div class="stat-item">
                    <Icon icon="fluent:heart-24-regular" />
                    <span>{{ item.likeCount }}</span>
                  </div>
                </div>
                <div class="card-footer">
                  <div class="author-info" v-if="item.username">
                    <Icon icon="fluent:person-24-filled" />
                    <span>{{ item.username }}</span>
                  </div>
                  <span class="card-date">{{ item.createdAt }}</span>
                  <Icon icon="fluent:arrow-right-24-regular" class="card-arrow" />
                </div>
              </div>
            </div>
            
            <!-- 加载触发器 -->
            <div v-if="hasMoreFeedback && !feedbackError" class="loading-trigger">
              <div v-if="feedbackLoading" class="loading-state">
                <ElSkeleton animated :rows="1" />
              </div>
              <div v-else class="load-more-hint">滚动加载更多内容</div>
            </div>
            <div v-else-if="!feedbackError" class="no-more-data">
              <Icon icon="fluent:checkmark-circle-24-filled" />
              <span>暂无更多内容</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 平台介绍 -->
    <section class="intro-section">
      <div class="container">
        <div class="intro-content">
          <div class="intro-icon">
            <Icon icon="fluent:trophy-24-filled" style="font-size: 48px; color: #ffd700;" />
          </div>
          <h2 class="section-title">关于平台</h2>
          <p class="intro-text">
            医疗知识学习平台致力于为用户提供专业、权威的医疗健康知识。
            平台汇集了各科室的医疗知识，支持用户分享学习心得，
            促进医疗知识的传播与交流，共同提高健康意识。
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
// === 变量定义 ===
$container-max-width: 1200px;
$section-padding: 100px 0;
$card-border-radius: 20px;
$transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// === 基础样式 ===
.home-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding-top: 60px;
  overflow-x: hidden;
}

.container {
  max-width: $container-max-width;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  text-align: center;
  background: linear-gradient(135deg, var(--color-text-primary), var(--color-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  font-size: 18px;
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: 60px;
  opacity: 0.8;
}

// === Hero Section ===
.hero-section {
  padding: 120px 0;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  position: relative;
  overflow: hidden;
  text-align: center;
}

.hero-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(156, 39, 176, 0.1));
    animation: float 6s ease-in-out infinite;

    &.circle-1 {
      width: 200px;
      height: 200px;
      top: 20%;
      left: 10%;
      animation-delay: 0s;
    }

    &.circle-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 15%;
      animation-delay: 2s;
    }

    &.circle-3 {
      width: 100px;
      height: 100px;
      bottom: 20%;
      left: 70%;
      animation-delay: 4s;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid var(--color-border-primary);
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 16px;
  color: var(--color-text-primary);
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.hero-title {
  font-size: 48px;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 24px;
  color: var(--color-text-primary);

  .title-highlight {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.hero-subtitle {
  font-size: 20px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 48px;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) !important;
  border: none !important;
  color: white !important;
  padding: 16px 32px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  border-radius: 50px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s ease !important;

  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
  }
}

.hero-btn-secondary {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 2px solid var(--color-border-primary) !important;
  color: var(--color-text-primary) !important;
  padding: 16px 32px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  border-radius: 50px !important;
  backdrop-filter: blur(10px) !important;
  transition: all 0.3s ease !important;

  &:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: var(--color-primary) !important;
    transform: translateY(-2px) !important;
  }
}

// === Stats Section ===
.stats-section {
  padding: $section-padding;
  background: var(--color-bg-primary);
}

.stats-header {
  text-align: center;
  margin-bottom: 80px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.stat-card {
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid var(--color-border-primary);
  border-radius: $card-border-radius;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: $transition;
  position: relative;
  overflow: hidden;
  min-height: 120px;
  width: 100%;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(156, 39, 176, 0.05));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);

    &::before {
      opacity: 1;
    }
  }

  .stat-icon-wrapper {
    position: relative;
    z-index: 1;
    flex-shrink: 0;

    .stat-icon {
  width: 60px;
  height: 60px;
      border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
      border: 2px solid var(--color-border-primary);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .stat-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;

    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-text-primary);
      margin-bottom: 4px;
      line-height: 1.2;
      word-break: break-word;
}

    .stat-label {
      font-size: 15px;
      color: var(--color-text-secondary);
      font-weight: 500;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .stat-description {
      font-size: 13px;
      color: var(--color-text-muted);
      opacity: 0.8;
      line-height: 1.3;
      word-break: break-word;
    }
}

  .stat-trend {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;

    .iconify {
      font-size: 16px;
      color: #4caf50;
}

    .trend-value {
      font-size: 13px;
      color: #4caf50;
  font-weight: 600;
      white-space: nowrap;
    }
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// === Features Section ===
.features-section {
  padding: $section-padding;
  background: var(--color-bg-primary);
}

.features-header {
  text-align: center;
  margin-bottom: 80px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 48px;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid var(--color-border-primary);
  border-radius: $card-border-radius;
  padding: 48px;
  text-align: center;
  transition: $transition;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  .feature-card-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(156, 39, 176, 0.05));
    opacity: 0;
    transition: $transition;
}

  &:hover {
    transform: translateY(-12px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
    border-color: var(--color-primary);

    .feature-card-bg {
      opacity: 1;
    }

    .feature-arrow {
      transform: translateX(8px);
      opacity: 1;
    }
  }

  .feature-content {
    position: relative;
    z-index: 1;

    .feature-icon-wrapper {
      margin-bottom: 32px;

      .feature-icon {
        width: 90px;
        height: 90px;
        border-radius: 24px;
  display: flex;
  align-items: center;
        justify-content: center;
        margin: 0 auto;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        border: 2px solid var(--color-border-primary);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
        }
      }
    }

    .feature-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--color-text-primary);
    }

    .feature-desc {
      font-size: 18px;
      line-height: 1.6;
      color: var(--color-text-secondary);
  margin-bottom: 24px;
}

    .feature-arrow {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      color: var(--color-primary);
      opacity: 0.6;
      transition: $transition;
    }
  }
}

// === Latest Section - 瀑布流样式 ===
.latest-section {
  padding: $section-padding;
  background: var(--color-bg-primary);
}

.latest-header {
  text-align: center;
  margin-bottom: 80px;
}

.waterfall-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  max-height: 800px;
  overflow: hidden;
}

.waterfall-column {
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid var(--color-border-primary);
  border-radius: $card-border-radius;
  padding: 40px;
  transition: $transition;
  display: flex;
  flex-direction: column;
  max-height: 800px;

  &:hover {
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
  }
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--color-border-primary);
  flex-shrink: 0;
}

.column-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.column-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.waterfall-grid {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border-primary);
    border-radius: 3px;
    transition: background 0.3s ease;

    &:hover {
      background: var(--color-primary);
    }
  }
}

.waterfall-card {
  padding: 24px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 16px;
  cursor: pointer;
  transition: $transition;
  position: relative;
  margin-bottom: 20px;
  opacity: 0;
  animation: slideInUp 0.5s ease forwards;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);

    .card-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }

  &.knowledge-card {
    border-left: 4px solid var(--color-primary);
  }

  &.feedback-card {
    border-left: 4px solid #4caf50;
  }
}

// 添加交错动画延迟
.waterfall-card:nth-child(1) { animation-delay: 0.1s; }
.waterfall-card:nth-child(2) { animation-delay: 0.2s; }
.waterfall-card:nth-child(3) { animation-delay: 0.3s; }
.waterfall-card:nth-child(4) { animation-delay: 0.4s; }
.waterfall-card:nth-child(5) { animation-delay: 0.5s; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.card-category {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.card-summary, .card-content {
  font-size: 16px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-text-muted);

    .iconify {
      font-size: 16px;
      color: var(--color-primary);
    }
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--color-text-muted);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.card-date {
  color: var(--color-text-muted);
}

.card-arrow {
  font-size: 18px;
  color: var(--color-primary);
  opacity: 0.6;
  transition: $transition;
}

// 加载状态样式
.loading-trigger {
  padding: 20px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.load-more-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-style: italic;
}

.no-more-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--color-text-muted);
  font-size: 14px;

  .iconify {
    color: var(--color-primary);
    font-size: 18px;
  }
}

// === Intro Section ===
.intro-section {
  padding: $section-padding;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.intro-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.intro-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
  box-shadow: 0 12px 32px rgba(255, 193, 7, 0.3);
  border: 3px solid rgba(255, 215, 0, 0.3);
}

.intro-text {
  font-size: 20px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin-bottom: 48px;
}

// === 响应式设计 ===
@media (max-width: 1024px) {
  .waterfall-container {
    grid-template-columns: 1fr;
    gap: 40px;
    max-height: none;
  }

  .waterfall-column {
    max-height: 600px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 80px 0;
  }

  .hero-title {
    font-size: 42px;
  }

  .section-title {
    font-size: 32px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 20px;
    max-width: none;
  }

  .stat-card {
    padding: 20px;
    gap: 12px;
    min-height: 100px;
    
    .stat-icon-wrapper .stat-icon {
    width: 50px;
    height: 50px;
      border-radius: 14px;
      
      .iconify {
        font-size: 24px !important;
      }
    }
    
    .stat-content {
      .stat-value {
        font-size: 24px;
      }
      
      .stat-label {
        font-size: 14px;
      }
      
      .stat-description {
        font-size: 12px !important;
      }
  }

    .stat-trend {
      .iconify {
        font-size: 14px;
      }
      
      .trend-value {
        font-size: 12px !important;
      }
    }
  }

  .waterfall-column {
    padding: 32px 24px;
    max-height: 500px;
  }

  .column-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .feature-card {
    padding: 32px 24px;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
}

// 中等屏幕优化 (769px - 1024px)
@media (min-width: 769px) and (max-width: 1024px) {
  .stats-grid {
    max-width: 600px;
    gap: 20px;
  }
  
  .stat-card {
    padding: 20px;
    min-height: 110px;
  }
}

// 超小屏幕优化
@media (max-width: 480px) {
  .stat-card {
    padding: 16px;
    gap: 10px;
    
    .stat-content {
      .stat-value {
        font-size: 22px;
      }
      
      .stat-label {
        font-size: 13px;
      }
      
      .stat-description {
        font-size: 11px !important;
  }
    }
  }
}

// === 错误状态样式 ===
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  margin: 20px 0;

  .iconify {
    font-size: 48px;
    color: #f56c6c;
    margin-bottom: 16px;
  }

  span {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin-bottom: 16px;
    text-align: center;
  }

  .el-button {
    font-size: 14px;
  }
}

// === 加载状态样式 ===
.loading-state {
  padding: 20px 0;

  .stats-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 32px;
  }
}

// === 作者信息样式增强 ===
.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;

  .iconify {
    font-size: 16px;
    color: var(--color-text-muted);
  }
}

// === 卡片状态增强 ===
.waterfall-card {
  &:hover {
    .author-info .iconify {
      color: var(--color-primary);
    }
  }
}

// === 骨架屏增强 ===
:deep(.el-skeleton__item) {
  background: linear-gradient(90deg, 
    var(--color-bg-secondary) 25%, 
    var(--color-bg-tertiary) 37%, 
    var(--color-bg-secondary) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: -100% 50%;
  }
}
</style>
