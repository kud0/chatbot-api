# Contributing to WhatsApp Chatbot Barbershop Booking System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience
- Nationality, personal appearance
- Race, religion, sexual orientation

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Respecting differing viewpoints and experiences
- Accepting constructive criticism gracefully
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behaviors include:**
- Trolling, insulting/derogatory comments, personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct inappropriate in a professional setting

### Enforcement

Violations can be reported to [your-email@example.com]. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

### Ways to Contribute

1. **Code Contributions**
   - Bug fixes
   - New features
   - Performance improvements
   - Code refactoring

2. **Documentation**
   - Fix typos or unclear sections
   - Add examples and tutorials
   - Translate documentation
   - Write blog posts or guides

3. **Testing**
   - Write or improve tests
   - Test on different environments
   - Report bugs with detailed reproduction steps

4. **Design**
   - Improve message templates
   - Create diagrams or flowcharts
   - Design better conversation flows

5. **Community**
   - Answer questions in issues
   - Help review pull requests
   - Share the project

### Before You Start

1. **Check existing issues/PRs** to avoid duplicate work
2. **Open an issue** for major changes before coding
3. **Fork the repository** and create a feature branch
4. **Follow code style** guidelines below
5. **Write tests** for new functionality
6. **Update documentation** as needed

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Accounts: Meta Developers, Google Cloud, xAI, Vercel

### Local Setup

```bash
# 1. Fork and clone
git clone https://github.com/your-username/barbershop-chatbot.git
cd barbershop-chatbot

# 2. Add upstream remote
git remote add upstream https://github.com/original-owner/barbershop-chatbot.git

# 3. Install dependencies
npm install

# 4. Set up environment
cp .env.example .env.local
# Fill in your credentials

# 5. Run development server
npm run dev

# 6. Run tests
npm test
```

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Keep branch updated
git fetch upstream
git rebase upstream/main

# 4. Push to your fork
git push origin feature/your-feature-name

# 5. Create pull request on GitHub
```

### VS Code Setup (Recommended)

**Install extensions:**
- ESLint
- Prettier
- JavaScript (ES6) code snippets
- GitLens

**Workspace settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.preferences.quoteStyle": "single",
  "files.eol": "\n"
}
```

## Code Style Guidelines

### JavaScript/TypeScript Style

**General Principles:**
- Write clean, readable, self-documenting code
- Prefer clarity over cleverness
- Keep functions small and focused
- Use meaningful variable names
- Comment complex logic, not obvious code

**Naming Conventions:**

```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// Variables and functions: camelCase
const userName = 'John';
function getUserName() { }

// Classes and constructors: PascalCase
class BookingService { }

// Private properties: _prefix
class Service {
  _privateMethod() { }
}

// Boolean variables: is/has/can prefix
const isValid = true;
const hasPermission = false;
const canEdit = true;
```

**Function Style:**

```javascript
// Good: Arrow functions for simple cases
const double = (x) => x * 2;

// Good: Named functions for clarity
function calculateTotalPrice(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good: Async/await over promises
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

// Bad: Callback hell
function getData(callback) {
  fetchData((data) => {
    processData(data, (result) => {
      saveData(result, callback);
    });
  });
}
```

**Object and Array Destructuring:**

```javascript
// Good: Use destructuring
function greet({ name, age }) {
  return `Hello ${name}, you are ${age} years old`;
}

const [first, second, ...rest] = items;

// Bad: Accessing properties repeatedly
function greet(user) {
  return `Hello ${user.name}, you are ${user.age} years old`;
}
```

**Error Handling:**

```javascript
// Good: Specific error handling
try {
  const booking = await createBooking(data);
  return booking;
} catch (error) {
  if (error.code === 'SLOT_UNAVAILABLE') {
    throw new BookingError('Time slot no longer available', error);
  }
  logger.error('Booking failed', { error, data });
  throw error;
}

// Bad: Silent failures
try {
  createBooking(data);
} catch (error) {
  // Silently fails
}
```

**Comments:**

