# System Architecture

## Table of Contents
- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Diagram](#component-diagram)
- [Data Flow](#data-flow)
- [Integration Points](#integration-points)
- [Session Management](#session-management)
- [Security Architecture](#security-architecture)
- [Scalability](#scalability)
- [Technology Stack](#technology-stack)

## Overview

The WhatsApp Chatbot Barbershop Booking System is a serverless, event-driven application that enables customers to book appointments through WhatsApp conversations. The system integrates multiple cloud services to provide a seamless booking experience.

**Key Characteristics:**
- **Serverless:** Runs on Vercel Edge Functions
- **Event-Driven:** Responds to WhatsApp webhooks
- **Stateful:** Session management via Redis
- **Multi-Language:** English and Spanish support
- **Real-Time:** Instant booking confirmation

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CUSTOMER LAYER                           │
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │  WhatsApp    │         │   Google     │                      │
│  │  Messenger   │         │  Calendar    │                      │
│  └──────┬───────┘         └──────▲───────┘                     │
└─────────┼────────────────────────┼──────────────────────────────┘
          │                        │
          │ HTTPS                  │ Calendar API
          │ Webhook                │ (Service Account)
          │                        │
┌─────────▼────────────────────────┼──────────────────────────────┐
│                    APPLICATION LAYER                             │
│                    (Vercel Serverless)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                 API Gateway Layer                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │    │
│  │  │   Webhook    │  │   Calendar   │  │   Health    │  │    │
│  │  │  /api/webhook│  │   /api/cal   │  │ /api/health │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  └─────────────┘  │    │
│  └─────────┼──────────────────┼───────────────────────────┘    │
│            │                  │                                 │
│  ┌─────────▼──────────────────▼───────────────────────────┐    │
│  │              Business Logic Layer                       │    │
│  │  ┌─────────────────┐  ┌──────────────────────────┐    │    │
│  │  │ Message Handler │  │  Booking Manager         │    │    │
│  │  │ - Parse input   │  │  - Validate availability │    │    │
│  │  │ - Route request │  │  - Create/cancel booking │    │    │
│  │  │ - Format reply  │  │  - Manage conflicts      │    │    │
│  │  └────────┬────────┘  └───────────┬──────────────┘    │    │
│  └───────────┼───────────────────────┼────────────────────┘    │
│              │                       │                          │
│  ┌───────────▼───────────────────────▼────────────────────┐    │
│  │              Service Integration Layer                  │    │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────┐   │    │
│  │  │ WhatsApp   │  │  Calendar   │  │   Session    │   │    │
│  │  │  Service   │  │   Service   │  │   Manager    │   │    │
│  │  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘   │    │
│  └────────┼─────────────────┼─────────────────┼───────────┘    │
└───────────┼─────────────────┼─────────────────┼────────────────┘
            │                 │                 │
            │ Meta API        │ Google API      │ KV API
            │                 │                 │
┌───────────▼─────────────────▼─────────────────▼────────────────┐
│                     EXTERNAL SERVICES                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Meta       │  │   Google     │  │   Vercel     │         │
│  │   WhatsApp   │  │   Calendar   │  │     KV       │         │
│  │     API      │  │     API      │  │   (Redis)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              xAI (Grok)                               │      │
│  │              AI Conversation Engine                   │      │
│  └──────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

## Component Diagram

### 1. Webhook Handler
**Location:** `/api/webhook/index.ts`

**Responsibilities:**
- Receive WhatsApp webhook events
- Verify webhook signatures
- Extract message content
- Validate request format
- Route to message handler

**Inputs:**
- WhatsApp webhook payload
- Signature header

**Outputs:**
- 200 OK response
- Message routing event

**Error Handling:**
- Invalid signature: 403 Forbidden
- Malformed payload: 400 Bad Request
- Processing error: 500, but return 200 to Meta

### 2. Message Handler
**Location:** `/src/handlers/messageHandler.ts`

**Responsibilities:**
- Parse user message intent
- Maintain conversation context
- Call AI service for response generation
- Format WhatsApp replies
- Handle multi-language

**Flow:**
```
Message In
    ↓
Load Session (Redis)
    ↓
Extract Intent
    ↓
Route to Handler:
    ├─ Greeting → Welcome message
    ├─ Service Inquiry → List services
    ├─ Availability Check → Query calendar
    ├─ Booking Request → Create booking
    ├─ Cancel Request → Cancel booking
    └─ Unknown → AI fallback
    ↓
Format Response
    ↓
Save Session (Redis)
    ↓
Send WhatsApp Message
```

**Intent Detection:**
- Keyword matching (fast path)
- AI classification (fallback)
- Context-aware routing

### 3. Booking Manager
**Location:** `/src/services/bookingService.ts`

**Responsibilities:**
- Validate booking requests
- Check calendar availability
- Create calendar events
- Handle conflicts
- Send confirmations
- Manage cancellations

**Booking State Machine:**
```
[Request Received]
    ↓
[Validate Input]
    ├─ Invalid → [Reject with Error]
    └─ Valid ↓
[Check Availability]
    ├─ Unavailable → [Suggest Alternatives]
    └─ Available ↓
[Create Event]
    ├─ API Error → [Retry Logic]
    └─ Success ↓
[Send Confirmation]
    ↓
[Update Session]
    ↓
[Complete]
```

### 4. Calendar Service
**Location:** `/src/services/calendarService.ts`

**Responsibilities:**
- Authenticate with Google
- Query available slots
- Create/update/delete events
- Handle timezone conversion
- Manage service account

**Operations:**
- `getAvailability(date, duration)`: Returns free slots
- `createEvent(booking)`: Creates calendar event
- `deleteEvent(eventId)`: Cancels appointment
- `getEvent(eventId)`: Retrieves booking details

**Caching Strategy:**
- Cache availability for 5 minutes
- Invalidate on booking/cancellation
- Use Redis for distributed cache

### 5. WhatsApp Service
**Location:** `/src/services/whatsappService.ts`

**Responsibilities:**
- Send text messages
- Send interactive messages (buttons, lists)
- Format message templates
- Handle media (future)
- Rate limit management

**Message Types:**
```typescript
// Text message
sendTextMessage(to, text)

// Button message
sendButtonMessage(to, text, buttons[])

// List message
sendListMessage(to, text, sections[])

// Template message
sendTemplate(to, templateName, parameters)
```

### 6. AI Service
**Location:** `/src/services/aiService.ts`

**Responsibilities:**
- Generate conversational responses
- Extract intent from natural language
- Multi-language support
- Context-aware replies
- Fallback handling

**Prompt Engineering:**
```
System Prompt:
- You are a barbershop booking assistant
- Available services: [list]
- Business hours: [hours]
- Current date/time: [timestamp]
- Customer language: [en/es]
- Conversation history: [context]

User Message: [user input]

Expected Response:
- Intent: [greeting|inquiry|booking|cancel|unknown]
- Reply: [assistant message]
- Action: [none|show_services|check_availability|create_booking]
```

### 7. Session Manager
**Location:** `/src/services/sessionService.ts`

**Responsibilities:**
- Store conversation state
- Track booking attempts
- Manage user preferences
- Handle session expiry
- Provide context to AI

**Session Schema:**
```typescript
interface Session {
  phoneNumber: string;
  language: 'en' | 'es';
  conversationHistory: Message[];
  pendingBooking?: {
    service: string;
    date?: string;
    time?: string;
    confirmed: boolean;
  };
  lastActiveAt: timestamp;
  createdAt: timestamp;
}
```

**TTL:** 24 hours of inactivity

## Data Flow

### Incoming Message Flow

```
1. Customer sends WhatsApp message
   └─> Meta receives and forwards to webhook

2. Webhook receives POST request
   └─> Verifies signature
   └─> Extracts message data
   └─> Returns 200 OK immediately

3. Message Handler processes asynchronously
   └─> Loads session from Redis
   └─> Detects intent
   └─> Routes to appropriate handler

4. Handler executes business logic
   ├─> Service Inquiry: Fetches services from config
   ├─> Availability: Queries Google Calendar
   └─> Booking: Creates calendar event

5. Response generation
   └─> Formats reply based on language
   └─> Includes interactive elements (buttons)

6. WhatsApp Service sends reply
   └─> Calls Meta API
   └─> Handles rate limits

7. Session update
   └─> Saves conversation to Redis
   └─> Updates last active timestamp
```

### Booking Creation Flow

```
1. User: "Book haircut tomorrow at 2pm"

2. Intent Detection: BOOKING_REQUEST
   └─> Extract: service=haircut, date=tomorrow, time=14:00

3. Validation
   ├─> Service exists? ✓
   ├─> Date is future? ✓
   ├─> Time in business hours? ✓
   └─> All required fields? ✓

4. Availability Check
   └─> Query Google Calendar for date
   └─> Check 14:00-14:30 slot
   └─> Result: Available ✓

5. Create Calendar Event
   ├─> Summary: "Haircut - John Doe"
   ├─> Start: 2025-10-30T14:00:00-04:00
   ├─> End: 2025-10-30T14:30:00-04:00
   ├─> Description: Phone, service details
   └─> Result: Event ID = evt_abc123

6. Send Confirmation
   └─> "Confirmed! Your haircut is booked for Oct 30 at 2:00 PM"
   └─> Include cancellation button

7. Update Session
   └─> Add booking to conversation history
   └─> Store event ID for future reference
```

## Integration Points

### 1. Meta WhatsApp API
**Endpoint:** `https://graph.facebook.com/v18.0`

**Authentication:** Bearer token

**Key Operations:**
- `POST /{phone_number_id}/messages`: Send message
- Webhook: Receive messages

**Rate Limits:**
- 1000 messages/day (test number)
- Unlimited (approved production)
- 80 requests/second per app

**Retry Strategy:**
- Exponential backoff
- Max 3 retries
- Store failed messages in queue

### 2. Google Calendar API
**Endpoint:** `https://www.googleapis.com/calendar/v3`

**Authentication:** Service Account (OAuth 2.0)

**Key Operations:**
- `GET /calendars/{id}/events`: List events
- `POST /calendars/{id}/events`: Create event
- `DELETE /calendars/{id}/events/{eventId}`: Delete event

**Quotas:**
- 1,000,000 requests/day
- 10 queries/second/user

**Error Handling:**
- 409 Conflict: Double booking detected
- 401 Unauthorized: Refresh credentials
- 403 Forbidden: Check calendar sharing

### 3. xAI Grok API
**Endpoint:** `https://api.x.ai/v1`

**Authentication:** API key

**Model:** `grok-beta`

**Key Operations:**
- `POST /chat/completions`: Generate response

**Cost:**
- $0.001 per request (approx)
- Context: 128K tokens
- Output: 4K tokens max

**Optimization:**
- Cache common responses
- Batch requests when possible
- Use streaming for long responses

### 4. Vercel KV (Redis)
**Type:** Serverless Redis

**Authentication:** REST API token

**Key Operations:**
- `SET session:{phone}`: Store session
- `GET session:{phone}`: Retrieve session
- `EXPIRE session:{phone}`: Set TTL
- `DEL session:{phone}`: Delete session

**Data Structure:**
```
session:{phone} → JSON string (Session object)
availability:{date} → JSON string (Available slots)
booking:{eventId} → JSON string (Booking details)
```

**TTL:**
- Sessions: 24 hours
- Availability cache: 5 minutes
- Bookings: 7 days after appointment

## Session Management

### Session Lifecycle

```
[First Message]
    ↓
Create Session
    ├─ Generate session ID
    ├─ Detect language
    ├─ Initialize empty history
    └─ Store in Redis
    ↓
[Conversation Active]
    ↓
Update Session (every message)
    ├─ Append to history
    ├─ Update pending booking
    ├─ Refresh TTL
    └─> Store in Redis
    ↓
[24h Inactivity or Manual End]
    ↓
Expire Session
    └─ Redis auto-deletes
    ↓
[User Returns]
    ↓
Create New Session
```

### Context Window Management

**Conversation History:**
- Keep last 10 messages
- Truncate older messages
- Preserve critical info (booking details)

**Example:**
```javascript
// Keep only essential context
const context = {
  recentMessages: session.history.slice(-10),
  pendingBooking: session.pendingBooking,
  userPreferences: {
    language: session.language,
    preferredServices: []
  }
};
```

## Security Architecture

### 1. Webhook Security
**Threat:** Unauthorized webhook calls

**Mitigation:**
- HMAC-SHA256 signature verification
- Timing-safe comparison
- Reject unsigned requests

### 2. Authentication
**Threat:** Unauthorized API access

**Mitigation:**
- Service account for Google Calendar
- API key rotation (90 days)
- Environment variable protection
- No secrets in code

### 3. Data Privacy
**Threat:** Customer data exposure

**Mitigation:**
- Encrypt data at rest (Redis TLS)
- Encrypt data in transit (HTTPS only)
- No PII in logs
- GDPR compliance:
  - Data retention: 7 days
  - Right to deletion
  - Consent management

### 4. Rate Limiting
**Threat:** API abuse

**Mitigation:**
- Per-user rate limits
- Per-IP rate limits
- Exponential backoff
- DDoS protection (Vercel)

### 5. Input Validation
**Threat:** Injection attacks

**Mitigation:**
- Validate all inputs
- Sanitize user messages
- Parameterized queries
- Content Security Policy

## Scalability

### Current Architecture
- **Capacity:** 1000 conversations/day
- **Latency:** <2 seconds per message
- **Availability:** 99.9% uptime

### Scaling Strategy

**Horizontal Scaling:**
- Serverless functions auto-scale
- No server management required
- Pay per execution

**Vertical Optimization:**
- Cache frequently accessed data
- Batch API requests
- Optimize database queries
- Use CDN for static assets

**Bottleneck Analysis:**

| Component | Bottleneck | Mitigation |
|-----------|------------|------------|
| WhatsApp API | 80 req/s | Queue + retry |
| Google Calendar | 10 req/s | Cache availability |
| AI Service | Cost | Cache responses |
| Redis | Memory | TTL + cleanup |

### Future Scaling (>10k conversations/day)

1. **Add Message Queue:**
   - Use Redis Queue or SQS
   - Decouple webhook from processing
   - Retry failed messages

2. **Implement Caching Layer:**
   - Cache service catalog
   - Cache availability for 5 minutes
   - Cache AI responses for common queries

3. **Database Migration:**
   - Move from Redis to PostgreSQL
   - Long-term booking storage
   - Analytics data warehouse

4. **Multi-Region Deployment:**
   - Deploy to multiple regions
   - Route based on phone number
   - Replicate data across regions

## Technology Stack

### Frontend (WhatsApp)
- **Interface:** WhatsApp Messenger
- **Platform:** Meta WhatsApp Business API
- **Features:** Text, buttons, lists, media

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Next.js (API routes) or Express
- **Language:** TypeScript
- **Hosting:** Vercel (serverless)

### Data Layer
- **Session Store:** Vercel KV (Redis)
- **Calendar:** Google Calendar
- **Future:** PostgreSQL for analytics

### External Services
- **Messaging:** Meta WhatsApp Business API
- **AI:** xAI Grok
- **Calendar:** Google Calendar API
- **Hosting:** Vercel

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** Vercel Git integration
- **Monitoring:** Vercel Analytics
- **Logging:** Vercel Logs
- **Alerts:** Vercel Notifications

## Cost Breakdown

**Monthly Costs (1000 messages/month):**

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Hosting | $0-20 | Free tier: 100GB bandwidth |
| Vercel KV | $0-10 | Free tier: 256MB storage |
| Meta WhatsApp | Free | Test number; $0 for approved |
| Google Calendar | Free | Within free quota |
| xAI Grok | $5-20 | ~$0.001 per request |
| **Total** | **$5-50/mo** | Scales with usage |

**Enterprise Scale (10k messages/month):**
- Vercel: $20-50
- KV: $10-20
- WhatsApp: Free (approved)
- Calendar: Free
- xAI: $20-50
- **Total:** $50-120/month

## Performance Characteristics

**Metrics:**
- **Response Time:** <2 seconds (p95)
- **Availability:** 99.9% (SLA)
- **Error Rate:** <0.1%
- **Throughput:** 100 messages/minute

**Monitoring:**
- Vercel Analytics: Page load times
- Custom metrics: Response latency
- Error tracking: Sentry integration
- Uptime: Vercel status page

## Disaster Recovery

**Backup Strategy:**
- Calendar: Google maintains backups
- Sessions: Redis persistence enabled
- Code: Git version control
- Environment: Infrastructure as code

**Recovery Procedures:**
1. **Service outage:** Automatic failover (Vercel)
2. **Data loss:** Restore from Redis persistence
3. **API key compromise:** Rotate immediately
4. **Code bug:** Rollback deployment

**RTO/RPO:**
- Recovery Time Objective: <5 minutes
- Recovery Point Objective: <1 hour

## Future Enhancements

**Planned Features:**
1. **Multi-barbershop support:** Separate calendars per location
2. **Barber selection:** Customer chooses preferred barber
3. **Payment integration:** Stripe for deposits
4. **Reminder system:** 24h before appointment
5. **Analytics dashboard:** Booking metrics
6. **Review system:** Post-appointment feedback

**Technical Improvements:**
1. **GraphQL API:** More flexible data fetching
2. **WebSocket:** Real-time updates
3. **Mobile app:** Native iOS/Android
4. **Voice messages:** Transcription + response
5. **Image support:** Send location, portfolios

## References

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)
- [Vercel Platform Documentation](https://vercel.com/docs)
- [xAI API Documentation](https://console.x.ai/docs)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
