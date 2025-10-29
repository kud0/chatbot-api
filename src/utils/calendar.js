/**
 * Google Calendar Utility Functions
 * Handles calendar operations, availability checking, and time slot management
 */

import { google } from 'googleapis';

/**
 * Parse service account credentials from environment
 * @returns {Object} Service account credentials
 * @throws {Error} If credentials are invalid
 */
function parseServiceAccountCredentials() {
  const { GOOGLE_SERVICE_ACCOUNT_JSON } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  }

  try {
    return JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format');
  }
}

/**
 * Get authenticated Google Calendar client
 * @returns {Object} Google Calendar API client
 */
export function getCalendarClient() {
  const credentials = parseServiceAccountCredentials();
  const { GOOGLE_CALENDAR_ID } = process.env;

  if (!GOOGLE_CALENDAR_ID) {
    throw new Error('GOOGLE_CALENDAR_ID not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  return {
    calendar: google.calendar({ version: 'v3', auth }),
    calendarId: GOOGLE_CALENDAR_ID
  };
}

/**
 * Get business hours from configuration
 * @param {Object} config - Business configuration
 * @returns {Object} Business hours by day
 */
export function getBusinessHours(config) {
  return config?.businessHours || {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '14:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  };
}

/**
 * Check if a datetime falls within business hours
 * @param {Date} datetime - Date to check
 * @param {Object} config - Business configuration
 * @returns {boolean} True if within business hours
 */
export function isWithinBusinessHours(datetime, config) {
  const businessHours = getBusinessHours(config);
  const dayName = datetime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayHours = businessHours[dayName];

  if (!dayHours || dayHours.closed) {
    return false;
  }

  const timeString = datetime.toTimeString().substring(0, 5); // HH:MM format

  return timeString >= dayHours.open && timeString <= dayHours.close;
}

/**
 * Get available time slots for a specific date
 * @param {Date} date - Date to check
 * @param {number} serviceDuration - Service duration in minutes
 * @param {Object} config - Business configuration
 * @returns {Promise<Array<Object>>} Array of available time slots
 */
export async function getAvailableSlots(date, serviceDuration, config) {
  const { calendar, calendarId } = getCalendarClient();
  const businessHours = getBusinessHours(config);

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayHours = businessHours[dayName];

  if (!dayHours || dayHours.closed) {
    return [];
  }

  // Set up time boundaries for the day
  const startOfDay = new Date(date);
  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  startOfDay.setHours(openHour, openMin, 0, 0);

  const endOfDay = new Date(date);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
  endOfDay.setHours(closeHour, closeMin, 0, 0);

  try {
    // Get existing events for the day
    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const existingEvents = response.data.items || [];

    // Generate all possible slots
    const slots = [];
    const slotInterval = config?.slotInterval || 30; // minutes
    let currentTime = new Date(startOfDay);

    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);

      if (slotEnd <= endOfDay) {
        // Check if slot conflicts with existing events
        const hasConflict = existingEvents.some(event => {
          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);

          return (
            (currentTime >= eventStart && currentTime < eventEnd) ||
            (slotEnd > eventStart && slotEnd <= eventEnd) ||
            (currentTime <= eventStart && slotEnd >= eventEnd)
          );
        });

        if (!hasConflict) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(slotEnd),
            available: true
          });
        }
      }

      currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
    }

    return slots;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw new Error('Failed to check availability');
  }
}

/**
 * Get availability for the next N days
 * @param {number} days - Number of days to check (default: 7)
 * @param {number} serviceDuration - Service duration in minutes
 * @param {Object} config - Business configuration
 * @returns {Promise<Object>} Availability by date
 */
export async function getNextDaysAvailability(days = 7, serviceDuration, config) {
  const availability = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);

    const dateKey = checkDate.toISOString().split('T')[0];

    try {
      const slots = await getAvailableSlots(checkDate, serviceDuration, config);
      availability[dateKey] = {
        date: checkDate,
        slotsAvailable: slots.length,
        slots: slots.slice(0, 10) // Return first 10 slots
      };
    } catch (error) {
      availability[dateKey] = {
        date: checkDate,
        slotsAvailable: 0,
        slots: [],
        error: error.message
      };
    }
  }

  return availability;
}

/**
 * Create a calendar event
 * @param {Object} eventData - Event details
 * @param {string} eventData.summary - Event title
 * @param {string} eventData.description - Event description
 * @param {Date} eventData.start - Start datetime
 * @param {Date} eventData.end - End datetime
 * @param {Object} eventData.attendees - Attendees information
 * @returns {Promise<Object>} Created event
 */
export async function createCalendarEvent(eventData) {
  const { calendar, calendarId } = getCalendarClient();

  const event = {
    summary: eventData.summary,
    description: eventData.description,
    start: {
      dateTime: eventData.start.toISOString(),
      timeZone: process.env.TIMEZONE || 'America/New_York'
    },
    end: {
      dateTime: eventData.end.toISOString(),
      timeZone: process.env.TIMEZONE || 'America/New_York'
    },
    attendees: eventData.attendees ? [eventData.attendees] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 }
      ]
    }
  };

  try {
    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'all'
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create booking');
  }
}

/**
 * Update a calendar event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event
 */
export async function updateCalendarEvent(eventId, updates) {
  const { calendar, calendarId } = getCalendarClient();

  try {
    const response = await calendar.events.patch({
      calendarId,
      eventId,
      resource: updates,
      sendUpdates: 'all'
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update booking');
  }
}

/**
 * Cancel a calendar event
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export async function cancelCalendarEvent(eventId) {
  const { calendar, calendarId } = getCalendarClient();

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all'
    });
  } catch (error) {
    console.error('Error canceling calendar event:', error);
    throw new Error('Failed to cancel booking');
  }
}

/**
 * Format datetime for user display
 * @param {Date} datetime - Date to format
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted datetime string
 */
export function formatDateTimeForUser(datetime, locale = 'en-US') {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };

  return datetime.toLocaleString(locale, options);
}

/**
 * Format date for user display (date only)
 * @param {Date} date - Date to format
 * @param {string} locale - Locale code
 * @returns {string} Formatted date string
 */
export function formatDateForUser(date, locale = 'en-US') {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return date.toLocaleDateString(locale, options);
}

/**
 * Format time for user display (time only)
 * @param {Date} datetime - Datetime to format
 * @param {string} locale - Locale code
 * @returns {string} Formatted time string
 */
export function formatTimeForUser(datetime, locale = 'en-US') {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };

  return datetime.toLocaleTimeString(locale, options);
}

/**
 * Parse user input date string to Date object
 * @param {string} dateString - User input (e.g., "tomorrow", "next monday", "2024-12-25")
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseDateString(dateString) {
  const input = dateString.toLowerCase().trim();

  // Handle relative dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (input === 'today') {
    return today;
  }

  if (input === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Handle "next [day]"
  const dayMatch = input.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (dayMatch) {
    const targetDay = dayMatch[1];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIndex = days.indexOf(targetDay);
    const currentIndex = today.getDay();

    let daysToAdd = targetIndex - currentIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    return targetDate;
  }

  // Try parsing ISO date
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  return null;
}
