/**
 * WhatsApp Webhook Endpoint
 * Handles incoming messages from WhatsApp Cloud API
 *
 * GET: Webhook verification
 * POST: Process incoming messages
 */

import { verifyWebhookSignature, extractMessageData, sendWhatsAppMessage, markMessageAsRead, sendTypingIndicator } from '../../src/utils/whatsapp.js';

/**
 * Main handler for WhatsApp webhook
 * @param {object} req - Vercel request object
 * @param {object} res - Vercel response object
 */
export default async function handler(req, res) {
  const { method } = req;

  try {
    // Handle GET request for webhook verification
    if (method === 'GET') {
      return handleVerification(req, res);
    }

    // Handle POST request for incoming messages
    if (method === 'POST') {
      return await handleIncomingMessage(req, res);
    }

    // Method not allowed
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET', 'POST']
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle webhook verification (GET request)
 * WhatsApp sends this to verify the webhook URL
 */
function handleVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Check if verification token matches
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.error('Webhook verification failed:', { mode, token });
  return res.status(403).json({ error: 'Verification failed' });
}

/**
 * Handle incoming WhatsApp message (POST request)
 */
async function handleIncomingMessage(req, res) {
  // Verify webhook signature for security
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = JSON.stringify(req.body);
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(signature, rawBody, webhookSecret)) {
    console.error('Invalid webhook signature');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Extract message data from payload
  const messageData = extractMessageData(req.body);

  // If no valid message data, return 200 (webhook requirement)
  if (!messageData) {
    console.log('No message data found in webhook payload');
    return res.status(200).json({ status: 'ok', message: 'No message to process' });
  }

  console.log('Received message:', {
    from: messageData.phoneNumber,
    type: messageData.messageType,
    messageId: messageData.messageId
  });

  // Respond immediately to WhatsApp (required within 20 seconds)
  res.status(200).json({ status: 'received' });

  // Process message asynchronously
  processMessageAsync(messageData).catch(error => {
    console.error('Error processing message asynchronously:', error);
  });
}

/**
 * Process message asynchronously (non-blocking)
 */
async function processMessageAsync(messageData) {
  const {
    messageId,
    phoneNumber,
    contactName,
    messageType,
    text
  } = messageData;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    // Mark message as read
    await markMessageAsRead(messageId, accessToken, phoneNumberId);

    // Handle non-text messages
    if (messageType !== 'text') {
      const response = getUnsupportedMessageResponse(messageType);
      await sendWhatsAppMessage(phoneNumber, response, accessToken, phoneNumberId);
      return;
    }

    // Handle empty messages
    if (!text || text.trim().length === 0) {
      const response = 'Por favor, envía un mensaje de texto. / Please send a text message.';
      await sendWhatsAppMessage(phoneNumber, response, accessToken, phoneNumberId);
      return;
    }

    // Show typing indicator
    await sendTypingIndicator(phoneNumber, accessToken, phoneNumberId);

    // Process the message through chat processor
    const chatResponse = await processChatMessage(phoneNumber, text, contactName);

    // Send response back to user
    await sendWhatsAppMessage(phoneNumber, chatResponse, accessToken, phoneNumberId);

  } catch (error) {
    console.error('Error in async message processing:', error);

    // Send error message to user
    try {
      const errorMessage = 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta nuevamente. / Sorry, there was an error processing your message. Please try again.';
      await sendWhatsAppMessage(phoneNumber, errorMessage, accessToken, phoneNumberId);
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

/**
 * Get response for unsupported message types
 */
function getUnsupportedMessageResponse(messageType) {
  const responses = {
    image: 'Lo siento, solo puedo procesar mensajes de texto. / Sorry, I can only process text messages.',
    video: 'Lo siento, solo puedo procesar mensajes de texto. / Sorry, I can only process text messages.',
    audio: 'Lo siento, solo puedo procesar mensajes de texto por ahora. / Sorry, I can only process text messages for now.',
    document: 'Lo siento, solo puedo procesar mensajes de texto. / Sorry, I can only process text messages.',
    sticker: '😊 Solo puedo procesar mensajes de texto. / I can only process text messages.',
    location: 'Gracias por compartir tu ubicación, pero solo puedo procesar mensajes de texto. / Thanks for sharing your location, but I can only process text messages.',
    contacts: 'Solo puedo procesar mensajes de texto. / I can only process text messages.'
  };

  return responses[messageType] || 'Solo puedo procesar mensajes de texto. / I can only process text messages.';
}

/**
 * Process chat message through the chat processor API
 */
async function processChatMessage(phoneNumber, message, contactName) {
  try {
    const chatProcessorUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/chat/process`;

    const response = await fetch(chatProcessorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': process.env.INTERNAL_API_SECRET || 'development'
      },
      body: JSON.stringify({
        phoneNumber,
        message,
        contactName
      })
    });

    if (!response.ok) {
      throw new Error(`Chat processor returned ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Lo siento, no pude procesar tu mensaje. / Sorry, I could not process your message.';

  } catch (error) {
    console.error('Error calling chat processor:', error);
    throw error;
  }
}
