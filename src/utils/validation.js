/**
 * Input Validation Utilities
 * Validates and sanitizes user inputs for security and data integrity
 */

/**
 * Validate phone number format (E.164)
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
export function validatePhone(phone) {
  if (!phone) {
    return {
      valid: false,
      error: 'Phone number is required'
    };
  }

  // E.164 format: +[country code][number]
  // Length: 1-15 digits (excluding +)
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  if (!e164Regex.test(phone)) {
    return {
      valid: false,
      error: 'Phone number must be in E.164 format (e.g., +1234567890)'
    };
  }

  return {
    valid: true,
    normalized: phone
  };
}

/**
 * Validate date string and parse to Date object
 * @param {string} dateString - Date string to validate
 * @returns {Object} Validation result with parsed date
 */
export function validateDate(dateString) {
  if (!dateString) {
    return {
      valid: false,
      error: 'Date is required'
    };
  }

  const dateStr = dateString.trim();

  // Try parsing the date
  const parsedDate = new Date(dateStr);

  if (isNaN(parsedDate.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format'
    };
  }

  // Check if date is in the past
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (parsedDate < now) {
    return {
      valid: false,
      error: 'Date cannot be in the past'
    };
  }

  // Check if date is too far in the future (e.g., more than 1 year)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  if (parsedDate > maxDate) {
    return {
      valid: false,
      error: 'Date cannot be more than 1 year in the future'
    };
  }

  return {
    valid: true,
    date: parsedDate
  };
}

/**
 * Validate service ID against configuration
 * @param {string} serviceId - Service ID to validate
 * @param {Object} config - Business configuration
 * @returns {Object} Validation result with service details
 */
export function validateServiceId(serviceId, config) {
  if (!serviceId) {
    return {
      valid: false,
      error: 'Service ID is required'
    };
  }

  const services = config?.services || [];

  if (services.length === 0) {
    return {
      valid: false,
      error: 'No services configured'
    };
  }

  const service = services.find(s => s.id === serviceId);

  if (!service) {
    return {
      valid: false,
      error: 'Service not found',
      availableServices: services.map(s => ({ id: s.id, name: s.name }))
    };
  }

  return {
    valid: true,
    service
  };
}

/**
 * Validate datetime against business hours
 * @param {Date} datetime - DateTime to validate
 * @param {Object} businessHours - Business hours configuration
 * @returns {Object} Validation result
 */
export function validateDateTime(datetime, businessHours) {
  if (!datetime || !(datetime instanceof Date)) {
    return {
      valid: false,
      error: 'Valid datetime is required'
    };
  }

  if (isNaN(datetime.getTime())) {
    return {
      valid: false,
      error: 'Invalid datetime'
    };
  }

  // Check if datetime is in the past
  if (datetime < new Date()) {
    return {
      valid: false,
      error: 'DateTime cannot be in the past'
    };
  }

  // Get day of week
  const dayName = datetime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayHours = businessHours?.[dayName];

  if (!dayHours) {
    return {
      valid: false,
      error: 'Business hours not configured for this day'
    };
  }

  if (dayHours.closed) {
    return {
      valid: false,
      error: 'Business is closed on this day'
    };
  }

  // Check if time is within business hours
  const timeString = datetime.toTimeString().substring(0, 5); // HH:MM

  if (timeString < dayHours.open || timeString >= dayHours.close) {
    return {
      valid: false,
      error: `Business hours for ${dayName} are ${dayHours.open} - ${dayHours.close}`,
      businessHours: dayHours
    };
  }

  return {
    valid: true,
    datetime
  };
}

/**
 * Sanitize text input to prevent injection attacks
 * @param {string} input - User input text
 * @returns {string} Sanitized text
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  let sanitized = input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Limit length to prevent abuse
  const MAX_LENGTH = 1000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Validate and sanitize user name
 * @param {string} name - User name
 * @returns {Object} Validation result
 */
export function validateName(name) {
  if (!name) {
    return {
      valid: false,
      error: 'Name is required'
    };
  }

  const sanitized = sanitizeInput(name);

  if (sanitized.length < 2) {
    return {
      valid: false,
      error: 'Name must be at least 2 characters'
    };
  }

  if (sanitized.length > 100) {
    return {
      valid: false,
      error: 'Name is too long (max 100 characters)'
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(sanitized)) {
    return {
      valid: false,
      error: 'Name contains invalid characters'
    };
  }

  return {
    valid: true,
    name: sanitized
  };
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {Object} Validation result
 */
export function validateEmail(email) {
  if (!email) {
    return {
      valid: false,
      error: 'Email is required'
    };
  }

  const sanitized = sanitizeInput(email).toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }

  return {
    valid: true,
    email: sanitized
  };
}

/**
 * Check for potential SQL injection patterns
 * @param {string} input - User input
 * @returns {boolean} True if suspicious patterns detected
 */
export function detectInjectionAttempt(input) {
  if (typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
    /('|\"|;|--|\*|\/\*|\*\/)/,
    /(<script|javascript:|onerror|onload)/i,
    /\.\.\//,
    /\bEXEC\b|\bEXECUTE\b/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate booking data object
 * @param {Object} bookingData - Complete booking data
 * @param {Object} config - Business configuration
 * @returns {Object} Validation result
 */
export function validateBookingData(bookingData, config) {
  const errors = [];

  // Validate phone
  const phoneValidation = validatePhone(bookingData.phone);
  if (!phoneValidation.valid) {
    errors.push(phoneValidation.error);
  }

  // Validate service
  const serviceValidation = validateServiceId(bookingData.serviceId, config);
  if (!serviceValidation.valid) {
    errors.push(serviceValidation.error);
  }

  // Validate datetime
  if (bookingData.datetime) {
    const datetimeValidation = validateDateTime(
      new Date(bookingData.datetime),
      config?.businessHours
    );
    if (!datetimeValidation.valid) {
      errors.push(datetimeValidation.error);
    }
  } else {
    errors.push('DateTime is required');
  }

  // Validate name if provided
  if (bookingData.userName) {
    const nameValidation = validateName(bookingData.userName);
    if (!nameValidation.valid) {
      errors.push(nameValidation.error);
    }
  }

  // Validate email if provided
  if (bookingData.email) {
    const emailValidation = validateEmail(bookingData.email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error);
    }
  }

  // Check for injection attempts
  const fieldsToCheck = [
    bookingData.userName,
    bookingData.email,
    bookingData.notes
  ].filter(Boolean);

  const hasInjection = fieldsToCheck.some(detectInjectionAttempt);
  if (hasInjection) {
    errors.push('Invalid characters detected in input');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? {
      phone: phoneValidation.normalized,
      serviceId: bookingData.serviceId,
      datetime: bookingData.datetime,
      userName: bookingData.userName ? sanitizeInput(bookingData.userName) : undefined,
      email: bookingData.email ? sanitizeInput(bookingData.email) : undefined,
      notes: bookingData.notes ? sanitizeInput(bookingData.notes) : undefined
    } : null
  };
}

/**
 * Validate webhook signature from WhatsApp
 * @param {string} token - Verification token
 * @param {string} expectedToken - Expected token from env
 * @returns {boolean} True if valid
 */
export function validateWebhookToken(token, expectedToken) {
  if (!token || !expectedToken) {
    return false;
  }

  return token === expectedToken;
}
