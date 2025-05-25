<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useUserStore } from '@/stores/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 主题管理
const { themeMode, setTheme } = useTheme()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 用户信息
const username = computed(() => {
  if (!userStore.userInfo) { return '' }
  if ('adminId' in userStore.userInfo) { return userStore.userInfo.username }
  if ('userId' in userStore.userInfo) { return userStore.userInfo.username }
  return ''
})

const userAvatar = computed(() => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  if (!userStore.userInfo) { 
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' 
  }
  
  const avatar = 'adminId' in userStore.userInfo 
    ? userStore.userInfo.avatar 
    : 'userId' in userStore.userInfo 
      ? userStore.userInfo.avatar 
      : null;
      
  if (!avatar) {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
  }
  
  // 检查是否已经是完整URL或数据URL
  if (avatar.startsWith('http') || avatar.startsWith('data:')) {
    return avatar;
  }
  
  // 相对路径添加基础URL
  return `${baseUrl}${avatar}`;
})

// 是否显示侧边栏
const showSidebar = computed(() => {
  // 排除首页和404页面
  return route.path !== '/' && route.path !== '/home' && route.path !== '/404'
})

// 检查用户认证状态
const isAuthenticated = computed(() => {
  return userStore.isAuthenticated
})

// 检查是否为管理员
const isAdmin = computed(() => {
  return userStore.userInfo && 'adminId' in userStore.userInfo
})


// 下拉菜单命令处理
const handleDropdownCommand = (command: string) => {
  if (command.startsWith('theme-')) {
    const theme = command.replace('theme-', '') as 'light' | 'dark' | 'auto'
    setTheme(theme)
    return
  }

  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'admin':
      router.push('/dashboard')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 登出处理
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('您确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    // 调用store的logout方法清除状态
    userStore.logout()
    // 清除localStorage中的token
    localStorage.removeItem('medical-app-token')
    ElMessage.success('已成功退出登录')
    router.push('/home')
  }
  catch {
    // 用户取消操作
  }
}
</script>

<template>
  <div class="main-layout">
    <!-- 头部导航栏 -->
    <header class="layout-header">
      <div class="header-logo">
        <router-link to="/">医疗知识学习平台</router-link>
      </div>
      <div class="header-menu">
        <el-menu
          mode="horizontal"
          :router="true"
          :default-active="activeMenu"
          background-color="transparent"
          text-color="var(--color-text-primary)"
          active-text-color="var(--color-primary)"
        >
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item v-if="isAdmin" index="/dashboard">平台管理</el-menu-item>
          <el-menu-item index="/knowledge">医疗知识</el-menu-item>
          <el-menu-item index="/experience">学习心得</el-menu-item>
        </el-menu>
      </div>
      <div class="header-actions">
        <template v-if="isAuthenticated">
          <el-dropdown @command="handleDropdownCommand">
            <span class="user-profile">
              <el-avatar :size="32" :src="userAvatar" />
              <span class="username">{{ username }}</span>
              <Icon icon="ep:arrow-down" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="theme-light">
                  <Icon icon="ep:sunny" />
                  <span>浅色模式</span>
                  <Icon v-if="themeMode === 'light'" icon="ep:check" class="theme-check" />
                </el-dropdown-item>
                <el-dropdown-item command="theme-dark">
                  <Icon icon="ep:moon" />
                  <span>深色模式</span>
                  <Icon v-if="themeMode === 'dark'" icon="ep:check" class="theme-check" />
                </el-dropdown-item>
                <el-dropdown-item command="theme-auto">
                  <Icon icon="ep:magic-stick" />
                  <span>自动模式</span>
                  <Icon v-if="themeMode === 'auto'" icon="ep:check" class="theme-check" />
                </el-dropdown-item>
                <el-dropdown-item divided command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button type="primary" @click="$router.push('/login')">登录/注册</el-button>
        </template>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="layout-content">
      <!-- 侧边栏菜单 (仅在特定页面显示) -->
      <aside v-if="showSidebar" class="layout-sidebar">
        <el-menu
          :default-active="activeMenu"
          :router="true"
          class="sidebar-menu"
          background-color="transparent"
          text-color="var(--color-text-secondary)"
          active-text-color="var(--color-text-primary)"
        >
          <!-- 管理员菜单 -->
          <template v-if="isAdmin">
            <el-sub-menu index="admin">
              <template #title>
                <Icon icon="ep:setting" />
                <span>平台管理</span>
              </template>
              <el-menu-item index="/dashboard">
                <Icon icon="ep:data-line" />仪表盘
              </el-menu-item>
              <el-menu-item index="/admin/users">
                <Icon icon="ep:user" />用户管理
              </el-menu-item>
              <el-menu-item index="/admin/categories">
                <Icon icon="ep:folder" />分类管理
              </el-menu-item>
            </el-sub-menu>
          </template>

          <!-- 知识管理菜单 -->
          <el-sub-menu index="knowledge-management">
            <template #title>
              <Icon icon="ep:document" />
              <span>医疗知识</span>
            </template>
            <el-menu-item index="/knowledge">
              <Icon icon="ep:collection" />知识浏览
            </el-menu-item>
            <el-menu-item v-if="isAdmin" index="/knowledge/create">
              <Icon icon="ep:plus" />新增知识
            </el-menu-item>
          </el-sub-menu>

          <!-- 心得管理菜单 -->
          <el-sub-menu index="experience-management">
            <template #title>
              <Icon icon="ep:chat-dot-round" />
              <span>学习心得</span>
            </template>
            <el-menu-item index="/experience">
              <Icon icon="ep:list" />心得浏览
            </el-menu-item>
            <el-menu-item v-if="isAuthenticated" index="/my-experience">
              <Icon icon="ep:message" />我的心得
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </aside>

      <!-- 路由内容 -->
      <div class="content-area" :class="{ 'with-sidebar': showSidebar }">
        <router-view />
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="layout-footer">
      <div>&copy; {{ new Date().getFullYear() }} 医疗知识学习平台 - 提供专业医疗知识分享与学习</div>
    </footer>
  </div>
