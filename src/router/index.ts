import type { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/modules/user' // 导入用户store
import LoginView from '@/views/auth/LoginView.vue'

// 导入主布局组件，所有需要认证的页面都将使用它
// 假设我们有一个 MainLayout.vue 组件在 src/layouts/ 目录下
const MainLayout = () => import('@/components/layouts/MainLayout.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }, // 登录页通常不需要认证
  },
  {
    path: '/', // 主应用路径，通常包含需要认证的页面
    component: MainLayout, // 使用主布局
    redirect: '/home', // 默认重定向到首页
    meta: { requiresAuth: false }, // 首页不需要认证
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/home/HomeView.vue'), // 首页
        meta: { title: '首页', requiresAuth: false },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'), // 仪表盘页面
        meta: { title: '仪表盘', requiresAuth: true, requiresAdmin: true }, // 仪表盘需要管理员权限
      },
      // 知识管理相关路由
      {
        path: 'knowledge',
        name: 'knowledgeList',
        component: () => import('@/views/knowledge/KnowledgeList.vue'),
        meta: { title: '知识库' },
      },
      {
        path: 'knowledge/create',
        name: 'knowledgeCreate',
        component: () => import('@/views/knowledge/KnowledgeForm.vue'),
        meta: { title: '创建知识', requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'knowledge/edit/:id',
        name: 'knowledgeEdit',
        component: () => import('@/views/knowledge/KnowledgeForm.vue'),
        meta: { title: '编辑知识', requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'knowledge/:id',
        name: 'knowledgeDetail',
        component: () => import('@/views/knowledge/KnowledgeDetail.vue'),
        meta: { title: '知识详情' },
      },
      // 学习心得管理路由
      {
        path: 'experience',
        name: 'experienceList',
        component: () => import('@/views/experience/ExperienceList.vue'),
        meta: { title: '学习心得' },
      },
      {
        path: 'my-experience',
        name: 'myExperience',
        component: () => import('@/views/experience/MyExperience.vue'),
        meta: { title: '我的心得', requiresAuth: true },
      },
      {
        path: 'experience/create',
        name: 'experienceCreate',
        component: () => import('@/views/experience/ExperienceForm.vue'),
        meta: { title: '发布心得', requiresAuth: true },
      },
      {
        path: 'experience/edit/:id',
        name: 'experienceEdit',
        component: () => import('@/views/experience/ExperienceForm.vue'),
        meta: { title: '编辑心得', requiresAuth: true },
      },
      {
        path: 'experience/:id',
        name: 'experienceDetail',
        component: () => import('@/views/experience/ExperienceDetail.vue'),
        meta: { title: '心得详情' },
      },
      // 个人资料路由
      {
        path: 'profile',
        name: 'userProfile',
        component: () => import('@/views/profile/UserProfile.vue'),
        meta: { title: '个人资料', requiresAuth: true },
      },
      {
        path: 'profile/settings',
        name: 'profileSettings',
        component: () => import('@/views/profile/ProfileSettings.vue'),
        meta: { title: '设置中心', requiresAuth: true },
      },
      // 管理员功能路由
      {
        path: 'admin/users',
        name: 'userManagement',
        component: () => import('@/views/admin/UserManagement.vue'),
        meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/categories',
        name: 'categoryManagement',
        component: () => import('@/views/admin/CategoryManagement.vue'),
        meta: { title: '分类管理', requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
  // 404 页面路由 (确保放在最后)
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/components/error/NotFoundPage.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 导航守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  console.log('路由守卫 - 当前路由:', to.path)
  console.log('路由守卫 - 认证状态:', userStore.isAuthenticated)
  console.log('路由守卫 - 用户角色:', userStore.currentUserRole)

  // 从localStorage恢复token并更新store
  if (!userStore.isAuthenticated && localStorage.getItem('medical-app-token')) {
    try {
      console.log('路由守卫 - 发现token，尝试恢复用户状态')
      const token = localStorage.getItem('medical-app-token')
      if (token) {
        // 设置token
        userStore.$patch({ token })
        // 尝试获取用户信息 - 确保等待完成
        await userStore.initStore()

        console.log('路由守卫 - 用户状态恢复完成, 角色:', userStore.currentUserRole)
      }
    }
    catch (error) {
      console.error('恢复用户登录状态失败:', error)
      localStorage.removeItem('medical-app-token') // 移除可能无效的token
    }
  }

  const isAuthenticated = userStore.isAuthenticated // 从store的getter获取认证状态
  const isAdmin = userStore.isAdmin // 检查是否为管理员

  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true) // 只有明确设置为true的路由才需要认证
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin === true) // 检查是否需要管理员权限

  console.log('路由守卫 - 权限检查:', {
    path: to.path,
    requiresAuth,
    requiresAdmin,
    isAuthenticated,
    isAdmin,
  })

  if (requiresAuth && !isAuthenticated) {
    // 如果目标路由需要认证但用户未认证，则重定向到登录页
    // 同时将目标路径作为 redirect 查询参数传递，以便登录后可以跳回
    console.log('路由守卫 - 未认证，重定向到登录页')
    next({ name: 'login', query: { redirect: to.fullPath } })
  }
  else if (requiresAdmin && !isAdmin) {
    // 如果目标路由需要管理员权限但用户不是管理员，则重定向到首页并提示
    console.log('路由守卫 - 权限不足，重定向到首页')
    next({ name: 'home' })
    // 添加权限不足的用户友好提示
    if (isAuthenticated) {
      // 使用 nextTick 确保路由跳转后再显示消息
      nextTick(() => {
        ElMessage({
          message: '抱歉，您没有访问该页面的权限',
          type: 'warning',
          duration: 3000,
        })
      })
    }
  }
  else if (to.name === 'login' && isAuthenticated) {
    // 如果已认证用户访问登录页，则重定向到首页
    console.log('路由守卫 - 已认证用户访问登录页，重定向到首页')
    next({ name: 'home' })
  }
  else {
    // 其他情况（无需认证的路由，或已认证用户访问需认证的路由）直接放行
    console.log('路由守卫 - 通过权限检查，允许访问')
    next()
  }
})

export default router
