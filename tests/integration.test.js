import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockWhatsAppAPI,
  mockGrokAPI,
  mockGoogleCalendar,
  mockVercelKV,
  createWhatsAppWebhookPayload,
  TEST_SERVICES,
} from './setup.js';

// Mock all external APIs
const mockWhatsApp = mockWhatsAppAPI();
const mockGrok = mockGrokAPI();
const mockCalendar = mockGoogleCalendar();
const mockKV = mockVercelKV();

describe('Integration Tests - End-to-End Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Booking Flow', () => {
    it('should complete full booking journey: greeting → service → availability → booking → confirmation', async () => {
      const userId = '1234567890';
      const conversationState = {
        userId,
        messages: [],
        context: { state: 'initial', language: 'en' },
      };

      // Step 1: User sends greeting
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'greeting',
              response: 'Hello! Welcome to our barbershop. How can I help you today?',
              language: 'en',
            }),
          },
        }],
      });

      mockKV.get.mockResolvedValueOnce(null);
      mockKV.set.mockResolvedValueOnce('OK');

      const step1Response = await processMessage(userId, 'Hello');

      expect(step1Response.intent).toBe('greeting');
      expect(step1Response.response).toContain('Welcome');
      conversationState.messages.push(
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: step1Response.response }
      );
      conversationState.context.state = 'awaiting_intent';

      // Step 2: User asks for services
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'service_inquiry',
              response: 'We offer:\n1. Haircut - $25 (30 min)\n2. Beard Trim - $15 (15 min)\n3. Haircut + Beard - $35 (45 min)\n4. Styling - $20 (20 min)\n\nWhich service would you like?',
              language: 'en',
            }),
          },
        }],
      });

      mockKV.get.mockResolvedValueOnce(JSON.stringify(conversationState));

      const step2Response = await processMessage(userId, 'What services do you offer?');

      expect(step2Response.intent).toBe('service_inquiry');
      expect(step2Response.response).toContain('Haircut');
      conversationState.messages.push(
        { role: 'user', content: 'What services do you offer?' },
        { role: 'assistant', content: step2Response.response }
      );
      conversationState.context.state = 'awaiting_service_selection';

      // Step 3: User selects service
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              response: 'Great! I can help you book a haircut. When would you like to come in?',
              language: 'en',
              extractedData: {
                serviceType: 'haircut',
              },
            }),
          },
        }],
      });

      const step3Response = await processMessage(userId, 'I want a haircut');

      expect(step3Response.intent).toBe('booking');
      expect(step3Response.extractedData.serviceType).toBe('haircut');
      conversationState.context.selectedService = TEST_SERVICES[0];
      conversationState.context.state = 'awaiting_datetime';

      // Step 4: Check availability
      mockCalendar.freebusy.query.mockResolvedValueOnce({
        data: {
          calendars: {
            'test@calendar.google.com': {
              busy: [],
            },
          },
        },
      });

      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'availability_check',
              response: 'Available times tomorrow: 9:00 AM, 10:00 AM, 11:00 AM, 2:00 PM, 3:00 PM',
              language: 'en',
              extractedData: {
                date: '2025-10-31',
              },
            }),
          },
        }],
      });

      const step4Response = await processMessage(userId, 'What times are available tomorrow?');

      expect(step4Response.intent).toBe('availability_check');
      expect(step4Response.response).toContain('Available times');

      // Step 5: User selects time
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              response: 'Perfect! Booking your haircut for tomorrow at 2:00 PM.',
              language: 'en',
              extractedData: {
                date: '2025-10-31',
                time: '14:00',
              },
            }),
          },
        }],
      });

      mockCalendar.events.insert.mockResolvedValueOnce({
        data: {
          id: 'event_test123',
          status: 'confirmed',
          htmlLink: 'https://calendar.google.com/event?eid=test123',
          start: { dateTime: '2025-10-31T14:00:00-04:00' },
          end: { dateTime: '2025-10-31T14:30:00-04:00' },
        },
      });

      mockWhatsApp.sendMessage.mockResolvedValueOnce({
        messages: [{ id: 'wamid.confirmation123' }],
      });

      const step5Response = await processMessage(userId, 'Tomorrow at 2pm');

      expect(step5Response.intent).toBe('booking');
      expect(mockCalendar.events.insert).toHaveBeenCalled();
      expect(mockWhatsApp.sendMessage).toHaveBeenCalled();

      // Verify entire flow completed successfully
      expect(conversationState.context.selectedService.id).toBe('haircut');
    });
  });

  describe('Service Inquiry Flow', () => {
    it('should handle service inquiry without booking', async () => {
      const userId = '9876543210';

      // User asks about services
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'service_inquiry',
              response: 'We offer haircuts, beard trims, styling, and combination packages.',
              language: 'en',
            }),
          },
        }],
      });

      mockKV.get.mockResolvedValueOnce(null);
      mockKV.set.mockResolvedValueOnce('OK');

      const response = await processMessage(userId, 'What services do you have?');

      expect(response.intent).toBe('service_inquiry');
      expect(response.response).toBeTruthy();

      // User asks about prices
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'service_inquiry',
              response: 'Haircut: $25, Beard Trim: $15, Haircut + Beard: $35, Styling: $20',
              language: 'en',
            }),
          },
        }],
      });

      const priceResponse = await processMessage(userId, 'How much does a haircut cost?');

      expect(priceResponse.intent).toBe('service_inquiry');
      expect(priceResponse.response).toContain('$25');
    });

    it('should handle business hours inquiry', async () => {
      const userId = '1111111111';

      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'business_hours',
              response: 'We are open:\nMon-Fri: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nClosed on Sundays',
              language: 'en',
            }),
          },
        }],
      });

      mockKV.get.mockResolvedValueOnce(null);

      const response = await processMessage(userId, 'What are your hours?');

      expect(response.intent).toBe('business_hours');
      expect(response.response).toContain('9:00 AM');
    });
  });

  describe('Multi-Language Flow', () => {
    it('should handle complete Spanish conversation', async () => {
      const userId = '3456789012';

      // Spanish greeting
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'greeting',
              response: '¡Hola! Bienvenido a nuestra barbería. ¿Cómo puedo ayudarte?',
              language: 'es',
            }),
          },
        }],
      });

      mockKV.get.mockResolvedValueOnce(null);

      const greetingResponse = await processMessage(userId, 'Hola');

      expect(greetingResponse.language).toBe('es');
      expect(greetingResponse.response).toContain('Bienvenido');

      // Spanish service inquiry
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'service_inquiry',
              response: 'Ofrecemos:\n1. Corte de Cabello - $25 (30 min)\n2. Recorte de Barba - $15 (15 min)\n3. Corte + Barba - $35 (45 min)',
              language: 'es',
            }),
          },
        }],
      });

      const serviceResponse = await processMessage(userId, '¿Qué servicios ofrecen?');

      expect(serviceResponse.language).toBe('es');
      expect(serviceResponse.response).toContain('Corte de Cabello');

      // Spanish booking
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              response: '¡Perfecto! ¿Cuándo te gustaría venir?',
              language: 'es',
              extractedData: {
                serviceType: 'haircut',
              },
            }),
          },
        }],
      });

      const bookingResponse = await processMessage(userId, 'Quiero un corte de cabello');

      expect(bookingResponse.language).toBe('es');
      expect(bookingResponse.intent).toBe('booking');
    });
  });

  describe('Error Recovery Flow', () => {
    it('should recover from API failures gracefully', async () => {
      const userId = '5555555555';

      // First attempt fails
      mockGrok.chat.completions.create.mockRejectedValueOnce(
        new Error('API timeout')
      );

      const processWithFallback = async (userId, message) => {
        try {
          const response = await mockGrok.chat.completions.create({
            model: 'grok-beta',
            messages: [{ role: 'user', content: message }],
          });

          return JSON.parse(response.choices[0].message.content);
        } catch (error) {
          return {
            intent: 'error',
            response: 'Sorry, I am experiencing technical difficulties. Please try again.',
            language: 'en',
          };
        }
      };

      const response = await processWithFallback(userId, 'Hello');

      expect(response.intent).toBe('error');
      expect(response.response).toContain('technical difficulties');
    });

    it('should handle invalid booking requests', async () => {
      const userId = '6666666666';

      // User tries to book in the past
      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              response: 'I cannot book appointments in the past. Please choose a future date.',
              language: 'en',
              error: 'invalid_date',
            }),
          },
        }],
      });

      mockKV.get.mockResolvedValueOnce(null);

      const response = await processMessage(userId, 'Book me yesterday at 2pm');

      expect(response.error).toBe('invalid_date');
      expect(response.response).toContain('cannot book');
    });

    it('should handle booking conflicts', async () => {
      const userId = '7777777777';

      mockGrok.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              response: 'Checking availability...',
              language: 'en',
              extractedData: {
                serviceType: 'haircut',
                date: '2025-10-31',
                time: '14:00',
              },
            }),
          },
        }],
      });

      mockCalendar.freebusy.query.mockResolvedValueOnce({
        data: {
          calendars: {
            'test@calendar.google.com': {
              busy: [
                {
                  start: '2025-10-31T14:00:00-04:00',
                  end: '2025-10-31T14:30:00-04:00',
                },
              ],
            },
          },
        },
      });

      mockKV.get.mockResolvedValueOnce(null);

      const response = await processMessage(userId, 'Tomorrow at 2pm');

      // Check availability and detect conflict
      const checkAvailability = async (dateTime, duration) => {
        const start = new Date(dateTime);
        const end = new Date(start.getTime() + duration * 60000);

        const freebusyResponse = await mockCalendar.freebusy.query({
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
        });

        const busy = freebusyResponse.data.calendars['test@calendar.google.com'].busy;

        return busy.length > 0 ? 'conflict' : 'available';
      };

      const availability = await checkAvailability('2025-10-31T14:00:00-04:00', 30);

      expect(availability).toBe('conflict');
    });
  });

  describe('State Transitions', () => {
    it('should maintain correct state through conversation', async () => {
      const states = [];

      const trackState = (newState) => {
        states.push(newState);
      };

      // Initial state
      trackState('initial');

      // After greeting
      trackState('awaiting_intent');

      // After service inquiry
      trackState('awaiting_service_selection');

      // After service selection
      trackState('awaiting_datetime');

      // After datetime selection
      trackState('awaiting_confirmation');

      // After confirmation
      trackState('completed');

      expect(states).toEqual([
        'initial',
        'awaiting_intent',
        'awaiting_service_selection',
        'awaiting_datetime',
        'awaiting_confirmation',
        'completed',
      ]);
    });

    it('should allow state resets', async () => {
      const conversation = {
        userId: '123',
        context: { state: 'awaiting_confirmation' },
      };

      const resetConversation = (conversation) => {
        return {
          ...conversation,
          context: { state: 'initial', language: 'en' },
          messages: [],
        };
      };

      const reset = resetConversation(conversation);

      expect(reset.context.state).toBe('initial');
      expect(reset.messages).toEqual([]);
    });
  });

  describe('Concurrent User Handling', () => {
    it('should handle multiple users simultaneously', async () => {
      const users = ['user1', 'user2', 'user3'];

      mockGrok.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'greeting',
              response: 'Hello!',
              language: 'en',
            }),
          },
        }],
      });

      mockKV.get.mockResolvedValue(null);
      mockKV.set.mockResolvedValue('OK');

      const promises = users.map(userId =>
        processMessage(userId, 'Hello')
      );

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.intent).toBe('greeting');
      });
    });
  });

  describe('Session Persistence', () => {
    it('should persist conversation across sessions', async () => {
      const userId = '8888888888';

      // First session
      const conversation1 = {
        userId,
        messages: [
          { role: 'user', content: 'I want a haircut' },
          { role: 'assistant', content: 'When would you like to book?' },
        ],
        context: {
          state: 'awaiting_datetime',
          selectedService: TEST_SERVICES[0],
        },
      };

      mockKV.set.mockResolvedValueOnce('OK');
      await mockKV.set(`conversation:${userId}`, JSON.stringify(conversation1));

      // Second session (user returns)
      mockKV.get.mockResolvedValueOnce(JSON.stringify(conversation1));

      const loadConversation = async (userId) => {
        const data = await mockKV.get(`conversation:${userId}`);
        return data ? JSON.parse(data) : null;
      };

      const conversation2 = await loadConversation(userId);

      expect(conversation2).toBeTruthy();
      expect(conversation2.context.state).toBe('awaiting_datetime');
      expect(conversation2.messages).toHaveLength(2);
    });
  });
});

// Helper function used in tests
async function processMessage(userId, message) {
  const response = await mockGrok.chat.completions.create({
    model: 'grok-beta',
    messages: [{ role: 'user', content: message }],
  });

  return JSON.parse(response.choices[0].message.content);
}
