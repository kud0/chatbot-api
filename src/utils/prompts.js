/**
 * AI Prompt Templates for Grok-4-fast
 * Provides context-aware prompts for different conversation scenarios
 */

/**
 * Build the base system prompt for the chatbot
 * @param {Object} config - Business configuration
 * @param {string} language - User's preferred language ('en' or 'es')
 * @returns {string} System prompt
 */
export function buildSystemPrompt(config, language = 'en') {
  const businessName = config?.businessName || 'our business';
  const businessDescription = config?.businessDescription || 'We provide professional services.';

  const prompts = {
    en: `You are a helpful booking assistant for ${businessName}. ${businessDescription}

Your responsibilities:
1. Greet users warmly and professionally
2. Help users understand available services
3. Guide them through the booking process
4. Answer questions about services, pricing, and availability
5. Confirm bookings and provide clear confirmation details

Services available:
${formatServicesForPrompt(config?.services, 'en')}

Important guidelines:
- Be conversational and friendly, but professional
- Keep responses concise (2-3 sentences max)
- When users want to book, ask for their preferred date/time
- Confirm all booking details before finalizing
- If you're unsure about availability, say you'll check
- Always maintain context from previous messages
- Use the user's language preference (English or Spanish)

Booking flow:
1. User expresses interest in a service
2. Ask for preferred date and time
3. Check availability (you'll be told if a slot is available)
4. Confirm details: service, date, time, name
5. Complete the booking

Never:
- Make up information about services or availability
- Promise specific times without checking availability
- Share personal information
- Discuss topics outside of booking and services`,

    es: `Eres un asistente de reservas útil para ${businessName}. ${businessDescription}

Tus responsabilidades:
1. Saludar a los usuarios de manera cálida y profesional
2. Ayudar a los usuarios a comprender los servicios disponibles
3. Guiarlos a través del proceso de reserva
4. Responder preguntas sobre servicios, precios y disponibilidad
5. Confirmar reservas y proporcionar detalles claros de confirmación

Servicios disponibles:
${formatServicesForPrompt(config?.services, 'es')}

Pautas importantes:
- Sé conversacional y amigable, pero profesional
- Mantén las respuestas concisas (máximo 2-3 oraciones)
- Cuando los usuarios quieran reservar, pregunta por su fecha/hora preferida
- Confirma todos los detalles de la reserva antes de finalizar
- Si no estás seguro de la disponibilidad, di que la verificarás
- Siempre mantén el contexto de los mensajes anteriores
- Usa el idioma de preferencia del usuario (inglés o español)

Flujo de reserva:
1. El usuario expresa interés en un servicio
2. Pregunta por la fecha y hora preferida
3. Verifica disponibilidad (se te dirá si hay un espacio disponible)
4. Confirma detalles: servicio, fecha, hora, nombre
5. Completa la reserva

Nunca:
- Inventes información sobre servicios o disponibilidad
- Prometas horarios específicos sin verificar disponibilidad
- Compartas información personal
- Discutas temas fuera de reservas y servicios`
  };

  return prompts[language] || prompts.en;
}

/**
 * Format services list for prompt
 * @param {Array<Object>} services - Services from config
 * @param {string} language - Language code
 * @returns {string} Formatted services text
 */
function formatServicesForPrompt(services, language) {
  if (!services || services.length === 0) {
    return language === 'es'
      ? 'No hay servicios configurados actualmente.'
      : 'No services currently configured.';
  }

  return services.map((service, index) => {
    const name = service.name?.[language] || service.name?.en || service.name;
    const description = service.description?.[language] || service.description?.en || service.description || '';
    const price = service.price ? `$${service.price}` : (language === 'es' ? 'Precio variable' : 'Variable pricing');
    const duration = service.duration ? `${service.duration} min` : '';

    return `${index + 1}. ${name} - ${price}${duration ? ` (${duration})` : ''}
   ${description}`;
  }).join('\n');
}

