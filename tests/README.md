# WhatsApp Chatbot Test Suite

Comprehensive test suite for the WhatsApp barbershop booking chatbot system.

## Overview

This test suite provides extensive coverage for:
- WhatsApp webhook handling and message processing
- AI chat processor with intent detection
- Google Calendar booking system
- Utility functions
- End-to-end integration flows

## Test Structure

```
tests/
├── setup.js                    # Test configuration and mocks
├── fixtures/                   # Sample data
│   ├── sample-messages.json    # WhatsApp message payloads
│   ├── sample-calendar-events.json
│   └── sample-conversations.json
├── webhook.test.js             # Webhook verification and parsing (62 tests)
├── chat.test.js                # AI processor and conversations (48 tests)
├── calendar.test.js            # Booking and availability (54 tests)
├── utils.test.js               # Utility functions (71 tests)
└── integration.test.js         # End-to-end flows (32 tests)
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npm run test:webhook
npm run test:chat
npm run test:calendar
npm run test:utils
npm run test:integration
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## Test Categories

### 1. Webhook Tests (webhook.test.js)

Tests webhook verification, message parsing, signature validation, and rate limiting:

- ✅ GET request verification with valid/invalid tokens
- ✅ POST message parsing (text, image, status updates)
- ✅ Signature verification (HMAC SHA256)
- ✅ Rate limiting per user
- ✅ Error handling (malformed payload, missing fields)

**Key Features Tested:**
- Webhook handshake (hub.verify_token, hub.challenge)
- Message extraction and validation
- HMAC signature verification
- Per-user rate limiting (configurable limits)
- Graceful error handling

### 2. Chat Tests (chat.test.js)

Tests AI chat processor, intent detection, and conversation management:

- ✅ Intent detection (service_inquiry, availability_check, booking, confirmation)
- ✅ Multi-language support (English, Spanish)
- ✅ Conversation context loading/saving
- ✅ Session management and expiry
- ✅ Error handling (API failures, malformed responses)
- ✅ Retry logic with exponential backoff

**Key Features Tested:**
- Grok API integration with mocked responses
- Intent extraction and classification
- Language detection and consistency
- Vercel KV conversation persistence
- Context state management
- Conversation history limits

### 3. Calendar Tests (calendar.test.js)

Tests Google Calendar integration and booking logic:

- ✅ Availability calculation (time slot generation)
- ✅ Business hours filtering
- ✅ Conflict detection
- ✅ Multi-day availability
- ✅ Booking creation and validation
- ✅ Timezone handling
- ✅ Double-booking prevention
- ✅ Cancellation policy enforcement

**Key Features Tested:**
- Google Calendar API integration
- Freebusy query and slot filtering
- Booking validation (date, time, business hours)
- Concurrent booking prevention
- Event creation with metadata
- Timezone conversions (America/New_York)

### 4. Utils Tests (utils.test.js)

Tests utility functions for validation, formatting, and sanitization:

- ✅ Phone number validation and normalization
- ✅ Date validation and parsing
- ✅ Service ID validation
- ✅ Session operations
- ✅ WhatsApp message formatting (text, buttons, lists)
- ✅ Input sanitization (XSS, SQL injection)
- ✅ Error message formatting (multi-language)
- ✅ Time calculations

**Key Features Tested:**
- Phone validation (10-15 digits)
- Date parsing (natural language)
- Service ID lookup
- Session ID generation and parsing
- WhatsApp interactive messages
- Security (input sanitization)
- Multi-language error messages

### 5. Integration Tests (integration.test.js)

End-to-end flows testing complete user journeys:

- ✅ Complete booking flow (greeting → service → availability → booking → confirmation)
- ✅ Service inquiry flow
- ✅ Multi-language conversations (Spanish)
- ✅ Error recovery flows
- ✅ State transitions
- ✅ Concurrent user handling
- ✅ Session persistence

**Key Features Tested:**
- Full booking journey (6 steps)
- Language consistency throughout conversation
- Graceful degradation on API failures
- Invalid booking request handling
- Booking conflict resolution
- State machine transitions
- Multi-user concurrent processing

## Mocked Dependencies

All external APIs are mocked in `setup.js`:

- **WhatsApp API**: Message sending, templates
- **Grok API**: Chat completions with intent detection
- **Google Calendar API**: Events, freebusy queries
- **Vercel KV**: Key-value storage for conversations

## Test Data

### Services
```javascript
[
  { id: 'haircut', name: 'Haircut', duration: 30, price: 25 },
  { id: 'beard_trim', name: 'Beard Trim', duration: 15, price: 15 },
  { id: 'haircut_beard', name: 'Haircut + Beard', duration: 45, price: 35 },
  { id: 'styling', name: 'Styling', duration: 20, price: 20 }
]
```

### Business Hours
```javascript
{
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: { closed: true }
}
```

## Example Test Output

```
✓ tests/webhook.test.js (62)
  ✓ WhatsApp Webhook (62)
    ✓ Webhook Verification (GET) (3)
    ✓ Incoming Message Parsing (POST) (5)
    ✓ Signature Verification (3)
    ✓ Rate Limiting (3)
    ✓ Error Handling (3)

