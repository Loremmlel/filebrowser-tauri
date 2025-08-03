// API 错误类型定义，与后端保持一致
export interface ApiError {
  status_code: number
  message: string
  error_type: ErrorType
}

export enum ErrorType {
  Warning = 'Warning', // 4xx 客户端错误 - 显示为警告
  Error = 'Error', // 5xx 服务器错误 - 显示为错误
  Network = 'Network', // 网络错误或其他错误
}

// 从 Tauri invoke 错误中解析 ApiError
export function parseApiError(error: unknown): ApiError {
  if (typeof error === 'string') {
    try {
      // 尝试解析 JSON 字符串
      const parsed = JSON.parse(error) as ApiError
      if (parsed.status_code && parsed.message && parsed.error_type) {
        return parsed
      }
    } catch {
      // 如果不是有效的 JSON，返回默认错误
    }

    // 如果是普通字符串错误，返回网络错误
    return {
      status_code: 0,
      message: error,
      error_type: ErrorType.Network,
    }
  }

  // 处理其他类型的错误
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      status_code: 0,
      message: String(error.message),
      error_type: ErrorType.Network,
    }
  }

  // 默认错误
  return {
    status_code: 0,
    message: '未知错误',
    error_type: ErrorType.Network,
  }
}
