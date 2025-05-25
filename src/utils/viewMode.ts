/**
 * 视图模式工具类
 * 统一管理列表和瀑布流模式的切换逻辑
 */

export type ViewMode = 'list' | 'waterfall'

export interface ViewModeConfig {
  /** 是否为管理员 */
  isAdmin: boolean
  /** 默认模式 */
  defaultMode?: ViewMode
}

/**
 * 获取用户默认视图模式
 * @param config 配置项
 * @returns 默认视图模式
 */
export function getDefaultViewMode(config: ViewModeConfig): ViewMode {
  if (config.defaultMode) {
    return config.defaultMode
  }
  
  // 管理员默认列表模式，普通用户默认瀑布流模式
  return config.isAdmin ? 'list' : 'waterfall'
}

/**
 * 切换视图模式
 * @param currentMode 当前模式
 * @returns 新的模式
 */
export function toggleViewMode(currentMode: ViewMode): ViewMode {
  return currentMode === 'list' ? 'waterfall' : 'list'
}

/**
 * 获取视图模式的显示标题
 * @param mode 视图模式
 * @returns 显示标题
 */
export function getViewModeTitle(mode: ViewMode): string {
  return mode === 'list' ? '切换到瀑布流模式' : '切换到列表模式'
}

/**
 * 获取视图模式的图标
 * @param mode 视图模式  
 * @returns 图标名称
 */
export function getViewModeIcon(mode: ViewMode): string {
  return mode === 'list' ? 'fluent:grid-24-filled' : 'fluent:list-24-regular'
}

/**
 * 平滑切换视图模式的辅助函数
 * @param element 目标元素
 * @param callback 切换回调
 * @param duration 动画持续时间
 */
export async function smoothToggleViewMode(
  element: HTMLElement | null,
  callback: () => Promise<void>,
  duration: number = 150
): Promise<void> {
  return new Promise((resolve) => {
    if (element) {
      element.style.opacity = '0.5'
      element.style.transform = 'translateY(10px)'
    }
    
    setTimeout(async () => {
      try {
        await callback()
      } finally {
        if (element) {
          element.style.opacity = '1'
          element.style.transform = 'translateY(0)'
        }
        resolve()
      }
    }, duration)
  })
} 