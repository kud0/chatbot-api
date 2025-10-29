/**
 * Logging Utility
 * Simple wrapper around console.log with structured logging for Vercel serverless
 */

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Get current log level from environment
 * @returns {string} Log level
 */
function getCurrentLogLevel() {
  return process.env.LOG_LEVEL || LogLevel.INFO;
}

/**
 * Check if log level should be output
 * @param {string} level - Level to check
 * @returns {boolean} True if should log
 */
function shouldLog(level) {
  const currentLevel = getCurrentLogLevel();
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

  const currentIndex = levels.indexOf(currentLevel);
  const checkIndex = levels.indexOf(level);

  return checkIndex >= currentIndex;
}

/**
 * Format log message with timestamp and context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {Object} Formatted log object
 */
function formatLogMessage(level, message, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    environment: process.env.VERCEL_ENV || 'development'
  };
}

/**
 * Log debug message
 * @param {string} message - Message to log
 * @param {Object} context - Additional context
 */
export function debug(message, context = {}) {
  if (shouldLog(LogLevel.DEBUG)) {
    const logObj = formatLogMessage(LogLevel.DEBUG, message, context);
    console.debug(JSON.stringify(logObj));
  }
}

/**
 * Log info message
 * @param {string} message - Message to log
 * @param {Object} context - Additional context
 */
export function info(message, context = {}) {
  if (shouldLog(LogLevel.INFO)) {
    const logObj = formatLogMessage(LogLevel.INFO, message, context);
    console.log(JSON.stringify(logObj));
  }
}

/**
 * Log warning message
 * @param {string} message - Message to log
 * @param {Object} context - Additional context
 */
export function warn(message, context = {}) {
  if (shouldLog(LogLevel.WARN)) {
    const logObj = formatLogMessage(LogLevel.WARN, message, context);
    console.warn(JSON.stringify(logObj));
  }
}

/**
 * Log error message
 * @param {string} message - Message to log
 * @param {Error|Object} error - Error object or context
 */
export function error(message, error = {}) {
  if (shouldLog(LogLevel.ERROR)) {
    const context = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
      name: error.name
    } : error;

    const logObj = formatLogMessage(LogLevel.ERROR, message, context);
    console.error(JSON.stringify(logObj));
  }
}

/**
 * Log API request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} metadata - Additional metadata
 */
export function logRequest(method, path, metadata = {}) {
  info('API Request', {
    method,
    path,
    ...metadata
  });
}

/**
 * Log API response
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 * @param {Object} metadata - Additional metadata
 */
export function logResponse(method, path, statusCode, duration, metadata = {}) {
  const logFn = statusCode >= 400 ? warn : info;

  logFn('API Response', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...metadata
  });
}

/**
 * Log WhatsApp message sent
 * @param {string} to - Recipient phone
 * @param {string} messageType - Type of message
 * @param {boolean} success - Whether send was successful
 */
export function logWhatsAppMessage(to, messageType, success) {
  info('WhatsApp Message', {
    to: maskPhone(to),
    messageType,
    success
  });
}

/**
 * Log booking event
 * @param {string} event - Event type (created, cancelled, etc.)
 * @param {string} phone - User phone
 * @param {Object} bookingData - Booking details
 */
export function logBooking(event, phone, bookingData = {}) {
  info('Booking Event', {
    event,
    phone: maskPhone(phone),
    service: bookingData.service,
    datetime: bookingData.datetime
  });
}

/**
 * Mask phone number for privacy
 * @param {string} phone - Phone number
 * @returns {string} Masked phone
 */
function maskPhone(phone) {
  if (!phone || phone.length < 4) {
    return '****';
  }
  return `****${phone.slice(-4)}`;
}

/**
 * Log session event
 * @param {string} event - Event type
 * @param {string} phone - User phone
 * @param {Object} metadata - Additional metadata
 */
export function logSession(event, phone, metadata = {}) {
  debug('Session Event', {
    event,
    phone: maskPhone(phone),
    ...metadata
  });
}

/**
 * Log rate limit event
 * @param {string} phone - User phone
 * @param {boolean} allowed - Whether request was allowed
 */
export function logRateLimit(phone, allowed) {
  if (!allowed) {
    warn('Rate Limit Exceeded', {
      phone: maskPhone(phone)
    });
  } else {
    debug('Rate Limit Check', {
      phone: maskPhone(phone),
      allowed
    });
  }
}

/**
 * Create a performance timer
 * @param {string} operationName - Name of operation
 * @returns {Function} Stop function that logs duration
 */
export function createTimer(operationName) {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    debug('Performance', {
      operation: operationName,
      duration: `${duration}ms`
    });
    return duration;
  };
}

/**
 * Log calendar operation
 * @param {string} operation - Operation type
 * @param {boolean} success - Whether operation succeeded
 * @param {Object} metadata - Additional metadata
 */
export function logCalendar(operation, success, metadata = {}) {
  const logFn = success ? info : error;

  logFn('Calendar Operation', {
    operation,
    success,
    ...metadata
  });
}

/**
 * Export log levels for reference
 */
export { LogLevel };
