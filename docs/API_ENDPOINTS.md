# API Endpoints Documentation

Complete API reference for the WhatsApp Chatbot Barbershop Booking System.

---

## 1. WhatsApp Webhook Endpoint

### `GET /api/webhook/whatsapp`

**Purpose**: Webhook verification for WhatsApp Cloud API

**Query Parameters**:
- `hub.mode` (string, required): Must be "subscribe"
- `hub.verify_token` (string, required): Your custom verify token
- `hub.challenge` (string, required): Challenge string from WhatsApp

**Response**:
- `200 OK`: Returns the challenge string
- `403 Forbidden`: Invalid verify token

**Example**:
```bash
GET /api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

---

### `POST /api/webhook/whatsapp`

**Purpose**: Receive incoming WhatsApp messages

**Headers**:
- `X-Hub-Signature-256` (required): Webhook signature for verification
- `Content-Type: application/json`

**Request Body**:
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "phone_number_id": "1234567890"
        },
        "messages": [{
          "from": "1234567890",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Hola, necesito una cita"
          }
        }],
        "contacts": [{
          "profile": {
            "name": "John Doe"
          }
        }]
      }
    }]
  }]
}
```

**Response**:
- `200 OK`: Message received and processing
- `403 Forbidden`: Invalid signature
- `500 Internal Server Error`: Processing error

**Features**:
- Signature verification for security
- Handles text messages
- Gracefully declines non-text messages (images, videos, etc.)
- Marks messages as read
- Shows typing indicator
- Asynchronous processing (non-blocking)

---

## 2. Chat Processor Endpoint

### `POST /api/chat/process`

**Purpose**: Process user messages with AI and manage conversation context

**Headers**:
- `Content-Type: application/json`
- `X-Internal-Request` (optional): Internal API secret for security

**Request Body**:
```json
{
  "phoneNumber": "+1234567890",
  "message": "Quiero un corte de cabello mañana",
  "contactName": "John Doe"
}
```

**Response**:
```json
{
  "response": "¡Claro! Te puedo ayudar con eso. ¿A qué hora prefieres tu cita mañana?",
  "intent": "BOOK_APPOINTMENT",
  "extractedData": {
    "serviceId": "haircut",
    "serviceName": {
      "es": "Corte de pelo",
      "en": "Haircut"
    },
    "serviceDuration": 30,
    "date": "mañana"
  },
  "conversationId": "+1234567890"
}
```

**Status Codes**:
- `200 OK`: Message processed successfully
- `400 Bad Request`: Missing required fields
- `403 Forbidden`: Invalid internal secret
- `405 Method Not Allowed`: Only POST allowed
- `500 Internal Server Error`: Processing error

**Detected Intents**:
- `INFO_REQUEST`: User asking about services/prices
- `CHECK_AVAILABILITY`: User wants to see available times
- `BOOK_APPOINTMENT`: User ready to book (has date/time info)
- `CONFIRM_BOOKING`: User confirming appointment
- `CANCEL_MODIFY`: User wants to cancel/change appointment
- `GENERAL`: General conversation

**Features**:
- Multi-language support (Spanish/English auto-detection)
- Conversation history (last 10 messages)
- Intent detection
- Data extraction (service, date, time, name)
- Vercel KV storage with 24h TTL
- xAI Grok-4-fast integration

---

## 3. Calendar Availability Endpoint

### `GET /api/calendar/availability`

**Purpose**: Check available time slots for booking

**Query Parameters**:
- `date` (string, required): Date in YYYY-MM-DD format
- `serviceId` (string, optional): Service ID to get duration-specific slots
- `range` (boolean, optional): Set to "true" or "7" for 7-day range

**Single Day Example**:
```bash
GET /api/calendar/availability?date=2025-11-01&serviceId=haircut
```

**Response**:
```json
{
  "date": "2025-11-01",
  "serviceId": "haircut",
  "serviceDuration": 30,
  "timezone": "Europe/Madrid",
  "availableSlots": [
    {
      "time": "09:00",
      "dateTime": "2025-11-01T09:00:00.000Z",
      "available": true
    },
    {
      "time": "09:15",
      "dateTime": "2025-11-01T09:15:00.000Z",
      "available": true
    }
  ],
  "totalSlots": 24
}
```

**Multi-Day Range Example**:
```bash
GET /api/calendar/availability?date=2025-11-01&serviceId=haircut&range=true
```