```javascript
// Good: Explain WHY, not WHAT
// Use rate limiting to prevent abuse from bots
await rateLimit(userId);

// Calculate discount based on loyalty tier
// Tier 1: 5%, Tier 2: 10%, Tier 3: 15%
const discount = calculateDiscount(user.loyaltyTier);

// Bad: State the obvious
// Set variable to true
const isActive = true;

// Call the function
doSomething();
```

### File Organization

**File naming:**
- Kebab-case: `booking-service.js`, `user-utils.js`
- Descriptive names: `whatsapp-webhook-handler.js`

**File structure:**
```javascript
// 1. Imports
const axios = require('axios');
const { logger } = require('./utils/logger');

// 2. Constants
const MAX_RETRIES = 3;
const TIMEOUT = 5000;

// 3. Helper functions (private)
function _formatPhoneNumber(phone) {
  // ...
}

// 4. Main functions (exported)
async function sendMessage(to, message) {
  // ...
}

// 5. Exports
module.exports = {
  sendMessage,
  sendTemplate
};
```

### ESLint Configuration

**Use project's ESLint config (.eslintrc.js):**

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'never']
  }
};
```

**Run linting:**
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

## Testing Requirements

### Test Structure

```javascript
// tests/booking-service.test.js
const { createBooking, cancelBooking } = require('../src/services/bookingService');

describe('BookingService', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear data, etc.
  });

  describe('createBooking', () => {
    it('should create booking with valid data', async () => {
      const booking = await createBooking(validData);
      expect(booking).toHaveProperty('id');
      expect(booking.status).toBe('confirmed');
    });

    it('should reject booking for unavailable slot', async () => {
      await expect(createBooking(unavailableSlot))
        .rejects
        .toThrow('Time slot not available');
    });

    it('should validate required fields', async () => {
      await expect(createBooking({}))
        .rejects
        .toThrow('Missing required field');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel existing booking', async () => {
      const result = await cancelBooking(bookingId);
      expect(result.status).toBe('cancelled');
    });
  });
});
```

### Test Coverage

**Minimum coverage requirements:**
- Overall: 80%
- New features: 90%
- Critical paths: 100%

**Run tests:**
```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode
npm test booking.test.js    # Specific file
```

### What to Test

**Unit Tests:**
- Individual functions
- Edge cases
- Error handling
- Input validation

**Integration Tests:**
- API endpoints
- Service interactions
- Database operations
- External API calls (mocked)

**Example:**
```javascript
// Unit test
describe('formatPhoneNumber', () => {
  it('formats US phone number', () => {
    expect(formatPhoneNumber('5551234567')).toBe('+15551234567');
  });

  it('handles already formatted numbers', () => {
    expect(formatPhoneNumber('+15551234567')).toBe('+15551234567');
  });
});

