# WhatsApp Chatbot API Setup Guide

Complete setup instructions for the barbershop booking system.

## Table of Contents
1. [WhatsApp Cloud API Setup](#whatsapp-cloud-api-setup)
2. [Google Calendar API Setup](#google-calendar-api-setup)
3. [xAI Grok Setup](#xai-grok-setup)
4. [Vercel KV Setup](#vercel-kv-setup)
5. [Deployment](#deployment)
6. [Testing](#testing)

---

## WhatsApp Cloud API Setup

### 1. Create Meta for Developers Account
1. Go to https://developers.facebook.com/
2. Create or log into your developer account
3. Click "Create App"

### 2. Configure WhatsApp Business
1. Select "Business" as app type
2. Add WhatsApp product to your app
3. Go to WhatsApp > API Setup

### 3. Get Required Credentials
- **Phone Number ID**: Found in API Setup section
- **Access Token**: Generate a permanent token (recommended)
- **Webhook Verify Token**: Create your own random string
- **Webhook Secret**: Found in Webhooks configuration

### 4. Configure Webhook
1. Set webhook URL: `https://your-domain.vercel.app/api/webhook/whatsapp`
2. Use your custom verify token
3. Subscribe to `messages` webhook field

### 5. Test Phone Number
- Use the test number provided by Meta
- Later, add your business phone number verification

---

## Google Calendar API Setup

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google Calendar API

### 2. Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name it (e.g., "barbershop-booking")
4. Grant role: "Editor" or "Calendar Administrator"
5. Create and download JSON key

### 3. Share Calendar with Service Account
1. Open Google Calendar
2. Go to calendar settings
3. Share with service account email
4. Grant "Make changes to events" permission

### 4. Extract Credentials
From the downloaded JSON:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

**Important**: Keep the `\n` characters in the private key

---

## xAI Grok Setup

### 1. Get API Access
1. Visit https://x.ai/
2. Sign up for API access
3. Generate API key

### 2. Configure Model
The system uses `grok-2-1212` model by default.

Supported models:
- `grok-2-1212` (recommended)
- `grok-beta`
- `grok-vision-beta`

### 3. Set Environment Variable
```bash
XAI_API_KEY=your_api_key_here
```

---

## Vercel KV Setup

### 1. Add KV Storage to Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add KV storage
vercel kv create
```

### 2. Environment Variables
Vercel automatically sets these when you add KV:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

No manual configuration needed!

---

## Deployment

### 1. Install Dependencies
```bash
npm install @ai-sdk/xai ai @vercel/kv googleapis
```

### 2. Set Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp docs/.env.example .env.local
```

Fill in all required values.

### 3. Deploy to Vercel
```bash
# Deploy
vercel --prod

# Add environment variables
vercel env add WHATSAPP_ACCESS_TOKEN
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
vercel env add XAI_API_KEY
# ... add all other variables
```

### 4. Update WhatsApp Webhook URL
Set webhook to: `https://your-app.vercel.app/api/webhook/whatsapp`

---

## Testing

### 1. Test Webhook Verification
```bash
curl "https://your-app.vercel.app/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=TEST"
```

Should return: `TEST`

### 2. Test Chat Processor
```bash
curl -X POST https://your-app.vercel.app/api/chat/process \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hola, quiero una cita",
    "contactName": "Test User"
  }'
```

### 3. Test Availability Check
```bash
curl "https://your-app.vercel.app/api/calendar/availability?date=2025-11-01&serviceId=haircut"
```

### 4. Test Booking
```bash
curl -X POST https://your-app.vercel.app/api/calendar/book \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "customerName": "Test Customer",
    "serviceId": "haircut",
    "dateTime": "2025-11-01T10:00:00",
    "language": "es"
  }'
```

### 5. Send Test WhatsApp Message
Send a message to your WhatsApp Business number:
```
Hola, necesito un corte de cabello
```

Check logs:
```bash
vercel logs --follow
```

---

## Troubleshooting

### WhatsApp Webhook Not Receiving Messages
- Verify webhook URL is correct
- Check webhook signature verification
- Ensure webhook subscriptions include "messages"
- Review WhatsApp Cloud API webhook logs

### Google Calendar Errors
- Verify service account has calendar access
- Check calendar ID in `barbershop.json`
- Ensure private key format is correct (with `\n`)
- Verify API is enabled in Google Cloud Console

### Grok API Errors
- Check API key is valid
- Verify model name is correct
- Monitor rate limits
- Check xAI service status

### Redis/KV Connection Issues
- Ensure KV is added to Vercel project
- Verify environment variables are set
- Check Vercel KV dashboard for errors

---

## Security Best Practices

1. **Never commit secrets**
   - Use `.gitignore` for `.env` files
   - Use Vercel environment variables

2. **Rotate credentials regularly**
   - WhatsApp access tokens
   - API keys
   - Service account keys

3. **Implement rate limiting**
   - Use Vercel's built-in rate limiting
   - Monitor API usage

4. **Validate all inputs**
   - Phone numbers
   - Dates and times
   - Service IDs

5. **Monitor logs**
   - Set up error tracking (Sentry)
   - Review Vercel logs regularly

---

## Support

For issues or questions:
- WhatsApp API: https://developers.facebook.com/docs/whatsapp
- Google Calendar API: https://developers.google.com/calendar
- xAI: https://docs.x.ai/
- Vercel: https://vercel.com/docs

---

## Next Steps

1. Customize `src/config/barbershop.json` with your business details
2. Test all endpoints thoroughly
3. Set up monitoring and alerts
4. Add analytics (optional)
5. Implement additional features:
   - Appointment reminders
   - Customer feedback
   - Loyalty program
   - Multi-staff scheduling
