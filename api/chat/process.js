/**
 * Chat Processor Endpoint
 * Processes messages using xAI Grok-4-fast via Vercel AI SDK
 * Manages conversation context and detects user intent
 */

import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { getConversation, appendMessage, updateConversationMetadata } from '../../src/utils/kv.js';
import barbershopConfig from '../../src/config/barbershop.json' assert { type: 'json' };

/**
 * Main handler for chat processing
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  // Verify internal request (optional security layer)
  const internalSecret = req.headers['x-internal-request'];
  if (process.env.INTERNAL_API_SECRET && internalSecret !== process.env.INTERNAL_API_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { phoneNumber, message, contactName } = req.body;

    // Validate input
    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['phoneNumber', 'message']
      });
    }

    // Load conversation context
    let context = await getConversation(phoneNumber);
    if (!context) {
      context = {
        phoneNumber,
        contactName: contactName || 'Cliente',
        messages: [],
        language: detectLanguage(message),
        createdAt: new Date().toISOString()
      };
    }

    // Append user message to history
    await appendMessage(phoneNumber, {
      role: 'user',
      content: message
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context.language);

    // Prepare conversation history (last 10 messages)
    const conversationHistory = context.messages.slice(-10);

    // Generate AI response using Grok-4-fast
    const aiResponse = await generateAIResponse(
      systemPrompt,
      conversationHistory,
      message
    );

    // Detect intent and extract data
    const intent = detectIntent(aiResponse, message);
    const extractedData = extractStructuredData(aiResponse, message, context);

    // Append AI response to history
    await appendMessage(phoneNumber, {
      role: 'assistant',
      content: aiResponse
    });

    // Update conversation metadata
    await updateConversationMetadata(phoneNumber, {
      lastIntent: intent,
      extractedData,
      lastUpdated: new Date().toISOString()
    });

    // Return response
    return res.status(200).json({
      response: aiResponse,
      intent,
      extractedData,
      conversationId: phoneNumber
    });

  } catch (error) {
    console.error('Chat processing error:', error);
    return res.status(500).json({
      error: 'Failed to process message',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Build system prompt for AI with barbershop context
 */
function buildSystemPrompt(language = 'es') {
  const config = barbershopConfig;
  const lang = language === 'en' ? 'en' : 'es';

  // Format services list
  const servicesList = config.services.map(service => {
    const name = service.name[lang];
    const desc = service.description[lang];
    const price = `${service.price.amount}${service.price.currency}`;
    const duration = `${service.duration} min`;
    return `- ${name} (${price}, ${duration}): ${desc}`;
  }).join('\n');

  // Format business hours
  const hoursText = formatBusinessHours(config.businessHours, lang);

  const currentDateTime = new Date().toLocaleString('es-ES', {
    timeZone: config.business.timezone,
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const prompts = {
    es: `Eres un asistente virtual útil y amigable para ${config.business.name[lang]}, una barbería en ${config.business.contact.address.city}.

FECHA Y HORA ACTUAL: ${currentDateTime}

SERVICIOS DISPONIBLES:
${servicesList}

HORARIO DE ATENCIÓN:
${hoursText}

INSTRUCCIONES:
- Ayuda a los clientes a reservar citas de forma conversacional
- Pregunta qué servicio desea el cliente
- Pregunta la fecha y hora preferida
- Confirma el nombre del cliente antes de finalizar la reserva
- Si el cliente pregunta por disponibilidad, indica que puedes consultar los horarios disponibles
- Mantén un tono amable y profesional
- Si el cliente quiere cancelar o modificar una cita, ayúdalo de manera cordial
- Responde en español a menos que el cliente escriba en inglés

IMPORTANTE:
- NO inventes horarios disponibles. Si te preguntan por disponibilidad, indica que vas a consultar los horarios disponibles.
- Para CONFIRMAR una reserva, necesitas: servicio, fecha, hora y nombre del cliente.
- Cuando tengas todos los datos, pregunta al cliente si desea confirmar la reserva.`,

    en: `You are a helpful and friendly virtual assistant for ${config.business.name[lang]}, a barbershop in ${config.business.contact.address.city}.

CURRENT DATE AND TIME: ${currentDateTime}

AVAILABLE SERVICES:
${servicesList}

BUSINESS HOURS:
${hoursText}

INSTRUCTIONS:
- Help customers book appointments in a conversational way
- Ask what service the customer wants
- Ask for their preferred date and time
- Confirm the customer's name before finalizing the booking
- If the customer asks about availability, indicate that you can check available times
- Keep a friendly and professional tone
- If the customer wants to cancel or modify an appointment, help them cordially
- Respond in English unless the customer writes in Spanish

IMPORTANT:
- DO NOT make up available times. If asked about availability, indicate you will check available times.
- To CONFIRM a booking, you need: service, date, time, and customer name.
- When you have all the data, ask the customer if they want to confirm the booking.`
  };

  return prompts[lang];
}

/**
 * Format business hours for display
 */
function formatBusinessHours(hours, lang) {
  const days = {
    es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  };

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const closedText = lang === 'en' ? 'Closed' : 'Cerrado';

  return dayKeys.map((key, index) => {
    const dayName = days[lang][index];
    const schedule = hours[key];

    if (schedule.closed) {
      return `${dayName}: ${closedText}`;
    }

    let text = `${dayName}: ${schedule.open} - ${schedule.close}`;
    if (schedule.breaks && schedule.breaks.length > 0) {
      const breakText = lang === 'en' ? 'break' : 'descanso';
      text += ` (${breakText}: ${schedule.breaks[0].start}-${schedule.breaks[0].end})`;
    }
    return text;
  }).join('\n');
}

/**
 * Generate AI response using Grok-4-fast
 */
async function generateAIResponse(systemPrompt, conversationHistory, userMessage) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const { text } = await generateText({
      model: xai('grok-2-1212'),
      messages,
      temperature: 0.7,
      maxTokens: 500
    });

    return text.trim();

  } catch (error) {
    console.error('Error generating AI response:', error);

    // Fallback response
    const fallbacks = {
      es: 'Disculpa, estoy teniendo problemas técnicos. ¿Podrías intentar de nuevo?',
      en: 'Sorry, I\'m having technical issues. Could you try again?'
    };

    return fallbacks.es;
  }
}

