import type { AxiosError, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/common'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/modules/user'

// === 错误处理配置 ===
interface ErrorHandlingConfig {
  showErrorMessage: boolean // 是否显示错误信息
  errorMessageDuration: number // 错误消息显示时长(ms)
  ignoreErrorCodes: number[] // 忽略的错误码(不显示错误消息)
  tokenExpirationCode: number // token失效的错误码
}

// 默认错误处理配置
const defaultErrorConfig: ErrorHandlingConfig = {
  showErrorMessage: true,
  errorMessageDuration: 3000,
  ignoreErrorCodes: [401], // 401错误由专门逻辑处理
  tokenExpirationCode: 401,
}

// 全局错误处理配置
let errorConfig: ErrorHandlingConfig = { ...defaultErrorConfig }

// 配置错误处理
export function configureErrorHandling(config: Partial<ErrorHandlingConfig>) {
  errorConfig = { ...errorConfig, ...config }
}

// 错误消息防抖
const errorMessageCache = new Map<string, number>()
const ERROR_DEBOUNCE_TIME = 2000 // 同一消息2秒内不重复显示

/**
 * 显示错误消息，带防抖
 */
function showErrorMessage(message: string, type: 'error' | 'warning' = 'error') {
  const now = Date.now()
  const lastTime = errorMessageCache.get(message) || 0

  if (now - lastTime > ERROR_DEBOUNCE_TIME) {
    ElMessage({
      message,
      type,
      duration: errorConfig.errorMessageDuration,
    })
    errorMessageCache.set(message, now)
  }
}

// 请求重试配置类型
interface RetryConfig {
  retries: number // 重试次数
  retryDelay: number // 重试延迟(ms)
  retryCondition?: (error: AxiosError) => boolean // 判断是否需要重试的条件
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 2,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // 默认只对网络错误或500+错误进行重试
    return (
      !error.response // 网络错误
      || (error.response && error.response.status >= 500) // 服务器错误
    )
  },
}

// 创建取消令牌Map，用于存储和管理请求取消函数
export const pendingRequests = new Map<string, AbortController>()

// 生成请求Key，用于标识请求
const generateRequestKey = (config: InternalAxiosRequestConfig): string => {
  const { url, method, params, data } = config
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&')
}

// 添加请求到待处理Map
const addPendingRequest = (config: InternalAxiosRequestConfig): void => {
  const requestKey = generateRequestKey(config)
  if (!pendingRequests.has(requestKey)) {
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestKey, controller)
  }
}

// 从待处理Map移除请求
const removePendingRequest = (config: InternalAxiosRequestConfig): void => {
  const requestKey = generateRequestKey(config)
  if (pendingRequests.has(requestKey)) {
    pendingRequests.delete(requestKey)
  }
}

// 扩展请求配置接口
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  showError?: boolean // 是否显示错误提示，默认为true
  needToken?: boolean // 是否需要token，默认为true
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // API 基础路径，从 .env 文件读取
  timeout: 10000, // 请求超时时间 (毫秒)
})

