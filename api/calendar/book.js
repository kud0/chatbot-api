/**
 * Calendar Booking Endpoint
 * Creates appointments in Google Calendar
 * Includes conflict prevention and confirmation
 */

import { createEvent, isSlotAvailable } from '../../src/utils/calendar.js';
import { createBookingHold, releaseBookingHold, addBookingToHistory } from '../../src/utils/kv.js';
import barbershopConfig from '../../src/config/barbershop.json' assert { type: 'json' };

/**
 * Main handler for booking appointments
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    const {
      phoneNumber,
      customerName,
      serviceId,
      dateTime,
      language = 'es',
      customerEmail
    } = req.body;

    // Validate required fields
    const validationError = validateBookingData({
      phoneNumber,
      customerName,
      serviceId,
      dateTime
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Get service details
    const service = barbershopConfig.services.find(s => s.id === serviceId);
    if (!service) {
      return res.status(400).json({
        error: 'Invalid service ID',
        availableServices: barbershopConfig.services.map(s => ({
          id: s.id,
          name: s.name
        }))
      });
    }

    // Parse and validate datetime
    const startDateTime = new Date(dateTime);
    if (isNaN(startDateTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid datetime format',
        expected: 'ISO 8601 format (e.g., 2025-01-15T10:00:00)'
      });
    }

    // Check if booking is in the past
    const now = new Date();
    if (startDateTime < now) {
      return res.status(400).json({
        error: language === 'en'
          ? 'Cannot book appointments in the past'
          : 'No se pueden reservar citas en el pasado'
      });
    }

    // Check minimum advance hours
    const minAdvanceTime = new Date(now);
    minAdvanceTime.setHours(minAdvanceTime.getHours() + barbershopConfig.booking.minAdvanceHours);

    if (startDateTime < minAdvanceTime) {
      return res.status(400).json({
        error: language === 'en'
          ? `Appointments must be booked at least ${barbershopConfig.booking.minAdvanceHours} hours in advance`
          : `Las citas deben reservarse con al menos ${barbershopConfig.booking.minAdvanceHours} horas de anticipación`
      });
    }

    // Calculate end time
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + service.duration);

    // Create temporary hold to prevent race conditions
    const holdCreated = await createBookingHold(dateTime, phoneNumber);
    if (!holdCreated) {
      return res.status(409).json({
        error: language === 'en'
          ? 'This time slot is currently being booked by another customer. Please try a different time.'
          : 'Este horario está siendo reservado por otro cliente. Por favor intenta con otro horario.'
      });
    }

    try {
      // Double-check availability in Google Calendar
      const calendarId = barbershopConfig.calendarId || 'primary';
      const available = await isSlotAvailable(calendarId, startDateTime, endDateTime);

      if (!available) {
        await releaseBookingHold(dateTime);
        return res.status(409).json({
          error: language === 'en'
            ? 'This time slot is no longer available. Please choose a different time.'
            : 'Este horario ya no está disponible. Por favor elige otro horario.'
        });
      }

      // Create calendar event
      const eventData = {
        summary: `${service.name[language]} - ${customerName}`,
        description: buildEventDescription({
          customerName,
          phoneNumber,
          service,
          language,
          customerEmail
        }),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        timeZone: barbershopConfig.business.timezone,
        attendeeEmail: customerEmail || null
      };

      const createdEvent = await createEvent(calendarId, eventData);

      // Save booking to user's history
      await addBookingToHistory(phoneNumber, {
        eventId: createdEvent.id,
        serviceId: service.id,
        serviceName: service.name[language],
        dateTime: startDateTime.toISOString(),
        customerName,
        status: 'confirmed'
      });

      // Release the hold (booking is now confirmed)
      await releaseBookingHold(dateTime);

      // Generate confirmation message
      const confirmationMessage = buildConfirmationMessage({
        customerName,
        service,
        startDateTime,
        language
      });

      return res.status(201).json({
        success: true,
        message: confirmationMessage,
        booking: {
          eventId: createdEvent.id,
          eventLink: createdEvent.htmlLink,
          serviceId: service.id,
          serviceName: service.name[language],
          dateTime: startDateTime.toISOString(),
          duration: service.duration,
          price: service.price,
          customerName,
          phoneNumber,
          status: 'confirmed'
        }
      });

    } catch (error) {
      // Release hold if booking fails
      await releaseBookingHold(dateTime);
      throw error;
    }

  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({
      error: 'Failed to create booking',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Validate booking data
 */
function validateBookingData(data) {
  const { phoneNumber, customerName, serviceId, dateTime } = data;

  if (!phoneNumber) {
    return 'Missing required field: phoneNumber';
  }

  if (!customerName || customerName.trim().length === 0) {
    return 'Missing required field: customerName';
  }

  if (!serviceId) {
    return 'Missing required field: serviceId';
  }

  if (!dateTime) {
    return 'Missing required field: dateTime';
  }

  // Validate phone number format (basic)
  const phonePattern = /^\+?\d{10,15}$/;
  if (!phonePattern.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
    return 'Invalid phone number format';
  }

  return null;
}

/**
 * Build event description
 */
function buildEventDescription({ customerName, phoneNumber, service, language, customerEmail }) {
  const lang = language === 'en' ? 'en' : 'es';

  const labels = {
    es: {
      customer: 'Cliente',
      phone: 'Teléfono',
      email: 'Email',
      service: 'Servicio',
      duration: 'Duración',
      price: 'Precio'
    },
    en: {
      customer: 'Customer',
      phone: 'Phone',
      email: 'Email',
      service: 'Service',
      duration: 'Duration',
      price: 'Price'
    }
  };

  const l = labels[lang];

  let description = `${l.customer}: ${customerName}\n`;
  description += `${l.phone}: ${phoneNumber}\n`;

  if (customerEmail) {
    description += `${l.email}: ${customerEmail}\n`;
  }

  description += `\n${l.service}: ${service.name[lang]}\n`;
  description += `${l.duration}: ${service.duration} min\n`;
  description += `${l.price}: ${service.price.amount}${service.price.currency}`;

  return description;
}

/**
 * Build confirmation message
 */
function buildConfirmationMessage({ customerName, service, startDateTime, language }) {
  const lang = language === 'en' ? 'en' : 'es';

  const dateStr = startDateTime.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: barbershopConfig.business.timezone
  });

  const timeStr = startDateTime.toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: barbershopConfig.business.timezone
  });

  if (lang === 'en') {
    return `✅ Booking confirmed!\n\nCustomer: ${customerName}\nService: ${service.name.en}\nDate: ${dateStr}\nTime: ${timeStr}\nDuration: ${service.duration} minutes\nPrice: ${service.price.amount}${service.price.currency}\n\n${barbershopConfig.business.name.en}\n${barbershopConfig.business.contact.address.street}\n${barbershopConfig.business.contact.phone}\n\nWe look forward to seeing you!`;
  }

  return `✅ ¡Reserva confirmada!\n\nCliente: ${customerName}\nServicio: ${service.name.es}\nFecha: ${dateStr}\nHora: ${timeStr}\nDuración: ${service.duration} minutos\nPrecio: ${service.price.amount}${service.price.currency}\n\n${barbershopConfig.business.name.es}\n${barbershopConfig.business.contact.address.street}\n${barbershopConfig.business.contact.phone}\n\n¡Te esperamos!`;
}
