import { vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// ENVIRONMENT VARIABLES MOCK
// ============================================================================

process.env.WHATSAPP_TOKEN = 'test_whatsapp_token_12345';
process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token_12345';
process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_number_id';
process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test_business_account_id';
process.env.XAI_API_KEY = 'test_xai_api_key_12345';
process.env.GOOGLE_CALENDAR_ID = 'test@calendar.google.com';
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'test@test.iam.gserviceaccount.com';
process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nTEST_KEY\n-----END PRIVATE KEY-----';
process.env.KV_REST_API_URL = 'https://test-kv.upstash.io';
process.env.KV_REST_API_TOKEN = 'test_kv_token';
process.env.WEBHOOK_SECRET = 'test_webhook_secret';
process.env.BUSINESS_TIMEZONE = 'America/New_York';

// ============================================================================
// GLOBAL MOCKS
// ============================================================================

// Mock console to reduce noise in tests (optional)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export const mockWhatsAppAPI = () => ({
  sendMessage: vi.fn().mockResolvedValue({
    messaging_product: 'whatsapp',
    contacts: [{ input: '1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'wamid.test123' }],
  }),
  sendTemplate: vi.fn().mockResolvedValue({
    messaging_product: 'whatsapp',
    contacts: [{ input: '1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'wamid.test123' }],
  }),
  markAsRead: vi.fn().mockResolvedValue({ success: true }),
});

export const mockGrokAPI = () => ({
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'grok-beta',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              intent: 'service_inquiry',
              response: 'Our barbershop offers haircuts, beard trims, and styling services.',
              language: 'en',
              extractedData: {
                serviceType: 'haircut',
              },
            }),
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }),
    },
  },
});

export const mockGoogleCalendar = () => ({
  events: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [],
      },
    }),
    insert: vi.fn().mockResolvedValue({
      data: {
        id: 'event_test123',
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/event?eid=test123',
        start: { dateTime: '2025-10-30T10:00:00-04:00' },
        end: { dateTime: '2025-10-30T10:30:00-04:00' },
      },
    }),
    get: vi.fn().mockResolvedValue({
      data: {
        id: 'event_test123',
        status: 'confirmed',
        summary: 'Haircut - John Doe',
        start: { dateTime: '2025-10-30T10:00:00-04:00' },
        end: { dateTime: '2025-10-30T10:30:00-04:00' },
      },
    }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  freebusy: {
    query: vi.fn().mockResolvedValue({
      data: {
        calendars: {
          'test@calendar.google.com': {
            busy: [],
          },
        },
      },
    }),
  },
});

export const mockVercelKV = () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  exists: vi.fn().mockResolvedValue(0),
  hget: vi.fn().mockResolvedValue(null),
  hset: vi.fn().mockResolvedValue(1),
  hgetall: vi.fn().mockResolvedValue({}),
});

// ============================================================================
// TEST HELPERS
// ============================================================================

export const createTestRequest = (url, options = {}) => {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  return new Request(url, { ...defaultOptions, ...options });
};

export const createWhatsAppWebhookPayload = (message, from = '1234567890') => ({
  object: 'whatsapp_business_account',
  entry: [{
    id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '15551234567',
          phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID,
        },
        contacts: [{
          profile: { name: 'Test User' },
          wa_id: from,
        }],
        messages: [{
          from: from,
          id: 'wamid.test' + Date.now(),
          timestamp: Math.floor(Date.now() / 1000).toString(),
          type: 'text',
          text: { body: message },
        }],
      },
      field: 'messages',
    }],
  }],
});

export const createWhatsAppSignature = (payload, secret = process.env.WEBHOOK_SECRET) => {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return 'sha256=' + hmac.digest('hex');
};

export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockDateNow = (timestamp) => {
  vi.spyOn(Date, 'now').mockReturnValue(timestamp);
};

// ============================================================================
// GLOBAL TEST LIFECYCLE
// ============================================================================

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});

// ============================================================================
// EXPORTED TEST DATA
// ============================================================================

export const TEST_SERVICES = [
  { id: 'haircut', name: 'Haircut', duration: 30, price: 25 },
  { id: 'beard_trim', name: 'Beard Trim', duration: 15, price: 15 },
  { id: 'haircut_beard', name: 'Haircut + Beard', duration: 45, price: 35 },
  { id: 'styling', name: 'Styling', duration: 20, price: 20 },
];

export const TEST_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: { closed: true },
};
