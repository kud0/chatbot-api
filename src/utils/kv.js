/**
 * Vercel KV (Redis) Utility Functions
 * Handles session and conversation state management
 */

import { kv } from '@vercel/kv';

const DEFAULT_TTL = 86400; // 24 hours in seconds
const HOLD_TTL = 300; // 5 minutes for booking holds

/**
 * Get conversation context for a user
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<object|null>} Conversation context
 */
export async function getConversation(phoneNumber) {
  try {
    const key = `conversation:${phoneNumber}`;
    const data = await kv.get(key);
    return data || null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
}

/**
 * Save conversation context
 * @param {string} phoneNumber - User's phone number
 * @param {object} context - Conversation context
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function saveConversation(phoneNumber, context, ttl = DEFAULT_TTL) {
  try {
    const key = `conversation:${phoneNumber}`;
    await kv.set(key, context, { ex: ttl });
    return true;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return false;
  }
}

/**
 * Append message to conversation history
 * @param {string} phoneNumber - User's phone number
 * @param {object} message - Message object with role and content
 * @returns {Promise<object>} Updated conversation context
 */
export async function appendMessage(phoneNumber, message) {
  try {
    const context = await getConversation(phoneNumber) || {
      phoneNumber,
      messages: [],
      language: 'es',
      createdAt: new Date().toISOString()
    };

    context.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 messages to prevent context overflow
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }

    context.lastMessageAt = new Date().toISOString();
    await saveConversation(phoneNumber, context);

    return context;
  } catch (error) {
    console.error('Error appending message:', error);
    throw error;
  }
}

/**
 * Update conversation metadata
 * @param {string} phoneNumber - User's phone number
 * @param {object} metadata - Metadata to merge
 * @returns {Promise<boolean>} Success status
 */
export async function updateConversationMetadata(phoneNumber, metadata) {
  try {
    const context = await getConversation(phoneNumber);
    if (!context) {
      return false;
    }

    context.metadata = {
      ...context.metadata,
      ...metadata,
      updatedAt: new Date().toISOString()
    };

    await saveConversation(phoneNumber, context);
    return true;
  } catch (error) {
    console.error('Error updating metadata:', error);
    return false;
  }
}

/**
 * Create a temporary hold for a booking slot
 * @param {string} dateTime - ISO datetime string
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<boolean>} Success status
 */
export async function createBookingHold(dateTime, phoneNumber) {
  try {
    const key = `hold:${dateTime}`;
    const existing = await kv.get(key);

    if (existing && existing !== phoneNumber) {
      return false; // Slot already held by someone else
    }

    await kv.set(key, phoneNumber, { ex: HOLD_TTL });
    return true;
  } catch (error) {
    console.error('Error creating booking hold:', error);
    return false;
  }
}

/**
 * Check if a slot is held
 * @param {string} dateTime - ISO datetime string
 * @returns {Promise<boolean>} True if held
 */
export async function isSlotHeld(dateTime) {
  try {
    const key = `hold:${dateTime}`;
    const holder = await kv.get(key);
    return holder !== null;
  } catch (error) {
    console.error('Error checking slot hold:', error);
    return false;
  }
}

/**
 * Release a booking hold
 * @param {string} dateTime - ISO datetime string
 * @returns {Promise<boolean>} Success status
 */
export async function releaseBookingHold(dateTime) {
  try {
    const key = `hold:${dateTime}`;
    await kv.del(key);
    return true;
  } catch (error) {
    console.error('Error releasing booking hold:', error);
    return false;
  }
}

/**
 * Clear conversation for a user
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<boolean>} Success status
 */
export async function clearConversation(phoneNumber) {
  try {
    const key = `conversation:${phoneNumber}`;
    await kv.del(key);
    return true;
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return false;
  }
}

/**
 * Get user's booking history
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<array>} Array of booking records
 */
export async function getBookingHistory(phoneNumber) {
  try {
    const key = `bookings:${phoneNumber}`;
    const bookings = await kv.get(key);
    return bookings || [];
  } catch (error) {
    console.error('Error getting booking history:', error);
    return [];
  }
}

/**
 * Add booking to user's history
 * @param {string} phoneNumber - User's phone number
 * @param {object} booking - Booking details
 * @returns {Promise<boolean>} Success status
 */
export async function addBookingToHistory(phoneNumber, booking) {
  try {
    const bookings = await getBookingHistory(phoneNumber);
    bookings.push({
      ...booking,
      bookedAt: new Date().toISOString()
    });

    const key = `bookings:${phoneNumber}`;
    await kv.set(key, bookings, { ex: 31536000 }); // 1 year
    return true;
  } catch (error) {
    console.error('Error adding booking to history:', error);
    return false;
  }
}
