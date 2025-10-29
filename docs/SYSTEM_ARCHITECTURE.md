# System Architecture

Visual representation of the WhatsApp Chatbot Barbershop Booking System.

---

## 🏗 High-Level Architecture

```
┌─────────────────┐
│   WhatsApp      │
│     User        │
└────────┬────────┘
         │
         │ Sends Message
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Cloud API                       │
│                  (Meta Infrastructure)                      │
└────────┬────────────────────────────────────────────────────┘
         │
         │ POST Webhook
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Platform                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         /api/webhook/whatsapp.js                     │  │
│  │  • Verify signature                                  │  │
│  │  • Extract message                                   │  │
│  │  • Return 200 OK immediately                         │  │
│  │  • Process async                                     │  │
│  └─────────────────┬────────────────────────────────────┘  │
│                    │                                        │
│                    │ Calls                                  │
│                    ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         /api/chat/process.js                         │  │
│  │  • Load conversation context                         │  │
│  │  • Call xAI Grok-4-fast                             │  │
│  │  • Detect intent                                     │  │
│  │  • Extract data                                      │  │
│  │  • Save to KV                                        │  │
│  └─────┬────────────────────────────────┬───────────────┘  │
│        │                                │                   │
│        │ If checking availability       │ If booking        │
│        ▼                                ▼                   │
│  ┌─────────────────────┐    ┌──────────────────────────┐  │
│  │ /api/calendar/      │    │ /api/calendar/book.js    │  │
│  │  availability.js    │    │ • Validate inputs        │  │
│  │ • Check business    │    │ • Create Redis hold      │  │
│  │   hours             │    │ • Double-check slot      │  │
│  │ • Get calendar      │    │ • Create event           │  │
│  │   events            │    │ • Save to history        │  │
│  │ • Calculate slots   │    │ • Send confirmation      │  │
│  │ • Check holds       │    │ • Release hold           │  │
│  └─────────────────────┘    └──────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │   xAI    │        │  Vercel  │        │  Google  │
   │  Grok-4  │        │    KV    │        │ Calendar │
   │   API    │        │ (Redis)  │        │   API    │
   └──────────┘        └──────────┘        └──────────┘
```

---

## 🔄 Data Flow Diagram

### Message Processing Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER SENDS MESSAGE                                        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. WHATSAPP WEBHOOK (GET verification / POST message)       │
│    • Verify signature with HMAC-SHA256                      │
│    • Extract: phone, name, message, messageId               │
│    • Mark as read                                            │
│    • Show typing indicator                                   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. CHAT PROCESSOR                                            │
│    a. Load Context from Redis                                │
│       - Get conversation history                             │
│       - Get user preferences                                 │
│       - Get language preference                              │
│                                                              │
│    b. Build System Prompt                                    │
│       - Add services catalog                                 │
│       - Add business hours                                   │
│       - Add current date/time                                │
│       - Add instructions                                     │
│                                                              │
│    c. Call xAI Grok-4-fast                                  │
│       - Send conversation history (last 10 msgs)            │
│       - Get AI response                                      │
│                                                              │
│    d. Process Response                                       │
│       - Detect intent                                        │
│       - Extract structured data                              │
│       - Save conversation to Redis                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
            ┌─────────────┴──────────────┐
            │                            │
            ▼                            ▼
┌───────────────────────┐    ┌──────────────────────────┐
│ 4a. CHECK AVAILABILITY│    │ 4b. CREATE BOOKING       │
│                       │    │                          │
│ • Parse date from AI  │    │ • Validate all inputs    │
│ • Get service details │    │ • Check not in past      │
│ • Query business hrs  │    │ • Check min advance      │
│ • Get calendar events │    │ • Create Redis hold      │
│ • Calculate free      │    │   (5 min TTL)            │
│   slots (15 min)      │    │ • Verify availability    │
│ • Exclude held slots  │    │ • Create calendar event  │
│ • Add 10-min buffer   │    │ • Add 1-hour reminder    │
│ • Return available    │    │ • Save to booking        │
│   times               │    │   history                │
│                       │    │ • Release hold           │
│                       │    │ • Generate confirmation  │
└───────────────────────┘    └──────────────────────────┘
            │                            │
            └─────────────┬──────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. SEND RESPONSE TO USER                                     │
