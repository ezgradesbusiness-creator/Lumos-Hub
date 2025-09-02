// src/utils/inputSanitizer.js

/**
 * Input Sanitization and Validation Utilities for Lumos Hub
 * Provides comprehensive input cleaning, validation, and security measures
 */

// Regular expressions for validation
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  URL: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHA: /^[a-zA-Z]+$/,
  NUMERIC: /^\d+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  MARKDOWN_LINK: /\[([^\]]*)\]\(([^)]+)\)/g,
  HTML_TAG: /<[^>]*>/g,
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
  XSS_BASIC: /[<>\"']/g
}

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /<script/gi,
  /<link/gi,
  /<meta/gi,
  /data:text\/html/gi,
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi
]

// Common profanity words (basic list)
const PROFANITY_LIST = [
  'spam', 'scam', 'phishing', 'malware', 'virus'
  // Add more as needed, keeping it professional
]

/**
 * Main InputSanitizer class
 */
export class InputSanitizer {
  constructor(options = {}) {
    this.options = {
      maxLength: options.maxLength || 10000,
      allowHTML: options.allowHTML || false,
      allowMarkdown: options.allowMarkdown || true,
      strictMode: options.strictMode || false,
      customPatterns: options.customPatterns || {},
      ...options
    }
  }

  /**
   * Sanitize general text input
   */
  sanitizeText(input, maxLength = null) {
    if (!input || typeof input !== 'string') return ''

    let sanitized = input.trim()
    
    // Limit length
    const length = maxLength || this.options.maxLength
    if (sanitized.length > length) {
      sanitized = sanitized.substring(0, length)
    }

    // Remove dangerous patterns
    sanitized = this.removeDangerousPatterns(sanitized)

    // Handle HTML based on settings
    if (!this.options.allowHTML) {
      sanitized = this.stripHTML(sanitized)
    } else {
      sanitized = this.sanitizeHTML(sanitized)
    }

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim()

    return sanitized
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(input) {
    if (!input) return ''

    // List of allowed HTML tags for rich text
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img'
    ]

    const allowedAttributes = {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'width', 'height'],
      'blockquote': ['cite']
    }

    // Remove script tags and dangerous content
    let sanitized = input.replace(PATTERNS.SCRIPT_TAG, '')
    
    // Remove dangerous attributes
    sanitized = sanitized.replace(/\son\w+\s*=/gi, '')
    
    // This is a basic implementation - in production, use a library like DOMPurify
    return sanitized
  }

  /**
   * Strip all HTML tags
   */
  stripHTML(input) {
    if (!input) return ''
    return input.replace(PATTERNS.HTML_TAG, '')
  }

  /**
   * Remove dangerous patterns
   */
  removeDangerousPatterns(input) {
    if (!input) return ''

    let cleaned = input
    DANGEROUS_PATTERNS.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '')
    })

    return cleaned
  }

  /**
   * Sanitize email input
   */
  sanitizeEmail(input) {
    if (!input) return ''
    
    let email = input.trim().toLowerCase()
    
    // Remove dangerous characters
    email = email.replace(/[<>\"']/g, '')
    
    // Basic length check
    if (email.length > 320) return '' // RFC 5321 limit
    
    return email
  }

  /**
   * Sanitize URL input
   */
  sanitizeURL(input) {
    if (!input) return ''

    let url = input.trim()
    
    // Check for dangerous protocols
    if (url.match(/^(javascript|data|vbscript):/i)) {
      return ''
    }

    // Ensure HTTP/HTTPS protocol
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url
    }

    // Basic validation
    if (!PATTERNS.URL.test(url)) {
      return ''
    }

    return url
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(input) {
    if (!input) return ''

    let filename = input.trim()
    
    // Remove path separators and dangerous characters
    filename = filename.replace(/[\/\\:*?"<>|]/g, '')
    
    // Remove leading dots and spaces
    filename = filename.replace(/^[\.\s]+/, '')
    
    // Limit length
    if (filename.length > 255) {
      const ext = filename.split('.').pop()
      const name = filename.substring(0, 250 - ext.length)
      filename = `${name}.${ext}`
    }

    // Ensure it's not empty
    if (!filename) {
      filename = 'untitled'
    }

    return filename
  }

  /**
   * Sanitize JSON input
   */
  sanitizeJSON(input) {
    if (!input) return null

    try {
      // Parse and re-stringify to ensure valid JSON
      const parsed = JSON.parse(input)
      return this.deepSanitizeObject(parsed)
    } catch {
      return null
    }
  }

  /**
   * Deep sanitize object properties
   */
  deepSanitizeObject(obj, maxDepth = 10, currentDepth = 0) {
    if (currentDepth >= maxDepth) return null
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? this.sanitizeText(obj) : obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitizeObject(item, maxDepth, currentDepth + 1))
    }

    const sanitizedObj = {}
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeText(key, 100)
      if (sanitizedKey) {
        sanitizedObj[sanitizedKey] = this.deepSanitizeObject(value, maxDepth, currentDepth + 1)
      }
    }

    return sanitizedObj
  }

  /**
   * Check for profanity (basic implementation)
   */
  containsProfanity(input) {
    if (!input) return false
    
    const lowerInput = input.toLowerCase()
    return PROFANITY_LIST.some(word => lowerInput.includes(word))
  }

  /**
   * Filter profanity
   */
  filterProfanity(input, replacement = '***') {
    if (!input) return ''

    let filtered = input
    PROFANITY_LIST.forEach(word => {
      const regex = new RegExp(word, 'gi')
      filtered = filtered.replace(regex, replacement)
    })

    return filtered
  }

  /**
   * Validate input against pattern
   */
  validate(input, pattern, customMessage = null) {
    if (!input) return { valid: false, message: 'Input is required' }

    const regex = PATTERNS[pattern] || this.options.customPatterns[pattern]
    if (!regex) return { valid: false, message: 'Unknown validation pattern' }

    const valid = regex.test(input)
    return {
      valid,
      message: valid ? null : (customMessage || `Invalid ${pattern} format`)
    }
  }

  /**
   * Sanitize search query
   */
  sanitizeSearchQuery(input) {
    if (!input) return ''

    let query = input.trim()
    
    // Remove SQL injection patterns
    query = query.replace(PATTERNS.SQL_INJECTION, '')
    
    // Remove special characters that could cause issues
    query = query.replace(/[<>\"';]/g, '')
    
    // Limit length
    if (query.length > 200) {
      query = query.substring(0, 200)
    }

    return query
  }

  /**
   * Sanitize task/note content
   */
  sanitizeContent(input, type = 'general') {
    if (!input) return ''

    let sanitized = this.sanitizeText(input)

    switch (type) {
      case 'task':
        // Allow basic formatting but be strict
        sanitized = this.stripHTML(sanitized)
        break
      
      case 'note':
        // Allow more formatting for notes
        if (this.options.allowMarkdown) {
          sanitized = this.sanitizeMarkdown(sanitized)
        }
        break
      
      case 'message':
        // Chat messages need emoji support
        sanitized = this.sanitizeMessage(sanitized)
        break
      
      default:
        // General content
        sanitized = this.stripHTML(sanitized)
    }

    return sanitized
  }

  /**
   * Sanitize markdown content
   */
  sanitizeMarkdown(input) {
    if (!input) return ''

    let sanitized = input

    // Remove dangerous markdown patterns
    sanitized = sanitized.replace(/\[([^\]]*)\]\(javascript:[^)]*\)/g, '[$1](blocked)')
    sanitized = sanitized.replace(/\[([^\]]*)\]\(data:[^)]*\)/g, '[$1](blocked)')

    return sanitized
  }

  /**
   * Sanitize chat message
   */
  sanitizeMessage(input) {
    if (!input) return ''

    let message = this.sanitizeText(input, 500) // Shorter limit for messages
    
    // Filter profanity in chat
    if (this.options.filterProfanity) {
      message = this.filterProfanity(message)
    }

    return message
  }

  /**
   * Sanitize user preferences/settings
   */
  sanitizePreferences(preferences) {
    if (!preferences || typeof preferences !== 'object') return {}

    const sanitized = {}
    const allowedKeys = [
      'theme', 'language', 'timezone', 'notifications', 'privacy',
      'fontSize', 'volume', 'autoSave', 'soundEnabled', 'darkMode'
    ]

    for (const [key, value] of Object.entries(preferences)) {
      if (allowedKeys.includes(key)) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeText(value, 100)
        } else if (typeof value === 'boolean' || typeof value === 'number') {
          sanitized[key] = value
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.deepSanitizeObject(value, 3)
        }
      }
    }

    return sanitized
  }
}

