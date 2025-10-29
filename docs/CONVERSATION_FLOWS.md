# Conversation Flow Examples

## Table of Contents
- [Overview](#overview)
- [Basic Flows](#basic-flows)
  - [Greeting Flow (English)](#greeting-flow-english)
  - [Service Inquiry Flow (English)](#service-inquiry-flow-english)
  - [Complete Booking Flow (Spanish)](#complete-booking-flow-spanish)
- [Advanced Flows](#advanced-flows)
  - [Availability Check](#availability-check)
  - [Booking Modification](#booking-modification)
  - [Booking Cancellation](#booking-cancellation)
- [Error Handling](#error-handling)
- [Multi-Language Switching](#multi-language-switching)
- [Edge Cases](#edge-cases)

## Overview

This document provides real-world conversation examples to illustrate how the chatbot handles various customer interactions. Each flow includes:

- Customer messages
- Bot responses
- System actions
- Session state changes

**Legend:**
- `Customer:` User message
- `Bot:` System response
- `[Action]` Backend operation
- `[State]` Session state change

## Basic Flows

### Greeting Flow (English)

**Scenario:** First-time customer initiates conversation

```
Customer: Hello

[Action] Create new session
[State] language: en, history: []

Bot: Hello! 👋 Welcome to Premium Barbershop!

I can help you with:
• View our services and prices
• Check available appointments
• Book an appointment
• Manage your existing bookings

How can I assist you today?

---

[State] history: ["Hello", "Welcome message"]
```

**Alternative Greetings:**
- "Hi"
- "Hey"
- "Good morning"
- "Hola" (triggers Spanish)

---

### Service Inquiry Flow (English)

**Scenario:** Customer wants to know available services

```
Customer: What services do you offer?

[Action] Load services from config

Bot: Here are our services:

💇 **Haircut**
• Duration: 30 minutes
• Price: $25
• Classic or modern styles

✂️ **Beard Trim**
• Duration: 15 minutes
• Price: $15
• Shape and style

💇✂️ **Haircut + Beard**
• Duration: 45 minutes
• Price: $35
• Complete grooming

🪒 **Hot Shave**
• Duration: 30 minutes
• Price: $30
• Traditional straight razor

Would you like to book an appointment?

[Yes] [Check Availability]

---

[State] Conversation context updated
```

**Alternative Questions:**
- "How much is a haircut?"
- "What do you have?"
- "Services"
- "Price list"

---

### Complete Booking Flow (Spanish)

**Scenario:** Spanish-speaking customer books haircut

```
Customer: Hola

[Action] Detect language: Spanish
[State] language: es

Bot: ¡Hola! 👋 Bienvenido a Premium Barbershop

¿En qué puedo ayudarte hoy?

• Ver servicios y precios
• Consultar disponibilidad
• Reservar una cita
• Gestionar tu reserva

---

Customer: Quiero un corte de pelo

[Action] Detect intent: BOOKING_REQUEST
[Action] Extract: service=haircut

Bot: Perfecto! ¿Para qué día te gustaría agendar tu corte de pelo?

Puedes decirme:
• "Mañana"
• "Este viernes"
• Una fecha específica (ej: "30 de octubre")

---

Customer: Mañana

[Action] Parse: date = 2025-10-30 (tomorrow)
[Action] Query calendar availability

Bot: Estas son las horas disponibles para mañana (30 de octubre):

🕘 9:00 AM
🕙 10:00 AM
🕐 1:00 PM
🕑 2:00 PM
🕔 5:00 PM

¿Qué hora prefieres?

---

Customer: 2 PM

[Action] Parse: time = 14:00
[State] pendingBooking: {service: haircut, date: 2025-10-30, time: 14:00}

Bot: Perfecto! Déjame confirmar los detalles:

📅 **Servicio:** Corte de pelo
📆 **Fecha:** Miércoles, 30 de octubre
🕐 **Hora:** 2:00 PM
⏱️ **Duración:** 30 minutos
💵 **Precio:** $25

¿Confirmas esta reserva?

[Sí, confirmar] [No, cambiar]

---

Customer: Sí, confirmar

[Action] Create Google Calendar event
[Action] Event ID: evt_abc123xyz
[Action] Send confirmation

Bot: ✅ ¡Reserva confirmada!

**Detalles de tu cita:**
👤 Cliente: +1 555-123-4567
💇 Servicio: Corte de pelo
📅 Fecha: Miércoles, 30 de octubre 2025
🕐 Hora: 2:00 PM - 2:30 PM
📍 Ubicación: Premium Barbershop

Te esperamos! Si necesitas cancelar, avísame con al menos 2 horas de anticipación.

[Cancelar cita] [Ver servicios]

---

[State] Booking completed
[State] Session updated with booking reference
```

**Translation Notes:**
- All date/time formatted according to locale
- Currency symbols adapted ($ vs €)
- Casual tone maintained in Spanish

---

## Advanced Flows

### Availability Check

**Scenario:** Customer checks multiple dates

```
Customer: What times are available this week?

[Action] Query calendar for next 7 days

Bot: Here's our availability this week:

**Wednesday, Oct 30**
✅ 9:00 AM, 10:00 AM, 1:00 PM, 2:00 PM, 5:00 PM

**Thursday, Oct 31**
✅ 9:00 AM, 11:00 AM, 3:00 PM, 4:00 PM

**Friday, Nov 1**
❌ Fully booked

**Saturday, Nov 2**
✅ 10:00 AM, 11:00 AM, 12:00 PM

Which day works best for you?

---

Customer: Do you have anything earlier on Wednesday?

[Action] Re-query for specific date

Bot: The earliest available slot on Wednesday, Oct 30 is:

🕘 **9:00 AM** - Available

Would you like to book this time?

[Yes, book 9 AM] [See other times]

---

Customer: Yes, book 9 AM

[Action] Initiate booking flow
[State] pendingBooking: {date: 2025-10-30, time: 09:00}

Bot: Great! What service would you like?

💇 Haircut ($25, 30min)
✂️ Beard Trim ($15, 15min)
💇✂️ Haircut + Beard ($35, 45min)
🪒 Hot Shave ($30, 30min)

---
```

---

### Booking Modification

**Scenario:** Customer wants to change appointment time

```
Customer: I need to change my appointment

[Action] Look up customer's bookings in calendar
[Action] Found: Haircut on Oct 30 at 2:00 PM

Bot: I found your upcoming appointment:

📅 **Current Booking:**
• Service: Haircut
• Date: Wednesday, Oct 30
• Time: 2:00 PM

What would you like to change?

[Change date] [Change time] [Cancel appointment]

---

Customer: [Clicks: Change time]

Bot: What time would you prefer instead?

Available times on Oct 30:
🕘 9:00 AM
🕙 10:00 AM
🕐 1:00 PM
🕔 5:00 PM

(Your current time: 2:00 PM)

---

Customer: 10 AM

[Action] Check if 10:00 AM is still available
[Action] Available: Yes

Bot: Perfect! I can move your appointment to 10:00 AM.

📅 **New Time:**
• Service: Haircut
• Date: Wednesday, Oct 30
• Time: 10:00 AM (changed from 2:00 PM)

Confirm this change?

[Yes, confirm] [No, keep original]

---

Customer: [Clicks: Yes, confirm]

[Action] Update Google Calendar event
[Action] Update event ID: evt_abc123xyz

Bot: ✅ Your appointment has been updated!

**Updated Details:**
💇 Haircut
📅 Wednesday, Oct 30, 2025
🕙 10:00 AM - 10:30 AM

See you then!
```

---

### Booking Cancellation

**Scenario:** Customer cancels appointment

```
Customer: I need to cancel my appointment

[Action] Look up bookings for phone number
[Action] Found: Haircut on Oct 30 at 2:00 PM

Bot: I found your upcoming appointment:

📅 **Booking to Cancel:**
• Service: Haircut
• Date: Wednesday, Oct 30
• Time: 2:00 PM

Are you sure you want to cancel this appointment?

[Yes, cancel it] [No, keep it]

---

Customer: [Clicks: Yes, cancel it]

[Action] Delete Google Calendar event
[Action] Event ID: evt_abc123xyz deleted
[Action] Clear booking from session

Bot: ✅ Your appointment has been cancelled.

**Cancelled Booking:**
💇 Haircut
📅 Wednesday, Oct 30
🕐 2:00 PM

Would you like to book a different time?

[Yes, book new time] [No, thank you]

---

Customer: No, thank you

Bot: No problem! Feel free to reach out whenever you need an appointment.

Have a great day! 👋
```

**Cancellation Policy Notes:**
- Customers should cancel 2+ hours in advance
- Bot can enforce cancellation policies
- Late cancellation warnings can be added

---

## Error Handling

### Time Slot Conflict

**Scenario:** Slot becomes unavailable during booking

```
Customer: Book haircut for tomorrow at 2 PM

[Action] Check availability
[Action] 2:00 PM shows available

Bot: Perfect! Let me confirm...

[Action] Create event
[Error] 409 Conflict - Slot just booked by another customer

Bot: I'm sorry, but someone just booked that time slot while we were talking!

Here are other available times tomorrow:

🕐 1:00 PM
🕑 2:30 PM
🕔 5:00 PM

Would any of these work for you?

---
```

---

### Invalid Date Input

**Scenario:** Customer provides unclear date

```
Customer: Book me for next week Tuesday

[Action] Parse "next week Tuesday"
[Error] Ambiguous - two Tuesdays in next 14 days

Bot: I want to make sure I book the right day. Did you mean:

📅 Tuesday, November 5, 2025
📅 Tuesday, November 12, 2025

Please select one:

[Nov 5] [Nov 12]

---
```

---

### Business Hours Violation

**Scenario:** Customer requests time outside hours

```
Customer: Can I book for 8 PM tomorrow?

[Action] Validate time: 20:00
[Error] Outside business hours (9 AM - 6 PM)

Bot: I'm sorry, but we're closed at 8:00 PM.

Our business hours are:
🕘 Monday-Friday: 9:00 AM - 6:00 PM
🕘 Saturday: 10:00 AM - 4:00 PM
❌ Sunday: Closed

The latest appointment time is 5:30 PM for a 30-minute service.

Would you like to book an earlier time tomorrow?

---
```

---

### Calendar API Error

**Scenario:** Google Calendar temporarily unavailable

```
Customer: Check availability for Friday

[Action] Query Google Calendar
[Error] 503 Service Unavailable
[Action] Retry after 2 seconds
[Error] 503 Service Unavailable again

Bot: I'm having trouble accessing the calendar right now. Please try again in a few minutes.

If you need immediate assistance, please call us at (555) 123-4567.

Sorry for the inconvenience! 🙏

---
```

---

## Multi-Language Switching

### English to Spanish

```
Customer: Hello

[State] language: en

Bot: Hello! 👋 Welcome to Premium Barbershop!

How can I help you today?

---

Customer: Español

[Action] Detect language switch
[State] language: es

Bot: ¡Perfecto! Cambiando a español.

¿En qué puedo ayudarte hoy?

• Ver servicios
• Consultar disponibilidad
• Reservar cita
• Gestionar reserva

---
```

---

### Spanish to English

```
Customer: Hola

[State] language: es

Bot: ¡Hola! 👋 Bienvenido a Premium Barbershop

---

Customer: English please

[Action] Detect language switch
[State] language: en

Bot: Switching to English.

How can I assist you today?

• View services
• Check availability
• Book appointment
• Manage booking

---
```

---

### Mixed Language Handling

```
Customer: Hola, do you have availability mañana?

[Action] Detect mixed languages
[Action] Primary language: Spanish (first word)
[State] language: es

Bot: ¡Hola! Sí, tengo disponibilidad para mañana.

¿Prefieres que continuemos en español o inglés?

[Español] [English]

---
```

---

## Edge Cases

### Duplicate Booking Attempt

**Scenario:** Customer tries to book while having active booking

```
Customer: Book a haircut for tomorrow at 3 PM

[Action] Check customer's existing bookings
[Action] Found: Haircut on Oct 30 at 2:00 PM

Bot: I see you already have an appointment:

📅 **Existing Booking:**
• Haircut on Oct 30 at 2:00 PM

Would you like to:

[Keep existing] [Change to 3 PM] [Book additional]

---

Customer: [Clicks: Book additional]

[Action] Verify not same day
[Error] Same day booking detected

Bot: We can only accommodate one appointment per day per customer.

Would you like to:
• Change your 2:00 PM appointment to 3:00 PM
• Book for a different day

---
```

---

### Past Date Request

**Scenario:** Customer tries to book in the past

```
Customer: Book me for yesterday

[Action] Parse: date = Oct 28 (yesterday)
[Error] Date is in the past

Bot: I can't book appointments in the past. 😊

Would you like to book for:
• Today (Oct 29)
• Tomorrow (Oct 30)
• Another future date

---
```

---

### Partial Information

**Scenario:** Customer provides incomplete details

```
Customer: I want an appointment

[Action] Missing: service, date, time

Bot: I'd be happy to help you book an appointment!

To get started, what service would you like?

💇 Haircut
✂️ Beard Trim
💇✂️ Haircut + Beard
🪒 Hot Shave

---

Customer: Haircut

[State] pendingBooking.service = "haircut"
[Action] Still missing: date, time

Bot: Great choice! When would you like to come in?

You can say:
• "Tomorrow"
• "This Friday"
• A specific date

---

Customer: Not sure, what's available?

[Action] Show next 7 days availability

Bot: Here's what's available this week:

[Shows availability list...]

---
```

---

### Unrealistic Expectations

**Scenario:** Customer requests immediate appointment

```
Customer: Can I come in 10 minutes?

[Action] Check: Current time = 2:45 PM
[Action] Next available = 3:00 PM (15 min away)

Bot: Our next available slot is at 3:00 PM (in 15 minutes).

Would that work for you?

[Yes, book 3 PM] [See other times]

---

Customer: [Clicks: Yes, book 3 PM]

Bot: ⚠️ Quick reminder: Please arrive on time at 3:00 PM as we have other appointments scheduled after yours.

Confirm booking?

[Yes, I'll be there] [No, choose different time]

---
```

---

### Very Long Message

**Scenario:** Customer sends multiple requests at once

```
Customer: Hi I need to book a haircut but I also want to know your prices and can you tell me if you're open on Sundays and also I want to cancel my old appointment if I have one and book for Friday at 2pm thanks

[Action] AI parses multiple intents:
  1. Booking request (haircut, Friday, 2 PM)
  2. Price inquiry
  3. Hours inquiry (Sunday)
  4. Cancellation check

Bot: Thanks for your message! Let me help with everything:

**1. Prices:**
• Haircut: $25 (30 min)
• Beard Trim: $15 (15 min)
• Haircut + Beard: $35 (45 min)
• Hot Shave: $30 (30 min)

**2. Sunday Hours:**
We're closed on Sundays. Open Mon-Sat.

**3. Your Bookings:**
I don't see any upcoming appointments for you.

**4. Friday 2 PM:**
That time is available! Would you like to book it?

[Yes, book Friday 2 PM] [Check other times]

---
```

---

### System Fallback

**Scenario:** Bot doesn't understand request

```
Customer: Do you have parking?

[Action] AI tries to classify intent
[Action] No matching intent found
[Action] Fallback to general info

Bot: I'm not sure about parking details.

For questions about parking, location, or other general inquiries, please call us at (555) 123-4567.

I can help you with:
• Viewing services and prices
• Checking availability
• Booking appointments
• Managing your bookings

What would you like to do?

---
```

---

## Best Practices for Conversations

**For Developers:**

1. **Keep responses concise:** Max 3-4 lines of text
2. **Use visual elements:** Emojis for quick scanning
3. **Provide clear options:** Buttons for common actions
4. **Validate early:** Check constraints before booking
5. **Confirm explicitly:** Always summarize before confirming
6. **Handle errors gracefully:** Offer alternatives
7. **Maintain context:** Reference previous messages
8. **Support both languages:** Seamless switching

**For Users:**

1. **Be specific:** "Haircut tomorrow at 2pm" vs "I need a cut"
2. **Use buttons:** Faster than typing
3. **Confirm carefully:** Review details before confirming
4. **Cancel in advance:** 2+ hours notice preferred
5. **One request at a time:** Better accuracy

---

## Testing Conversation Flows

**Test Cases:**

```bash
# Happy path: Complete booking
Test 1: "Book haircut for tomorrow at 2pm"
Expected: Booking created successfully

# Error path: Unavailable time
Test 2: "Book for midnight"
Expected: Business hours error

# Edge case: Language switch
Test 3: "Hello" → "Español" → "Book"
Expected: Spanish responses after switch

# Complex: Multi-step booking
Test 4: "What services?" → "Haircut" → "Tomorrow" → "2pm" → "Confirm"
Expected: Complete flow works

# Cancellation
Test 5: "Cancel my appointment"
Expected: Shows booking and cancels
```

---

## Additional Resources

- [CONFIGURATION.md](./CONFIGURATION.md) - Customize services and messages
- [API.md](./API.md) - Technical API details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Debug conversation issues
