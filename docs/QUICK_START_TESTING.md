# Quick Start Guide - Testing

## Installation

```bash
cd /Users/alexsolecarretero/Public/projects/upwork/chatbot
npm install
```

## Run Tests

### All Tests
```bash
npm test
```

### With Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (re-run on file changes)
```bash
npm run test:watch
```

### Interactive UI
```bash
npm run test:ui
```

## Individual Test Suites

```bash
# Webhook tests (62 tests)
npm run test:webhook

# Chat AI tests (48 tests)
npm run test:chat

# Calendar booking tests (54 tests)
npm run test:calendar

# Utils tests (71 tests)
npm run test:utils

# Integration tests (32 tests)
npm run test:integration
```

## View Coverage Report

```bash
npm run test:coverage
open coverage/index.html
```

## Test File Locations

```
/tests
├── setup.js                           # Test configuration
├── webhook.test.js                    # 62 webhook tests
├── chat.test.js                       # 48 AI chat tests
├── calendar.test.js                   # 54 booking tests
├── utils.test.js                      # 71 utility tests
├── integration.test.js                # 32 integration tests
└── fixtures/
    ├── sample-messages.json           # WhatsApp payloads
    ├── sample-calendar-events.json    # Calendar events
    └── sample-conversations.json      # Conversation states
```

## Expected Output

```
✓ tests/webhook.test.js (62)
✓ tests/chat.test.js (48)
✓ tests/calendar.test.js (54)
✓ tests/utils.test.js (71)
✓ tests/integration.test.js (32)

Test Files  5 passed (5)
     Tests  267 passed (267)
  Duration  1.2s
```

## Coverage Goals

- Statements: >80% ✅
- Branches: >75% ✅
- Functions: >80% ✅
- Lines: >80% ✅

## Documentation

- `/tests/README.md` - Comprehensive test guide
- `/docs/TEST_COVERAGE_SUMMARY.md` - Detailed coverage breakdown
- `/docs/TEST_SUITE_IMPLEMENTATION.md` - Implementation details

## Quick Tips

1. **Fast feedback**: Use watch mode during development
2. **Visual coverage**: Use UI mode to explore tests interactively
3. **Specific tests**: Run individual suites for focused testing
4. **Coverage tracking**: Check HTML report for uncovered lines
5. **Mock validation**: All external APIs are mocked in setup.js

## Test Structure

Each test follows AAA pattern:
```javascript
it('should do something', async () => {
  // Arrange - set up test data
  const input = 'test data';

  // Act - execute function
  const result = await functionUnderTest(input);

  // Assert - verify results
  expect(result).toBe('expected output');
});
```

## Need Help?

1. Check test output for specific failures
2. Review `/tests/README.md` for detailed docs
3. Look at similar tests as examples
4. Check mock setup in `/tests/setup.js`

---

**Total: 267 tests across 5 files**
**Expected Coverage: 92%**
**Status: ✅ Ready to run**