// 请求拦截器
service.interceptors.request.use(
  (config: CustomRequestConfig): CustomRequestConfig | Promise<CustomRequestConfig> => {
    // 添加请求到待处理Map
    addPendingRequest(config)

    // 默认需要token
    if (config.needToken !== false) {
      const userStore = useUserStore()
      if (userStore.token) {
        // 确保 headers 对象存在
        config.headers = (config.headers || {}) as AxiosRequestHeaders
        config.headers.Authorization = `Bearer ${userStore.token}` // 在请求头中添加认证 Token
      }
    }

    // 设置默认的错误处理行为
    if (config.showError === undefined) {
      config.showError = errorConfig.showErrorMessage
    }

    return config
  },
  (error: AxiosError) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 请求完成后，从待处理Map中移除
    removePendingRequest(response.config as InternalAxiosRequestConfig)

    const config = response.config as CustomRequestConfig
    const res = response.data

    // 检查是否是标准API响应格式 {code, message, data}
    if (res && typeof res === 'object' && 'code' in res) {
      // 业务状态码判断：约定 code 在 200-299 范围内为成功
      if (res.code >= 200 && res.code < 300) {
        return res // 成功时，返回完整响应，让调用者决定如何处理
      }

      // 处理业务错误 (res.code 不在 200-299 范围)
      console.error('API业务错误:', res)

      // 特定业务错误码处理，例如 Token 失效
      if (res.code === errorConfig.tokenExpirationCode) {
        handleTokenExpired()
        return Promise.reject(new Error(res.message || '登录已过期，请重新登录'))
      }

      // 控制是否显示错误信息
      const shouldShowError = config.showError && !errorConfig.ignoreErrorCodes.includes(res.code)
      if (shouldShowError) {
        showErrorMessage(res.message || '业务处理失败，请稍后再试')
      }

      return Promise.reject(new Error(res.message || '业务错误'))
    }

    // 如果不是标准格式，直接返回原始响应数据
    return res
  },
  (error: any) => {
    // 请求出错也要从待处理Map中移除
    if (error.config) {
      removePendingRequest(error.config as InternalAxiosRequestConfig)
    }

    // 如果是取消请求的错误，不显示错误信息
    if (axios.isCancel(error)) {
      console.log('请求已取消:', error.message)
      return Promise.reject(error)
    }

    const config = error.config as CustomRequestConfig
    let message = '请求发生未知错误'

    if (error.response) {
      // 服务器返回了响应，但状态码不在 2xx 范围
      const status = error.response.status
      switch (status) {
        case 400:
          message = '请求参数错误 (400)'
          break
        case 401:
          message = '未授权，请重新登录 (401)'
          handleTokenExpired()
          break
        case 403:
          message = '禁止访问 (403)'
          break
        case 404:
          message = '请求资源未找到 (404)'
          break
        case 500:
          message = '服务器内部错误 (500)'
          break
        case 502:
          message = '网关错误 (502)'
          break
        case 503:
          message = '服务不可用 (503)'
          break
        case 504:
          message = '网关超时 (504)'
          break
        default:
          message = `请求失败，状态码：${status}`
      }
    }
    else if (error.request) {
      // 请求已发出，但没有收到响应 (例如网络问题、服务器宕机)
      message = '网络请求超时或服务器无响应，请检查您的网络连接'
    }
    else {
      // 在设置请求时触发了一个错误 (例如请求被取消)
      message = error.message || '请求发送失败，请稍后重试'
    }

    // 控制是否显示错误信息
    if (config?.showError) {
      showErrorMessage(message)
    }

    return Promise.reject(error)
  },
)

/**
 * 处理Token过期
 */
function handleTokenExpired() {
  const userStore = useUserStore()
  if (userStore.isAuthenticated) {
    // 确保未显示过登录过期提示
    const expireKey = 'token_expired_shown'
    const expireShown = sessionStorage.getItem(expireKey)

    if (!expireShown) {
      sessionStorage.setItem(expireKey, 'true')

      // 显示会话过期提示
      ElMessageBox.confirm('您的登录状态已失效，请重新登录', '登录已过期', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          // 跳转到登录页
          const currentPath = window.location.pathname + window.location.search
          window.location.href = `/login?redirect=${currentPath}`
        })
        .catch(() => {
          // 用户取消，仍然清除登录状态
        })
        .finally(() => {
          // 登出
          userStore.logout()
          // 清除标记
          setTimeout(() => sessionStorage.removeItem(expireKey), 2000)
        })
    }
    else {
      // 已经显示过，只进行登出
      userStore.logout()
    }
  }
}

/**
 * 取消所有请求
 */
export const cancelAllRequests = (): void => {
  pendingRequests.forEach((controller) => {
    controller.abort()
  })
  pendingRequests.clear()
}

