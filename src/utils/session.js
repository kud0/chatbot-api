/**
 * Session Management Utility
 * Handles conversation history and booking holds using Vercel KV
 */

import { kv } from '@vercel/kv';

// Session TTL: 24 hours (WhatsApp conversation window)
const SESSION_TTL = 60 * 60 * 24;

// Booking hold TTL: 5 minutes
const BOOKING_HOLD_TTL = 60 * 5;

/**
 * Generate session key for a phone number
 * @param {string} phone - Phone number
 * @returns {string} Session key
 */
function getSessionKey(phone) {
  return `session:${phone}`;
}

/**
 * Generate booking hold key for a phone number
 * @param {string} phone - Phone number
 * @returns {string} Booking hold key
 */
function getBookingHoldKey(phone) {
  return `booking-hold:${phone}`;
}

/**
 * Save conversation history to Vercel KV
 * @param {string} phone - Phone number (E.164 format)
 * @param {Array<Object>} messages - Array of message objects
 * @param {Object} metadata - Additional metadata (language, intent, etc.)
 * @returns {Promise<void>}
 */
export async function saveConversation(phone, messages, metadata = {}) {
  const key = getSessionKey(phone);

  const sessionData = {
    phone,
    messages,
    metadata: {
      ...metadata,
      lastUpdated: Date.now()
    }
  };

  try {
    await kv.set(key, sessionData, { ex: SESSION_TTL });
  } catch (error) {
    console.error('Failed to save conversation:', error);
    throw new Error('Session storage error');
  }
}

/**
 * Get conversation history from Vercel KV
 * @param {string} phone - Phone number
 * @returns {Promise<Object|null>} Session data or null if not found
 */
export async function getConversation(phone) {
  const key = getSessionKey(phone);

  try {
    const sessionData = await kv.get(key);
    return sessionData;
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return null;
  }
}

/**
 * Clear conversation history for a phone number
 * @param {string} phone - Phone number
 * @returns {Promise<void>}
 */
export async function clearConversation(phone) {
  const key = getSessionKey(phone);

  try {
    await kv.del(key);
  } catch (error) {
    console.error('Failed to clear conversation:', error);
    throw new Error('Failed to clear session');
  }
}

/**
 * Add a message to the conversation
 * @param {string} phone - Phone number
 * @param {Object} message - Message object
 * @param {string} message.role - 'user' or 'assistant'
 * @param {string} message.content - Message content
 * @returns {Promise<void>}
 */
export async function addMessageToConversation(phone, message) {
  const session = await getConversation(phone);

  const messages = session?.messages || [];
  messages.push({
    ...message,
    timestamp: Date.now()
  });

  // Keep only last 20 messages to prevent bloat
  const trimmedMessages = messages.slice(-20);

  await saveConversation(
    phone,
    trimmedMessages,
    session?.metadata || {}
  );
}

/**
 * Update conversation metadata
 * @param {string} phone - Phone number
 * @param {Object} metadata - Metadata to merge
 * @returns {Promise<void>}
 */
export async function updateConversationMetadata(phone, metadata) {
  const session = await getConversation(phone);

  if (!session) {
    await saveConversation(phone, [], metadata);
    return;
  }

  await saveConversation(
    phone,
    session.messages,
    {
      ...session.metadata,
      ...metadata
    }
  );
}

/**
 * Create a temporary booking hold
 * @param {string} phone - Phone number
 * @param {string} datetime - ISO datetime string
 * @param {string} service - Service ID or name
 * @param {Object} additionalData - Additional booking data
 * @returns {Promise<void>}
 */
export async function createBookingHold(phone, datetime, service, additionalData = {}) {
  const key = getBookingHoldKey(phone);

  const holdData = {
    phone,
    datetime,
    service,
    ...additionalData,
    createdAt: Date.now(),
    expiresAt: Date.now() + (BOOKING_HOLD_TTL * 1000)
  };

  try {
    await kv.set(key, holdData, { ex: BOOKING_HOLD_TTL });
  } catch (error) {
    console.error('Failed to create booking hold:', error);
    throw new Error('Failed to reserve time slot');
  }
}