**Response**:
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-07",
  "serviceDuration": 30,
  "timezone": "Europe/Madrid",
  "days": {
    "2025-11-01": {
      "date": "2025-11-01",
      "dayOfWeek": "Friday",
      "availableSlots": [...],
      "totalSlots": 24,
      "hasAvailability": true
    }
  }
}
```

**Status Codes**:
- `200 OK`: Slots returned successfully
- `400 Bad Request`: Invalid parameters
- `405 Method Not Allowed`: Only GET allowed
- `500 Internal Server Error`: Calendar API error

**Features**:
- Business hours enforcement
- Break time handling
- Existing appointment exclusion
- 10-minute buffer between appointments
- Minimum advance booking (2 hours default)
- Maximum advance booking (30 days default)
- Redis hold check (prevents race conditions)
- 15-minute slot intervals

---

## 4. Calendar Booking Endpoint

### `POST /api/calendar/book`

**Purpose**: Create a confirmed appointment

**Headers**:
- `Content-Type: application/json`

**Request Body**:
```json
{
  "phoneNumber": "+1234567890",
  "customerName": "John Doe",
  "serviceId": "haircut",
  "dateTime": "2025-11-01T10:00:00",
  "language": "es",
  "customerEmail": "john@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "✅ ¡Reserva confirmada!\n\nCliente: John Doe\nServicio: Corte de pelo\nFecha: viernes, 1 de noviembre de 2025\nHora: 10:00\nDuración: 30 minutos\nPrecio: 25EUR\n\nBarbería El Clásico\nCalle Gran Vía, 45\n+34912345678\n\n¡Te esperamos!",
  "booking": {
    "eventId": "abc123xyz",
    "eventLink": "https://calendar.google.com/event?eid=xxx",
    "serviceId": "haircut",
    "serviceName": "Corte de pelo",
    "dateTime": "2025-11-01T10:00:00.000Z",
    "duration": 30,
    "price": {
      "amount": 25,
      "currency": "EUR"
    },
    "customerName": "John Doe",
    "phoneNumber": "+1234567890",
    "status": "confirmed"
  }
}
```

**Status Codes**:
- `201 Created`: Booking successful
- `400 Bad Request`: Invalid or missing fields
- `405 Method Not Allowed`: Only POST allowed
- `409 Conflict`: Slot no longer available or held by another user
- `500 Internal Server Error`: Booking failed

**Validations**:
- Phone number format validation
- Customer name required
- Valid service ID
- Valid datetime format (ISO 8601)
- Not in the past
- Meets minimum advance hours
- Within advance booking window

**Features**:
- Race condition prevention (5-minute Redis hold)
- Double-checks availability before booking
- Creates Google Calendar event
- Email attendee (optional)
- 1-hour reminder notification
- Saves to booking history
- Multi-language confirmation messages

---

## 5. Calendar Cancellation Endpoint (Optional)

### `POST /api/calendar/cancel`

**Purpose**: Cancel existing appointments

**Headers**:
- `Content-Type: application/json`

**Request Body (with eventId)**:
```json
{
  "phoneNumber": "+1234567890",
  "eventId": "abc123xyz",
  "language": "es"
}
```

**Request Body (list appointments)**:
```json
{
  "phoneNumber": "+1234567890",
  "language": "es"
}
```

**Response (successful cancellation)**:
```json
{
  "success": true,
  "message": "✅ Tu cita ha sido cancelada exitosamente.",
  "eventId": "abc123xyz"
}
```

**Response (list appointments)**:
```json
{
  "message": "Se encontraron citas próximas. Por favor proporciona el eventId para cancelar una específica.",
  "appointments": [
    {
      "eventId": "abc123",
      "summary": "Corte de pelo - John Doe",
      "dateTime": "2025-11-01T10:00:00.000Z",
      "description": "Cliente: John Doe\nTeléfono: +1234567890"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Cancellation successful or appointments listed
- `400 Bad Request`: Missing phone number
- `404 Not Found`: No appointments found
- `405 Method Not Allowed`: Only POST/DELETE allowed
- `500 Internal Server Error`: Cancellation failed

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message (development only)"
}
```

Common error codes:
- `400`: Bad Request - Invalid parameters
- `403`: Forbidden - Authentication/verification failed
- `404`: Not Found - Resource doesn't exist
- `405`: Method Not Allowed - Wrong HTTP method
- `409`: Conflict - Resource conflict (e.g., booking collision)
- `500`: Internal Server Error - Server-side error

---

## Rate Limiting

Recommended rate limits (implement via Vercel or middleware):
- Webhook: 100 requests/minute per phone number
- Chat processor: 30 requests/minute per phone number
- Availability: 60 requests/minute
- Booking: 10 requests/minute per phone number

---

## Security

All endpoints implement:
- Input validation
- Signature verification (webhook)
- Internal secret verification (optional)
- SQL injection prevention
- XSS prevention
- CORS configuration
- Environment variable protection

---

## Testing with cURL

### Test availability
```bash
curl "https://your-app.vercel.app/api/calendar/availability?date=2025-11-01&serviceId=haircut"
```

### Test chat processing
```bash
curl -X POST https://your-app.vercel.app/api/chat/process \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Necesito un corte",
    "contactName": "Test"
  }'
```

### Test booking
```bash
curl -X POST https://your-app.vercel.app/api/calendar/book \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "customerName": "Test User",
    "serviceId": "haircut",
    "dateTime": "2025-11-01T10:00:00",
    "language": "es"
  }'
```

---

## Integration Flow

```
WhatsApp User Message
    ↓
[1] POST /api/webhook/whatsapp (receives message)
    ↓
[2] POST /api/chat/process (AI processes message)
    ↓ (if checking availability)
[3] GET /api/calendar/availability
    ↓ (if booking)
[4] POST /api/calendar/book
    ↓
WhatsApp sends confirmation to user
```

---

## Monitoring

Key metrics to track:
- Webhook success rate
- Chat processing latency
- Booking success rate
- Calendar API errors
- Redis connection health
- AI model response time

---

## Support

For technical issues:
- Check Vercel logs: `vercel logs --follow`
- Review environment variables
- Verify API credentials
- Test endpoints individually
- Check external service status