/**
 * Build context-aware prompt with conversation history
 * @param {Object} options - Prompt options
 * @param {Array<Object>} options.messages - Conversation history
 * @param {Object} options.config - Business configuration
 * @param {string} options.language - User's language
 * @param {string} options.intent - Detected intent (optional)
 * @param {Object} options.availabilityContext - Availability information (optional)
 * @returns {Array<Object>} Messages array for API
 */
export function buildContextPrompt(options) {
  const {
    messages = [],
    config,
    language = 'en',
    intent,
    availabilityContext
  } = options;

  const systemPrompt = buildSystemPrompt(config, language);

  // Add context about current intent if provided
  let enhancedSystemPrompt = systemPrompt;

  if (intent) {
    const intentContext = {
      en: {
        booking: '\n\nCurrent context: User wants to book a service. Guide them through date/time selection.',
        inquiry: '\n\nCurrent context: User is asking about services. Provide clear information.',
        cancellation: '\n\nCurrent context: User wants to cancel a booking. Be understanding and helpful.',
        greeting: '\n\nCurrent context: User just started conversation. Provide a warm welcome.'
      },
      es: {
        booking: '\n\nContexto actual: El usuario quiere reservar un servicio. Guíalo en la selección de fecha/hora.',
        inquiry: '\n\nContexto actual: El usuario está preguntando sobre servicios. Proporciona información clara.',
        cancellation: '\n\nContexto actual: El usuario quiere cancelar una reserva. Sé comprensivo y servicial.',
        greeting: '\n\nContexto actual: El usuario acaba de comenzar la conversación. Ofrece una bienvenida cálida.'
      }
    };

    const context = intentContext[language]?.[intent];
    if (context) {
      enhancedSystemPrompt += context;
    }
  }

  // Add availability context if provided
  if (availabilityContext) {
    const availMsg = language === 'es'
      ? `\n\nDisponibilidad verificada: ${JSON.stringify(availabilityContext)}`
      : `\n\nVerified availability: ${JSON.stringify(availabilityContext)}`;
    enhancedSystemPrompt += availMsg;
  }

  return [
    { role: 'system', content: enhancedSystemPrompt },
    ...messages
  ];
}

/**
 * Intent detection prompt
 * @param {string} message - User message
 * @param {string} language - Language code
 * @returns {string} Intent detection prompt
 */
export function buildIntentDetectionPrompt(message, language = 'en') {
  const prompts = {
    en: `Analyze this message and identify the primary intent. Return ONLY one word from this list: greeting, booking, inquiry, cancellation, confirmation, other.

Message: "${message}"

Intent:`,
    es: `Analiza este mensaje e identifica la intención principal. Devuelve SOLO una palabra de esta lista: greeting, booking, inquiry, cancellation, confirmation, other.

Mensaje: "${message}"

Intención:`
  };

  return prompts[language] || prompts.en;
}

/**
 * Generate greeting message template
 * @param {string} language - Language code
 * @param {string} userName - User's name (optional)
 * @param {Object} config - Business configuration
 * @returns {string} Greeting message
 */
export function generateGreeting(language, userName, config) {
  const businessName = config?.businessName || 'us';

  const greetings = {
    en: userName
      ? `Hello ${userName}! 👋 Welcome to ${businessName}. How can I help you today? Would you like to learn about our services or book an appointment?`
      : `Hello! 👋 Welcome to ${businessName}. How can I help you today? Would you like to learn about our services or book an appointment?`,
    es: userName
      ? `¡Hola ${userName}! 👋 Bienvenido a ${businessName}. ¿Cómo puedo ayudarte hoy? ¿Te gustaría conocer nuestros servicios o reservar una cita?`
      : `¡Hola! 👋 Bienvenido a ${businessName}. ¿Cómo puedo ayudarte hoy? ¿Te gustaría conocer nuestros servicios o reservar una cita?`
  };

  return greetings[language] || greetings.en;
}

