/**
 * WhatsApp Webhook - Menu-Based Booking System
 * No AI - Uses interactive buttons and lists for booking flow
 */
import { kv } from '@vercel/kv';
import { google } from 'googleapis';

// Barbershop configuration
const BARBERSHOP_CONFIG = {
  "business": {
    "name": "Barbería El Clásico",
    "timezone": "Europe/Madrid"
  },
  "services": [
    {"id": "haircut", "name": "Corte de pelo", "duration": 30, "price": 25},
    {"id": "beard-trim", "name": "Arreglo de barba", "duration": 15, "price": 10},
    {"id": "haircut-beard-combo", "name": "Corte + Barba", "duration": 45, "price": 30},
    {"id": "hair-coloring", "name": "Tinte de pelo", "duration": 60, "price": 40},
    {"id": "kids-haircut", "name": "Corte infantil", "duration": 20, "price": 15},
    {"id": "hot-towel-shave", "name": "Afeitado tradicional", "duration": 25, "price": 20}
  ],
  "businessHours": {
    "monday": {"open": "09:00", "close": "20:00", "breaks": [{"start": "14:00", "end": "15:00"}]},
    "tuesday": {"open": "09:00", "close": "20:00", "breaks": [{"start": "14:00", "end": "15:00"}]},
    "wednesday": {"open": "09:00", "close": "20:00", "breaks": [{"start": "14:00", "end": "15:00"}]},
    "thursday": {"open": "09:00", "close": "20:00", "breaks": [{"start": "14:00", "end": "15:00"}]},
    "friday": {"open": "09:00", "close": "21:00", "breaks": [{"start": "14:00", "end": "15:00"}]},
    "saturday": {"open": "10:00", "close": "18:00"},
    "sunday": {"closed": true}
  }
};

