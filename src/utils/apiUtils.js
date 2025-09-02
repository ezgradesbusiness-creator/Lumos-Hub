// src/utils/apiUtils.js

/**
 * API Utilities for Lumos Hub
 * Handles HTTP requests, error handling, retries, and response processing
 */

// Constants
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_BASE = 1000 // 1 second

// HTTP Status Code Utilities
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
}

// Error Classes
export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    }
  }
}

export class NetworkError extends Error {
  constructor(message, originalError = null) {
    super(message)
    this.name = 'NetworkError'
    this.originalError = originalError
    this.timestamp = new Date().toISOString()
  }
}

export class TimeoutError extends Error {
  constructor(message, timeout) {
    super(message)
    this.name = 'TimeoutError'
    this.timeout = timeout
    this.timestamp = new Date().toISOString()
  }
}

// Request Configuration Builder
export class RequestConfig {
  constructor() {
    this.config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: DEFAULT_TIMEOUT,
      retries: 0,
      retryDelay: RETRY_DELAY_BASE
    }
  }

  method(httpMethod) {
    this.config.method = httpMethod.toUpperCase()
    return this
  }

  headers(headerObj) {
    this.config.headers = { ...this.config.headers, ...headerObj }
    return this
  }

  timeout(ms) {
    this.config.timeout = ms
    return this
  }

  retries(count, delay = RETRY_DELAY_BASE) {
    this.config.retries = count
    this.config.retryDelay = delay
    return this
  }

  body(data) {
    if (data instanceof FormData) {
      // Remove Content-Type for FormData - browser will set it with boundary
      const { 'Content-Type': _, ...headersWithoutContentType } = this.config.headers
      this.config.headers = headersWithoutContentType
      this.config.body = data
    } else if (typeof data === 'object') {
      this.config.body = JSON.stringify(data)
    } else {
      this.config.body = data
    }
    return this
  }

  auth(token, type = 'Bearer') {
    this.config.headers.Authorization = `${type} ${token}`
    return this
  }

  build() {
    return { ...this.config }
  }
}

