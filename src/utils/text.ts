/**
 * 文本处理工具函数
 */

/**
 * 将HTML内容转换为纯文本
 * @param html HTML字符串
 * @returns 纯文本内容
 */
export function htmlToText(html: string): string {
  if (!html) return ''
  
  // 创建一个临时的div元素来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // 获取纯文本内容
  const text = tempDiv.textContent || tempDiv.innerText || ''
  
  // 清理多余的空白字符
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * 截取文本内容
 * @param text 原始文本
 * @param maxLength 最大长度
 * @param suffix 后缀（默认为...）
 * @returns 截取后的文本
 */
export function truncateText(text: string, maxLength: number = 100, suffix: string = '...'): string {
  if (!text) return ''
  
  if (text.length <= maxLength) {
    return text
  }
  
  return text.slice(0, maxLength) + suffix
}

/**
 * 从HTML内容中提取纯文本并截取
 * @param html HTML字符串
 * @param maxLength 最大长度
 * @param suffix 后缀
 * @returns 截取后的纯文本
 */
export function extractAndTruncateText(html: string, maxLength: number = 150, suffix: string = '...'): string {
  const text = htmlToText(html)
  return truncateText(text, maxLength, suffix)
}

/**
 * 高亮搜索关键词
 * @param text 原始文本
 * @param keyword 搜索关键词
 * @returns 高亮后的HTML
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword || !text) return text
  
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 计算文本的实际长度（排除HTML标签）
 * @param html HTML字符串
 * @returns 文本长度
 */
export function getTextLength(html: string): number {
  return htmlToText(html).length
} 