</template>

<style scoped>
  .main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

/* 头部样式 */
.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-md);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.header-logo a {
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
  transition: color 0.3s ease;

  &:hover {
    color: var(--color-primary);
  }
}

.header-menu {
  flex: 1;
  margin-left: 40px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle-wrapper {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  backdrop-filter: blur(5px);

  &:hover {
    background: var(--glass-input-bg);
  }
}

.username {
  margin: 0 10px;
  color: var(--color-text-primary);
}

/* 主题选择样式 */
:deep(.el-dropdown-menu) {
  background: var(--color-bg-elevated) !important;
  border: 1px solid var(--color-border-primary) !important;
  border-radius: 12px;
  box-shadow: var(--shadow-lg) !important;
  backdrop-filter: blur(20px);
  padding: 8px 0;
  min-width: 200px;
}

:deep(.el-dropdown-menu__item) {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 12px 16px !important;
  color: var(--color-text-primary) !important;
  background-color: transparent !important;
  border-radius: 8px !important;
  margin: 0 8px !important;
  transition: all 0.2s ease !important;

  &:hover {
    background: var(--color-bg-secondary) !important;
    color: var(--color-primary) !important;
  }

  &.is-divided {
    border-top: 1px solid var(--color-border-secondary) !important;
    margin-top: 8px !important;
    padding-top: 16px !important;
  }

  .theme-check {
    margin-left: auto !important;
    color: var(--color-primary) !important;
    font-size: 16px !important;
  }

  .el-icon {
    font-size: 16px !important;
    color: var(--color-text-primary) !important;
  }

  span {
    color: var(--color-text-primary) !important;
  }
}

/* 强制覆盖Element Plus下拉菜单样式 */
:deep(.el-popper.is-light .el-dropdown-menu) {
  background: var(--color-bg-elevated) !important;
  border: 1px solid var(--color-border-primary) !important;
  color: var(--color-text-primary) !important;
}

:deep(.el-popper.is-light .el-dropdown-menu__item) {
  color: var(--color-text-primary) !important;
  background-color: transparent !important;

  &:not(.is-disabled):hover {
    background: var(--color-bg-secondary) !important;
    color: var(--color-primary) !important;
  }
}

/* 针对特定主题的强制样式 */
[data-theme='dark'] :deep(.el-dropdown-menu) {
  background: var(--color-bg-elevated) !important;
  border-color: var(--color-border-primary) !important;
}

[data-theme='dark'] :deep(.el-dropdown-menu__item) {
  color: var(--color-text-primary) !important;

  &:hover {
    background: var(--color-bg-secondary) !important;
    color: var(--color-primary) !important;
  }
}

.dark :deep(.el-dropdown-menu) {
  background: var(--color-bg-elevated) !important;
  border-color: var(--color-border-primary) !important;
}

.dark :deep(.el-dropdown-menu__item) {
  color: var(--color-text-primary) !important;

  &:hover {
    background: var(--color-bg-secondary) !important;
    color: var(--color-primary) !important;
  }
}

/* Element Plus 菜单样式覆盖 */
:deep(.el-menu) {
  background-color: transparent !important;
  border-right: none !important;
}

:deep(.el-menu-item) {
  color: var(--color-text-secondary) !important;

  &:hover {
    background-color: var(--color-bg-secondary) !important;
    color: var(--color-text-primary) !important;
  }

  &.is-active {
    background-color: var(--color-bg-secondary) !important;
    color: var(--color-text-primary) !important;
  }
}

:deep(.el-sub-menu__title) {
  color: var(--color-text-secondary) !important;

  &:hover {
    background-color: var(--color-bg-secondary) !important;
    color: var(--color-text-primary) !important;
  }
}

:deep(.el-sub-menu .el-menu-item) {
  color: var(--color-text-secondary) !important;

  &:hover {
    background-color: var(--color-bg-secondary) !important;
    color: var(--color-text-primary) !important;
  }

  &.is-active {
    background-color: var(--color-bg-secondary) !important;
    color: var(--color-primary) !important;
  }
}

/* Element Plus 按钮样式覆盖 */
:deep(.el-button) {
  background-color: var(--color-button-primary) !important;
  border-color: var(--color-button-primary) !important;
  color: var(--color-button-text) !important;

  &:hover {
    background-color: var(--color-button-primary-hover) !important;
    border-color: var(--color-button-primary-hover) !important;
  }
}

/* Element Plus 头像样式覆盖 */
:deep(.el-avatar) {
  background-color: var(--color-bg-secondary) !important;
  border: 1px solid var(--color-border-primary) !important;
}

/* Element Plus 图标样式覆盖 */
:deep(.el-icon) {
  color: inherit !important;
}

/* Iconify Icon 样式覆盖 */
:deep(.iconify) {
  color: inherit !important;
  font-size: 16px;
}

.theme-check {
  margin-left: auto !important;
  color: var(--color-primary) !important;
  font-size: 16px !important;
}

/* 内容区域 */
.layout-content {
  display: flex;
  min-height: calc(100vh - 60px - 60px); /* 减去header和footer高度 */
  padding-top: 60px; /* 为固定的header腾出空间 */
}

/* 侧边栏 */
.layout-sidebar {
  width: 220px;
  background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  height: calc(100vh - 60px);
  position: fixed;
  left: 0;
  top: 60px;
  overflow-y: auto;
  border-right: 1px solid var(--color-border-primary);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

/* 主内容区 */
.content-area {
  flex: 1;
  padding: 0;
  margin-left: 0;
  transition: margin-left 0.3s;
  background: var(--color-bg-primary);
  min-height: calc(100vh - 120px);
}

.content-area.with-sidebar {
  margin-left: 220px;
}

/* 页脚 */
.layout-footer {
  padding: 20px;
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
  color: var(--color-text-secondary);
  text-align: center;
  border-top: 1px solid var(--color-border-primary);
  backdrop-filter: blur(10px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-actions {
    gap: 8px;
  }

  .username {
    display: none;
  }

  .layout-sidebar {
    width: 100%;
    height: auto;
    position: static;
    display: none;
  }

  .content-area.with-sidebar {
    margin-left: 0;
  }
}
</style>