│    • Format message (with markdown if needed)                │
│    • Send via WhatsApp Cloud API                             │
│    • Log success/failure                                     │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. USER RECEIVES MESSAGE                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗂 Database/Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel KV (Redis)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  conversation:{phoneNumber}                                  │
│  ├── phoneNumber: string                                    │
│  ├── contactName: string                                    │
│  ├── language: "es" | "en"                                  │
│  ├── messages: [                                            │
│  │     { role, content, timestamp }                         │
│  │   ]                                                      │
│  ├── metadata: {                                            │
│  │     lastIntent, extractedData, ...                       │
│  │   }                                                      │
│  ├── createdAt: ISO timestamp                               │
│  └── lastMessageAt: ISO timestamp                           │
│  TTL: 24 hours                                              │
│                                                              │
│  hold:{dateTime}                                            │
│  └── phoneNumber: string                                    │
│  TTL: 5 minutes                                             │
│                                                              │
│  bookings:{phoneNumber}                                     │
│  └── [                                                      │
│        { eventId, serviceId, dateTime, status, ... }        │
│      ]                                                      │
│  TTL: 1 year                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Google Calendar                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Calendar Event                                              │
│  ├── id: string (Google generated)                          │
│  ├── summary: "Service - Customer Name"                     │
│  ├── description: "Customer: ...\nPhone: ..."               │
│  ├── start: { dateTime, timeZone }                          │
│  ├── end: { dateTime, timeZone }                            │
│  ├── attendees: [{ email }] (optional)                      │
│  ├── reminders: { overrides: [60 min popup] }               │
│  └── status: "confirmed"                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Transport Security                                │
│  • HTTPS/TLS encryption                                     │
│  • Vercel edge network                                      │
│                                                              │
│  Layer 2: Authentication                                    │
│  • WhatsApp webhook signature (HMAC-SHA256)                 │
│  • Google service account OAuth2                            │
│  • xAI API key authentication                               │
│                                                              │
│  Layer 3: Input Validation                                  │
│  • Phone number format                                      │
│  • Date/time validation                                     │
│  • Service ID validation                                    │
│  • SQL injection prevention                                 │
│  • XSS prevention                                           │
│                                                              │
│  Layer 4: Rate Limiting                                     │
│  • Per-phone-number limits                                  │
│  • Per-endpoint limits                                      │
│  • Redis-based tracking                                     │
│                                                              │
│  Layer 5: Error Handling                                    │
│  • Sanitized error messages                                 │
│  • No sensitive data in logs                                │
│  • Graceful degradation                                     │
│                                                              │
│  Layer 6: Access Control                                    │
│  • Environment variables                                    │
│  • Internal API secrets                                     │
│  • Least privilege principle                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (WhatsApp)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  API Layer (Vercel)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Webhook    │→ │     Chat     │→ │   Calendar      │  │
│  │   Handler    │  │  Processor   │  │   Operations    │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
┌───────────▼──────┐ ┌─────▼──────┐ ┌─────▼────────┐
│  Utilities       │ │  Config    │ │  External    │
│                  │ │            │ │  Services    │
│ • whatsapp.js    │ │ • barber-  │ │              │
│ • kv.js          │ │   shop.json│ │ • xAI Grok   │
│ • calendar.js    │ │            │ │ • Google Cal │
│                  │ │            │ │ • Vercel KV  │
└──────────────────┘ └────────────┘ └──────────────┘
```

---

## 📊 Scalability Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                   Scalability Strategy                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Horizontal Scaling                                          │
│  • Vercel serverless functions (auto-scale)                 │
│  • No server state (stateless design)                       │
│  • Redis for distributed state                              │
│                                                              │
│  Performance Optimization                                    │
│  • Async message processing                                 │
│  • 200 OK response within 20 seconds                        │
│  • Redis caching for conversations                          │
│  • Efficient calendar API queries                           │
│                                                              │
│  Load Distribution                                           │
│  • Edge network (Vercel)                                    │
│  • CDN for static assets                                    │
│  • Database connection pooling                              │
│                                                              │
│  Failure Handling                                            │
│  • Retry logic for API calls                                │
│  • Exponential backoff                                      │
│  • Circuit breakers                                         │
│  • Graceful degradation                                     │
│                                                              │
│  Monitoring                                                  │
│  • Vercel Analytics                                         │
│  • Error tracking (Sentry optional)                         │
│  • Custom metrics via logging                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    State Flow                                │
└─────────────────────────────────────────────────────────────┘

User Message
    ↓
┌─────────────────────┐
│ 1. Load State       │ ← Redis: conversation:{phone}
│    from Redis       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 2. Process with AI  │ → xAI Grok-4-fast
│    (stateless)      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 3. Update State     │ → Redis: conversation:{phone}
│    in Redis         │   (append message, update metadata)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 4. If Booking:      │
│    Create Hold      │ → Redis: hold:{dateTime}
└─────────┬───────────┘   (5-minute TTL)
          │
          ▼
┌─────────────────────┐
│ 5. Create Event     │ → Google Calendar
│    in Calendar      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 6. Save to History  │ → Redis: bookings:{phone}
└─────────┬───────────┘   (1-year TTL)
          │
          ▼
┌─────────────────────┐
│ 7. Release Hold     │ → Redis: delete hold:{dateTime}
└─────────────────────┘
```