/**
 * 取消指定URL的请求
 * @param url 要取消的请求URL
 */
export const cancelRequest = (url: string): void => {
  pendingRequests.forEach((controller, key) => {
    if (key.startsWith(url)) {
      controller.abort()
      pendingRequests.delete(key)
    }
  })
}

/**
 * 创建带重试功能的请求
 * @param fn 请求函数
 * @param retryConfig 重试配置
 */
export const withRetry = <T>(
  fn: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {},
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  return new Promise<T>((resolve, reject) => {
    const attempt = (attemptsLeft: number): void => {
      fn()
        .then(resolve)
        .catch((error) => {
          const axiosError = error as AxiosError
          if (attemptsLeft <= 0 || !config.retryCondition?.(axiosError)) {
            reject(error)
            return
          }

          console.log(`请求失败，${config.retryDelay}ms后重试，剩余重试次数: ${attemptsLeft}`)
          setTimeout(() => attempt(attemptsLeft - 1), config.retryDelay)
        })
    }

    attempt(config.retries)
  })
}

// 自定义请求选项接口
export interface RequestOptions {
  showError?: boolean // 是否显示错误提示
  needToken?: boolean // 是否需要携带token
  retry?: Partial<RetryConfig> // 重试配置
}

/**
 * 通用 GET 请求
 * @param url 请求地址
 * @param params URL查询参数
 * @param options 请求选项
 * @returns Promise<T> T 为拦截器处理后的业务数据类型
 */
export const httpGet = <T = any>(
  url: string,
  params?: object,
  options?: RequestOptions,
): Promise<T> => {
  const customConfig = {
    showError: options?.showError,
    needToken: options?.needToken,
  }

  const request = () =>
    service.get<T, T>(url, {
      params,
      headers: {}, // 避免TypeScript错误
      ...customConfig,
    })

  return options?.retry ? withRetry<T>(request, options.retry) : request()
}

/**
 * 通用 POST 请求
 * @param url 请求地址
 * @param data 请求体数据
 * @param options 请求选项
 * @returns Promise<T> T 为拦截器处理后的业务数据类型
 */
export const httpPost = <T = any>(
  url: string,
  data?: any,
  options?: RequestOptions,
): Promise<T> => {
  const customConfig = {
    showError: options?.showError,
    needToken: options?.needToken,
  }

  const request = () =>
    service.post<T, T>(url, data, {
      headers: {}, // 避免TypeScript错误
      ...customConfig,
    })

  return options?.retry ? withRetry<T>(request, options.retry) : request()
}

/**
 * 通用 PUT 请求
 * @param url 请求地址
 * @param data 请求体数据
 * @param options 请求选项
 * @returns Promise<T> T 为拦截器处理后的业务数据类型
 */
export const httpPut = <T = any>(url: string, data?: any, options?: RequestOptions): Promise<T> => {
  const customConfig = {
    showError: options?.showError,
    needToken: options?.needToken,
  }

  const request = () =>
    service.put<T, T>(url, data, {
      headers: {}, // 避免TypeScript错误
      ...customConfig,
    })

  return options?.retry ? withRetry<T>(request, options.retry) : request()
}

/**
 * 通用 DELETE 请求
 * @param url 请求地址
 * @param params URL查询参数 (有些DELETE请求可能将参数放在URL中)
 * @param options 请求选项
 * @returns Promise<T> T 为拦截器处理后的业务数据类型
 */
export const httpDelete = <T = any>(
  url: string,
  params?: object,
  options?: RequestOptions,
): Promise<T> => {
  const customConfig = {
    showError: options?.showError,
    needToken: options?.needToken,
  }

  const request = () =>
    service.delete<T, T>(url, {
      params,
      headers: {}, // 避免TypeScript错误
      ...customConfig,
    })

  return options?.retry ? withRetry<T>(request, options.retry) : request()
}

export default service