export default async function handler(req, res) {
  const { method } = req;

  // Handle GET request for webhook verification
  if (method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden');
    }
  }

  // Handle POST request for incoming messages
  if (method === 'POST') {
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          const message = messages[0];
          const from = message.from;
          const phoneNumberId = value.metadata.phone_number_id;

          // Handle different message types
          if (message.type === 'interactive') {
            await handleInteractiveMessage(message, from, phoneNumberId);
          } else if (message.text?.body) {
            await handleTextMessage(message.text.body, from, phoneNumberId);
          }
        }
      }

      return res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('❌ Error:', error);
      return res.status(200).json({ status: 'error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Handle text messages - Show welcome menu
 */
async function handleTextMessage(text, phone, phoneNumberId) {
  console.log(`📱 Text from ${phone}: ${text}`);

  // Reset conversation state
  await kv.del(`booking:${phone}`);

  // Show service selection menu
  await sendServiceMenu(phoneNumberId, phone);
}

/**
 * Handle interactive message responses (button/list clicks)
 */
async function handleInteractiveMessage(message, phone, phoneNumberId) {
  const interactiveType = message.interactive.type;

  if (interactiveType === 'list_reply') {
    const selectedId = message.interactive.list_reply.id;
    console.log(`📋 List selection from ${phone}: ${selectedId}`);

    // Check if it's a service selection
    if (selectedId.startsWith('service:')) {
      const serviceId = selectedId.replace('service:', '');
      await handleServiceSelection(serviceId, phone, phoneNumberId);
    }
    // Check if it's a date selection
    else if (selectedId.startsWith('date:')) {
      const date = selectedId.replace('date:', '');
      await handleDateSelection(date, phone, phoneNumberId);
    }
  }
  else if (interactiveType === 'button_reply') {
    const selectedId = message.interactive.button_reply.id;
    console.log(`🔘 Button click from ${phone}: ${selectedId}`);

    // Check if it's a time selection
    if (selectedId.startsWith('time:')) {
      const time = selectedId.replace('time:', '');
      await handleTimeSelection(time, phone, phoneNumberId);
    }
    // Check if it's confirmation
    else if (selectedId === 'confirm') {
      await handleConfirmation(phone, phoneNumberId);
    }
    else if (selectedId === 'cancel') {
      await handleCancellation(phone, phoneNumberId);
    }
    else if (selectedId === 'restart') {
      await sendServiceMenu(phoneNumberId, phone);
    }
  }
}

/**
 * Send service selection menu
 */
async function sendServiceMenu(phoneNumberId, phone) {
  const rows = BARBERSHOP_CONFIG.services.map(service => ({
    id: `service:${service.id}`,
    title: service.name,
    description: `€${service.price} - ${service.duration}min`
  }));

  await sendInteractiveList(phoneNumberId, phone, {
    header: "💈 Barbería El Clásico",
    body: "¿Qué servicio necesitas?\n\nSelecciona una opción del menú:",
    button: "Ver servicios",
    sections: [{
      title: "Servicios disponibles",
      rows: rows
    }]
  });
}

/**
 * Handle service selection - Show date menu
 */
async function handleServiceSelection(serviceId, phone, phoneNumberId) {
  const service = BARBERSHOP_CONFIG.services.find(s => s.id === serviceId);
  if (!service) return;

  // Save service to state
  await kv.set(`booking:${phone}`, {
    step: 'date_selection',
    serviceId: serviceId,
    serviceName: service.name,
    serviceDuration: service.duration,
    servicePrice: service.price
  }, { ex: 3600 }); // 1 hour expiry

  // Generate next 7 days
  const dates = generateNextDays(7);
  const rows = dates.map(d => ({
    id: `date:${d.value}`,
    title: d.label,
    description: d.dayName
  }));

  await sendInteractiveList(phoneNumberId, phone, {
    header: `✅ ${service.name}`,
    body: `€${service.price} - ${service.duration} minutos\n\n¿Qué día prefieres?`,
    button: "Seleccionar fecha",
    sections: [{
      title: "Próximos 7 días",
      rows: rows
    }]
  });
}

/**
 * Handle date selection - Show available times
 */
async function handleDateSelection(dateStr, phone, phoneNumberId) {
  const booking = await kv.get(`booking:${phone}`);
  if (!booking) {
    await sendServiceMenu(phoneNumberId, phone);
    return;
  }

  // Get available time slots from Google Calendar
  const availableSlots = await getAvailableTimeSlots(dateStr, booking.serviceDuration);

  if (availableSlots.length === 0) {
    await sendWhatsAppMessage(phoneNumberId, phone,
      "❌ No hay horarios disponibles para ese día.\n\nPrueba con otra fecha.");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Show date menu again
    const dates = generateNextDays(7);
    const rows = dates.map(d => ({
      id: `date:${d.value}`,
      title: d.label,
      description: d.dayName
    }));

    await sendInteractiveList(phoneNumberId, phone, {
      header: `${booking.serviceName}`,
      body: "Selecciona otra fecha:",
      button: "Ver fechas",
      sections: [{
        title: "Próximos 7 días",
        rows: rows
      }]
    });
    return;
  }

  // Update state
  booking.step = 'time_selection';
  booking.date = dateStr;
  await kv.set(`booking:${phone}`, booking, { ex: 3600 });

  // Show time slots as buttons (max 3 buttons, so show first 3 slots)
  const buttons = availableSlots.slice(0, 3).map(slot => ({
    type: "reply",
    reply: {
      id: `time:${slot}`,
      title: slot
    }
  }));

  await sendInteractiveButtons(phoneNumberId, phone, {
    body: `📅 ${formatDate(dateStr)}\n\nHorarios disponibles:`,
    buttons: buttons
  });
}

/**
 * Handle time selection - Show confirmation
 */
async function handleTimeSelection(time, phone, phoneNumberId) {
  const booking = await kv.get(`booking:${phone}`);
  if (!booking) {
    await sendServiceMenu(phoneNumberId, phone);
    return;
  }

  // Update state
  booking.step = 'confirmation';
  booking.time = time;
  await kv.set(`booking:${phone}`, booking, { ex: 3600 });

  // Show confirmation buttons
  const buttons = [
    {
      type: "reply",
      reply: {
        id: "confirm",
        title: "✅ Confirmar"
      }
    },
    {
      type: "reply",
      reply: {
        id: "cancel",
        title: "❌ Cancelar"
      }
    }
  ];

  const summary = `📋 RESUMEN DE TU CITA

🔹 Servicio: ${booking.serviceName}
💰 Precio: €${booking.servicePrice}
⏱️ Duración: ${booking.serviceDuration}min
📅 Fecha: ${formatDate(booking.date)}
🕐 Hora: ${booking.time}

¿Confirmar esta cita?`;

  await sendInteractiveButtons(phoneNumberId, phone, {
    body: summary,
    buttons: buttons
  });
}

/**
 * Handle confirmation - Create calendar event
 */
async function handleConfirmation(phone, phoneNumberId) {
  const booking = await kv.get(`booking:${phone}`);
  if (!booking) {
    await sendServiceMenu(phoneNumberId, phone);
    return;
  }

  try {
    // Create Google Calendar event
    const eventUrl = await createCalendarEvent({
      service: booking.serviceName,
      date: booking.date,
      time: booking.time,
      duration: booking.serviceDuration,
      customerPhone: phone
    });

    // Send confirmation message
    const confirmMessage = `✅ ¡CITA CONFIRMADA!

📋 ${booking.serviceName}
📅 ${formatDate(booking.date)}
🕐 ${booking.time}
💈 Barbería El Clásico

¡Te esperamos!

_Para cancelar, contacta con al menos 2 horas de antelación._`;

    await sendWhatsAppMessage(phoneNumberId, phone, confirmMessage);

    // Clear booking state
    await kv.del(`booking:${phone}`);

  } catch (error) {
    console.error('Error creating calendar event:', error);
    await sendWhatsAppMessage(phoneNumberId, phone,
      "❌ Hubo un error al confirmar tu cita. Por favor, inténtalo de nuevo o llámanos al +34 912 345 678");
  }
}

/**
 * Handle cancellation
 */
async function handleCancellation(phone, phoneNumberId) {
  await kv.del(`booking:${phone}`);

  const buttons = [{
    type: "reply",
    reply: {
      id: "restart",
      title: "🔄 Nueva cita"
    }
  }];

  await sendInteractiveButtons(phoneNumberId, phone, {
    body: "❌ Cita cancelada.\n\n¿Quieres reservar otra?",
    buttons: buttons
  });
}

/**
 * Generate next N days (excluding Sundays - closed)
 */
function generateNextDays(count) {
  const days = [];
  const now = new Date();

  // Set to Madrid timezone
  const madridTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));

  let currentDate = new Date(madridTime);
  currentDate.setHours(0, 0, 0, 0);

  while (days.length < count) {
    const dayOfWeek = currentDate.getDay();

    // Skip Sundays (0)
    if (dayOfWeek !== 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      days.push({
        value: dateStr,
        label: formatDate(dateStr),
        dayName: dayNames[dayOfWeek]
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Get available time slots from Google Calendar
 */
async function getAvailableTimeSlots(dateStr, serviceDuration) {
  try {
    // Initialize Google Calendar
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.CALENDAR_ID;

    // Get day of week
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Get business hours for this day
    const hours = BARBERSHOP_CONFIG.businessHours[dayName];
    if (!hours || hours.closed) {
      return [];
    }

    // Generate all possible slots
    const slots = [];
    const [openHour, openMinute] = hours.open.split(':').map(Number);
    const [closeHour, closeMinute] = hours.close.split(':').map(Number);

    let currentHour = openHour;
    let currentMinute = openMinute;

    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Check if slot is during break time
      let isDuringBreak = false;
      if (hours.breaks) {
        for (const breakTime of hours.breaks) {
          const [breakStartHour, breakStartMinute] = breakTime.start.split(':').map(Number);
          const [breakEndHour, breakEndMinute] = breakTime.end.split(':').map(Number);

          const slotMinutes = currentHour * 60 + currentMinute;
          const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
          const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

          if (slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes) {
            isDuringBreak = true;
            break;
          }
        }
      }

      if (!isDuringBreak) {
        slots.push(timeStr);
      }

      // Increment by 30 minutes (slot duration)
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute -= 60;
      }
    }

    // Check each slot against Google Calendar for conflicts
    const availableSlots = [];
    const timeMin = new Date(dateStr + 'T00:00:00Z').toISOString();
    const timeMax = new Date(dateStr + 'T23:59:59Z').toISOString();

    // Get existing events for the day
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const existingEvents = response.data.items || [];

    // Check each slot
    for (const slot of slots) {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotStart = new Date(dateStr + 'T' + slot + ':00');
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      let hasConflict = false;
      for (const event of existingEvents) {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);

        // Check if slot overlaps with existing event
        if (slotStart < eventEnd && slotEnd > eventStart) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        availableSlots.push(slot);
      }
    }

    return availableSlots;

  } catch (error) {
    console.error('Error checking calendar:', error);
    // Return default slots if calendar check fails
    return ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];
  }
}

/**
 * Create Google Calendar event
 */
async function createCalendarEvent({ service, date, time, duration, customerPhone }) {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.CALENDAR_ID;

    // Create start and end times
    const startDateTime = new Date(date + 'T' + time + ':00');
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const event = {
      summary: `${service} - ${customerPhone}`,
      description: `Reserva de ${service}\nCliente: ${customerPhone}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Madrid'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event
    });

    console.log('✅ Calendar event created:', response.data.id);
    return response.data.htmlLink;

  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Send interactive list message
 */
async function sendInteractiveList(phoneNumberId, to, { header, body, button, sections }) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const message = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: header
      },
      body: {
        text: body
      },
      action: {
        button: button,
        sections: sections
      }
    }
  };

  console.log('🔄 Sending interactive list to:', to);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ WhatsApp API error:', result);
  } else {
    console.log('✅ Message sent successfully');
  }

  return result;
}

/**
 * Send interactive buttons message
 */
async function sendInteractiveButtons(phoneNumberId, to, { body, buttons }) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const message = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: body
      },
      action: {
        buttons: buttons
      }
    }
  };

  console.log('🔄 Sending interactive buttons to:', to);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ WhatsApp API error:', result);
  } else {
    console.log('✅ Buttons sent successfully');
  }

  return result;
}

/**
 * Send simple text message
 */
async function sendWhatsAppMessage(phoneNumberId, to, text) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    })
  });

  return await response.json();
}

/* ========================================
 * AI-BASED VERSION (DISABLED)
 * ========================================
 *
 * The AI implementation has been moved to:
 * api/webhook/whatsapp-ai-backup.js
 *
 * Reasons for disabling:
 * - Poor conversation quality
 * - Memory issues despite Vercel KV
 * - Incorrect time extraction
 * - Repetitive greetings
 *
 * Can be re-enabled if needed in the future.
 * ========================================
 */
