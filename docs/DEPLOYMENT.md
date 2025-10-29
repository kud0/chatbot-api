# Deployment Guide

## Table of Contents
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Vercel Deployment](#vercel-deployment)
- [Webhook Configuration](#webhook-configuration)
- [Production Testing](#production-testing)
- [Monitoring and Logging](#monitoring-and-logging)
- [Rollback Procedures](#rollback-procedures)
- [Post-Deployment Verification](#post-deployment-verification)
- [Continuous Deployment](#continuous-deployment)
- [Maintenance](#maintenance)

## Pre-Deployment Checklist

Before deploying to production, ensure all these items are completed:

### Code Checklist

- [ ] All tests passing locally
- [ ] No console.logs in production code (use proper logging)
- [ ] Error handling implemented for all API calls
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Environment variables documented
- [ ] No hardcoded secrets or credentials
- [ ] Dependencies updated to latest stable versions

**Verify tests:**
```bash
npm run test
npm run lint
npm run typecheck  # if using TypeScript
```

### Services Checklist

- [ ] Meta WhatsApp app created and configured
- [ ] Google Calendar API enabled and service account created
- [ ] xAI API key obtained and tested
- [ ] Vercel account set up
- [ ] GitHub repository created and code pushed
- [ ] All service accounts have correct permissions

**Verify services:**
```bash
# Test Google Calendar connection
node scripts/test-calendar.js

# Test xAI API
node scripts/test-ai.js

# Test Meta API (with test number)
node scripts/test-whatsapp.js
```

### Configuration Checklist

- [ ] Business hours configured correctly
- [ ] Services and pricing up to date
- [ ] Timezone set correctly
- [ ] Multi-language content reviewed
- [ ] Contact information accurate
- [ ] Privacy policy and terms of service prepared

**Review configuration:**
```bash
# Check config file
cat src/config/business.js

# Verify all required fields
node scripts/validate-config.js
```

### Security Checklist

- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] API keys stored in environment variables only
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input sanitization in place
- [ ] No sensitive data in logs

## Environment Configuration

### Required Environment Variables

Create a comprehensive list of all required variables:

```bash
# .env.example - Check this into Git
# Copy to .env.local and fill in real values

# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_APP_SECRET=

# Google Calendar
GOOGLE_CALENDAR_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_CREDENTIALS=

# xAI Configuration
XAI_API_KEY=
XAI_MODEL=grok-beta

# Vercel KV (auto-populated by Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Business Configuration
BUSINESS_NAME=Premium Barbershop
BUSINESS_TIMEZONE=America/New_York
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=18:00
BUSINESS_PHONE=+15551234567
BUSINESS_ADDRESS=123 Main St, New York, NY 10001

# Optional
NODE_ENV=production
LOG_LEVEL=info
AI_GATEWAY_URL=
SENTRY_DSN=
```

### Setting Variables in Vercel

**Via Dashboard:**
```bash
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. For each variable:
   - Name: VARIABLE_NAME
   - Value: variable_value
   - Environments: ✓ Production ✓ Preview ✓ Development
   - Click "Save"
```

**Via CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add variable
vercel env add VARIABLE_NAME production

# Add multiple from file
while IFS='=' read -r key value; do
  [[ $key =~ ^#.*$ ]] && continue  # Skip comments
  [[ -z $key ]] && continue         # Skip empty lines
  echo "$value" | vercel env add "$key" production
done < .env.production

# Pull variables to local
vercel env pull .env.local
```

### Validating Environment Variables

Create a validation script:

```javascript
// scripts/validate-env.js
const required = [
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_VERIFY_TOKEN',
  'GOOGLE_CALENDAR_ID',
  'GOOGLE_CREDENTIALS',
  'XAI_API_KEY',
  'KV_URL'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✓ All required environment variables are set');

// Validate formats
if (!process.env.WHATSAPP_PHONE_NUMBER_ID.match(/^\d+$/)) {
  console.error('WHATSAPP_PHONE_NUMBER_ID must be numeric');
  process.exit(1);
}

if (!process.env.GOOGLE_CALENDAR_ID.includes('@')) {
  console.error('GOOGLE_CALENDAR_ID must be email format');
  process.exit(1);
}

console.log('✓ Environment variable formats valid');
```

Run validation:
```bash
node scripts/validate-env.js
```

## Vercel Deployment

### Option 1: GitHub Integration (Recommended)

**Setup:**
```bash
1. Push code to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/repo.git
   git push -u origin main

2. Connect to Vercel
   - Go to vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Import from GitHub
   - Select repository
   - Configure project:
     * Framework Preset: Other (or Next.js if using)
     * Root Directory: ./
     * Build Command: npm run build (if needed)
     * Output Directory: (leave empty for serverless)
   - Add environment variables
   - Click "Deploy"

3. Wait for deployment
   - Usually takes 30-60 seconds
   - Green checkmark = success
   - Click "Visit" to see live site
```

**Subsequent Deployments:**
```bash
# Just push to main branch
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys
# View deployment: vercel.com/dashboard
```

### Option 2: Vercel CLI

**Deploy manually:**
```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# With specific build command
vercel --prod --build-env NODE_ENV=production
```

### Build Configuration

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "vercel dev",
    "build": "echo 'No build step required'",
    "deploy": "vercel --prod",
    "deploy:preview": "vercel"
  }
}
```

## Webhook Configuration

### Update Meta Webhook URL

**After deployment, update webhook URL:**

```bash
1. Get deployment URL
   - Vercel dashboard → Your project
   - Copy production URL: https://your-project.vercel.app

2. Update Meta webhook
   - Meta Developer Console
   - Your App → WhatsApp → Configuration
   - Click "Edit" next to Callback URL
   - Enter: https://your-project.vercel.app/api/webhook
   - Verify token: (your WHATSAPP_VERIFY_TOKEN)
   - Click "Verify and Save"

3. Subscribe to webhook fields
   - Scroll to "Webhook Fields"
   - Check: ☑ messages
   - Check: ☑ message_status (optional)
   - Click "Save"
```

### Test Webhook Connection

```bash
# Test webhook endpoint
curl "https://your-project.vercel.app/api/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Should return: test123

# Send test message from WhatsApp
# Bot should respond within 2 seconds
```

### Webhook Troubleshooting

If webhook not working:

```bash
# 1. Check Vercel function logs
vercel logs --prod | grep webhook

# 2. Check Meta webhook status
Meta Console → WhatsApp → Configuration → Webhook
Look for "Last Callback" timestamp

# 3. Test manually
curl -X POST "https://your-project.vercel.app/api/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "15551234567",
            "text": {"body": "test"},
            "type": "text"
          }]
        }
      }]
    }]
  }'

# 4. Verify environment variables in Vercel
vercel env ls
```

## Production Testing

### Test Plan

**Execute these tests after deployment:**

#### 1. Basic Functionality

```bash
# Test: Greeting
Send: "Hello"
Expected: Welcome message with options

# Test: Service Inquiry
Send: "What services do you offer?"
Expected: List of services with prices

# Test: Availability Check
Send: "What times are available tomorrow?"
Expected: List of available time slots
```

#### 2. Booking Flow

```bash
# Test: Complete Booking
Send: "Book a haircut for tomorrow at 2pm"
Expected:
  - Bot asks for confirmation
  - Shows booking details
  - Creates calendar event
  - Sends confirmation message

# Verify:
  - Check Google Calendar for new event
  - Event has correct time, service, customer info
  - Customer receives confirmation
```

#### 3. Error Handling

```bash
# Test: Invalid Time
Send: "Book for midnight"
Expected: Error message about business hours

# Test: Past Date
Send: "Book for yesterday"
Expected: Error message about past dates

# Test: Unavailable Slot
Send: "Book for [already booked time]"
Expected: Message saying slot unavailable with alternatives
```

#### 4. Multi-Language

```bash
# Test: Spanish
Send: "Hola"
Expected: Response in Spanish

# Test: Language Switch
Send: "Hello" → "Español"
Expected: Switches to Spanish responses
```

#### 5. Cancellation

```bash
# Test: Cancel Booking
Send: "Cancel my appointment"
Expected:
  - Shows current booking
  - Asks for confirmation
  - Cancels booking
  - Removes from calendar
```

### Load Testing

**Test concurrent bookings:**

```javascript
// scripts/load-test.js
const axios = require('axios');

async function testConcurrentBookings() {
  const requests = Array.from({ length: 10 }, (_, i) => ({
    phone: `+155512345${i}`,
    time: '14:00'
  }));

  const results = await Promise.allSettled(
    requests.map(req =>
      axios.post('https://your-project.vercel.app/api/webhook', {
        // Webhook payload
      })
    )
  );

  console.log('Successful:', results.filter(r => r.status === 'fulfilled').length);
  console.log('Failed:', results.filter(r => r.status === 'rejected').length);
}

testConcurrentBookings();
```

## Monitoring and Logging

### Vercel Analytics

**Enable analytics:**
```bash
1. Vercel Dashboard → Your Project
2. Analytics tab
3. View:
   - Function execution time
   - Error rate
   - Request count
   - Regional distribution
```

### Custom Logging

**Implement structured logging:**

```javascript
// utils/logger.js
const log = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(`[${level}] ${message}`, meta);
  }
};

module.exports = {
  info: (msg, meta) => log('INFO', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta)
};

// Usage
const logger = require('./utils/logger');
logger.info('Booking created', { bookingId: '123', customer: phone });
logger.error('Calendar API failed', { error: err.message });
```

### Error Tracking (Optional)

**Integrate Sentry:**

```bash
# Install Sentry
npm install @sentry/node

# Initialize
// utils/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Use in API routes
try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Monitoring Checklist

**Set up alerts for:**

- [ ] Error rate > 5%
- [ ] Response time > 5 seconds
- [ ] Function execution failures
- [ ] Calendar API errors
- [ ] WhatsApp API errors
- [ ] Daily spending > threshold

## Rollback Procedures

### Quick Rollback

**If deployment breaks production:**

```bash
# Method 1: Vercel Dashboard
1. Go to Deployments tab
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Confirm

# Method 2: Vercel CLI
vercel rollback <deployment-url>

# Method 3: Git revert
git revert HEAD
git push
# Vercel auto-deploys reverted version
```

### Gradual Rollback

**If issue is subtle:**

```bash
# 1. Identify problematic deployment
vercel ls

# 2. Check logs for errors
vercel logs --deployment <deployment-id> | grep ERROR

# 3. If needed, rollback
vercel rollback <previous-deployment-url>

# 4. Investigate locally
git checkout <previous-commit>
npm run dev
# Test and fix issue

# 5. Deploy fix
git add .
git commit -m "Fix issue"
git push
```

## Post-Deployment Verification

### Verification Checklist

Run these checks after every deployment:

```bash
# 1. Health check
curl https://your-project.vercel.app/api/health
# Expected: {"status": "healthy"}

# 2. Webhook endpoint
curl "https://your-project.vercel.app/api/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=test"
# Expected: test

# 3. Send test message
# Send "Hello" from WhatsApp
# Expected: Bot responds within 2 seconds

# 4. Check logs for errors
vercel logs --prod | head -50 | grep ERROR
# Expected: No errors

# 5. Verify environment variables
vercel env ls
# Expected: All required variables present

# 6. Check calendar integration
# Book test appointment
# Verify appears in Google Calendar

# 7. Monitor for 15 minutes
# Watch for any unexpected errors
vercel logs --follow
```

### Smoke Test Script

```bash
#!/bin/bash
# scripts/smoke-test.sh

BASE_URL="https://your-project.vercel.app"

echo "Running smoke tests..."

# Test 1: Health check
echo -n "Health check... "
STATUS=$(curl -s "$BASE_URL/api/health" | jq -r '.status')
if [ "$STATUS" == "healthy" ]; then
  echo "✓"
else
  echo "✗ Failed"
  exit 1
fi

# Test 2: Webhook verification
echo -n "Webhook verification... "
RESPONSE=$(curl -s "$BASE_URL/api/webhook?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=test123")
if [ "$RESPONSE" == "test123" ]; then
  echo "✓"
else
  echo "✗ Failed"
  exit 1
fi

# Test 3: Check logs for errors
echo -n "Recent errors... "
ERROR_COUNT=$(vercel logs --prod --since 5m | grep ERROR | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
  echo "✓ None"
else
  echo "⚠ Found $ERROR_COUNT errors"
fi

echo "Smoke tests complete!"
```

Run smoke tests:
```bash
chmod +x scripts/smoke-test.sh
./scripts/smoke-test.sh
```

## Continuous Deployment

### GitHub Actions (Optional)

Create automated deployment pipeline:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  smoke-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: ./scripts/smoke-test.sh
        env:
          VERIFY_TOKEN: ${{ secrets.VERIFY_TOKEN }}
```

### Deployment Notifications

**Slack notifications:**

```javascript
// scripts/notify-deployment.js
const axios = require('axios');

async function notifyDeployment(status, deploymentUrl) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `Deployment ${status}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Deployment ${status}*\n${deploymentUrl}`
        }
      }
    ]
  });
}

// Call after deployment
notifyDeployment('successful', 'https://your-project.vercel.app');
```

## Maintenance

### Regular Maintenance Tasks

**Weekly:**
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backups
- [ ] Test critical paths

**Monthly:**
- [ ] Update dependencies
- [ ] Review and rotate access tokens
- [ ] Audit environment variables
- [ ] Review calendar for data cleanup
- [ ] Check costs and usage

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Feature planning

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update non-breaking
npm update

# Update breaking (test thoroughly)
npm install package@latest

# After updates, test locally
npm run dev
# Run smoke tests
npm test

# Deploy
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Token Rotation

```bash
# Every 90 days, rotate tokens:

# 1. WhatsApp Access Token
# Meta Console → Generate new token
# Update in Vercel
vercel env rm WHATSAPP_ACCESS_TOKEN production
vercel env add WHATSAPP_ACCESS_TOKEN production
# Redeploy

# 2. xAI API Key
# console.x.ai → Create new key
# Update in Vercel
vercel env rm XAI_API_KEY production
vercel env add XAI_API_KEY production
# Redeploy

# 3. Google Service Account
# Rotate every year or if compromised
# Google Cloud Console → Create new key
# Update GOOGLE_CREDENTIALS
# Delete old key
```

---

## Deployment Checklist Summary

**Before Each Deployment:**
- [ ] Tests pass
- [ ] Code reviewed
- [ ] Environment variables verified
- [ ] Dependencies updated
- [ ] Documentation current

**During Deployment:**
- [ ] Deploy to Vercel
- [ ] Update webhook URL
- [ ] Monitor deployment logs
- [ ] No errors in initial requests

**After Deployment:**
- [ ] Run smoke tests
- [ ] Send test messages
- [ ] Verify calendar integration
- [ ] Monitor for 15 minutes
- [ ] Update deployment log

**If Issues:**
- [ ] Check logs immediately
- [ ] Rollback if critical
- [ ] Fix and redeploy
- [ ] Post-mortem analysis

---

For more information:
- [SETUP.md](./SETUP.md) - Initial setup
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [API.md](./API.md) - API reference