/**
 * Check if there's an active booking hold
 * @param {string} phone - Phone number
 * @returns {Promise<Object|null>} Booking hold data or null
 */
export async function checkBookingHold(phone) {
  const key = getBookingHoldKey(phone);

  try {
    const holdData = await kv.get(key);
    return holdData;
  } catch (error) {
    console.error('Failed to check booking hold:', error);
    return null;
  }
}

/**
 * Release booking hold (cancel or complete)
 * @param {string} phone - Phone number
 * @returns {Promise<void>}
 */
export async function releaseBookingHold(phone) {
  const key = getBookingHoldKey(phone);

  try {
    await kv.del(key);
  } catch (error) {
    console.error('Failed to release booking hold:', error);
    throw new Error('Failed to release booking hold');
  }
}

/**
 * Get all active sessions (for monitoring/debugging)
 * @returns {Promise<Array<string>>} Array of phone numbers with active sessions
 */
export async function getActiveSessions() {
  try {
    const keys = await kv.keys('session:*');
    return keys.map(key => key.replace('session:', ''));
  } catch (error) {
    console.error('Failed to get active sessions:', error);
    return [];
  }
}

/**
 * Get session statistics
 * @param {string} phone - Phone number
 * @returns {Promise<Object>} Session statistics
 */
export async function getSessionStats(phone) {
  const session = await getConversation(phone);

  if (!session) {
    return {
      exists: false,
      messageCount: 0,
      duration: 0
    };
  }

  const messages = session.messages || [];
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  return {
    exists: true,
    messageCount: messages.length,
    duration: lastMessage?.timestamp - firstMessage?.timestamp || 0,
    lastActivity: session.metadata?.lastUpdated,
    metadata: session.metadata
  };
}

/**
 * Clean up expired sessions (for manual cleanup if needed)
 * Note: KV auto-expires, but this can be used for forced cleanup
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function cleanupExpiredSessions() {
  try {
    const allKeys = await kv.keys('session:*');
    let deletedCount = 0;

    for (const key of allKeys) {
      const session = await kv.get(key);
      if (!session || !session.metadata?.lastUpdated) {
        await kv.del(key);
        deletedCount++;
        continue;
      }

      const age = Date.now() - session.metadata.lastUpdated;
      if (age > SESSION_TTL * 1000) {
        await kv.del(key);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
    return 0;
  }
}

/**
 * Store booking confirmation data
 * @param {string} phone - Phone number
 * @param {Object} bookingData - Confirmed booking details
 * @returns {Promise<void>}
 */
export async function storeBookingConfirmation(phone, bookingData) {
  const key = `booking:${phone}:${Date.now()}`;

  const confirmationData = {
    ...bookingData,
    confirmedAt: Date.now(),
    status: 'confirmed'
  };

  try {
    // Store for 30 days
    await kv.set(key, confirmationData, { ex: 60 * 60 * 24 * 30 });
  } catch (error) {
    console.error('Failed to store booking confirmation:', error);
    throw new Error('Failed to save booking confirmation');
  }
}

/**
 * Get booking history for a phone number
 * @param {string} phone - Phone number
 * @param {number} limit - Maximum number of bookings to return
 * @returns {Promise<Array<Object>>} Array of booking objects
 */
export async function getBookingHistory(phone, limit = 10) {
  try {
    const keys = await kv.keys(`booking:${phone}:*`);
    const sortedKeys = keys.sort().reverse().slice(0, limit);

    const bookings = await Promise.all(
      sortedKeys.map(key => kv.get(key))
    );

    return bookings.filter(Boolean);
  } catch (error) {
    console.error('Failed to get booking history:', error);
    return [];
  }
}
