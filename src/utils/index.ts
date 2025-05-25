// 导出所有工具模块
export * from './images'
export * from './mock'
export * from './requests'
export * from './text'
export * from './viewMode'

// 时间格式化工具函数
/**
 * 格式化日期时间
 * @param dateString 日期字符串
 * @param type 格式类型
 * @returns 格式化后的字符串
 */
export function formatDateTime(dateString: string, type: 'date' | 'time' | 'datetime' = 'datetime'): string {
  if (!dateString) {
    return ''
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  switch (type) {
    case 'date':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    case 'time':
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    case 'datetime':
    default:
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
  }
}

/**
 * 格式化相对时间
 * @param dateString 日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) {
    return ''
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffMinutes < 1) {
    return '刚刚'
  }
  else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  }
  else if (diffHours < 24) {
    return `${diffHours}小时前`
  }
  else if (diffDays === 1) {
    return '昨天'
  }
  else if (diffDays < 7) {
    return `${diffDays}天前`
  }
  else if (diffWeeks < 4) {
    return `${diffWeeks}周前`
  }
  else if (diffMonths < 12) {
    return `${diffMonths}个月前`
  }
  else {
    return `${diffYears}年前`
  }
}
