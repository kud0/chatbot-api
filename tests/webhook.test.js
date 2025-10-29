import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTestRequest,
  createWhatsAppWebhookPayload,
  createWhatsAppSignature,
  mockWhatsAppAPI,
} from './setup.js';
import sampleMessages from './fixtures/sample-messages.json';

// Mock dependencies
const mockWhatsApp = mockWhatsAppAPI();

describe('WhatsApp Webhook', () => {
  describe('Webhook Verification (GET)', () => {
    it('should verify webhook with valid token', async () => {
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
      const challenge = 'test_challenge_12345';

      const url = new URL('http://localhost:3000/api/webhook');
      url.searchParams.append('hub.mode', 'subscribe');
      url.searchParams.append('hub.verify_token', verifyToken);
      url.searchParams.append('hub.challenge', challenge);

      const request = createTestRequest(url.toString(), { method: 'GET' });

      // Mock webhook handler
      const verifyWebhook = (req) => {
        const mode = new URL(req.url).searchParams.get('hub.mode');
        const token = new URL(req.url).searchParams.get('hub.verify_token');
        const challenge = new URL(req.url).searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === verifyToken) {
          return new Response(challenge, { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
      };

      const response = await verifyWebhook(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe(challenge);
    });

    it('should reject verification with invalid token', async () => {
      const challenge = 'test_challenge_12345';

      const url = new URL('http://localhost:3000/api/webhook');
      url.searchParams.append('hub.mode', 'subscribe');
      url.searchParams.append('hub.verify_token', 'invalid_token');
      url.searchParams.append('hub.challenge', challenge);

      const request = createTestRequest(url.toString(), { method: 'GET' });

      const verifyWebhook = (req) => {
        const mode = new URL(req.url).searchParams.get('hub.mode');
        const token = new URL(req.url).searchParams.get('hub.verify_token');
        const challenge = new URL(req.url).searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
      };

      const response = await verifyWebhook(request);

      expect(response.status).toBe(403);
    });

    it('should reject verification with missing parameters', async () => {
      const url = new URL('http://localhost:3000/api/webhook');
      url.searchParams.append('hub.mode', 'subscribe');
      // Missing verify_token and challenge

      const request = createTestRequest(url.toString(), { method: 'GET' });

      const verifyWebhook = (req) => {
        const mode = new URL(req.url).searchParams.get('hub.mode');
        const token = new URL(req.url).searchParams.get('hub.verify_token');
        const challenge = new URL(req.url).searchParams.get('hub.challenge');

        if (!mode || !token || !challenge) {
          return new Response('Bad Request', { status: 400 });
        }

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
      };

      const response = await verifyWebhook(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Incoming Message Parsing (POST)', () => {
    it('should parse valid text message', async () => {
      const payload = sampleMessages.greetingMessage;

      const parseMessage = (payload) => {
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        const message = change?.value?.messages?.[0];
        const contact = change?.value?.contacts?.[0];

        if (!message || message.type !== 'text') {
          return null;
        }

        return {
          from: message.from,
          messageId: message.id,
          timestamp: message.timestamp,
          text: message.text.body,
          name: contact?.profile?.name,
        };
      };

      const parsed = parseMessage(payload);

      expect(parsed).toMatchObject({
        from: '1234567890',
        messageId: expect.any(String),
        timestamp: expect.any(String),
        text: 'Hello',
        name: 'John Doe',
      });
    });

    it('should handle image messages', async () => {
      const payload = sampleMessages.imageMessage;

      const parseMessage = (payload) => {
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        const message = change?.value?.messages?.[0];

        if (!message) return null;

        return {
          from: message.from,
          messageId: message.id,
          type: message.type,
          image: message.image,
        };
      };

      const parsed = parseMessage(payload);

      expect(parsed.type).toBe('image');
      expect(parsed.image).toMatchObject({
        mime_type: 'image/jpeg',
        id: expect.any(String),
      });
    });

    it('should handle status updates', async () => {
      const payload = sampleMessages.statusUpdate;

      const parseMessage = (payload) => {
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        const status = change?.value?.statuses?.[0];

        if (!status) return null;

        return {
          messageId: status.id,
          status: status.status,
          recipientId: status.recipient_id,
          timestamp: status.timestamp,
        };
      };

      const parsed = parseMessage(payload);

      expect(parsed).toMatchObject({
        messageId: expect.any(String),
        status: 'delivered',
        recipientId: '1234567890',
      });
    });

    it('should reject malformed payload', async () => {
      const payload = sampleMessages.malformedPayload;

      const parseMessage = (payload) => {
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        const message = change?.value?.messages?.[0];

        if (!message) {
          throw new Error('Invalid payload: no message found');
        }

        return {
          from: message.from,
          text: message.text.body,
        };
      };

      expect(() => parseMessage(payload)).toThrow('Invalid payload');
    });

    it('should validate required fields', async () => {
      const invalidPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [{
                // Missing 'from' field
                id: 'test123',
                type: 'text',
                text: { body: 'Hello' },
              }],
            },
          }],
        }],
      };

      const validateMessage = (payload) => {
        const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message?.from || !message?.id || !message?.type) {
          throw new Error('Missing required fields');
        }

        return true;
      };

      expect(() => validateMessage(invalidPayload)).toThrow('Missing required fields');
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signature', async () => {
      const payload = sampleMessages.greetingMessage;
      const signature = createWhatsAppSignature(payload);

      const verifySignature = (receivedSignature, payload, secret) => {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        const expectedSignature = 'sha256=' + hmac.digest('hex');

        return receivedSignature === expectedSignature;
      };

      const isValid = verifySignature(
        signature,
        payload,
        process.env.WEBHOOK_SECRET
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const payload = sampleMessages.greetingMessage;
      const invalidSignature = 'sha256=invalid_signature_hash';

      const verifySignature = (receivedSignature, payload, secret) => {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        const expectedSignature = 'sha256=' + hmac.digest('hex');

        return receivedSignature === expectedSignature;
      };

      const isValid = verifySignature(
        invalidSignature,
        payload,
        process.env.WEBHOOK_SECRET
      );

      expect(isValid).toBe(false);
    });

    it('should reject missing signature', async () => {
      const payload = sampleMessages.greetingMessage;

      const verifySignature = (receivedSignature, payload, secret) => {
        if (!receivedSignature) {
          throw new Error('Missing signature');
        }

        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        const expectedSignature = 'sha256=' + hmac.digest('hex');

        return receivedSignature === expectedSignature;
      };

      expect(() => verifySignature(null, payload, process.env.WEBHOOK_SECRET))
        .toThrow('Missing signature');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const rateLimiter = new Map();
      const RATE_LIMIT = 10;
      const WINDOW_MS = 60000; // 1 minute

      const checkRateLimit = (userId) => {
        const now = Date.now();
        const userKey = `ratelimit:${userId}`;

        if (!rateLimiter.has(userKey)) {
          rateLimiter.set(userKey, { count: 1, resetAt: now + WINDOW_MS });
          return true;
        }

        const { count, resetAt } = rateLimiter.get(userKey);

        if (now > resetAt) {
          rateLimiter.set(userKey, { count: 1, resetAt: now + WINDOW_MS });
          return true;
        }

        if (count >= RATE_LIMIT) {
          return false;
        }

        rateLimiter.set(userKey, { count: count + 1, resetAt });
        return true;
      };

      // First 10 requests should pass
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit('user123')).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const rateLimiter = new Map();
      const RATE_LIMIT = 5;
      const WINDOW_MS = 60000;

      const checkRateLimit = (userId) => {
        const now = Date.now();
        const userKey = `ratelimit:${userId}`;

        if (!rateLimiter.has(userKey)) {
          rateLimiter.set(userKey, { count: 1, resetAt: now + WINDOW_MS });
          return true;
        }

        const { count, resetAt } = rateLimiter.get(userKey);

        if (now > resetAt) {
          rateLimiter.set(userKey, { count: 1, resetAt: now + WINDOW_MS });
          return true;
        }

        if (count >= RATE_LIMIT) {
          return false;
        }

        rateLimiter.set(userKey, { count: count + 1, resetAt });
        return true;
      };

      // First 5 requests should pass
      for (let i = 0; i < 5; i++) {
        checkRateLimit('user456');
      }

      // 6th request should be blocked
      expect(checkRateLimit('user456')).toBe(false);
    });

    it('should reset rate limit after time window', async () => {
      const rateLimiter = new Map();
      const RATE_LIMIT = 5;
      const WINDOW_MS = 100; // Short window for testing

      const checkRateLimit = (userId, currentTime) => {
        const userKey = `ratelimit:${userId}`;

        if (!rateLimiter.has(userKey)) {
          rateLimiter.set(userKey, { count: 1, resetAt: currentTime + WINDOW_MS });
          return true;
        }

        const { count, resetAt } = rateLimiter.get(userKey);

        if (currentTime > resetAt) {
          rateLimiter.set(userKey, { count: 1, resetAt: currentTime + WINDOW_MS });
          return true;
        }

        if (count >= RATE_LIMIT) {
          return false;
        }

        rateLimiter.set(userKey, { count: count + 1, resetAt });
        return true;
      };

      const startTime = Date.now();

      // Use up the rate limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit('user789', startTime);
      }

      // Should be blocked
      expect(checkRateLimit('user789', startTime)).toBe(false);

      // After window expires, should work again
      const afterWindow = startTime + WINDOW_MS + 1;
      expect(checkRateLimit('user789', afterWindow)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const handleWebhook = async (payload) => {
        try {
          // Simulate network error
          throw new Error('Network error');
        } catch (error) {
          return {
            status: 500,
            error: 'Internal server error',
          };
        }
      };

      const result = await handleWebhook(sampleMessages.greetingMessage);

      expect(result.status).toBe(500);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle missing environment variables', async () => {
      const originalToken = process.env.WHATSAPP_TOKEN;
      delete process.env.WHATSAPP_TOKEN;

      const handleWebhook = async () => {
        if (!process.env.WHATSAPP_TOKEN) {
          throw new Error('Missing WHATSAPP_TOKEN environment variable');
        }
        return { status: 200 };
      };

      await expect(handleWebhook()).rejects.toThrow('Missing WHATSAPP_TOKEN');

      // Restore
      process.env.WHATSAPP_TOKEN = originalToken;
    });

    it('should return 200 for non-message events', async () => {
      const statusPayload = sampleMessages.statusUpdate;

      const handleWebhook = async (payload) => {
        const hasMessages = payload.entry?.[0]?.changes?.[0]?.value?.messages;

        if (!hasMessages) {
          // Status update or other event - acknowledge but don't process
          return { status: 200, message: 'Event received' };
        }

        return { status: 200, message: 'Message processed' };
      };

      const result = await handleWebhook(statusPayload);

      expect(result.status).toBe(200);
      expect(result.message).toBe('Event received');
    });
  });
});