// HTTP Client
export class HttpClient {
  constructor(baseURL = '', defaultConfig = {}) {
    this.baseURL = baseURL
    this.defaultConfig = defaultConfig
    this.interceptors = {
      request: [],
      response: []
    }
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor)
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor)
  }

  // Apply request interceptors
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config }
    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig)
    }
    return modifiedConfig
  }

  // Apply response interceptors
  async applyResponseInterceptors(response) {
    let modifiedResponse = response
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse)
    }
    return modifiedResponse
  }

  // Main request method
  async request(url, config = {}) {
    const fullURL = this.buildURL(url)
    const mergedConfig = this.mergeConfig(config)
    const finalConfig = await this.applyRequestInterceptors(mergedConfig)

    let lastError = null
    const maxAttempts = finalConfig.retries + 1

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest(fullURL, finalConfig)
        const processedResponse = await this.applyResponseInterceptors(response)
        return processedResponse
      } catch (error) {
        lastError = error
        
        if (attempt === maxAttempts || !this.shouldRetry(error, attempt)) {
          break
        }

        await this.delay(finalConfig.retryDelay * Math.pow(2, attempt - 1))
      }
    }

    throw lastError
  }

  // Execute the actual HTTP request
  async executeRequest(url, config) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      const fetchConfig = {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal
      }

      const response = await fetch(url, fetchConfig)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw await this.createApiError(response)
      }

      return await this.processResponse(response)
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${config.timeout}ms`, config.timeout)
      }
      
      if (error instanceof ApiError) {
        throw error
      }
      
      throw new NetworkError('Network request failed', error)
    }
  }

  // Process response based on content type
  async processResponse(response) {
    const contentType = response.headers.get('content-type') || ''
    
    let data = null
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else if (contentType.includes('text/')) {
      data = await response.text()
    } else if (contentType.includes('application/octet-stream')) {
      data = await response.blob()
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    }
  }

  // Create API error from response
  async createApiError(response) {
    let errorData = null
    
    try {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        errorData = await response.json()
      } else {
        errorData = { message: await response.text() }
      }
    } catch {
      errorData = { message: response.statusText }
    }

    return new ApiError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code || response.status,
      errorData.details || null
    )
  }

  // Build full URL
  buildURL(url) {
    if (url.startsWith('http')) {
      return url
    }
    return `${this.baseURL}${url.startsWith('/') ? url : '/' + url}`
  }

  // Merge configurations
  mergeConfig(config) {
    return {
      ...this.defaultConfig,
      ...config,
      headers: {
        ...this.defaultConfig.headers,
        ...config.headers
      }
    }
  }

  // Check if request should be retried
  shouldRetry(error, attempt) {
    if (error instanceof TimeoutError) return true
    if (error instanceof NetworkError) return true
    if (error instanceof ApiError) {
      // Retry on server errors and rate limiting
      return error.status >= 500 || error.status === HttpStatus.TOO_MANY_REQUESTS
    }
    return false
  }

  // Delay utility for retries
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Convenience methods
  get(url, config = {}) {
    return this.request(url, { ...config, method: 'GET' })
  }

  post(url, data, config = {}) {
    return this.request(url, { 
      ...config, 
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    })
  }

  put(url, data, config = {}) {
    return this.request(url, { 
      ...config, 
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  patch(url, data, config = {}) {
    return this.request(url, { 
      ...config, 
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  delete(url, config = {}) {
    return this.request(url, { ...config, method: 'DELETE' })
  }
}

// Response Helpers
export const createSuccessResponse = (data, message = null, meta = {}) => ({
  success: true,
  data,
  message,
  meta,
  timestamp: new Date().toISOString()
})

export const createErrorResponse = (error, code = null) => ({
  success: false,
  error: error instanceof Error ? error.message : error,
  code,
  timestamp: new Date().toISOString()
})

// URL and Query Parameter Utilities
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item))
      } else {
        searchParams.append(key, value)
      }
    }
  })
  
  return searchParams.toString()
}

export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString)
  const result = {}
  
  for (const [key, value] of params.entries()) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key].push(value)
      } else {
        result[key] = [result[key], value]
      }
    } else {
      result[key] = value
    }
  }
  
  return result
}

// Request Caching
export class RequestCache {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  generateKey(url, config) {
    return `${config.method || 'GET'}_${url}_${JSON.stringify(config.body || {})}`
  }

  get(url, config) {
    const key = this.generateKey(url, config)
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  set(url, config, data) {
    const key = this.generateKey(url, config)
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }

  has(url, config) {
    const key = this.generateKey(url, config)
    const cached = this.cache.get(key)
    
    if (!cached) return false
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

// Upload Progress Tracker
export class UploadTracker {
  constructor() {
    this.uploads = new Map()
  }

  track(uploadId, onProgress) {
    this.uploads.set(uploadId, { onProgress, startTime: Date.now() })
  }

  updateProgress(uploadId, loaded, total) {
    const upload = this.uploads.get(uploadId)
    if (!upload) return

    const progress = Math.round((loaded / total) * 100)
    const elapsed = Date.now() - upload.startTime
    const speed = loaded / (elapsed / 1000) // bytes per second
    const remainingBytes = total - loaded
    const eta = remainingBytes / speed * 1000 // milliseconds

    upload.onProgress({
      loaded,
      total,
      progress,
      speed,
      eta: eta > 0 ? eta : 0
    })
  }

  complete(uploadId) {
    this.uploads.delete(uploadId)
  }
}

// Rate Limiter
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  async throttle() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.windowMs - (now - oldestRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return this.throttle()
    }

    this.requests.push(now)
  }
}

// Create default HTTP client instance
export const httpClient = new HttpClient()

// Add common request interceptor for authentication
httpClient.addRequestInterceptor(async (config) => {
  // Add auth token if available
  const token = localStorage.getItem('auth-token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for token refresh
httpClient.addResponseInterceptor(async (response) => {
  if (response.status === HttpStatus.UNAUTHORIZED) {
    // Handle token refresh logic here
    const refreshToken = localStorage.getItem('refresh-token')
    if (refreshToken) {
      // Attempt to refresh token
      // This is a placeholder - implement actual refresh logic
      console.warn('Token expired, refresh logic needed')
    }
  }
  return response
})

export default httpClient
