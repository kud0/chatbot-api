/**
 * WhatsApp Webhook with AI
 */
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

export default async function handler(req, res) {
  const { method } = req;

  // Handle GET request for webhook verification
  if (method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
      console.log('Webhook verified!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden');
    }
  }

  // Handle POST request for incoming messages
  if (method === 'POST') {
    try {
      const body = req.body;
      console.log('Incoming webhook:', JSON.stringify(body));

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
            console.log(`Message from ${from}: ${messageText}`);

            // Get AI response
            const aiResponse = await getAIResponse(messageText, from);

            // Send response
            await sendWhatsAppMessage(phoneNumberId, from, aiResponse);
          }
        }
      }

      return res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(200).json({ status: 'error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Get AI response using Grok
 */
async function getAIResponse(userMessage, phone) {
  try {
    const systemPrompt = `Eres un asistente virtual de una barbería en Madrid llamada "Barbería El Clásico".

Nuestros servicios:
- Corte de pelo: €25 (30 min)
- Recorte de barba: €10 (15 min)
- Corte + Barba: €30 (45 min, descuento de €5)
- Tinte de pelo: €40 (60 min)
- Corte niño: €15 (20 min)
- Afeitado con toalla caliente: €20 (25 min)

Horario:
- Lunes a Viernes: 9:00 - 19:00
- Sábado: 10:00 - 14:00
- Domingo: Cerrado

Dirección: Calle Gran Vía, 45, Madrid

Tu trabajo:
1. Responde en español de forma amigable y profesional
2. Informa sobre servicios y precios
3. Ayuda a reservar citas
4. Usa emojis ocasionalmente (💈, ✂️, 👍)

Responde de forma breve y directa.`;

    const result = await generateText({
      model: xai('grok-2-1212'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      maxTokens: 200
    });

    return result.text;
  } catch (error) {
    console.error('AI Error:', error);
    return '¡Hola! Soy el asistente de Barbería El Clásico. ¿En qué puedo ayudarte? 💈\n\nEscribe "servicios" para ver nuestra lista de servicios.';
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

  const data = await response.json();
  console.log('WhatsApp response:', data);
  return data;
}
