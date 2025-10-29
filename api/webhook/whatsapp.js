/**
 * WhatsApp Webhook Endpoint - Simple Version
 */

export default async function handler(req, res) {
  const { method } = req;

  // Handle GET request for webhook verification
  if (method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if token matches
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
    console.log('Incoming webhook:', JSON.stringify(req.body));

    // For now, just acknowledge receipt
    return res.status(200).json({ status: 'received' });
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