---

## 🌐 Multi-Language Support

```
┌─────────────────────────────────────────────────────────────┐
│               Language Detection & Switching                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Detection Phase (First Message)                            │
│  • Analyze keywords (hola, hello, buenos, good)             │
│  • Count Spanish vs English words                           │
│  • Default to Spanish if unclear                            │
│  • Save to conversation context                             │
│                                                              │
│  AI Prompt Phase                                             │
│  • System prompt in detected language                       │
│  • Services catalog in both languages                       │
│  • Business hours in both languages                         │
│  • AI responds in appropriate language                      │
│                                                              │
│  Response Phase                                              │
│  • Confirmation messages in user's language                 │
│  • Calendar event summary in user's language                │
│  • Error messages in user's language                        │
│                                                              │
│  Supported Languages                                         │
│  • Spanish (es) - Default                                   │
│  • English (en)                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration Management

```
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Sources                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Environment Variables (Secrets)                         │
│     • API keys                                              │
│     • Tokens                                                │
│     • Service account credentials                           │
│     Source: Vercel Environment Variables                    │
│                                                              │
│  2. Business Configuration (Static)                         │
│     • Services catalog                                      │
│     • Business hours                                        │
│     • Pricing                                               │
│     • Staff info                                            │
│     Source: /src/config/barbershop.json                     │
│                                                              │
│  3. Runtime State (Dynamic)                                 │
│     • Conversations                                         │
│     • Booking holds                                         │
│     • User history                                          │
│     Source: Vercel KV (Redis)                               │
│                                                              │
│  4. External State (Calendar)                               │
│     • Booked appointments                                   │
│     • Event details                                         │
│     Source: Google Calendar                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Monitoring & Logging

```
┌─────────────────────────────────────────────────────────────┐
│                    Logging Strategy                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: Request Logging                                   │
│  • Incoming webhook requests                                │
│  • Message ID, phone number, timestamp                      │
│  • Response status codes                                    │
│                                                              │
│  Level 2: Processing Logging                                │
│  • AI model calls (latency, tokens used)                    │
│  • Intent detection results                                 │
│  • Data extraction results                                  │
│                                                              │
│  Level 3: Integration Logging                               │
│  • Calendar API calls                                       │
│  • Redis operations                                         │
│  • External API failures                                    │
│                                                              │
│  Level 4: Business Metrics                                  │
│  • Bookings created                                         │
│  • Availability checks                                      │
│  • Conversation flows                                       │
│  • User engagement                                          │
│                                                              │
│  Level 5: Error Tracking                                    │
│  • Exceptions with stack traces                             │
│  • Failed API calls                                         │
│  • Validation errors                                        │
│  • Security violations                                      │
│                                                              │
│  Tools:                                                      │
│  • Vercel Logs (built-in)                                   │
│  • Sentry (optional, for production)                        │
│  • Custom analytics via KV                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Deployment Topology                         │
└─────────────────────────────────────────────────────────────┘

Developer Machine
    ↓
    │ git push / vercel deploy
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Platform                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Build Phase                                           │ │
│  │  • Install dependencies                                │ │
│  │  • Run type checking (if TS)                           │ │
│  │  • Create serverless functions                         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Deploy Phase                                          │ │
│  │  • Deploy to edge network                              │ │
│  │  • Configure environment variables                     │ │
│  │  • Set up KV storage                                   │ │
│  │  • Generate production URL                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                  Global Edge Network                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   USA    │  │  Europe  │  │   Asia   │  │   Other  │   │
│  │   Edge   │  │   Edge   │  │   Edge   │  │  Regions │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
    ↓
End Users (WhatsApp)
```

---

**This architecture supports**:
- ✅ High availability
- ✅ Auto-scaling
- ✅ Global distribution
- ✅ Fault tolerance
- ✅ Security
- ✅ Performance
- ✅ Maintainability
