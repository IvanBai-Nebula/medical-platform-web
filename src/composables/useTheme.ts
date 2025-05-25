import { ref, computed, watch, onMounted } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_STORAGE_KEY = 'medical-platform-theme'

// 响应式主题状态
const themeMode = ref<ThemeMode>('auto')
const systemPrefersDark = ref(false)

// 计算当前实际主题
const currentTheme = computed(() => {
  if (themeMode.value === 'auto') {
    return systemPrefersDark.value ? 'dark' : 'light'
  }
  return themeMode.value === 'dark' ? 'dark' : 'light'
})

// 应用主题到 DOM
const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  
  // 同时设置 class 以便于 CSS 选择器使用
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}

// 检测系统主题偏好
const detectSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches
    
    // 监听系统主题变化
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches
    })
  }
}

// 从本地存储读取主题设置
const loadThemeFromStorage = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      themeMode.value = stored as ThemeMode
    }
  }
}

// 保存主题设置到本地存储
const saveThemeToStorage = (theme: ThemeMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
}

export function useTheme() {
  // 设置主题
  const setTheme = (theme: ThemeMode) => {
    themeMode.value = theme
    saveThemeToStorage(theme)
  }

  // 切换主题
  const toggleTheme = () => {
    if (themeMode.value === 'light') {
      setTheme('dark')
    } else if (themeMode.value === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  // 直接切换明暗主题（不包括 auto）
  const toggleLightDark = () => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  // 获取主题图标
  const getThemeIcon = () => {
    switch (themeMode.value) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'auto':
        return '🌓'
      default:
        return '🌓'
    }
  }

  // 获取主题名称
  const getThemeName = () => {
    switch (themeMode.value) {
      case 'light':
        return '明亮模式'
      case 'dark':
        return '黑暗模式'
      case 'auto':
        return '跟随系统'
      default:
        return '跟随系统'
    }
  }

  // 初始化主题
  const initTheme = () => {
    detectSystemTheme()
    loadThemeFromStorage()
  }

  // 监听主题变化并应用
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  }, { immediate: true })

  // 组件挂载时初始化
  onMounted(() => {
    initTheme()
  })

  return {
    // 状态
    themeMode: readonly(themeMode),
    currentTheme: readonly(currentTheme),
    systemPrefersDark: readonly(systemPrefersDark),
    
    // 方法
    setTheme,
    toggleTheme,
    toggleLightDark,
    getThemeIcon,
    getThemeName,
    initTheme,
  }
}

// 全局初始化（用于 main.ts）
export function initGlobalTheme() {
  detectSystemTheme()
  loadThemeFromStorage()
  
  // 立即应用主题以避免闪烁
  const theme = themeMode.value === 'auto' 
    ? (systemPrefersDark.value ? 'dark' : 'light')
    : themeMode.value
  applyTheme(theme)
} 