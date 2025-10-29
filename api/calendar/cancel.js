/**
 * Calendar Cancellation Endpoint
 * Cancels appointments in Google Calendar
 * Optional endpoint for cancellation functionality
 */

import { deleteEvent, findEventsByPhone } from '../../src/utils/calendar.js';
import barbershopConfig from '../../src/config/barbershop.json' assert { type: 'json' };

/**
 * Main handler for cancelling appointments
 */
export default async function handler(req, res) {
  // Only allow POST and DELETE requests
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['POST', 'DELETE']
    });
  }

  try {
    const { phoneNumber, eventId, language = 'es' } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Missing required field: phoneNumber'
      });
    }

    const calendarId = barbershopConfig.calendarId || 'primary';

    // If eventId provided, cancel specific event
    if (eventId) {
      const cancelled = await deleteEvent(calendarId, eventId);

      if (cancelled) {
        const message = language === 'en'
          ? '✅ Your appointment has been successfully cancelled.'
          : '✅ Tu cita ha sido cancelada exitosamente.';

        return res.status(200).json({
          success: true,
          message,
          eventId
        });
      }

      return res.status(404).json({
        error: language === 'en'
          ? 'Appointment not found'
          : 'Cita no encontrada'
      });
    }

    // If no eventId, find upcoming appointments for this phone number
    const upcomingEvents = await findEventsByPhone(calendarId, phoneNumber);

    if (upcomingEvents.length === 0) {
      return res.status(404).json({
        error: language === 'en'
          ? 'No upcoming appointments found'
          : 'No se encontraron citas próximas',
        phoneNumber
      });
    }

    // Return list of appointments to cancel
    const appointments = upcomingEvents.map(event => ({
      eventId: event.id,
      summary: event.summary,
      dateTime: event.start.dateTime || event.start.date,
      description: event.description
    }));

    return res.status(200).json({
      message: language === 'en'
        ? 'Found upcoming appointments. Please provide eventId to cancel a specific one.'
        : 'Se encontraron citas próximas. Por favor proporciona el eventId para cancelar una específica.',
      appointments
    });

  } catch (error) {
    console.error('Cancellation error:', error);
    return res.status(500).json({
      error: 'Failed to cancel appointment',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
