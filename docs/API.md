# API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Webhook Verification](#webhook-verification)
  - [Receive Messages](#receive-messages)
  - [Calendar Availability](#calendar-availability)
  - [Create Booking](#create-booking)
  - [Cancel Booking](#cancel-booking)
  - [Health Check](#health-check)
- [Data Models](#data-models)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Webhook Security](#webhook-security)

## Overview

The WhatsApp Chatbot API provides endpoints for:
- Receiving and processing WhatsApp messages
- Managing calendar availability
- Creating and canceling appointments
- Health monitoring

**Base URL:** `https://your-project.vercel.app`

**API Version:** v1

**Response Format:** JSON

## Authentication

### WhatsApp Webhook Authentication

WhatsApp webhooks use **signature verification** for security.

**Verification Process:**
1. Meta sends webhook with `X-Hub-Signature-256` header
2. Server computes HMAC-SHA256 of payload using app secret
3. Signatures are compared
4. Request rejected if signatures don't match

**Required Headers:**
```
X-Hub-Signature-256: sha256=<signature>
Content-Type: application/json
```

### Internal API Authentication

For internal endpoints (calendar, bookings):

**Method:** Bearer Token

**Header:**
```
Authorization: Bearer YOUR_API_KEY
```

**Environment Variable:** `API_SECRET_KEY`

## Endpoints

### Webhook Verification

Verifies webhook URL during Meta setup.

**Endpoint:** `GET /api/webhook`

**Purpose:** WhatsApp webhook verification

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hub.mode | string | Yes | Must be "subscribe" |
| hub.verify_token | string | Yes | Verification token from Meta setup |
| hub.challenge | string | Yes | Random string to echo back |

**Success Response:**
```
HTTP/1.1 200 OK
Content-Type: text/plain

<hub.challenge value>
```

**Error Response:**
```json
HTTP/1.1 403 Forbidden
{
  "error": "Verification failed"
}
```

**Example Request:**
```bash
curl "https://your-project.vercel.app/api/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=1234567890"
```

**Example Response:**
```
1234567890
```

### Receive Messages

Processes incoming WhatsApp messages.

**Endpoint:** `POST /api/webhook`

**Purpose:** Handle incoming WhatsApp messages and events

**Headers:**
```
Content-Type: application/json
X-Hub-Signature-256: sha256=<signature>
```

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "John Doe"
                },
                "wa_id": "15551234567"
              }
            ],
            "messages": [
              {
                "from": "15551234567",
                "id": "wamid.XXX",
                "timestamp": "1234567890",
                "text": {
                  "body": "Hello"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Success Response:**
```json
HTTP/1.1 200 OK
{
  "success": true,
  "messageId": "wamid.XXX"
}
```

**Error Response:**
```json
HTTP/1.1 400 Bad Request
{
  "error": "Invalid message format",
  "details": "Missing required field: messages"
}
```

**Message Types Supported:**
- `text`: Regular text messages
- `button`: Button reply
- `list`: List selection

### Calendar Availability

Gets available time slots for booking.

**Endpoint:** `GET /api/calendar/availability`

**Purpose:** Check available appointment slots

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Date in ISO format (YYYY-MM-DD) |
| service | string | No | Service type (haircut, shave, etc.) |
| duration | number | No | Duration in minutes (default: 30) |

**Request Headers:**
```
Authorization: Bearer YOUR_API_KEY
```

**Success Response:**
```json
HTTP/1.1 200 OK
{
  "date": "2025-10-30",
  "availableSlots": [
    {
      "start": "09:00",
      "end": "09:30",
      "available": true
    },
    {
      "start": "09:30",
      "end": "10:00",
      "available": true
    },
    {
      "start": "10:00",
      "end": "10:30",
      "available": false
    }
  ],
  "businessHours": {
    "start": "09:00",
    "end": "18:00"
  }
}
```

**Error Response:**
```json
HTTP/1.1 400 Bad Request
{
  "error": "Invalid date format",
  "message": "Date must be in YYYY-MM-DD format"
}
```

**Example Request:**
```bash
curl -X GET "https://your-project.vercel.app/api/calendar/availability?date=2025-10-30&service=haircut" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Create Booking

Creates a new appointment in calendar.

**Endpoint:** `POST /api/calendar/book`

**Purpose:** Book a new appointment

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerPhone": "+15551234567",
  "service": "haircut",
  "date": "2025-10-30",
  "startTime": "14:00",
  "duration": 30,
  "notes": "First time customer"
}
```

**Field Validation:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| customerName | string | Yes | 2-100 characters |
| customerPhone | string | Yes | Valid E.164 format |
| service | string | Yes | Must be valid service type |
| date | string | Yes | ISO format, future date |
| startTime | string | Yes | HH:MM format, within business hours |
| duration | number | Yes | 15-120 minutes |
| notes | string | No | Max 500 characters |

**Success Response:**
```json
HTTP/1.1 201 Created
{
  "success": true,
  "booking": {
    "id": "evt_abc123xyz",
    "customerName": "John Doe",
    "customerPhone": "+15551234567",
    "service": "haircut",
    "date": "2025-10-30",
    "startTime": "14:00",
    "endTime": "14:30",
    "status": "confirmed",
    "calendarLink": "https://calendar.google.com/event?eid=..."
  },
  "message": "Appointment booked successfully"
}
```

**Error Responses:**

```json
HTTP/1.1 409 Conflict
{
  "error": "Time slot not available",
  "message": "The selected time slot is already booked",
  "availableSlots": ["14:30", "15:00", "15:30"]
}
```

```json
HTTP/1.1 400 Bad Request
{
  "error": "Validation error",
  "message": "Invalid time slot",
  "details": {
    "startTime": "Time must be within business hours (09:00-18:00)"
  }
}
```

**Example Request:**
```bash
curl -X POST "https://your-project.vercel.app/api/calendar/book" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "+15551234567",
    "service": "haircut",
    "date": "2025-10-30",
    "startTime": "14:00",
    "duration": 30
  }'
```

### Cancel Booking

Cancels an existing appointment.

**Endpoint:** `DELETE /api/calendar/book/:bookingId`

**Purpose:** Cancel a confirmed appointment

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| bookingId | string | Yes | Calendar event ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Customer phone for verification |

**Request Headers:**
```
Authorization: Bearer YOUR_API_KEY
```

**Success Response:**
```json
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "booking": {
    "id": "evt_abc123xyz",
    "status": "cancelled",
    "cancelledAt": "2025-10-29T10:30:00Z"
  }
}
```

**Error Responses:**

```json
HTTP/1.1 404 Not Found
{
  "error": "Booking not found",
  "message": "No booking found with the provided ID"
}
```

```json
HTTP/1.1 403 Forbidden
{
  "error": "Unauthorized",
  "message": "Phone number does not match booking"
}
```

**Example Request:**
```bash
curl -X DELETE "https://your-project.vercel.app/api/calendar/book/evt_abc123xyz?phone=%2B15551234567" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Health Check

Checks API and service health.

**Endpoint:** `GET /api/health`

**Purpose:** Monitor system health

**Success Response:**
```json
HTTP/1.1 200 OK
{
  "status": "healthy",
  "timestamp": "2025-10-29T10:30:00Z",
  "services": {
    "whatsapp": {
      "status": "connected",
      "lastMessageAt": "2025-10-29T10:25:00Z"
    },
    "calendar": {
      "status": "connected",
      "lastSyncAt": "2025-10-29T10:29:00Z"
    },
    "ai": {
      "status": "connected",
      "model": "grok-beta"
    },
    "redis": {
      "status": "connected",
      "sessions": 15
    }
  },
  "version": "1.0.0"
}
```

**Degraded Response:**
```json
HTTP/1.1 503 Service Unavailable
{
  "status": "degraded",
  "timestamp": "2025-10-29T10:30:00Z",
  "services": {
    "whatsapp": {
      "status": "connected"
    },
    "calendar": {
      "status": "error",
      "error": "Authentication failed"
    },
    "ai": {
      "status": "connected"
    },
    "redis": {
      "status": "connected"
    }
  }
}
```

**Example Request:**
```bash
curl "https://your-project.vercel.app/api/health"
```

## Data Models

### Message Object

```typescript
interface WhatsAppMessage {
  from: string;           // Sender phone number
  id: string;             // Message ID
  timestamp: string;      // Unix timestamp
  type: 'text' | 'button' | 'list';
  text?: {
    body: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  list?: {
    id: string;
    title: string;
  };
}
```

### Booking Object

```typescript
interface Booking {
  id: string;             // Calendar event ID
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:MM
  endTime: string;        // HH:MM
  duration: number;       // minutes
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;      // ISO timestamp
  calendarLink: string;
}
```

### Service Object

```typescript
interface Service {
  id: string;
  name: string;
  nameEs: string;         // Spanish name
  duration: number;       // minutes
  price: number;          // USD
  description: string;
  descriptionEs: string;
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (time slot taken) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Dependent service unavailable |

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  },
  "code": "ERROR_CODE",
  "timestamp": "2025-10-29T10:30:00Z"
}
```

## Rate Limiting

**Limits:**
- Webhook: No limit (managed by Meta)
- Calendar API: 60 requests/minute per IP
- Booking API: 20 bookings/hour per phone number
- Health: 10 requests/minute per IP

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1635511200
```

**Rate Limit Response:**
```json
HTTP/1.1 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

## Webhook Security

### Signature Verification

**Algorithm:** HMAC-SHA256

**Process:**
1. Get signature from `X-Hub-Signature-256` header
2. Extract signature (remove "sha256=" prefix)
3. Compute HMAC of raw body using app secret
4. Compare signatures using timing-safe comparison

**Code Example:**
```javascript
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}
```

### IP Allowlist (Optional)

Meta's webhook IPs:
- `173.252.88.0/24`
- `173.252.120.0/24`
- `31.13.64.0/19`

## Testing

### Test Webhook Locally

```bash
# Send test webhook
curl -X POST "http://localhost:3000/api/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "15551234567",
            "text": {"body": "Hello"},
            "type": "text"
          }]
        }
      }]
    }]
  }'
```

### Test Calendar API

```bash
# Check availability
curl "http://localhost:3000/api/calendar/availability?date=2025-10-30"

# Create booking
curl -X POST "http://localhost:3000/api/calendar/book" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "+15551234567",
    "service": "haircut",
    "date": "2025-10-30",
    "startTime": "14:00",
    "duration": 30
  }'
```

## Additional Resources

- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/api/messages)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Webhook Best Practices](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
