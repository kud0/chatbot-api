# Cost Optimization Guide

## Table of Contents
- [Overview](#overview)
- [Cost Breakdown](#cost-breakdown)
- [Free Tier Limits](#free-tier-limits)
- [Optimization Strategies](#optimization-strategies)
- [Monitoring Usage](#monitoring-usage)
- [When to Upgrade](#when-to-upgrade)
- [Alternative Options](#alternative-options)
- [Cost Calculators](#cost-calculators)

## Overview

The WhatsApp chatbot booking system is designed to be cost-effective for small to medium barbershops. This guide helps you minimize costs while maintaining good performance.

**Target Monthly Cost:** $5-$50 for most small barbershops

## Cost Breakdown

### Monthly Costs by Service

| Service | Free Tier | Typical Usage | Cost Range |
|---------|-----------|---------------|------------|
| **Vercel Hosting** | 100GB bandwidth<br>100GB-hours compute | 1000 messages/mo | $0-$20 |
| **Vercel KV (Redis)** | 256MB storage<br>3000 commands | Session storage | $0-$10 |
| **Meta WhatsApp** | Unlimited (approved) | 1000 messages/mo | $0 |
| **Google Calendar** | 1M requests/day | 5000 bookings/mo | $0 |
| **xAI Grok** | No free tier | 1000 requests/mo | $5-$20 |
| **Total** | - | Small barbershop | **$5-$50/mo** |

### Cost per Customer Interaction

Breakdown of single conversation (greeting → booking):

| Operation | API Calls | Cost |
|-----------|-----------|------|
| Receive message | 1 WhatsApp webhook | $0 |
| Load session | 1 KV read | $0.000001 |
| AI response (3x) | 3 xAI calls | $0.003 |
| Check availability | 1 Calendar API | $0 |
| Create booking | 1 Calendar API | $0 |
| Save session | 3 KV writes | $0.000003 |
| Send messages (4x) | 4 WhatsApp sends | $0 |
| **Total per booking** | - | **~$0.003-0.005** |

**Example Monthly Costs:**

- **100 bookings/month:** ~$0.50
- **500 bookings/month:** ~$2.50
- **1000 bookings/month:** ~$5.00
- **5000 bookings/month:** ~$25.00

## Free Tier Limits

### Vercel

**Free Plan Includes:**
- 100GB bandwidth per month
- 100GB-hours serverless function execution
- Unlimited API requests
- Unlimited deployments
- HTTPS included
- DDoS protection

**Limits:**
- Function execution: 10 seconds max
- Function size: 50MB
- Build time: 45 minutes

**How to Stay Free:**
- Typical small barbershop will stay within free tier
- Bandwidth: ~1MB per 1000 messages = plenty
- Compute: Each function runs ~500ms = plenty

**Monitor usage:**
```bash
# Check usage
vercel dashboard → Analytics → Usage

# If approaching limits:
# - Enable caching
# - Optimize functions
# - Reduce log verbosity
```

### Vercel KV

**Free Plan:**
- 256MB storage
- 3,000 commands/day
- Data persistence
- TLS encryption

**Typical Usage:**
- Session: ~5KB each
- 256MB = ~50,000 sessions
- 3,000 commands/day = ~90,000/month

**Optimization:**
```javascript
// Reduce session size
const minimalSession = {
  phone: session.phone,
  lang: session.language,
  history: session.history.slice(-5),  // Keep only last 5 messages
  pending: session.pendingBooking
};

// Shorter TTL to free space faster
await kv.set(key, session, { ex: 3600 }); // 1 hour instead of 24
```

### Google Calendar API

**Free Quota:**
- 1,000,000 requests/day
- 10 queries/second/user

**Typical Usage:**
- Small shop: ~50 requests/day
- Medium shop: ~500 requests/day
- **Will never hit free limit**

**No optimization needed** - free tier is very generous.

### xAI (Grok)

**No free tier** - This is your main cost

**Pricing:**
- ~$0.001 per request (varies by model)
- Input tokens: Included
- Output tokens: Included

**Typical Usage:**
- 3 AI calls per booking
- 1000 bookings/month = 3000 calls = $3-$6/month

### Meta WhatsApp

**Free for approved apps:**
- First 1,000 conversations/month: FREE
- After that: $0.005-0.01 per conversation (varies by country)

**Test number:**
- Completely free
- Limited to 5 phone numbers
- Good for initial testing

**Production:**
- Need business verification
- Then unlimited free messages (within limits)
- Marketing messages may cost extra

## Optimization Strategies

### 1. Cache AI Responses

**Save 50-70% on AI costs:**

```javascript
// Cache common questions
const cacheKey = `ai:${hashMessage(userMessage)}`;
const cached = await kv.get(cacheKey);

if (cached) {
  console.log('Cache hit - saved AI call');
  return cached;
}

const aiResponse = await callAI(userMessage);
await kv.set(cacheKey, aiResponse, { ex: 86400 }); // 24 hour cache
return aiResponse;
```

**Pre-cache common responses:**
```javascript
const commonResponses = {
  'hello': 'Hello! Welcome to...',
  'hola': '¡Hola! Bienvenido...',
  'services': 'Here are our services...',
  'hours': 'Our hours are...',
  'price': 'Our prices are...'
};

// Check cache first, then AI
if (commonResponses[userMessage.toLowerCase()]) {
  return commonResponses[userMessage.toLowerCase()];
}
```

**Potential savings:** $3-10/month

### 2. Optimize AI Context

**Reduce token usage:**

```javascript
// Bad: Send entire conversation history
const messages = [
  systemPrompt,
  ...allConversationHistory  // Could be 50+ messages
];

// Good: Send only recent context
const messages = [
  systemPrompt,
  summarizedOldContext,  // Summary of old messages
  ...recentMessages.slice(-5)  // Only last 5 messages
];
```

**Shorter system prompts:**
```javascript
// Bad: 500 word system prompt
const systemPrompt = `You are an extremely helpful...`;  // 500 words

// Good: 100 word system prompt
const systemPrompt = `Barbershop booking bot. Services: haircut $25, shave $15. Hours: 9-6. Respond briefly.`;
```

**Potential savings:** $1-3/month

### 3. Batch Calendar Operations

**Reduce API calls:**

```javascript
// Bad: Query availability for each day separately
for (const date of next7Days) {
  const avail = await checkAvailability(date);  // 7 API calls
}

// Good: Query once for date range
const avail = await checkAvailability(startDate, endDate);  // 1 API call
```

**Cache availability:**
```javascript
const cacheKey = `avail:${date}`;
const cached = await kv.get(cacheKey);

if (cached && Date.now() - cached.timestamp < 300000) {  // 5 minutes
  return cached.data;
}

const availability = await fetchFromCalendar(date);
await kv.set(cacheKey, { data: availability, timestamp: Date.now() });
```

**Potential savings:** Negligible (Calendar is free)

### 4. Reduce Session Storage

**Smaller sessions = more fit in free tier:**

```javascript
// Bad: Store everything
const session = {
  phone: '+15551234567',
  conversationHistory: [...],  // All messages
  userProfile: {...},
  analytics: {...},
  metadata: {...}
};  // ~50KB per session

// Good: Store essentials only
const session = {
  phone: '+15551234567',
  lang: 'en',
  history: history.slice(-10),  // Last 10 only
  pending: pendingBooking
};  // ~5KB per session
```

**Potential savings:** Stay within free tier longer

### 5. Implement Rate Limiting

**Prevent abuse and excessive costs:**

```javascript
const rateLimitKey = `rate:${phone}`;
const count = await kv.incr(rateLimitKey);

if (count === 1) {
  await kv.expire(rateLimitKey, 3600);  // 1 hour window
}

if (count > 20) {  // Max 20 messages per hour
  return sendMessage(phone, 'Too many messages. Please wait.');
}
```

**Prevents:**
- Accidental message loops
- Testing gone wrong
- Malicious usage

**Potential savings:** $5-20/month (if abuse occurs)

### 6. Use Vercel Edge Functions

**Faster and cheaper than serverless:**

```javascript
// In api/webhook.js
export const config = {
  runtime: 'edge',  // Use Edge instead of Node.js
};

// Benefits:
// - Faster cold starts
// - Lower costs
// - Global distribution
```

**Potential savings:** 20-30% on compute costs

### 7. Optimize Logging

**Logs cost storage and bandwidth:**

```javascript
// Bad: Log everything in production
console.log('Received message:', fullMessage);
console.log('Session data:', session);
console.log('AI response:', response);

// Good: Log only errors and critical info
if (process.env.NODE_ENV === 'production') {
  console.error('Error:', error.message);  // Errors only
} else {
  console.log('Debug:', details);  // Full logs in dev
}
```

**Potential savings:** $1-5/month on bandwidth

## Monitoring Usage

### Vercel Dashboard

**Check usage regularly:**
```
Dashboard → Analytics → Usage

Monitor:
- Bandwidth (GB)
- Function executions (GB-hours)
- KV commands
- Edge requests
```

**Set up alerts:**
```
Settings → Notifications → Usage Alerts

Alert when:
- 80% of bandwidth used
- 80% of compute used
- 80% of KV commands used
```

### Cost Tracking Script

```javascript
// scripts/cost-tracker.js
const costs = {
  vercel: {
    bandwidth: process.env.VERCEL_BANDWIDTH_GB,
    compute: process.env.VERCEL_COMPUTE_HOURS,
    kv: process.env.VERCEL_KV_COMMANDS
  },
  ai: {
    requests: await getAIRequestCount(),
    estimatedCost: requests * 0.001
  }
};

// Calculate total
const totalCost = calculateTotalCost(costs);

console.log('Estimated monthly cost:', totalCost);

if (totalCost > threshold) {
  sendAlert('Cost exceeding budget!');
}
```

**Run monthly:**
```bash
node scripts/cost-tracker.js
```

### Usage Patterns

**Track these metrics:**

```javascript
// Store daily stats
await kv.hincrby('stats:daily', 'messages', 1);
await kv.hincrby('stats:daily', 'bookings', 1);
await kv.hincrby('stats:daily', 'ai_calls', 1);

// View stats
const stats = await kv.hgetall('stats:daily');
console.log('Daily usage:', stats);
```

## When to Upgrade

### Vercel Pro ($20/month)

**Consider upgrading when:**
- Bandwidth > 100GB/month
- Need > 400 hours compute/month
- Want team collaboration
- Need preview deployments
- Require advanced analytics

**Benefits:**
- 1TB bandwidth
- 1000 hours compute
- Team features
- Priority support

### Vercel KV Paid Plan ($10+/month)

**Consider upgrading when:**
- Storage > 256MB
- Commands > 3000/day
- Need higher performance
- Want data persistence guarantees

**Benefits:**
- 1GB storage ($10)
- 100K commands/day
- Better performance
- Backup features

### When NOT to Upgrade

**Stay on free tier if:**
- < 1000 bookings/month
- < 5000 messages/month
- Everything works fine
- No performance issues

**Most small barbershops never need to upgrade**

## Alternative Options

### Lower Cost Alternatives

#### 1. Self-Host on VPS

**Cost:** $5-10/month (DigitalOcean, Linode)

**Pros:**
- Predictable pricing
- Full control
- No cold starts

**Cons:**
- Need to manage server
- No auto-scaling
- Manual updates
- No built-in DDoS protection

**When to consider:**
- Very high volume (10k+ messages/month)
- Technical expertise
- Want full control

#### 2. Use Cheaper AI Model

**Instead of xAI Grok:**

**Option A: OpenAI GPT-3.5**
- Cost: ~$0.0005 per request (50% cheaper)
- Quality: Slightly lower but acceptable

**Option B: Anthropic Claude Instant**
- Cost: ~$0.0008 per request (20% cheaper)
- Quality: Similar

**Option C: Rule-Based System**
- Cost: $0
- No AI, just keyword matching
- Good for simple interactions

**Implementation:**
```javascript
// Rule-based (free)
function getResponse(message) {
  if (/services|price/i.test(message)) return showServices();
  if (/book|appointment/i.test(message)) return startBooking();
  if (/hours|when/i.test(message)) return showHours();
  return getAIResponse(message);  // Fallback to AI for complex queries
}
```

**Savings:** $3-10/month

#### 3. Reduce Features

**To save costs:**

- Disable AI, use only templates: Save $5-15/month
- Limit to 500 messages/month: Stay in all free tiers
- Manual booking (bot just shows info): Save ~$3/month
- Single language only: Reduce complexity

### Free Tier Strategy

**How to stay 100% free:**

1. Use Vercel free tier (generous enough)
2. Use Vercel KV free tier (optimize sessions)
3. Use Google Calendar free tier (already plenty)
4. **Skip AI entirely** - use templated responses
5. Use WhatsApp test number (for testing)

**Total cost:** $0/month
**Limitation:** Less conversational, more rigid

**Example template-based flow:**
```
User: "Hello"
Bot: "Welcome! Reply with:
  1 - View services
  2 - Check availability
  3 - Book appointment"

User: "1"
Bot: [Shows services]
No AI needed!
```

## Cost Calculators

### Monthly Cost Estimator

**Input your expected usage:**

```javascript
// scripts/cost-calculator.js

const usage = {
  messagesPerMonth: 1000,  // Your estimate
  bookingsPerMonth: 200,
  aiCallsPerBooking: 3,
  avgSessionSize: 5  // KB
};

const costs = {
  vercel: usage.messagesPerMonth > 100000 ? 20 : 0,
  vercelKV: usage.messagesPerMonth > 50000 ? 10 : 0,
  ai: (usage.bookingsPerMonth * usage.aiCallsPerBooking * 0.001),
  whatsapp: 0,  // Free if approved
  calendar: 0   // Always free
};

const total = Object.values(costs).reduce((a, b) => a + b, 0);

console.log('Estimated monthly cost:', `$${total.toFixed(2)}`);
```

**Run calculator:**
```bash
node scripts/cost-calculator.js
```

### ROI Calculator

**Is it worth the cost?**

```
Manual booking time: 5 minutes per booking
Chatbot booking time: 0 minutes (automated)

Savings per booking: 5 minutes
Bookings per month: 200
Total time saved: 1000 minutes = 16.7 hours

If your time is worth: $20/hour
Monthly savings: $334

Chatbot cost: $10/month
Net savings: $324/month

ROI: 3,240% 🚀
```

## Cost Optimization Checklist

- [ ] Enable AI response caching
- [ ] Reduce session data size
- [ ] Implement rate limiting
- [ ] Use Edge functions
- [ ] Minimize logging in production
- [ ] Cache calendar availability
- [ ] Use rule-based responses for common queries
- [ ] Set up usage alerts
- [ ] Monitor costs monthly
- [ ] Optimize system prompts
- [ ] Keep conversation history small
- [ ] Use template responses when possible

## Summary

**Expected Monthly Costs:**

| Barbershop Size | Messages/Mo | Bookings/Mo | Cost |
|----------------|-------------|-------------|------|
| Very Small | <500 | <100 | $2-5 |
| Small | 500-2000 | 100-400 | $5-15 |
| Medium | 2000-5000 | 400-1000 | $15-30 |
| Large | 5000+ | 1000+ | $30-100 |

**Key Takeaways:**
1. Most small barbershops: $5-20/month
2. Free tiers are generous - optimize to stay within them
3. AI is the main cost - cache responses aggressively
4. ROI is excellent even at higher costs
5. Start free, upgrade only when needed

**Next Steps:**
1. Monitor usage for 1 month
2. Implement caching if costs too high
3. Only upgrade if hitting limits
4. Review costs quarterly

---

For more information:
- [SETUP.md](./SETUP.md) - Initial setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration options
