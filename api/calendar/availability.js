/**
 * Calendar Availability Endpoint
 * Checks available time slots for booking appointments
 * Integrates with Google Calendar API
 */

import { getEvents, isSlotAvailable } from '../../src/utils/calendar.js';
import { isSlotHeld } from '../../src/utils/kv.js';
import barbershopConfig from '../../src/config/barbershop.json' assert { type: 'json' };

/**
 * Main handler for availability checking
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET']
    });
  }

  try {
    const { date, serviceId, range } = req.query;

    // Validate required parameters
    if (!date) {
      return res.status(400).json({
        error: 'Missing required parameter: date',
        format: 'YYYY-MM-DD'
      });
    }

    // Validate date format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        format: 'YYYY-MM-DD',
        example: '2025-01-15'
      });
    }

    // Get service details
    let serviceDuration = 30; // default duration
    if (serviceId) {
      const service = barbershopConfig.services.find(s => s.id === serviceId);
      if (service) {
        serviceDuration = service.duration;
      } else {
        return res.status(400).json({
          error: 'Invalid service ID',
          availableServices: barbershopConfig.services.map(s => s.id)
        });
      }
    }

    // Handle range queries (multiple days)
    if (range === 'true' || range === '7') {
      const availability = await getMultiDayAvailability(date, serviceDuration, 7);
      return res.status(200).json(availability);
    }

    // Get availability for single day
    const slots = await getAvailableSlots(date, serviceDuration);

    return res.status(200).json({
      date,
      serviceId: serviceId || 'any',
      serviceDuration,
      timezone: barbershopConfig.business.timezone,
      availableSlots: slots,
      totalSlots: slots.length
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return res.status(500).json({
      error: 'Failed to check availability',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get available time slots for a specific date
 */
async function getAvailableSlots(dateString, serviceDuration) {
  const requestedDate = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Don't allow booking in the past
  if (requestedDate < today) {
    return [];
  }

  // Check if date is beyond advance booking limit
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + barbershopConfig.booking.advanceBookingDays);
  if (requestedDate > maxDate) {
    return [];
  }

  // Get day of week
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[requestedDate.getDay()];

  // Check business hours for this day
  const businessHours = barbershopConfig.businessHours[dayName];
  if (!businessHours || businessHours.closed) {
    return [];
  }

  // Parse business hours
  const [openHour, openMinute] = businessHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = businessHours.close.split(':').map(Number);

  // Create start and end times for the day
  const dayStart = new Date(requestedDate);
  dayStart.setHours(openHour, openMinute, 0, 0);

  const dayEnd = new Date(requestedDate);
  dayEnd.setHours(closeHour, closeMinute, 0, 0);

  // Get existing calendar events
  const calendarId = barbershopConfig.calendarId || 'primary';
  const existingEvents = await getEvents(calendarId, dayStart, dayEnd);

  // Generate potential slots
  const slots = [];
  const slotDuration = serviceDuration;
  const bufferTime = 10; // 10 minutes buffer between appointments

  let currentSlot = new Date(dayStart);

  // Check minimum advance hours
  const minAdvanceTime = new Date();
  minAdvanceTime.setHours(minAdvanceTime.getHours() + barbershopConfig.booking.minAdvanceHours);

  while (currentSlot < dayEnd) {
    const slotEnd = new Date(currentSlot);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

    // Check if slot end time exceeds business hours
    if (slotEnd > dayEnd) {
      break;
    }

    // Skip if slot is in the past or within minimum advance time
    if (currentSlot < minAdvanceTime) {
      currentSlot = new Date(currentSlot);
      currentSlot.setMinutes(currentSlot.getMinutes() + 15);
      continue;
    }

    // Check for break times
    const isDuringBreak = businessHours.breaks?.some(breakPeriod => {
      const [breakStartHour, breakStartMinute] = breakPeriod.start.split(':').map(Number);
      const [breakEndHour, breakEndMinute] = breakPeriod.end.split(':').map(Number);

      const breakStart = new Date(requestedDate);
      breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);

      const breakEnd = new Date(requestedDate);
      breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

      return (
        (currentSlot >= breakStart && currentSlot < breakEnd) ||
        (slotEnd > breakStart && slotEnd <= breakEnd)
      );
    });

    if (isDuringBreak) {
      currentSlot = new Date(currentSlot);
      currentSlot.setMinutes(currentSlot.getMinutes() + 15);
      continue;
    }

    // Check if slot overlaps with existing events
    const hasConflict = existingEvents.some(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);

      // Add buffer time to event boundaries
      eventStart.setMinutes(eventStart.getMinutes() - bufferTime);
      eventEnd.setMinutes(eventEnd.getMinutes() + bufferTime);

      return (
        (currentSlot >= eventStart && currentSlot < eventEnd) ||
        (slotEnd > eventStart && slotEnd <= eventEnd) ||
        (currentSlot <= eventStart && slotEnd >= eventEnd)
      );
    });

    if (!hasConflict) {
      // Check if slot is held in Redis
      const slotDateTime = currentSlot.toISOString();
      const held = await isSlotHeld(slotDateTime);

      if (!held) {
        slots.push({
          time: currentSlot.toTimeString().substring(0, 5), // HH:MM format
          dateTime: currentSlot.toISOString(),
          available: true
        });
      }
    }

    // Move to next slot (15-minute intervals)
    currentSlot = new Date(currentSlot);
    currentSlot.setMinutes(currentSlot.getMinutes() + 15);
  }

  return slots;
}

/**
 * Get availability for multiple days
 */
async function getMultiDayAvailability(startDate, serviceDuration, numDays = 7) {
  const availability = {};
  const startDateObj = new Date(startDate + 'T00:00:00');

  for (let i = 0; i < numDays; i++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + i);

    const dateString = currentDate.toISOString().split('T')[0];
    const slots = await getAvailableSlots(dateString, serviceDuration);

    availability[dateString] = {
      date: dateString,
      dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
      availableSlots: slots,
      totalSlots: slots.length,
      hasAvailability: slots.length > 0
    };
  }

  return {
    startDate,
    endDate: new Date(startDateObj.setDate(startDateObj.getDate() + numDays - 1))
      .toISOString()
      .split('T')[0],
    serviceDuration,
    timezone: barbershopConfig.business.timezone,
    days: availability
  };
}

/**
 * Helper to format time in local timezone
 */
function formatTimeInTimezone(date, timezone) {
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
