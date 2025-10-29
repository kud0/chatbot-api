/**
 * WhatsApp Webhook Endpoint
 */

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
      console.log('Verification failed');
      return res.status(403).send('Forbidden');
    }
  }

  // Handle POST request for incoming messages
  if (method === 'POST') {
    try {
      const body = req.body;
      console.log('Incoming webhook:', JSON.stringify(body));

      // Extract message data
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

          console.log(`Message from ${from}: ${messageText}`);

          // Send a simple response
          if (messageText) {
            await sendWhatsAppMessage(phoneNumberId, from, `¡Hola! Recibí tu mensaje: "${messageText}". Soy el bot de la barbería. ¿En qué puedo ayudarte? 💈`);
          }
        }
      }

      return res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(200).json({ status: 'error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(phoneNumberId, to, text) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
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
    console.log('WhatsApp API response:', data);
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