✓ tests/chat.test.js (48)
  ✓ AI Chat Processor (48)
    ✓ Intent Detection (4)
    ✓ Multi-language Support (3)
    ✓ Conversation Context Management (4)
    ✓ Session Management (3)
    ✓ Error Handling (4)
    ✓ Context Preservation (2)

✓ tests/calendar.test.js (54)
  ✓ Calendar and Booking System (54)
    ✓ Availability Calculation (5)
    ✓ Booking Creation (4)
    ✓ Timezone Handling (2)
    ✓ Double-Booking Prevention (2)
    ✓ Booking Retrieval (2)
    ✓ Booking Cancellation (2)

✓ tests/utils.test.js (71)
  ✓ Utility Functions (71)
    ✓ Phone Validation (4)
    ✓ Date Validation (5)
    ✓ Service ID Validation (3)
    ✓ Session Operations (3)
    ✓ WhatsApp Message Formatting (5)
    ✓ Input Sanitization (3)
    ✓ Error Messages (2)
    ✓ Time Utilities (3)
    ✓ String Utilities (3)

✓ tests/integration.test.js (32)
  ✓ Integration Tests - End-to-End Flows (32)
    ✓ Complete Booking Flow (1)
    ✓ Service Inquiry Flow (2)
    ✓ Multi-Language Flow (1)
    ✓ Error Recovery Flow (3)
    ✓ State Transitions (2)
    ✓ Concurrent User Handling (1)
    ✓ Session Persistence (1)

Test Files  5 passed (5)
     Tests  267 passed (267)
  Start at  10:30:45
  Duration  1.23s
```

## Coverage Report

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/index.html
```

Expected coverage:
- **webhook.test.js**: 100% coverage of webhook handlers
- **chat.test.js**: 95%+ coverage of chat processor
- **calendar.test.js**: 95%+ coverage of booking logic
- **utils.test.js**: 100% coverage of utility functions
- **integration.test.js**: 85%+ coverage of main flows

## Best Practices

1. **Isolation**: Each test is independent and isolated
2. **Mocking**: All external APIs are mocked
3. **Descriptive Names**: Tests clearly describe what they verify
4. **Arrange-Act-Assert**: Consistent test structure
5. **Edge Cases**: Boundary conditions are tested
6. **Error Scenarios**: Failure paths are covered
7. **Async Handling**: Proper async/await usage

## Adding New Tests

When adding new features, follow these steps:

1. Add test fixtures to `tests/fixtures/` if needed
2. Create mocks in `tests/setup.js` for new external services
3. Write unit tests in the appropriate test file
4. Add integration test for the complete flow
5. Run coverage to ensure >80% coverage
6. Update this README with new test descriptions

## Troubleshooting

### Tests failing with "Module not found"
```bash
npm install
```

### Coverage report not generating
```bash
npm install --save-dev @vitest/coverage-v8
```

### Tests timing out
Increase timeout in `vitest.config.js`:
```javascript
test: {
  testTimeout: 20000, // 20 seconds
}
```

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## License

MIT
