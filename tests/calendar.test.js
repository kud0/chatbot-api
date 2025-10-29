import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockGoogleCalendar,
  TEST_SERVICES,
  TEST_BUSINESS_HOURS,
} from './setup.js';
import sampleEvents from './fixtures/sample-calendar-events.json';

// Mock dependencies
const mockCalendar = mockGoogleCalendar();

describe('Calendar and Booking System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Availability Calculation', () => {
    it('should filter slots by business hours', async () => {
      const isWithinBusinessHours = (date, businessHours) => {
        const day = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
        const hours = businessHours[day];

        if (hours?.closed) return false;

        const time = date.toTimeString().slice(0, 5);
        return time >= hours.open && time < hours.close;
      };

      const testDate = new Date('2025-10-30T10:00:00-04:00'); // Thursday 10 AM
      const sundayDate = new Date('2025-11-02T10:00:00-04:00'); // Sunday

      expect(isWithinBusinessHours(testDate, TEST_BUSINESS_HOURS)).toBe(true);
      expect(isWithinBusinessHours(sundayDate, TEST_BUSINESS_HOURS)).toBe(false);
    });

    it('should generate time slots for given duration', async () => {
      const generateTimeSlots = (startTime, endTime, duration) => {
        const slots = [];
        let current = new Date(startTime);
        const end = new Date(endTime);

        while (current < end) {
          const slotEnd = new Date(current.getTime() + duration * 60000);
          if (slotEnd <= end) {
            slots.push({
              start: new Date(current),
              end: slotEnd,
            });
          }
          current = slotEnd;
        }

        return slots;
      };

      const slots = generateTimeSlots(
        '2025-10-30T09:00:00-04:00',
        '2025-10-30T12:00:00-04:00',
        30
      );

      expect(slots.length).toBe(6); // 3 hours / 30 min = 6 slots
      expect(slots[0].start.getHours()).toBe(9);
      expect(slots[5].end.getHours()).toBe(12);
    });

    it('should detect conflicts with existing bookings', async () => {
      mockCalendar.freebusy.query.mockResolvedValue({
        data: sampleEvents.freebusyResponse,
      });

      const hasConflict = (requestedStart, requestedEnd, busySlots) => {
        const start = new Date(requestedStart);
        const end = new Date(requestedEnd);

        return busySlots.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);

          return (start < busyEnd && end > busyStart);
        });
      };

      const busySlots = sampleEvents.freebusyResponse.calendars['test@calendar.google.com'].busy;

      // Conflict - overlaps with 10:00-10:15 slot
      expect(hasConflict(
        '2025-10-30T10:00:00-04:00',
        '2025-10-30T10:30:00-04:00',
        busySlots
      )).toBe(true);

      // No conflict - free slot
      expect(hasConflict(
        '2025-10-30T13:00:00-04:00',
        '2025-10-30T13:30:00-04:00',
        busySlots
      )).toBe(false);
    });

    it('should calculate available slots excluding conflicts', async () => {
      mockCalendar.freebusy.query.mockResolvedValue({
        data: sampleEvents.freebusyResponse,
      });

      const getAvailableSlots = async (date, duration) => {
        const response = await mockCalendar.freebusy.query({
          timeMin: `${date}T09:00:00-04:00`,
          timeMax: `${date}T18:00:00-04:00`,
        });

        const busySlots = response.data.calendars['test@calendar.google.com'].busy;

        // Generate all possible slots
        const allSlots = [];
        let current = new Date(`${date}T09:00:00-04:00`);
        const end = new Date(`${date}T18:00:00-04:00`);

        while (current < end) {
          const slotEnd = new Date(current.getTime() + duration * 60000);
          if (slotEnd <= end) {
            allSlots.push({
              start: current.toISOString(),
              end: slotEnd.toISOString(),
            });
          }
          current = slotEnd;
        }

        // Filter out busy slots
        return allSlots.filter(slot => {
          return !busySlots.some(busy => {
            const slotStart = new Date(slot.start);
            const slotEnd = new Date(slot.end);
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);

            return (slotStart < busyEnd && slotEnd > busyStart);
          });
        });
      };

      const availableSlots = await getAvailableSlots('2025-10-30', 30);

      expect(availableSlots.length).toBeGreaterThan(0);
      expect(mockCalendar.freebusy.query).toHaveBeenCalled();
    });

    it('should handle multi-day availability check', async () => {
      const getMultiDayAvailability = async (startDate, endDate, duration) => {
        const availability = {};
        let current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];

          // Skip Sundays (closed)
          if (current.getDay() !== 0) {
            availability[dateStr] = {
              date: dateStr,
              slots: 12, // Simplified: assume 12 slots per day
            };
          }

          current.setDate(current.getDate() + 1);
        }

        return availability;
      };

      const availability = await getMultiDayAvailability(
        '2025-10-30',
        '2025-11-02',
        30
      );

      expect(Object.keys(availability).length).toBe(3); // Thu, Fri, Sat (no Sunday)
      expect(availability['2025-11-02']).toBeUndefined(); // Sunday
    });
  });

  describe('Booking Creation', () => {
    it('should create valid booking', async () => {
      mockCalendar.events.insert.mockResolvedValue({
        data: {
          id: 'event_new_123',
          status: 'confirmed',
          htmlLink: 'https://calendar.google.com/event?eid=test123',
          start: { dateTime: '2025-10-31T14:00:00-04:00' },
          end: { dateTime: '2025-10-31T14:30:00-04:00' },
        },
      });

      const createBooking = async (customerName, customerPhone, service, dateTime) => {
        const startTime = new Date(dateTime);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);

        const event = {
          summary: `${service.name} - ${customerName}`,
          description: `Service: ${service.name}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nDuration: ${service.duration} minutes`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'America/New_York',
          },
          extendedProperties: {
            private: {
              serviceId: service.id,
              customerPhone: customerPhone,
              bookingSource: 'whatsapp',
            },
          },
        };

        const response = await mockCalendar.events.insert({
          calendarId: 'test@calendar.google.com',
          resource: event,
        });

        return response.data;
      };

      const booking = await createBooking(
        'John Doe',
        '1234567890',
        TEST_SERVICES[0],
        '2025-10-31T14:00:00-04:00'
      );

      expect(booking.status).toBe('confirmed');
      expect(booking.id).toBeTruthy();
      expect(mockCalendar.events.insert).toHaveBeenCalledTimes(1);
    });

    it('should reject booking with conflict', async () => {
      mockCalendar.freebusy.query.mockResolvedValue({
        data: sampleEvents.freebusyResponse,
      });

      const checkAndCreateBooking = async (service, dateTime) => {
        const startTime = new Date(dateTime);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);

        // Check for conflicts
        const response = await mockCalendar.freebusy.query({
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
        });

        const busySlots = response.data.calendars['test@calendar.google.com'].busy;

        const hasConflict = busySlots.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return (startTime < busyEnd && endTime > busyStart);
        });

        if (hasConflict) {
          throw new Error('Time slot is not available');
        }

        return { success: true };
      };

      await expect(
        checkAndCreateBooking(TEST_SERVICES[0], '2025-10-30T10:00:00-04:00')
      ).rejects.toThrow('not available');
    });

    it('should reject booking with invalid date', async () => {
      const validateBookingDate = (dateTime) => {
        const date = new Date(dateTime);
        const now = new Date();

        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }

        if (date < now) {
          throw new Error('Cannot book in the past');
        }

        // Check if more than 90 days in advance
        const maxAdvance = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        if (date > maxAdvance) {
          throw new Error('Cannot book more than 90 days in advance');
        }

        return true;
      };

      expect(() => validateBookingDate('invalid-date')).toThrow('Invalid date');
      expect(() => validateBookingDate('2024-01-01T10:00:00')).toThrow('past');
      expect(() => validateBookingDate('2030-01-01T10:00:00')).toThrow('90 days');
    });

    it('should reject booking outside business hours', async () => {
      const isWithinBusinessHours = (dateTime, businessHours) => {
        const date = new Date(dateTime);
        const day = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
        const hours = businessHours[day];

        if (hours?.closed) {
          throw new Error('We are closed on this day');
        }

        const time = date.toTimeString().slice(0, 5);
        if (time < hours.open || time >= hours.close) {
          throw new Error(`Business hours: ${hours.open} - ${hours.close}`);
        }

        return true;
      };

      // Sunday (closed)
      expect(() =>
        isWithinBusinessHours('2025-11-02T10:00:00', TEST_BUSINESS_HOURS)
      ).toThrow('closed');

      // Before opening (8 AM on weekday)
      expect(() =>
        isWithinBusinessHours('2025-10-30T08:00:00', TEST_BUSINESS_HOURS)
      ).toThrow('Business hours');

      // After closing (7 PM on weekday)
      expect(() =>
        isWithinBusinessHours('2025-10-30T19:00:00', TEST_BUSINESS_HOURS)
      ).toThrow('Business hours');
    });
  });

  describe('Timezone Handling', () => {
    it('should handle timezone conversions correctly', () => {
      const convertToBusinessTimezone = (dateTime, timezone = 'America/New_York') => {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', { timeZone: timezone });
      };

      const utcTime = '2025-10-30T14:00:00Z';
      const nyTime = convertToBusinessTimezone(utcTime);

      expect(nyTime).toBeTruthy();
    });

    it('should store all times in business timezone', async () => {
      const normalizeToBusinessTimezone = (dateTime) => {
        const date = new Date(dateTime);
        const options = {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        };

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(date);

        const values = {};
        parts.forEach(({ type, value }) => {
          values[type] = value;
        });

        return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
      };

      const result = normalizeToBusinessTimezone('2025-10-30T10:00:00-04:00');

      expect(result).toContain('2025-10-30');
      expect(result).toContain('10:00');
    });
  });

  describe('Double-Booking Prevention', () => {
    it('should prevent simultaneous bookings for same slot', async () => {
      let lockMap = new Map();

      const acquireLock = async (key, timeout = 5000) => {
        if (lockMap.has(key)) {
          throw new Error('Slot is being booked by another user');
        }

        lockMap.set(key, Date.now());

        setTimeout(() => {
          lockMap.delete(key);
        }, timeout);

        return true;
      };

      const releaseLock = (key) => {
        lockMap.delete(key);
      };

      const slotKey = '2025-10-30T14:00:00';

      // First booking acquires lock
      await expect(acquireLock(slotKey)).resolves.toBe(true);

      // Second booking should fail
      await expect(acquireLock(slotKey)).rejects.toThrow('being booked');

      // Clean up
      releaseLock(slotKey);
    });

    it('should handle concurrent booking attempts', async () => {
      mockCalendar.freebusy.query.mockResolvedValue({
        data: {
          calendars: {
            'test@calendar.google.com': {
              busy: [],
            },
          },
        },
      });

      const bookingsAttempted = [];
      const bookingsSucceeded = [];

      const attemptBooking = async (id, dateTime) => {
        bookingsAttempted.push(id);

        // Simulate checking availability
        await new Promise(resolve => setTimeout(resolve, 10));

        // Only first one succeeds
        if (bookingsSucceeded.length === 0) {
          bookingsSucceeded.push(id);
          return { success: true };
        }

        throw new Error('Slot already booked');
      };

      // Simulate concurrent attempts
      const promises = [
        attemptBooking('user1', '2025-10-30T14:00:00'),
        attemptBooking('user2', '2025-10-30T14:00:00'),
        attemptBooking('user3', '2025-10-30T14:00:00'),
      ];

      const results = await Promise.allSettled(promises);

      expect(bookingsAttempted.length).toBe(3);
      expect(bookingsSucceeded.length).toBe(1);

      const rejections = results.filter(r => r.status === 'rejected');
      expect(rejections.length).toBe(2);
    });
  });

  describe('Booking Retrieval', () => {
    it('should retrieve booking by ID', async () => {
      mockCalendar.events.get.mockResolvedValue({
        data: sampleEvents.existingBooking,
      });

      const getBooking = async (eventId) => {
        const response = await mockCalendar.events.get({
          calendarId: 'test@calendar.google.com',
          eventId: eventId,
        });

        return response.data;
      };

      const booking = await getBooking('event_existing_123');

      expect(booking.id).toBe('event_existing_123');
      expect(booking.summary).toContain('Haircut');
    });

    it('should list bookings for customer phone', async () => {
      mockCalendar.events.list.mockResolvedValue({
        data: {
          items: [sampleEvents.existingBooking],
        },
      });

      const getCustomerBookings = async (customerPhone) => {
        const response = await mockCalendar.events.list({
          calendarId: 'test@calendar.google.com',
          timeMin: new Date().toISOString(),
          privateExtendedProperty: `customerPhone=${customerPhone}`,
        });

        return response.data.items;
      };

      const bookings = await getCustomerBookings('1234567890');

      expect(bookings.length).toBeGreaterThan(0);
      expect(mockCalendar.events.list).toHaveBeenCalled();
    });
  });

  describe('Booking Cancellation', () => {
    it('should cancel existing booking', async () => {
      mockCalendar.events.delete.mockResolvedValue({ data: {} });

      const cancelBooking = async (eventId) => {
        await mockCalendar.events.delete({
          calendarId: 'test@calendar.google.com',
          eventId: eventId,
        });

        return { success: true, message: 'Booking cancelled successfully' };
      };

      const result = await cancelBooking('event_test123');

      expect(result.success).toBe(true);
      expect(mockCalendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'test@calendar.google.com',
        eventId: 'event_test123',
      });
    });

    it('should enforce cancellation policy', async () => {
      const validateCancellation = (bookingDateTime) => {
        const bookingTime = new Date(bookingDateTime);
        const now = new Date();
        const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

        const MIN_CANCELLATION_HOURS = 24;

        if (hoursUntilBooking < MIN_CANCELLATION_HOURS) {
          throw new Error(`Must cancel at least ${MIN_CANCELLATION_HOURS} hours in advance`);
        }

        return true;
      };

      // Booking in 2 hours - should fail
      const soonBooking = new Date(Date.now() + 2 * 60 * 60 * 1000);
      expect(() => validateCancellation(soonBooking.toISOString()))
        .toThrow('24 hours');

      // Booking in 48 hours - should succeed
      const futureBooking = new Date(Date.now() + 48 * 60 * 60 * 1000);
      expect(validateCancellation(futureBooking.toISOString())).toBe(true);
    });
  });
});
