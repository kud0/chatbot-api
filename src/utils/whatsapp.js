/**
 * WhatsApp Cloud API Utility Functions
 * Handles message sending, webhook verification, and payload parsing
 */

import crypto from 'crypto';

/**
 * Send a WhatsApp message via Cloud API
 * @param {string} phone - Recipient phone number (E.164 format)
 * @param {string} message - Message text to send
 * @param {Object} options - Optional parameters
 * @param {boolean} options.preview_url - Enable URL preview
 * @returns {Promise<Object>} API response
 * @throws {Error} If API call fails
 */
export async function sendWhatsAppMessage(phone, message, options = {}) {
  const {
    WHATSAPP_API_URL,
    WHATSAPP_PHONE_ID,
    WHATSAPP_TOKEN
  } = process.env;

  if (!WHATSAPP_API_URL || !WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
    throw new Error('WhatsApp API credentials not configured');
  }

  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: {
      preview_url: options.preview_url || false,
      body: message
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
}

/**
 * Send an interactive button message
 * @param {string} phone - Recipient phone number
 * @param {string} bodyText - Main message text
 * @param {Array<{id: string, title: string}>} buttons - Array of buttons (max 3)
 * @returns {Promise<Object>} API response
 */
export async function sendInteractiveButtons(phone, bodyText, buttons) {
  const {
    WHATSAPP_API_URL,
    WHATSAPP_PHONE_ID,
    WHATSAPP_TOKEN
  } = process.env;

  if (buttons.length > 3) {
    throw new Error('Maximum 3 buttons allowed');
  }

  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.map(btn => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.title
          }
        }))
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send interactive buttons:', error);
    throw error;
  }
}

/**
 * Verify WhatsApp webhook signature
 * @param {string} signature - X-Hub-Signature-256 header value
 * @param {string} body - Raw request body
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(signature, body) {
  const { WHATSAPP_WEBHOOK_SECRET } = process.env;

  if (!WHATSAPP_WEBHOOK_SECRET) {
    console.warn('WHATSAPP_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WHATSAPP_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex');

  const signatureValue = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(signatureValue, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Parse incoming WhatsApp webhook payload
 * @param {Object} payload - Webhook payload from WhatsApp
 * @returns {Object|null} Parsed message data or null if not a message
 */
export function parseWebhookPayload(payload) {
  try {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) {
      return null;
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    // Extract message content based on type
    let messageText = '';
    let messageType = message.type;

    switch (messageType) {
      case 'text':
        messageText = message.text?.body || '';
        break;
      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          messageText = message.interactive.button_reply.title;
        } else if (message.interactive?.type === 'list_reply') {
          messageText = message.interactive.list_reply.title;
        }
        break;
      case 'button':
        messageText = message.button?.text || '';
        break;
      default:
        messageText = `[Unsupported message type: ${messageType}]`;
    }

    return {
      messageId: message.id,
      from: message.from,
      timestamp: message.timestamp,
      type: messageType,
      text: messageText,
      contactName: contact?.profile?.name || 'Unknown',
      metadata: value.metadata
    };
  } catch (error) {
    console.error('Error parsing webhook payload:', error);
    return null;
  }
}

/**
 * Format text with WhatsApp markdown
 * @param {string} text - Plain text
 * @param {Object} formatting - Formatting options
 * @returns {string} Formatted text
 */
export function formatMessageText(text, formatting = {}) {
  let formatted = text;

  // WhatsApp formatting:
  // *bold*
  // _italic_
  // ~strikethrough~
  // ```code```

  if (formatting.bold) {
    const words = Array.isArray(formatting.bold) ? formatting.bold : [formatting.bold];
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      formatted = formatted.replace(regex, `*${word}*`);
    });
  }

  if (formatting.italic) {
    const words = Array.isArray(formatting.italic) ? formatting.italic : [formatting.italic];
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      formatted = formatted.replace(regex, `_${word}_`);
    });
  }

  return formatted;
}

/**
 * Rate limiting helper using simple in-memory store
 * Note: For production, use Redis or similar distributed cache
 * @param {string} phone - Phone number to check
 * @param {number} maxMessages - Max messages per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if within rate limit
 */
const rateLimitStore = new Map();

export function checkRateLimit(phone, maxMessages = 10, windowMs = 60000) {
  const now = Date.now();
  const key = phone;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  const record = rateLimitStore.get(key);

  if (now > record.resetAt) {
    // Reset window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxMessages) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 * Call periodically to prevent memory leaks
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Handle API errors gracefully
 * @param {Error} error - Error object
 * @returns {Object} User-friendly error response
 */
export function handleApiError(error) {
  console.error('WhatsApp API Error:', error);

  // Check for specific error types
  if (error.message.includes('429')) {
    return {
      success: false,
      userMessage: 'Too many requests. Please try again in a moment.',
      retryable: true
    };
  }

  if (error.message.includes('401') || error.message.includes('403')) {
    return {
      success: false,
      userMessage: 'Authentication error. Please contact support.',
      retryable: false
    };
  }

  if (error.message.includes('400')) {
    return {
      success: false,
      userMessage: 'Invalid request. Please try again.',
      retryable: false
    };
  }

  return {
    success: false,
    userMessage: 'An error occurred. Please try again later.',
    retryable: true
  };
}
