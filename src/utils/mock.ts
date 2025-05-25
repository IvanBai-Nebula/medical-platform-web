/**
 * Mock 工具函数
 * 用于模拟网络延迟和其他测试功能
 */

/**
 * 模拟网络延迟
 * @param ms 延迟时间（毫秒），默认500ms
 * @returns Promise
 */
export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 随机延迟
 * @param min 最小延迟时间（毫秒）
 * @param max 最大延迟时间（毫秒）
 * @returns Promise
 */
export const randomDelay = (min: number = 300, max: number = 800): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return mockDelay(delay)
}

/**
 * 模拟失败
 * @param errorRate 失败率（0-1）
 * @param errorMessage 错误信息
 * @returns Promise
 */
export const mockFailure = (errorRate: number = 0.1, errorMessage: string = 'Mock failure'): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (Math.random() < errorRate) {
      reject(new Error(errorMessage))
    } else {
      resolve()
    }
  })
}

/**
 * 模拟带延迟的失败
 * @param errorRate 失败率（0-1）
 * @param delay 延迟时间（毫秒）
 * @param errorMessage 错误信息
 * @returns Promise
 */
export const mockDelayedFailure = async (
  errorRate: number = 0.1, 
  delay: number = 500, 
  errorMessage: string = 'Mock failure'
): Promise<void> => {
  await mockDelay(delay)
  await mockFailure(errorRate, errorMessage)
} 