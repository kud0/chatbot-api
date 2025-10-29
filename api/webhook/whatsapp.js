/**
 * WhatsApp Webhook with AI + Memory + Calendar
 */
import { kv } from '@vercel/kv';

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
          const messageText = message.text?.body;
          const phoneNumberId = value.metadata.phone_number_id;

          if (messageText) {
            console.log(`📱 Message from ${from}: ${messageText}`);

            // Get conversation history
            const history = await getConversationHistory(from);

            // Get AI response with memory
            const aiResponse = await getAIResponse(messageText, from, history);

            // Check if we need to book
            const bookingIntent = detectBookingIntent(messageText, history);

            if (bookingIntent.shouldBook) {
              console.log('📅 Booking detected!', bookingIntent);
              // TODO: Actually book to calendar
              // For now, just acknowledge
            }

            // Save to conversation history
            await saveConversation(from, messageText, aiResponse);

            // Send response
            await sendWhatsAppMessage(phoneNumberId, from, aiResponse);
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
 * Get conversation history from KV
 */
async function getConversationHistory(phone) {
  try {
    const key = `conv:${phone}`;
    const history = await kv.get(key);
    return history || [];
  } catch (error) {
    console.log('No history found');
    return [];
  }
}

/**
 * Save conversation to KV
 */
async function saveConversation(phone, userMsg, aiMsg) {
  try {
    const key = `conv:${phone}`;
    let history = await kv.get(key) || [];

    // Add new messages
    history.push({ role: 'user', content: userMsg });
    history.push({ role: 'assistant', content: aiMsg });

    // Keep last 10 messages only
    if (history.length > 10) {
      history = history.slice(-10);
    }

    // Save with 24h expiry
    await kv.set(key, history, { ex: 86400 });
  } catch (error) {
    console.log('Could not save conversation');
  }
}

/**
 * Detect if user wants to book
 */
function detectBookingIntent(message, history) {
  const msg = message.toLowerCase();
  const confirmWords = ['confirmo', 'sí', 'si', 'vale', 'ok', 'perfecto', 'confirmar'];

  // Check if user is confirming
  const isConfirming = confirmWords.some(word => msg.includes(word));

  // Check if we have service and time in history
  const hasService = history.some(h =>
    h.content && (h.content.includes('corte') || h.content.includes('barba') || h.content.includes('combo'))
  );

  const hasTime = history.some(h =>
    h.content && /\d{1,2}:\d{2}/.test(h.content)
  );

  return {
    shouldBook: isConfirming && hasService && hasTime,
    hasService,
    hasTime
  };
}

/**
 * Get AI response
 */
async function getAIResponse(userMessage, phone, history) {
  try {
    // Get current date/time in Madrid timezone
    const now = new Date();
    const madridTime = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const systemPrompt = `Eres asistente de Barbería El Clásico en Madrid.

FECHA Y HORA ACTUAL: ${madridTime}

SERVICIOS:
- Corte: €25 (30min)
- Barba: €10 (15min)
- Combo (Corte+Barba): €30 (45min)

HORARIO:
- Lunes a Viernes: 9:00-19:00
- Sábado: 10:00-14:00
- Domingo: CERRADO

INSTRUCCIONES:
- NO saludes con "Hola" en cada mensaje (solo la primera vez)
- Usa la fecha actual que te di arriba
- Sé breve y directo
- Cuando el cliente confirme cita, di "✅ Cita confirmada para [día] a las [hora]"
- Usa emojis: 💈 ✂️ 📅`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content || 'Disculpa, ¿puedes repetir?';
    }

    return '¿En qué puedo ayudarte? 💈';
  } catch (error) {
    console.error('AI Error:', error.message);
    return 'Servicios: Corte €25, Barba €10, Combo €30. Horario: Lu-Vi 9-19h, Sá 10-14h. ¿Qué necesitas?';
  }
}

/**
 * Send WhatsApp message
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
