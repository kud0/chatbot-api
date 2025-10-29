# Troubleshooting Guide

## Table of Contents
- [Common Issues](#common-issues)
  - [WhatsApp Webhook Issues](#whatsapp-webhook-issues)
  - [Google Calendar Errors](#google-calendar-errors)
  - [Vercel KV Connection Issues](#vercel-kv-connection-issues)
  - [AI Response Issues](#ai-response-issues)
- [Booking Problems](#booking-problems)
- [Environment Variable Issues](#environment-variable-issues)
- [Meta Verification Issues](#meta-verification-issues)
- [Cost and Usage Issues](#cost-and-usage-issues)
- [Debugging Tools](#debugging-tools)
- [Getting Help](#getting-help)

## Common Issues

### WhatsApp Webhook Issues

#### Issue: Webhook not receiving messages

**Symptoms:**
- Send WhatsApp message but bot doesn't respond
- Webhook logs show no incoming requests
- Meta shows "Last Callback: Never"

**Possible Causes & Solutions:**

**1. Webhook URL not configured**

Check Meta configuration:
```bash
# Verify webhook URL in Meta dashboard
https://your-project.vercel.app/api/webhook

# Should match exactly (no trailing slash)
```

**Solution:**
1. Go to Meta Developer Console
2. Navigate to WhatsApp → Configuration → Webhook
3. Verify URL is exactly: `https://your-project.vercel.app/api/webhook`
4. Click "Verify and Save"

**2. Verify token mismatch**

```bash
# Check your .env file
WHATSAPP_VERIFY_TOKEN=your_token_here

# Must match Meta configuration exactly
```

**Solution:**
```bash
# In Vercel dashboard
1. Go to Settings → Environment Variables
2. Check WHATSAPP_VERIFY_TOKEN value
3. Copy to Meta webhook configuration
4. Save and re-verify webhook
```

**3. Webhook not subscribed to message events**

**Solution:**
1. Meta Console → WhatsApp → Configuration
2. Scroll to "Webhook Fields"
3. Ensure "messages" is checked ☑
4. Click "Save"

**4. Phone number not added to test list**

**Solution:**
1. Meta Console → WhatsApp → API Setup
2. Find "To" field under test number
3. Add your phone number in format: +15551234567
4. Save and verify

**Testing:**
```bash
# Check webhook with curl
curl "https://your-project.vercel.app/api/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Should return: test123
```

---

#### Issue: Webhook receives messages but doesn't respond

**Symptoms:**
- Vercel logs show incoming webhook
- But no reply sent to WhatsApp
- Customer sees no bot response

**Possible Causes:**

**1. Invalid access token**

```bash
# Check logs for:
Error: Invalid OAuth access token - Cannot parse access token
```

**Solution:**
```bash
# Regenerate token in Meta
1. Meta Console → WhatsApp → API Setup
2. Click "Generate Token"
3. Copy new token
4. Update in Vercel:
   - Settings → Environment Variables
   - Update WHATSAPP_ACCESS_TOKEN
   - Redeploy: git commit --allow-empty && git push
```

**2. Phone number ID mismatch**

```bash
# Verify phone number ID
# Should be numeric ID, not actual phone number
WHATSAPP_PHONE_NUMBER_ID=123456789012345  # Correct
WHATSAPP_PHONE_NUMBER_ID=+15551234567     # Wrong
```

**Solution:**
```bash
# Get correct ID from Meta
1. WhatsApp → API Setup
2. Copy "Phone number ID" (numeric)
3. Update environment variable
```

**3. Rate limiting**

```bash
# Check logs for:
Error: (#4) Application request limit reached
```

**Solution:**
- Wait 1 hour for rate limit reset
- Reduce message frequency
- Implement exponential backoff in code

**4. Message format error**

```bash
# Check logs for:
Error: Invalid parameter, message
```

**Solution:**
```javascript
// Ensure message format is correct
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "15551234567",
  "type": "text",
  "text": {
    "body": "Your message"
  }
}
```

---

#### Issue: Webhook signature verification failing

**Symptoms:**
```bash
Error: Invalid signature
403 Forbidden
```

**Causes:**
- Wrong app secret
- Signature header missing
- Body parsing issue

**Solution:**
```bash
# 1. Verify app secret
Meta Console → Settings → Basic → App Secret

# 2. Update environment variable
WHATSAPP_APP_SECRET=your_app_secret

# 3. Ensure raw body is used for signature
// In API route
export const config = {
  api: {
    bodyParser: false  // Must be false for signature verification
  }
};
```

**Debug signature:**
```javascript
// Add logging
console.log('Signature header:', req.headers['x-hub-signature-256']);
console.log('Raw body:', rawBody);
console.log('Computed signature:', computedSignature);
```

---

### Google Calendar Errors

#### Issue: Calendar authentication failed

**Symptoms:**
```bash
Error: invalid_grant
Error: Unauthorized
401 Unauthorized
```

**Possible Causes:**

**1. Service account not shared with calendar**

**Solution:**
```bash
# 1. Get service account email from credentials
cat google-credentials.json | grep client_email

# 2. Share calendar
- Open Google Calendar
- Find your calendar → Settings
- Share with specific people
- Add service account email
- Grant "Make changes to events"
- Send
```

**2. Invalid credentials JSON**

**Solution:**
```bash
# Verify credentials format
cat google-credentials.json | jq .

# Should have these fields:
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...@....iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}

# If missing fields, regenerate:
1. Google Cloud Console
2. IAM & Admin → Service Accounts
3. Click service account
4. Keys → Add Key → Create New Key
5. JSON format → Create
```

**3. Environment variable formatting**

```bash
# Wrong: Multi-line
GOOGLE_CREDENTIALS={
  "type": "service_account"
}

# Correct: Single line, escaped
GOOGLE_CREDENTIALS='{"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----\\n..."}'
```

**Solution:**
```bash
# Convert to single line
cat google-credentials.json | jq -c . | pbcopy

# Paste into .env.local or Vercel
GOOGLE_CREDENTIALS='<paste here>'
```

**4. Calendar API not enabled**

**Solution:**
```bash
# Enable Calendar API
1. Google Cloud Console
2. APIs & Services → Library
3. Search "Google Calendar API"
4. Click → Enable

# Verify
gcloud services list --enabled | grep calendar
```

---

#### Issue: Calendar quota exceeded

**Symptoms:**
```bash
Error: Quota exceeded
429 Too Many Requests
```

**Solution:**
```bash
# 1. Check quota usage
Google Cloud Console → APIs & Services → Quotas

# 2. Request quota increase
- Click "Calendar API"
- Click "All quotas"
- Select quota type
- Click "Edit Quotas"
- Request increase

# 3. Implement caching
// Cache availability for 5 minutes
const cacheKey = `availability:${date}`;
const cached = await kv.get(cacheKey);
if (cached) return cached;

const availability = await fetchFromCalendar(date);
await kv.set(cacheKey, availability, { ex: 300 }); // 5 min TTL
```

---

#### Issue: Double booking occurs

**Symptoms:**
- Two customers book same time slot
- Calendar shows overlapping events

**Cause:**
Race condition during concurrent bookings

**Solution:**
```javascript
// Implement atomic booking with Redis lock
const lockKey = `lock:${date}:${time}`;
const lockAcquired = await kv.set(lockKey, '1', {
  nx: true,  // Only set if not exists
  ex: 10     // Expire after 10 seconds
});

if (!lockAcquired) {
  throw new Error('Slot being booked by another customer');
}

try {
  // Check availability again
  const available = await checkCalendar(date, time);
  if (!available) {
    throw new Error('Slot no longer available');
  }

  // Create booking
  const event = await calendar.events.insert({...});

  return event;
} finally {
  // Always release lock
  await kv.del(lockKey);
}
```

---

### Vercel KV Connection Issues

#### Issue: Cannot connect to KV

**Symptoms:**
```bash
Error: KV_REST_API_URL is not defined
Error: Connection timeout
```

**Solution:**

**1. Verify environment variables**
```bash
# Check Vercel dashboard
Settings → Environment Variables

# Required variables:
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN

# These are auto-added when you create KV database
```

**2. Re-link KV database**
```bash
# Remove and re-add
vercel env rm KV_URL
vercel env rm KV_REST_API_URL
vercel env rm KV_REST_API_TOKEN
vercel env rm KV_REST_API_READ_ONLY_TOKEN

# Go to Vercel dashboard → Storage
# Click your KV database → Connect to project
# Redeploy
```

**3. Local development**
```bash
# Pull environment variables
vercel env pull .env.local

# Or manually create KV for local dev
vercel kv create local-dev
```

---

#### Issue: Session data not persisting

**Symptoms:**
- Bot "forgets" conversation context
- User has to restart conversation
- Session not found errors

**Possible Causes:**

**1. TTL too short**
```javascript
// Increase session TTL
await kv.set(`session:${phone}`, session, {
  ex: 86400  // 24 hours (was too short)
});
```

**2. Session key mismatch**
```javascript
// Ensure consistent key format
const sessionKey = `session:${phone.replace(/\+/g, '')}`; // Remove +

// Or use hash for consistency
const crypto = require('crypto');
const sessionKey = `session:${crypto.createHash('md5').update(phone).digest('hex')}`;
```

**3. JSON serialization error**
```javascript
// Check for circular references
try {
  await kv.set(key, JSON.stringify(session));
} catch (err) {
  console.error('Serialization error:', err);
  // Remove problematic fields
}
```

---

### AI Response Issues

#### Issue: AI not responding

**Symptoms:**
- Bot sends generic error message
- AI service timeout
- Empty responses

**Possible Causes:**

**1. Invalid API key**
```bash
Error: 401 Unauthorized
Error: Invalid API key
```

**Solution:**
```bash
# Regenerate xAI API key
1. Go to console.x.ai
2. API Keys → Create New Key
3. Copy key
4. Update in Vercel:
   XAI_API_KEY=xai-your-new-key
```

**2. API timeout**
```bash
Error: Request timeout after 30000ms
```

**Solution:**
```javascript
// Increase timeout
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'grok-beta',
    messages: messages,
    max_tokens: 500,
    temperature: 0.7
  }),
  signal: AbortSignal.timeout(60000)  // 60 second timeout
});
```

**3. Context too large**
```bash
Error: Context length exceeded
Error: Maximum tokens exceeded
```

**Solution:**
```javascript
// Truncate conversation history
const recentMessages = conversationHistory.slice(-10); // Keep last 10 only

// Summarize old context
const summarizedContext = await summarizeHistory(oldMessages);
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'system', content: `Previous context: ${summarizedContext}` },
  ...recentMessages
];
```

**4. Rate limiting**
```bash
Error: 429 Too Many Requests
```

**Solution:**
```javascript
// Implement retry with exponential backoff
async function callAIWithRetry(messages, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await callAI(messages);
    } catch (err) {
      if (err.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}
```

---

#### Issue: AI responses in wrong language

**Symptoms:**
- User speaks Spanish, bot replies in English
- Language switches unexpectedly

**Solution:**
```javascript
// Explicitly set language in system prompt
const systemPrompt = `
You are a barbershop booking assistant.
IMPORTANT: Respond ONLY in ${session.language === 'es' ? 'Spanish' : 'English'}.

${session.language === 'es' ?
  'Habla únicamente en español.' :
  'Speak only in English.'}

User's preferred language: ${session.language}
`;

// Validate response language
function validateLanguage(response, expectedLang) {
  // Basic check (not perfect but helps)
  const spanishWords = ['el', 'la', 'de', 'que', 'por'];
  const hasSpanish = spanishWords.some(word =>
    response.toLowerCase().includes(` ${word} `)
  );

  if (expectedLang === 'es' && !hasSpanish) {
    console.warn('AI responded in wrong language');
    // Retry with more explicit prompt
  }
}
```

---

## Booking Problems

### Issue: Bookings not appearing in calendar

**Symptoms:**
- Bot confirms booking
- But event not in Google Calendar
- Customer doesn't see calendar invite

**Debug Steps:**

```javascript
// Add logging to booking creation
try {
  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: `${service} - ${customerName}`,
      start: { dateTime: startTime, timeZone: 'America/New_York' },
      end: { dateTime: endTime, timeZone: 'America/New_York' },
      description: `Customer: ${customerPhone}\nService: ${service}`
    }
  });

  console.log('Event created:', event.data.id);
  console.log('Event link:', event.data.htmlLink);

  return event.data;
} catch (err) {
  console.error('Booking error:', err.message);
  console.error('Full error:', JSON.stringify(err, null, 2));
  throw err;
}
```

**Common Causes:**

1. **Wrong calendar ID**
   ```bash
   # Verify calendar ID
   - Open Google Calendar
   - Settings → Your calendar
   - Integrate calendar → Calendar ID
   # Should end with: @group.calendar.google.com
   ```

2. **Timezone mismatch**
   ```javascript
   // Always include timezone
   start: {
     dateTime: '2025-10-30T14:00:00',
     timeZone: 'America/New_York'  // Required
   }
   ```

3. **Invalid date format**
   ```javascript
   // Wrong
   start: { dateTime: '10/30/2025 2:00 PM' }

   // Correct (ISO 8601)
   start: { dateTime: '2025-10-30T14:00:00-04:00' }
   ```

---

### Issue: Times show in wrong timezone

**Symptoms:**
- Bot shows 2 PM
- Calendar shows 6 PM
- User confused about actual time

**Solution:**
```javascript
// Always use business timezone
const BUSINESS_TIMEZONE = 'America/New_York';

// Convert user input to business timezone
const moment = require('moment-timezone');

function parseUserTime(timeString, date) {
  // Assume user is in business timezone
  const datetime = moment.tz(
    `${date} ${timeString}`,
    'YYYY-MM-DD HH:mm',
    BUSINESS_TIMEZONE
  );

  return datetime.toISOString();
}

// Display times in business timezone
function formatTime(isoString) {
  return moment.tz(isoString, BUSINESS_TIMEZONE)
    .format('h:mm A z'); // "2:00 PM EST"
}
```

---

## Environment Variable Issues

### Issue: Environment variables not working in Vercel

**Symptoms:**
```bash
Error: WHATSAPP_ACCESS_TOKEN is not defined
undefined
```

**Solution:**

**1. Check environment scope**
```bash
# Variables must be set for correct environments
- Production: For vercel.app domain
- Preview: For pull request deployments
- Development: For local development

# Set for all three:
vercel env add VARIABLE_NAME
> Enter value: your_value
> Add to: Production, Preview, Development
```

**2. Redeploy after adding variables**
```bash
# Variables only apply to NEW deployments
git commit --allow-empty -m "Redeploy for env vars"
git push

# Or manual redeploy
vercel --prod
```

**3. Check variable names**
```bash
# Verify exact names (case-sensitive)
# In code:
process.env.WHATSAPP_ACCESS_TOKEN

# In Vercel must be exactly:
WHATSAPP_ACCESS_TOKEN  # Not whatsapp_access_token
```

---

## Meta Verification Issues

### Issue: App review rejected

**Common Rejection Reasons:**

**1. "Use case not clear"**

**Solution:**
Resubmit with detailed explanation:
```
Use Case: Barbershop Appointment Booking

Description:
Our barbershop uses this chatbot to allow customers to:
1. View available services (haircut, shave, beard trim)
2. Check appointment availability in real-time
3. Book appointments by selecting date and time
4. Receive booking confirmations
5. Cancel or modify existing appointments

Conversation Flow:
- Customer initiates message ("Hello")
- Bot asks what they need
- Customer selects service
- Bot shows available times from Google Calendar
- Customer picks time
- Bot creates appointment and sends confirmation

Privacy:
- We only store phone numbers and appointment details
- Data is deleted 7 days after appointment
- No marketing messages sent
- See privacy policy: https://your-site.com/privacy

All messages are customer-initiated. We do not send
unsolicited messages or promotions.
```

**2. "Demo video insufficient"**

**Solution:**
Record new video showing:
- Open WhatsApp on phone (screen record)
- Send "Hello" to bot
- Bot responds with options
- Select "Book appointment"
- Choose service, date, time
- Confirm booking
- Show confirmation message
- Open Google Calendar
- Show appointment was created
- Duration: 60-90 seconds

**3. "Privacy policy missing"**

**Solution:**
Create privacy policy page including:
- What data is collected (phone number, name, appointment details)
- How it's used (booking appointments only)
- How long it's stored (7 days after appointment)
- User rights (access, deletion, modification)
- Contact information

---

## Cost and Usage Issues

### Issue: Unexpected high costs

**Symptoms:**
- Higher than expected Vercel bill
- xAI charges accumulating
- Lots of API calls in logs

**Debug:**

```bash
# Check Vercel usage
vercel logs --prod | grep "Function Execution" | wc -l

# Check function invocations per day
vercel logs --prod --since 24h | grep webhook | wc -l

# Check AI API calls
vercel logs --prod | grep "xAI request" | wc -l
```

**Solutions:**

**1. Implement caching**
```javascript
// Cache common AI responses
const cacheKey = `ai:${hash(userMessage)}`;
const cached = await kv.get(cacheKey);
if (cached) {
  console.log('Using cached AI response');
  return cached;
}

const response = await callAI(userMessage);
await kv.set(cacheKey, response, { ex: 3600 }); // 1 hour
return response;
```

**2. Rate limit users**
```javascript
// Limit messages per user per hour
const rateLimitKey = `ratelimit:${phone}`;
const messageCount = await kv.incr(rateLimitKey);

if (messageCount === 1) {
  await kv.expire(rateLimitKey, 3600); // 1 hour
}

if (messageCount > 50) {
  return sendMessage(phone, 'You are sending messages too quickly. Please wait.');
}
```

**3. Set spending alerts**
```bash
# Vercel
- Dashboard → Settings → Billing
- Set spending limit: $50/month
- Enable email alerts

# xAI
- console.x.ai → Billing
- Set usage limits
- Enable alerts at 80% threshold
```

---

## Debugging Tools

### Vercel Logs

```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs --prod | grep "api/webhook"

# Last 100 logs
vercel logs --prod | head -100

# Logs from last hour
vercel logs --prod --since 1h

# Logs with errors only
vercel logs --prod | grep ERROR
```

### Local Testing

```bash
# Test webhook verification
curl "http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=challenge123"

# Test incoming message
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
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

# Test calendar availability
curl "http://localhost:3000/api/calendar/availability?date=2025-10-30"
```

### Add Debug Logging

```javascript
// In webhook handler
export default async function handler(req, res) {
  console.log('Webhook received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // ... rest of code

  console.log('Sending response:', response);
  return res.json(response);
}
```

### Meta Webhook Logs

```bash
# Check Meta's webhook logs
1. Meta Developer Console
2. WhatsApp → Configuration → Webhook
3. Click "Test" button
4. View "Recent Deliveries"
5. Check status codes and errors
```

---

## Getting Help

### Before Asking for Help

1. **Check logs:**
   ```bash
   vercel logs --prod | tail -100
   ```

2. **Verify environment variables:**
   ```bash
   vercel env ls
   ```

3. **Test locally:**
   ```bash
   npm run dev
   # Test with curl
   ```

4. **Check service status:**
   - Vercel: https://vercel-status.com
   - Meta: https://developers.facebook.com/status
   - Google: https://status.cloud.google.com

### Information to Include

When requesting help, provide:

1. **Error message:**
   ```
   Full error with stack trace
   ```

2. **Steps to reproduce:**
   ```
   1. Send message "Hello"
   2. Bot doesn't respond
   3. Check logs, see error X
   ```

3. **Environment:**
   ```
   - Node version: 18.17.0
   - Vercel region: iad1
   - Last working: Yesterday
   ```

4. **Relevant logs:**
   ```bash
   # Last 20 logs
   vercel logs --prod | tail -20
   ```

5. **What you've tried:**
   ```
   - Redeployed
   - Checked env vars
   - Tested locally (works)
   ```

### Support Channels

1. **Documentation:**
   - [Meta WhatsApp Docs](https://developers.facebook.com/docs/whatsapp)
   - [Vercel Docs](https://vercel.com/docs)
   - [Google Calendar API](https://developers.google.com/calendar)

2. **Community:**
   - Meta Developer Forum
   - Vercel Discord
   - Stack Overflow

3. **Direct Support:**
   - Meta Business Support (for verified businesses)
   - Vercel Support (Pro/Enterprise)
   - Project GitHub Issues

---

## Quick Reference

### Health Check Checklist

Run these checks if anything seems wrong:

```bash
# 1. Webhook responding?
curl "https://your-project.vercel.app/api/health"

# 2. Environment variables set?
vercel env ls

# 3. Can reach calendar?
# Check Google Cloud Console → Calendar API → Metrics

# 4. Recent deployments successful?
vercel ls

# 5. Any errors in logs?
vercel logs --prod | grep ERROR

# 6. Meta webhook status?
# Meta Console → WhatsApp → Configuration → Check status

# 7. KV database connected?
vercel kv list

# 8. Recent function executions?
# Vercel Dashboard → Analytics
```

### Emergency Fixes

**If bot completely stops responding:**

```bash
# 1. Force redeploy
git commit --allow-empty -m "Emergency redeploy"
git push

# 2. Check Vercel status
open https://vercel-status.com

# 3. Verify webhook URL
# Meta Console → Verify webhook still points to your domain

# 4. Test health endpoint
curl https://your-project.vercel.app/api/health

# 5. Check logs for recurring errors
vercel logs --prod | grep ERROR | sort | uniq -c | sort -rn
```

---

For additional help, see:
- [SETUP.md](./SETUP.md) - Setup instructions
- [API.md](./API.md) - API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