/**
 * Generate service inquiry response template
 * @param {Object} config - Business configuration
 * @param {string} language - Language code
 * @returns {string} Services message
 */
export function generateServicesMessage(config, language) {
  const services = config?.services || [];

  if (services.length === 0) {
    return language === 'es'
      ? 'Lo siento, actualmente no tenemos servicios configurados. Por favor, contacta con nosotros directamente.'
      : 'Sorry, we currently have no services configured. Please contact us directly.';
  }

  const intro = language === 'es'
    ? 'Aquí están nuestros servicios disponibles:'
    : 'Here are our available services:';

  const servicesList = services.map((service, index) => {
    const name = service.name?.[language] || service.name?.en || service.name;
    const price = service.price ? `$${service.price}` : '';
    const duration = service.duration ? `${service.duration} min` : '';

    return `${index + 1}. *${name}*${price ? ` - ${price}` : ''}${duration ? ` (${duration})` : ''}`;
  }).join('\n');

  const outro = language === 'es'
    ? '\n\n¿Qué servicio te interesa?'
    : '\n\nWhich service interests you?';

  return `${intro}\n\n${servicesList}${outro}`;
}

/**
 * Generate booking confirmation message
 * @param {Object} bookingDetails - Booking information
 * @param {string} language - Language code
 * @returns {string} Confirmation message
 */
export function generateBookingConfirmation(bookingDetails, language) {
  const { service, datetime, userName, confirmationId } = bookingDetails;

  const templates = {
    en: `✅ *Booking Confirmed!*

Service: ${service}
Date & Time: ${datetime}
${userName ? `Name: ${userName}` : ''}
${confirmationId ? `Confirmation #: ${confirmationId}` : ''}

We've sent you a calendar invitation. See you then! 🎉

Need to cancel or reschedule? Just let us know.`,

    es: `✅ *¡Reserva Confirmada!*

Servicio: ${service}
Fecha y Hora: ${datetime}
${userName ? `Nombre: ${userName}` : ''}
${confirmationId ? `# de Confirmación: ${confirmationId}` : ''}

Te hemos enviado una invitación de calendario. ¡Nos vemos entonces! 🎉

¿Necesitas cancelar o reprogramar? Solo avísanos.`
  };

  return templates[language] || templates.en;
}

/**
 * Generate error message
 * @param {string} errorType - Type of error
 * @param {string} language - Language code
 * @returns {string} Error message
 */
export function generateErrorMessage(errorType, language) {
  const errors = {
    en: {
      no_availability: 'Sorry, there are no available slots for that time. Would you like to try a different date?',
      invalid_date: 'I couldn\'t understand that date. Could you try again? For example: "tomorrow" or "next Monday".',
      invalid_service: 'I couldn\'t find that service. Would you like to see our full service list?',
      booking_failed: 'Sorry, there was an issue creating your booking. Please try again or contact us directly.',
      rate_limit: 'You\'re sending messages too quickly. Please wait a moment and try again.',
      general: 'Something went wrong. Please try again or contact us for assistance.'
    },
    es: {
      no_availability: 'Lo siento, no hay espacios disponibles para ese horario. ¿Te gustaría probar otra fecha?',
      invalid_date: 'No pude entender esa fecha. ¿Podrías intentar de nuevo? Por ejemplo: "mañana" o "el próximo lunes".',
      invalid_service: 'No pude encontrar ese servicio. ¿Te gustaría ver nuestra lista completa de servicios?',
      booking_failed: 'Lo siento, hubo un problema al crear tu reserva. Por favor intenta de nuevo o contáctanos directamente.',
      rate_limit: 'Estás enviando mensajes demasiado rápido. Por favor espera un momento e intenta de nuevo.',
      general: 'Algo salió mal. Por favor intenta de nuevo o contáctanos para asistencia.'
    }
  };

  return errors[language]?.[errorType] || errors[language]?.general || errors.en.general;
}