/**
 * Detect user intent from conversation
 */
function detectIntent(aiResponse, userMessage) {
  const combined = (aiResponse + ' ' + userMessage).toLowerCase();

  // Check for booking confirmation intent
  if (
    combined.includes('confirmar') ||
    combined.includes('confirm') ||
    combined.includes('reservar') ||
    combined.includes('book')
  ) {
    return 'CONFIRM_BOOKING';
  }

  // Check for availability check intent
  if (
    combined.includes('disponible') ||
    combined.includes('available') ||
    combined.includes('horario') ||
    combined.includes('schedule') ||
    combined.includes('cuándo') ||
    combined.includes('when')
  ) {
    return 'CHECK_AVAILABILITY';
  }

  // Check for cancellation intent
  if (
    combined.includes('cancelar') ||
    combined.includes('cancel') ||
    combined.includes('modificar') ||
    combined.includes('modify') ||
    combined.includes('cambiar') ||
    combined.includes('change')
  ) {
    return 'CANCEL_MODIFY';
  }

  // Check for information request
  if (
    combined.includes('precio') ||
    combined.includes('price') ||
    combined.includes('cuánto') ||
    combined.includes('how much') ||
    combined.includes('servicio') ||
    combined.includes('service')
  ) {
    return 'INFO_REQUEST';
  }

  // Check for booking attempt (has date/time keywords)
  if (
    combined.match(/\d{1,2}:\d{2}/) ||
    combined.includes('mañana') ||
    combined.includes('tomorrow') ||
    combined.includes('hoy') ||
    combined.includes('today')
  ) {
    return 'BOOK_APPOINTMENT';
  }

  return 'GENERAL';
}

/**
 * Extract structured data from conversation
 */
function extractStructuredData(aiResponse, userMessage, context) {
  const combined = aiResponse + ' ' + userMessage;
  const data = {};

  // Extract service
  const services = barbershopConfig.services;
  for (const service of services) {
    const esName = service.name.es.toLowerCase();
    const enName = service.name.en.toLowerCase();

    if (combined.toLowerCase().includes(esName) || combined.toLowerCase().includes(enName)) {
      data.serviceId = service.id;
      data.serviceName = service.name;
      data.serviceDuration = service.duration;
      data.servicePrice = service.price;
      break;
    }
  }

  // Extract date patterns
  const dateMatch = combined.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (dateMatch) {
    data.date = dateMatch[0];
  }

  // Extract time patterns
  const timeMatch = combined.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    data.time = timeMatch[0];
  }

  // Extract customer name from context
  if (context.contactName) {
    data.customerName = context.contactName;
  }

  return data;
}

/**
 * Detect language from message
 */
function detectLanguage(message) {
  const spanishWords = ['hola', 'buenos', 'días', 'quiero', 'necesito', 'gracias', 'cita'];
  const englishWords = ['hello', 'hi', 'good', 'want', 'need', 'thanks', 'appointment'];

  const lowerMessage = message.toLowerCase();

  const spanishScore = spanishWords.filter(word => lowerMessage.includes(word)).length;
  const englishScore = englishWords.filter(word => lowerMessage.includes(word)).length;

  return englishScore > spanishScore ? 'en' : 'es';
}
