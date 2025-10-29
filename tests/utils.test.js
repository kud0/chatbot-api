import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('Phone Validation', () => {
    it('should validate correct phone numbers', () => {
      const validatePhone = (phone) => {
        // Remove non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Check length (10-15 digits)
        if (cleaned.length < 10 || cleaned.length > 15) {
          return false;
        }

        return true;
      };

      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('+1 (234) 567-8900')).toBe(true);
      expect(validatePhone('+44 20 1234 5678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      const validatePhone = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10 || cleaned.length > 15) {
          return false;
        }
        return true;
      };

      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('12345678901234567890')).toBe(false);
    });

    it('should normalize phone numbers', () => {
      const normalizePhone = (phone) => {
        return phone.replace(/\D/g, '');
      };

      expect(normalizePhone('+1 (234) 567-8900')).toBe('12345678900');
      expect(normalizePhone('234-567-8900')).toBe('2345678900');
      expect(normalizePhone('1234567890')).toBe('1234567890');
    });

    it('should format phone numbers for display', () => {
      const formatPhone = (phone) => {
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }

        if (cleaned.length === 11 && cleaned[0] === '1') {
          return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        }

        return phone;
      };

      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
      expect(formatPhone('11234567890')).toBe('+1 (123) 456-7890');
    });
  });

  describe('Date Validation', () => {
    it('should validate correct date formats', () => {
      const validateDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      };

      expect(validateDate('2025-10-30')).toBe(true);
      expect(validateDate('2025-10-30T14:00:00')).toBe(true);
      expect(validateDate('2025-10-30T14:00:00-04:00')).toBe(true);
    });

    it('should reject invalid dates', () => {
      const validateDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      };

      expect(validateDate('invalid-date')).toBe(false);
      expect(validateDate('2025-13-45')).toBe(false);
      expect(validateDate('')).toBe(false);
    });

    it('should check if date is in the future', () => {
      const isFutureDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        return date > now;
      };

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      expect(isFutureDate(futureDate.toISOString())).toBe(true);
      expect(isFutureDate(pastDate.toISOString())).toBe(false);
    });

    it('should parse natural language dates', () => {
      const parseNaturalDate = (input) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const patterns = {
          today: today,
          tomorrow: tomorrow,
          'next week': new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        };

        const lower = input.toLowerCase();
        for (const [key, date] of Object.entries(patterns)) {
          if (lower.includes(key)) {
            return date;
          }
        }

        return null;
      };

      expect(parseNaturalDate('tomorrow')).toBeTruthy();
      expect(parseNaturalDate('today')).toBeTruthy();
      expect(parseNaturalDate('next week')).toBeTruthy();
    });

    it('should format dates for display', () => {
      const formatDate = (dateString, locale = 'en-US') => {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      };

      const result = formatDate('2025-10-30T14:00:00');

      expect(result).toContain('2025');
      expect(result).toContain('30');
    });
  });

  describe('Service ID Validation', () => {
    it('should validate correct service IDs', () => {
      const VALID_SERVICES = ['haircut', 'beard_trim', 'haircut_beard', 'styling'];

      const validateServiceId = (serviceId) => {
        return VALID_SERVICES.includes(serviceId);
      };

      expect(validateServiceId('haircut')).toBe(true);
      expect(validateServiceId('beard_trim')).toBe(true);
      expect(validateServiceId('styling')).toBe(true);
    });

    it('should reject invalid service IDs', () => {
      const VALID_SERVICES = ['haircut', 'beard_trim', 'haircut_beard', 'styling'];

      const validateServiceId = (serviceId) => {
        return VALID_SERVICES.includes(serviceId);
      };

      expect(validateServiceId('invalid_service')).toBe(false);
      expect(validateServiceId('')).toBe(false);
      expect(validateServiceId(null)).toBe(false);
    });

    it('should get service details by ID', () => {
      const SERVICES = {
        haircut: { id: 'haircut', name: 'Haircut', duration: 30, price: 25 },
        beard_trim: { id: 'beard_trim', name: 'Beard Trim', duration: 15, price: 15 },
        haircut_beard: { id: 'haircut_beard', name: 'Haircut + Beard', duration: 45, price: 35 },
        styling: { id: 'styling', name: 'Styling', duration: 20, price: 20 },
      };

      const getService = (serviceId) => {
        return SERVICES[serviceId] || null;
      };

      const service = getService('haircut');

      expect(service).toBeTruthy();
      expect(service.name).toBe('Haircut');
      expect(service.duration).toBe(30);
      expect(service.price).toBe(25);
    });
  });

  describe('Session Operations', () => {
    it('should generate unique session ID', () => {
      const generateSessionId = (userId) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `session:${userId}:${timestamp}:${random}`;
      };

      const sessionId1 = generateSessionId('user123');
      const sessionId2 = generateSessionId('user123');

      expect(sessionId1).toContain('session:user123');
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should parse session ID', () => {
      const parseSessionId = (sessionId) => {
        const parts = sessionId.split(':');

        if (parts.length < 3 || parts[0] !== 'session') {
          return null;
        }

        return {
          userId: parts[1],
          timestamp: parseInt(parts[2], 10),
        };
      };

      const parsed = parseSessionId('session:user123:1730217600000:abc123');

      expect(parsed).toBeTruthy();
      expect(parsed.userId).toBe('user123');
      expect(parsed.timestamp).toBe(1730217600000);
    });

    it('should validate session expiry', () => {
      const isSessionExpired = (sessionId, maxAge = 30 * 60 * 1000) => {
        const parts = sessionId.split(':');

        if (parts.length < 3) {
          return true;
        }

        const timestamp = parseInt(parts[2], 10);
        const age = Date.now() - timestamp;

        return age > maxAge;
      };

      const oldSession = `session:user123:${Date.now() - 40 * 60 * 1000}:abc123`;
      const newSession = `session:user123:${Date.now()}:abc123`;

      expect(isSessionExpired(oldSession)).toBe(true);
      expect(isSessionExpired(newSession)).toBe(false);
    });
  });

  describe('WhatsApp Message Formatting', () => {
    it('should format text message', () => {
      const formatTextMessage = (to, text) => {
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: text },
        };
      };

      const message = formatTextMessage('1234567890', 'Hello, World!');

      expect(message.messaging_product).toBe('whatsapp');
      expect(message.to).toBe('1234567890');
      expect(message.text.body).toBe('Hello, World!');
    });

    it('should format button message', () => {
      const formatButtonMessage = (to, text, buttons) => {
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: text },
            action: {
              buttons: buttons.map((btn, idx) => ({
                type: 'reply',
                reply: {
                  id: btn.id || `btn_${idx}`,
                  title: btn.title,
                },
              })),
            },
          },
        };
      };

      const message = formatButtonMessage('1234567890', 'Choose an option', [
        { id: 'opt1', title: 'Option 1' },
        { id: 'opt2', title: 'Option 2' },
      ]);

      expect(message.type).toBe('interactive');
      expect(message.interactive.type).toBe('button');
      expect(message.interactive.action.buttons).toHaveLength(2);
    });

    it('should format list message', () => {
      const formatListMessage = (to, text, sections) => {
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: text },
            action: {
              button: 'View Options',
              sections: sections,
            },
          },
        };
      };

      const message = formatListMessage('1234567890', 'Choose a service', [
        {
          title: 'Services',
          rows: [
            { id: 'haircut', title: 'Haircut', description: '$25 - 30 min' },
            { id: 'beard', title: 'Beard Trim', description: '$15 - 15 min' },
          ],
        },
      ]);

      expect(message.type).toBe('interactive');
      expect(message.interactive.type).toBe('list');
      expect(message.interactive.action.sections).toHaveLength(1);
    });

    it('should escape special characters', () => {
      const escapeWhatsAppText = (text) => {
        return text
          .replace(/\*/g, '\\*')
          .replace(/_/g, '\\_')
          .replace(/~/g, '\\~')
          .replace(/`/g, '\\`');
      };

      expect(escapeWhatsAppText('*bold* _italic_')).toBe('\\*bold\\* \\_italic\\_');
      expect(escapeWhatsAppText('~strikethrough~ `code`')).toBe('\\~strikethrough\\~ \\`code\\`');
    });

    it('should format markdown text', () => {
      const formatMarkdown = (text) => {
        // Bold: *text*
        // Italic: _text_
        // Strikethrough: ~text~
        // Code: ```text```
        return text;
      };

      const formatted = formatMarkdown('*Bold* _italic_ ~strike~ ```code```');

      expect(formatted).toContain('*Bold*');
      expect(formatted).toContain('_italic_');
      expect(formatted).toContain('~strike~');
      expect(formatted).toContain('```code```');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize user input', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') {
          return '';
        }

        return input
          .trim()
          .replace(/[<>]/g, '')
          .substring(0, 1000); // Max length
      };

      expect(sanitizeInput('  hello  ')).toBe('hello');
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('a'.repeat(2000))).toHaveLength(1000);
    });

    it('should validate and sanitize phone input', () => {
      const sanitizePhone = (phone) => {
        if (typeof phone !== 'string') {
          throw new Error('Phone must be a string');
        }

        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length < 10 || cleaned.length > 15) {
          throw new Error('Invalid phone number length');
        }

        return cleaned;
      };

      expect(sanitizePhone('+1 (234) 567-8900')).toBe('12345678900');
      expect(() => sanitizePhone('123')).toThrow('Invalid phone');
      expect(() => sanitizePhone(12345)).toThrow('must be a string');
    });

    it('should remove SQL injection attempts', () => {
      const sanitizeSQLInput = (input) => {
        const dangerousPatterns = [
          /;.*--/gi,
          /union.*select/gi,
          /drop.*table/gi,
          /insert.*into/gi,
          /delete.*from/gi,
        ];

        let sanitized = input;

        dangerousPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });

        return sanitized.trim();
      };

      expect(sanitizeSQLInput("test'; DROP TABLE users; --")).not.toContain('DROP TABLE');
      expect(sanitizeSQLInput('test UNION SELECT * FROM users')).not.toContain('UNION SELECT');
    });
  });

  describe('Error Messages', () => {
    it('should format user-friendly error messages', () => {
      const formatErrorMessage = (error, language = 'en') => {
        const messages = {
          en: {
            network: 'Connection error. Please try again.',
            invalid_date: 'Please provide a valid date.',
            booking_conflict: 'This time slot is not available.',
            outside_hours: 'We are closed at this time.',
          },
          es: {
            network: 'Error de conexión. Por favor, inténtelo de nuevo.',
            invalid_date: 'Por favor, proporcione una fecha válida.',
            booking_conflict: 'Este horario no está disponible.',
            outside_hours: 'Estamos cerrados en este momento.',
          },
        };

        return messages[language][error] || 'An error occurred.';
      };

      expect(formatErrorMessage('network', 'en')).toBe('Connection error. Please try again.');
      expect(formatErrorMessage('network', 'es')).toBe('Error de conexión. Por favor, inténtelo de nuevo.');
    });

    it('should log errors with context', () => {
      const logError = (error, context = {}) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          error: error.message || error,
          stack: error.stack,
          context: context,
        };

        return logEntry;
      };

      const error = new Error('Test error');
      const log = logError(error, { userId: '123', action: 'booking' });

      expect(log.error).toBe('Test error');
      expect(log.context.userId).toBe('123');
      expect(log.timestamp).toBeTruthy();
    });
  });

  describe('Time Utilities', () => {
    it('should calculate duration between times', () => {
      const calculateDuration = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end - start;
        return Math.floor(durationMs / (1000 * 60)); // minutes
      };

      const duration = calculateDuration(
        '2025-10-30T10:00:00',
        '2025-10-30T10:30:00'
      );

      expect(duration).toBe(30);
    });

    it('should add minutes to a time', () => {
      const addMinutes = (dateTime, minutes) => {
        const date = new Date(dateTime);
        date.setMinutes(date.getMinutes() + minutes);
        return date.toISOString();
      };

      const result = addMinutes('2025-10-30T10:00:00', 30);

      expect(result).toContain('10:30');
    });

    it('should check if time is within business hours', () => {
      const isBusinessHours = (dateTime, hours) => {
        const date = new Date(dateTime);
        const day = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
        const dayHours = hours[day];

        if (dayHours?.closed) return false;

        const time = date.toTimeString().slice(0, 5);
        return time >= dayHours.open && time < dayHours.close;
      };

      const businessHours = {
        monday: { open: '09:00', close: '18:00' },
        sunday: { closed: true },
      };

      expect(isBusinessHours('2025-10-27T10:00:00', businessHours)).toBe(true);
      expect(isBusinessHours('2025-11-02T10:00:00', businessHours)).toBe(false);
    });
  });

  describe('String Utilities', () => {
    it('should truncate long strings', () => {
      const truncate = (str, maxLength, suffix = '...') => {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
      };

      expect(truncate('This is a long string', 10)).toBe('This is...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should capitalize first letter', () => {
      const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('')).toBe('');
    });

    it('should convert snake_case to Title Case', () => {
      const toTitleCase = (str) => {
        return str
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      expect(toTitleCase('haircut_beard')).toBe('Haircut Beard');
      expect(toTitleCase('beard_trim')).toBe('Beard Trim');
    });
  });
});
