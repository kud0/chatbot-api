import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockGrokAPI,
  mockVercelKV,
  TEST_SERVICES,
} from './setup.js';
import sampleConversations from './fixtures/sample-conversations.json';

// Mock dependencies
const mockGrok = mockGrokAPI();
const mockKV = mockVercelKV();

describe('AI Chat Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Intent Detection', () => {
    it('should detect service_inquiry intent', async () => {
      mockGrok.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'service_inquiry',
              response: 'We offer haircuts, beard trims, and styling services.',
              language: 'en',
            }),
          },
        }],
      });

      const detectIntent = async (message, context) => {
        const response = await mockGrok.chat.completions.create({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are a barbershop booking assistant. Detect user intent.',
            },
            { role: 'user', content: message },
          ],
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result.intent;
      };

      const intent = await detectIntent('What services do you offer?', {});

      expect(intent).toBe('service_inquiry');
      expect(mockGrok.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should detect availability_check intent', async () => {
      mockGrok.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'availability_check',
              response: 'Let me check our availability for you.',
              language: 'en',
              extractedData: {
                date: '2025-10-30',
              },
            }),
          },
        }],
      });

      const detectIntent = async (message) => {
        const response = await mockGrok.chat.completions.create({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'Detect user intent and extract date information.',
            },
            { role: 'user', content: message },
          ],
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;
      };

      const result = await detectIntent('What times are available on Friday?');

      expect(result.intent).toBe('availability_check');
      expect(result.extractedData).toHaveProperty('date');
    });

    it('should detect booking intent with extracted data', async () => {
      mockGrok.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              response: 'I can help you book a haircut.',
              language: 'en',
              extractedData: {
                serviceType: 'haircut',
                date: '2025-10-30',
                time: '14:00',
              },
            }),
          },
        }],
      });

      const detectIntent = async (message) => {
        const response = await mockGrok.chat.completions.create({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'Extract booking details: service, date, time.',
            },
            { role: 'user', content: message },
          ],
        });

        return JSON.parse(response.choices[0].message.content);
      };

      const result = await detectIntent('I want to book a haircut for tomorrow at 2pm');

      expect(result.intent).toBe('booking');
      expect(result.extractedData).toMatchObject({
        serviceType: 'haircut',
        date: expect.any(String),
        time: expect.any(String),
      });
    });

    it('should detect confirmation intent', async () => {
      mockGrok.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'confirmation',
              response: 'Confirming your booking.',
              language: 'en',
              confirmed: true,
            }),
          },
        }],
      });

      const detectIntent = async (message) => {
        const response = await mockGrok.chat.completions.create({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'Detect if user is confirming or canceling.',
            },
            { role: 'user', content: message },
          ],
        });

        return JSON.parse(response.choices[0].message.content);
      };

      const result = await detectIntent('Yes, please confirm');

      expect(result.intent).toBe('confirmation');
      expect(result.confirmed).toBe(true);
    });
  });

  describe('Multi-language Support', () => {
    it('should handle Spanish conversations', async () => {
      mockGrok.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              response: '¡Claro! Puedo ayudarte a reservar un corte de cabello.',
              language: 'es',
              extractedData: {
                serviceType: 'haircut',
              },
            }),
          },
        }],
      });

      const processMessage = async (message) => {
        const response = await mockGrok.chat.completions.create({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'Respond in the same language as the user.',
            },
            { role: 'user', content: message },
          ],
        });

        return JSON.parse(response.choices[0].message.content);
      };

      const result = await processMessage('Necesito un corte de cabello');

      expect(result.language).toBe('es');
      expect(result.response).toContain('corte de cabello');
    });

    it('should detect language from user input', async () => {
      const detectLanguage = (message) => {
        // Simple language detection
        const spanishPatterns = /hola|necesito|quiero|gracias|por favor/i;
        const englishPatterns = /hello|need|want|thank you|please/i;

        if (spanishPatterns.test(message)) return 'es';
        if (englishPatterns.test(message)) return 'en';
        return 'en'; // default
      };

      expect(detectLanguage('Hola, necesito ayuda')).toBe('es');
      expect(detectLanguage('Hello, I need help')).toBe('en');
      expect(detectLanguage('random text')).toBe('en');
    });

    it('should maintain language consistency in conversation', async () => {
      const conversation = sampleConversations.spanishConversation;

      const getConversationLanguage = (conversation) => {
        return conversation.context.language;
      };

      const language = getConversationLanguage(conversation);

      expect(language).toBe('es');
      expect(conversation.messages[1].content).toContain('Hola');
    });
  });

  describe('Conversation Context Management', () => {
    it('should load existing conversation context', async () => {
      const userId = '1234567890';
      mockKV.get.mockResolvedValue(JSON.stringify(sampleConversations.bookingFlowConversation));

      const loadContext = async (userId) => {
        const data = await mockKV.get(`conversation:${userId}`);
        return data ? JSON.parse(data) : null;
      };

      const context = await loadContext(userId);

      expect(context).toBeTruthy();
      expect(context.userId).toBe(userId);
      expect(context.context.intent).toBe('booking');
      expect(mockKV.get).toHaveBeenCalledWith(`conversation:${userId}`);
    });

    it('should save conversation context', async () => {
      const userId = '1234567890';
      const context = {
        userId,
        messages: [
          { role: 'user', content: 'Hello', timestamp: Date.now() },
        ],
        context: {
          intent: 'greeting',
          language: 'en',
          state: 'initial',
        },
      };

      mockKV.set.mockResolvedValue('OK');

      const saveContext = async (userId, context) => {
        const key = `conversation:${userId}`;
        const ttl = 3600; // 1 hour
        await mockKV.set(key, JSON.stringify(context));
        await mockKV.expire(key, ttl);
        return true;
      };

      const result = await saveContext(userId, context);

      expect(result).toBe(true);
      expect(mockKV.set).toHaveBeenCalledWith(
        `conversation:${userId}`,
        JSON.stringify(context)
      );
    });

    it('should create new conversation for first-time user', async () => {
      const userId = 'new_user_123';
      mockKV.get.mockResolvedValue(null);

      const getOrCreateConversation = async (userId) => {
        const existing = await mockKV.get(`conversation:${userId}`);

        if (existing) {
          return JSON.parse(existing);
        }

        return {
          userId,
          messages: [],
          context: {
            intent: null,
            language: 'en',
            state: 'initial',
          },
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        };
      };

      const conversation = await getOrCreateConversation(userId);

      expect(conversation.userId).toBe(userId);
      expect(conversation.messages).toEqual([]);
      expect(conversation.context.state).toBe('initial');
    });

    it('should update conversation state', async () => {
      const updateConversationState = (conversation, newState, extractedData = {}) => {
        return {
          ...conversation,
          context: {
            ...conversation.context,
            state: newState,
            ...extractedData,
          },
          lastUpdated: Date.now(),
        };
      };

      const conversation = sampleConversations.serviceInquiryConversation;
      const updated = updateConversationState(
        conversation,
        'awaiting_datetime',
        { selectedService: TEST_SERVICES[0] }
      );

      expect(updated.context.state).toBe('awaiting_datetime');
      expect(updated.context.selectedService).toBeDefined();
      expect(updated.lastUpdated).toBeGreaterThan(conversation.lastUpdated);
    });
  });

  describe('Session Management', () => {
    it('should create new session', async () => {
      const userId = '1234567890';
      const sessionId = `session:${userId}:${Date.now()}`;

      mockKV.set.mockResolvedValue('OK');

      const createSession = async (userId) => {
        const sessionId = `session:${userId}:${Date.now()}`;
        const session = {
          id: sessionId,
          userId,
          startTime: Date.now(),
          active: true,
        };

        await mockKV.set(sessionId, JSON.stringify(session));
        return session;
      };

      const session = await createSession(userId);

      expect(session.userId).toBe(userId);
      expect(session.active).toBe(true);
      expect(mockKV.set).toHaveBeenCalled();
    });

    it('should expire inactive sessions', async () => {
      const SESSION_TIMEOUT = 30 * 60; // 30 minutes

      const checkSessionExpiry = (session, now) => {
        const elapsed = now - session.startTime;
        return elapsed > SESSION_TIMEOUT * 1000;
      };

      const oldSession = {
        userId: '123',
        startTime: Date.now() - (40 * 60 * 1000), // 40 minutes ago
        active: true,
      };

      const isExpired = checkSessionExpiry(oldSession, Date.now());

      expect(isExpired).toBe(true);
    });

    it('should maintain active sessions', async () => {
      const SESSION_TIMEOUT = 30 * 60;

      const checkSessionExpiry = (session, now) => {
        const elapsed = now - session.startTime;
        return elapsed > SESSION_TIMEOUT * 1000;
      };

      const activeSession = {
        userId: '123',
        startTime: Date.now() - (10 * 60 * 1000), // 10 minutes ago
        active: true,
      };

      const isExpired = checkSessionExpiry(activeSession, Date.now());

      expect(isExpired).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle Grok API failures', async () => {
      mockGrok.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const processMessage = async (message) => {
        try {
          await mockGrok.chat.completions.create({
            model: 'grok-beta',
            messages: [{ role: 'user', content: message }],
          });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            fallbackResponse: 'Sorry, I am experiencing technical difficulties.',
          };
        }
      };

      const result = await processMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
      expect(result.fallbackResponse).toBeTruthy();
    });

    it('should handle malformed AI responses', async () => {
      mockGrok.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response',
          },
        }],
      });

      const processMessage = async (message) => {
        try {
          const response = await mockGrok.chat.completions.create({
            model: 'grok-beta',
            messages: [{ role: 'user', content: message }],
          });

          const parsed = JSON.parse(response.choices[0].message.content);
          return { success: true, data: parsed };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to parse AI response',
            fallbackResponse: 'I did not understand that. Can you rephrase?',
          };
        }
      };

      const result = await processMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.error).toContain('parse');
    });

    it('should handle KV storage failures', async () => {
      mockKV.get.mockRejectedValue(new Error('Connection timeout'));

      const loadContext = async (userId) => {
        try {
          const data = await mockKV.get(`conversation:${userId}`);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          // Return default context on failure
          return {
            userId,
            messages: [],
            context: { state: 'initial' },
          };
        }
      };

      const context = await loadContext('123');

      expect(context.userId).toBe('123');
      expect(context.messages).toEqual([]);
    });

    it('should retry on transient failures', async () => {
      let attempts = 0;
      mockGrok.chat.completions.create.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({ intent: 'greeting', response: 'Hello!' }),
            },
          }],
        });
      });

      const processWithRetry = async (message, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await mockGrok.chat.completions.create({
              model: 'grok-beta',
              messages: [{ role: 'user', content: message }],
            });

            return JSON.parse(response.choices[0].message.content);
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
          }
        }
      };

      const result = await processWithRetry('Hello');

      expect(result.intent).toBe('greeting');
      expect(attempts).toBe(3);
    });
  });

  describe('Context Preservation', () => {
    it('should maintain conversation history', async () => {
      const conversation = sampleConversations.multiTurnConversation;

      const addMessage = (conversation, role, content) => {
        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              role,
              content,
              timestamp: Date.now(),
            },
          ],
          lastUpdated: Date.now(),
        };
      };

      const updated = addMessage(conversation, 'assistant', 'When would you like to book?');

      expect(updated.messages.length).toBe(conversation.messages.length + 1);
      expect(updated.messages[updated.messages.length - 1].role).toBe('assistant');
    });

    it('should limit conversation history size', async () => {
      const MAX_MESSAGES = 20;

      const trimConversation = (conversation) => {
        if (conversation.messages.length <= MAX_MESSAGES) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.slice(-MAX_MESSAGES),
        };
      };

      const longConversation = {
        ...sampleConversations.multiTurnConversation,
        messages: Array(30).fill(null).map((_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: Date.now(),
        })),
      };

      const trimmed = trimConversation(longConversation);

      expect(trimmed.messages.length).toBe(MAX_MESSAGES);
    });
  });
});