// Integration test
describe('POST /api/webhook', () => {
  it('processes incoming message', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .send(webhookPayload)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Mocking External Services

```javascript
// Mock WhatsApp API
jest.mock('../src/services/whatsappService', () => ({
  sendMessage: jest.fn().mockResolvedValue({ messageId: 'msg_123' })
}));

// Mock Google Calendar
jest.mock('googleapis', () => ({
  calendar: jest.fn(() => ({
    events: {
      insert: jest.fn().mockResolvedValue({ data: { id: 'evt_123' } })
    }
  }))
}));
```

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] ESLint passes with no errors

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(booking): add support for recurring appointments

Allows customers to book weekly or monthly appointments.

Closes #123

---

fix(webhook): handle malformed message payloads

Adds validation to prevent crashes from invalid webhook data.

---

docs(setup): add troubleshooting section

Includes solutions for common setup issues.
```

### Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass

## Screenshots (if applicable)

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** run (linting, tests)
2. **Maintainer review** (1-2 business days)
3. **Address feedback** if requested
4. **Approval and merge** by maintainer

**What reviewers look for:**
- Code quality and readability
- Test coverage
- Documentation completeness
- Performance implications
- Security concerns
- Breaking changes

## Reporting Issues

### Before Creating an Issue

1. **Search existing issues** - maybe it's already reported
2. **Try latest version** - might be fixed already
3. **Check documentation** - might be expected behavior

### Bug Report Template

```markdown
**Describe the bug**
Clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Send message "..."
2. Bot responds with "..."
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- Node version: 18.17.0
- OS: macOS 13.0
- Vercel region: iad1

**Logs**
```
Paste relevant logs here
```

**Additional context**
Any other relevant information.
```

### Good Bug Reports

**Good:**
```
Title: Webhook signature verification fails with special characters

Description:
When a message contains emojis, webhook signature verification
fails even though the signature is valid.

Reproduce:
1. Send message with emoji: "Hello 👋"
2. Webhook receives message
3. Signature verification fails with error: "Invalid signature"

Expected: Signature verification should pass
Actual: Returns 403 Forbidden

Environment: Node 18.17.0, Vercel iad1

Logs:
Error: Invalid signature
Expected: sha256=abc123...
Received: sha256=def456...

I suspect the issue is UTF-8 encoding of the emoji.
```

**Bad:**
```
Title: It doesn't work

Description: The bot is broken
```

## Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description of the problem.

**Describe the solution you'd like**
Clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Use case**
How would this feature be used?

**Additional context**
Mockups, examples, or related features.
```

### Good Feature Requests

**Good:**
```
Title: Add SMS notification support

Problem:
Some customers prefer SMS over WhatsApp. Currently, all
notifications go through WhatsApp only.

Solution:
Add optional SMS notifications for booking confirmations
and reminders using Twilio API.

Use case:
- Customer books via WhatsApp
- Receives confirmation via both WhatsApp and SMS
- 24h reminder sent via both channels
- Configurable per customer preference

Alternatives considered:
- Email notifications (less immediate)
- Push notifications (requires app)

Implementation notes:
- Add TWILIO_API_KEY to environment
- New config option: SMS_ENABLED
- Store customer SMS preference in session
```

**Bad:**
```
Title: Add more features

Please add more features to make it better.
```

## Code Review Guidelines

### For Contributors

**When requesting review:**
- Keep PRs focused and small (<400 lines)
- Provide context in description
- Respond promptly to feedback
- Be open to suggestions

**When receiving feedback:**
- Don't take it personally
- Ask questions if unclear
- Make requested changes or discuss alternatives
- Thank reviewers for their time

### For Reviewers

**Be respectful:**
- Use "we" instead of "you"
- Suggest, don't command
- Explain the "why"
- Appreciate the contribution

**Good review comments:**
```
"We could simplify this by using array destructuring"

"Great work on the error handling! One suggestion: we might
want to log the error details for debugging."

"This looks good! I'm wondering if we should add a test
case for when the API returns a 500 error?"
```

**Bad review comments:**
```
"This is wrong, fix it"

"You should know better"

"This code is terrible"
```

## Development Tips

### Debugging

```javascript
// Use debug package for logging
const debug = require('debug')('app:booking');

debug('Creating booking', { data });
debug('API response', { response });

// Run with DEBUG env var
// DEBUG=app:* npm run dev
```

### Testing Locally

```bash
# Use ngrok for webhook testing
ngrok http 3000

# Update Meta webhook URL to ngrok URL
# Send test WhatsApp messages

# Check logs
vercel logs --follow
```

### Performance

```javascript
// Profile slow functions
console.time('fetchData');
await fetchData();
console.timeEnd('fetchData');

// Use async/await properly
// Good: Parallel
const [user, booking] = await Promise.all([
  getUser(userId),
  getBooking(bookingId)
]);

// Bad: Sequential when not needed
const user = await getUser(userId);
const booking = await getBooking(bookingId);
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussion
- **Pull Requests**: Code contributions

### Getting Help

**Before asking:**
1. Check documentation
2. Search existing issues
3. Try debugging yourself

**When asking:**
- Be specific
- Provide context
- Include error messages
- Show what you've tried

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (if applicable)

Significant contributors may be invited to become maintainers.

## Questions?

If you have questions about contributing, please:
- Open a GitHub Discussion
- Email [your-email@example.com]
- Check [docs/](./docs/) for more information

---

Thank you for contributing! 🎉
