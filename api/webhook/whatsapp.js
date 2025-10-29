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
 * Get AI response using direct xAI API
 */
async function getAIResponse(userMessage, phone) {
  try {
    console.log('Calling xAI API directly...');

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente de barbería en Madrid. Servicios: Corte €25, Barba €10, Corte+Barba €30. Horario: Lu-Vi 9-19h, Sá 10-14h. Responde en español, breve.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();
    console.log('xAI Response:', JSON.stringify(data));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiText = data.choices[0].message.content;
      console.log('AI Text:', aiText);
      return aiText || '¡Hola! ¿En qué puedo ayudarte? 💈';
    }

    return '¡Hola! Soy de Barbería El Clásico. ¿En qué puedo ayudarte? 💈';
  } catch (error) {
    console.error('AI Error:', error.message);
    return '¡Hola! Soy de Barbería El Clásico. Servicios: Corte €25, Barba €10. ¿Qué necesitas? 💈';
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
