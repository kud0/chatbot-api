# Dependencies Guide

Required npm packages for the WhatsApp Chatbot Barbershop Booking System.

## Installation

```bash
npm install @ai-sdk/xai ai @vercel/kv googleapis
```

---

## Core Dependencies

### 1. **@ai-sdk/xai** (v1.0.0+)
**Purpose**: xAI provider for Vercel AI SDK

**Usage**: Connect to xAI's Grok models
```javascript
import { xai } from '@ai-sdk/xai';
```

**Documentation**: https://sdk.vercel.ai/providers/ai-sdk-providers/xai

---

### 2. **ai** (v4.0.0+)
**Purpose**: Vercel AI SDK core library

**Usage**: Generate text with AI models
```javascript
import { generateText } from 'ai';

const { text } = await generateText({
  model: xai('grok-2-1212'),
  messages: [...],
  temperature: 0.7
});
```

**Documentation**: https://sdk.vercel.ai/

---

### 3. **@vercel/kv** (v3.0.0+)
**Purpose**: Vercel KV (Redis) client

**Usage**: Session and conversation state management
```javascript
import { kv } from '@vercel/kv';

await kv.set('key', value, { ex: 86400 });
const data = await kv.get('key');
```

**Documentation**: https://vercel.com/docs/storage/vercel-kv

---

### 4. **googleapis** (v140.0.0+)
**Purpose**: Google Calendar API client

**Usage**: Manage appointments and availability
```javascript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {...},
  scopes: ['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({ version: 'v3', auth });
```

**Documentation**: https://github.com/googleapis/google-api-nodejs-client

---

## Development Dependencies

### Recommended
```bash
npm install --save-dev @types/node typescript
```

- **@types/node**: TypeScript definitions for Node.js
- **typescript**: TypeScript compiler (if using TypeScript)

---

## Package.json Example

```json
{
  "name": "whatsapp-barbershop-chatbot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vercel dev",
    "build": "vercel build",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "@ai-sdk/xai": "^1.0.2",
    "ai": "^4.0.0",
    "@vercel/kv": "^3.0.0",
    "googleapis": "^140.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Environment Requirements

### Node.js Version
- **Minimum**: Node.js 18.x
- **Recommended**: Node.js 20.x (LTS)

### Vercel Runtime
- Uses Vercel's serverless functions
- Automatic Node.js version detection
- Edge runtime compatible (if needed)

---

## API Rate Limits

### xAI Grok API
- Rate limits vary by plan
- Monitor usage in xAI dashboard
- Implement exponential backoff

### Google Calendar API
- Default: 1,000,000 queries/day
- 10,000 queries per 100 seconds per user
- Batch requests recommended for high volume

### WhatsApp Cloud API
- Varies by business verification tier
- Monitor in Meta Business Manager
- Implement queue for high traffic

### Vercel KV
- Based on your Vercel plan
- Hobby: Limited operations
- Pro: Higher limits
- Enterprise: Custom limits

---

## Optional Dependencies

### For Production Monitoring

```bash
npm install @sentry/node
```

**Sentry Error Tracking**:
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### For Testing

```bash
npm install --save-dev jest @testing-library/node
```

### For Linting

```bash
npm install --save-dev eslint prettier
```

---

## Version Compatibility

| Package | Minimum | Recommended | Notes |
|---------|---------|-------------|-------|
| @ai-sdk/xai | 1.0.0 | Latest | Active development |
| ai | 4.0.0 | Latest | Stable API |
| @vercel/kv | 3.0.0 | Latest | Redis compatible |
| googleapis | 130.0.0 | Latest | Calendar v3 API |
| Node.js | 18.0.0 | 20.x LTS | Required for fetch API |

---

## Security Considerations

### Package Auditing
```bash
npm audit
npm audit fix
```

### Regular Updates
```bash
npm outdated
npm update
```

### Lock File
Always commit `package-lock.json` to ensure consistent installations.

---

## Troubleshooting

### Module Resolution Issues
If using ES modules, ensure `package.json` has:
```json
{
  "type": "module"
}
```

### TypeScript Errors
Install type definitions:
```bash
npm install --save-dev @types/node
```

### Vercel KV Connection
Ensure environment variables are set:
```bash
vercel env pull .env.local
```

---

## Alternative Providers

### Instead of xAI:
- OpenAI: `npm install @ai-sdk/openai`
- Anthropic: `npm install @ai-sdk/anthropic`
- Google: `npm install @ai-sdk/google`

### Instead of Vercel KV:
- Upstash Redis: `npm install @upstash/redis`
- Redis: `npm install redis`

### Instead of googleapis:
- Microsoft Graph (Outlook Calendar): `npm install @microsoft/microsoft-graph-client`

---

## Documentation Links

- Vercel AI SDK: https://sdk.vercel.ai/
- xAI Documentation: https://docs.x.ai/
- Google Calendar API: https://developers.google.com/calendar
- Vercel KV: https://vercel.com/docs/storage/vercel-kv
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api

---

## Support

For dependency issues:
1. Check npm documentation
2. Review package GitHub issues
3. Verify version compatibility
4. Test in clean environment
5. Report bugs to respective repositories