// Validation helper functions
export const validators = {
  email: (input) => new InputSanitizer().validate(input, 'EMAIL'),
  url: (input) => new InputSanitizer().validate(input, 'URL'),
  phone: (input) => new InputSanitizer().validate(input, 'PHONE'),
  username: (input) => new InputSanitizer().validate(input, 'USERNAME'),
  password: (input) => new InputSanitizer().validate(input, 'PASSWORD'),
  
  required: (input) => ({
    valid: Boolean(input && input.trim()),
    message: 'This field is required'
  }),
  
  minLength: (input, min) => ({
    valid: input && input.length >= min,
    message: `Must be at least ${min} characters`
  }),
  
  maxLength: (input, max) => ({
    valid: !input || input.length <= max,
    message: `Must be no more than ${max} characters`
  }),
  
  range: (value, min, max) => ({
    valid: value >= min && value <= max,
    message: `Must be between ${min} and ${max}`
  }),
  
  custom: (input, validator, message) => ({
    valid: validator(input),
    message: message
  })
}

// Quick sanitization functions
export const sanitize = {
  text: (input) => new InputSanitizer().sanitizeText(input),
  html: (input) => new InputSanitizer().sanitizeHTML(input),
  email: (input) => new InputSanitizer().sanitizeEmail(input),
  url: (input) => new InputSanitizer().sanitizeURL(input),
  filename: (input) => new InputSanitizer().sanitizeFilename(input),
  search: (input) => new InputSanitizer().sanitizeSearchQuery(input),
  content: (input, type) => new InputSanitizer().sanitizeContent(input, type),
  json: (input) => new InputSanitizer().sanitizeJSON(input)
}

// Form validation helper
export class FormValidator {
  constructor() {
    this.rules = new Map()
    this.errors = new Map()
  }

  addRule(field, validator, message) {
    if (!this.rules.has(field)) {
      this.rules.set(field, [])
    }
    this.rules.get(field).push({ validator, message })
    return this
  }

  validate(data) {
    this.errors.clear()
    let isValid = true

    for (const [field, rules] of this.rules) {
      const value = data[field]
      
      for (const rule of rules) {
        const result = rule.validator(value)
        if (!result.valid) {
          this.errors.set(field, rule.message || result.message)
          isValid = false
          break // Only show first error per field
        }
      }
    }

    return {
      valid: isValid,
      errors: Object.fromEntries(this.errors)
    }
  }

  getErrors() {
    return Object.fromEntries(this.errors)
  }

  hasError(field) {
    return this.errors.has(field)
  }

  getError(field) {
    return this.errors.get(field)
  }
}

// Create default sanitizer instance
export const defaultSanitizer = new InputSanitizer({
  maxLength: 5000,
  allowHTML: false,
  allowMarkdown: true,
  strictMode: false
})

export default defaultSanitizer
