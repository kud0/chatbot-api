# WhatsApp Chatbot Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Meta Business Manager Setup](#meta-business-manager-setup)
- [Google Cloud Setup](#google-cloud-setup)
- [xAI Setup](#xai-setup)
- [Vercel Setup](#vercel-setup)
- [Local Development Setup](#local-development-setup)
- [Testing with WhatsApp Sandbox](#testing-with-whatsapp-sandbox)
- [Deploying to Production](#deploying-to-production)
- [Meta App Review Process](#meta-app-review-process)

## Prerequisites

Before starting, ensure you have:

- **Accounts Required:**
  - Meta Business Manager account (https://business.facebook.com)
  - Google Cloud Platform account (https://console.cloud.google.com)
  - xAI account (https://console.x.ai)
  - Vercel account (https://vercel.com)
  - GitHub account (for deployment)

- **Local Requirements:**
  - Node.js 18.x or higher
  - npm or yarn package manager
  - Git installed
  - Code editor (VS Code recommended)

- **Knowledge:**
  - Basic JavaScript/TypeScript
  - REST API concepts
  - Environment variables
  - Command line basics

## Meta Business Manager Setup

### Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - **App Name:** `Barbershop Booking Bot`
   - **Contact Email:** Your email
   - **Business Account:** Select or create one
5. Click **"Create App"**

### Step 2: Add WhatsApp Product

1. In your app dashboard, click **"Add Products"**
2. Find **WhatsApp** and click **"Set Up"**
3. You'll be redirected to WhatsApp setup page
4. Complete the setup wizard:
   - Select or create a Business Portfolio
   - Add a business phone number (or use the test number)

### Step 3: Get Test Phone Number

1. In WhatsApp setup, find **"Test Number"** section
2. Copy the test phone number (format: +1 555-XXX-XXXX)
3. Save this number - you'll use it for initial testing
4. Add your personal WhatsApp number to the **"To"** field
5. Click **"Send Message"** to verify access

**Important:** Test numbers can only send messages to up to 5 phone numbers that you manually add.

### Step 4: Get Access Token

1. In WhatsApp setup, go to **"Configuration"** → **"API Setup"**
2. Find **"Temporary Access Token"** section
3. Click **"Generate Token"**
4. Copy the token (starts with `EAAE...`)
5. Save this token securely (valid for 24-90 days)

**For Production:**
1. Go to **"Configuration"** → **"Business Verification"**
2. Complete business verification process
3. Request a **System User Access Token** (never expires)
4. Follow Meta's documentation for system user creation

### Step 5: Configure Webhook URL

1. In WhatsApp setup, go to **"Configuration"** → **"Webhook"**
2. Click **"Edit"**
3. Enter your webhook URL:
   ```
   https://your-domain.vercel.app/api/webhook
   ```
4. Enter a **Verify Token** (create a random string, e.g., `my_secure_verify_token_123`)
5. Save the verify token for later
6. Click **"Verify and Save"**

### Step 6: Subscribe to Webhook Fields

1. In Webhook configuration, scroll to **"Webhook Fields"**
2. Subscribe to:
   - ☑ **messages** (required)
   - ☑ **message_status** (optional, for delivery status)
3. Click **"Save"**

## Google Cloud Setup

### Step 1: Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a Project"** → **"New Project"**
3. Enter project details:
   - **Project Name:** `barbershop-booking`
   - **Organization:** Your organization (or leave default)
4. Click **"Create"**
5. Wait for project creation (30-60 seconds)

### Step 2: Enable Calendar API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and click **"Enable"**
4. Wait for API to be enabled

### Step 3: Create Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in service account details:
   - **Name:** `barbershop-calendar-service`
   - **ID:** Auto-generated
   - **Description:** `Service account for WhatsApp booking bot`
4. Click **"Create and Continue"**
5. Grant **"Editor"** role
6. Click **"Continue"** → **"Done"**

### Step 4: Create Service Account Key

1. In Credentials page, find your service account
2. Click on the service account email
3. Go to **"Keys"** tab
4. Click **"Add Key"** → **"Create New Key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. The key file will download automatically
8. Rename it to `google-credentials.json`
9. **KEEP THIS FILE SECURE** - Never commit to Git

### Step 5: Share Calendar

1. Open [Google Calendar](https://calendar.google.com)
2. Create a new calendar or use existing one:
   - Click **"+"** next to **"Other Calendars"**
   - Select **"Create new calendar"**
   - Name: `Barbershop Bookings`
   - Click **"Create Calendar"**
3. Find your calendar in the left sidebar
4. Click **"Settings and sharing"**
5. Scroll to **"Share with specific people"**
6. Click **"Add people"**
7. Paste the service account email from `google-credentials.json` (field: `client_email`)
8. Set permission to **"Make changes to events"**
9. Click **"Send"**

### Step 6: Get Calendar ID

1. In calendar settings, scroll to **"Integrate calendar"**
2. Copy the **"Calendar ID"** (looks like `abc123@group.calendar.google.com`)
3. Save this for environment variables

## xAI Setup

### Step 1: Create xAI Account

1. Go to [xAI Console](https://console.x.ai)
2. Sign up or log in with X (Twitter) account
3. Complete account verification

### Step 2: Get API Key

1. In the console, go to **"API Keys"**
2. Click **"Create New Key"**
3. Give it a name: `Barbershop Chatbot`
4. Copy the API key (starts with `xai-...`)
5. Save this securely - it won't be shown again

### Step 3: Set Usage Limits (Optional)

1. Go to **"Settings"** → **"Billing"**
2. Set a monthly spending limit to prevent cost overruns
3. Add payment method
4. Enable usage alerts

**Cost Estimate:**
- Grok model: ~$0.001 per request
- Typical monthly cost: $5-$20 for small barbershop

## Vercel Setup

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js (or Other)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (if applicable)

### Step 2: Enable Vercel KV

1. In your project, go to **"Storage"** tab
2. Click **"Create Database"**
3. Select **"KV (Redis)"**
4. Choose a name: `barbershop-sessions`
5. Select region (closest to your users)
6. Click **"Create"**
7. Vercel will automatically add environment variables

### Step 3: Enable Vercel AI Gateway (Optional)

1. Go to **"Settings"** → **"AI Gateway"**
2. Click **"Enable AI Gateway"**
3. Configure:
   - **Provider:** xAI
   - **Caching:** Enabled (saves costs)
   - **Rate Limiting:** 60 requests/minute
4. Copy the AI Gateway URL

### Step 4: Add Environment Variables

1. Go to **"Settings"** → **"Environment Variables"**
2. Add the following variables:

```bash
# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Google Calendar
GOOGLE_CALENDAR_ID=your_calendar_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email

# Google Credentials (paste entire JSON as single line)
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}

# xAI Configuration
XAI_API_KEY=xai-your-api-key
XAI_MODEL=grok-beta

# Vercel KV (auto-added by Vercel)
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token

# Business Configuration
BUSINESS_NAME=My Barbershop
BUSINESS_TIMEZONE=America/New_York
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=18:00

# Optional: AI Gateway
AI_GATEWAY_URL=https://your-ai-gateway.vercel.app
```

3. Set environment for: **Production**, **Preview**, **Development**
4. Click **"Save"**

### Step 5: Get Phone Number ID

1. Go back to Meta WhatsApp setup
2. In **"API Setup"**, find **"Phone Number ID"**
3. Copy the number (not the phone number itself, but the ID)
4. Add to `WHATSAPP_PHONE_NUMBER_ID` variable

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/barbershop-chatbot.git
cd barbershop-chatbot
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add all variables from Vercel setup

3. For `GOOGLE_CREDENTIALS`, format as single-line JSON:
   ```bash
   GOOGLE_CREDENTIALS='{"type":"service_account",...}'
   ```

### Step 4: Install Vercel CLI (Optional)

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
```

This automatically pulls environment variables from Vercel.

### Step 5: Run Development Server

```bash
npm run dev
# or
vercel dev
```

The server will start at `http://localhost:3000`

### Step 6: Test Locally with ngrok

To test WhatsApp webhook locally:

1. Install ngrok: https://ngrok.com/download
2. Run ngrok:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update webhook URL in Meta:
   ```
   https://abc123.ngrok.io/api/webhook
   ```
5. Send a WhatsApp message to test

## Testing with WhatsApp Sandbox

### Step 1: Add Test Recipients

1. In Meta WhatsApp setup, go to **"API Setup"**
2. Find **"Send and receive messages"** section
3. Click **"Add recipient phone number"**
4. Enter phone number in international format: `+1234567890`
5. The recipient will receive a code message
6. Reply with the code to verify

### Step 2: Send Test Message

1. Use Meta's **"Send test message"** feature
2. Or send a message from your WhatsApp to the test number
3. Check your local server logs for webhook events

### Step 3: Test Conversation Flows

Test these scenarios:
- Greeting: Send "Hello"
- Service inquiry: "What services do you offer?"
- Booking: "I want to book a haircut for tomorrow at 2pm"
- Check availability: "What times are available on Friday?"
- Cancel booking: "Cancel my appointment"
- Language switch: Send "Español" or "English"

## Deploying to Production

### Step 1: Pre-Deployment Checks

- [ ] All environment variables configured
- [ ] Google Calendar shared with service account
- [ ] Test number working with sandbox
- [ ] Local testing completed
- [ ] Code committed to Git

### Step 2: Deploy to Vercel

**Option A: Automatic Deployment (Recommended)**
1. Push to GitHub main branch:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```
2. Vercel automatically deploys
3. Check deployment status in Vercel dashboard

**Option B: Manual Deployment**
```bash
vercel --prod
```

### Step 3: Update Webhook URL

1. Go to Meta WhatsApp setup
2. Update webhook URL to your Vercel production URL:
   ```
   https://your-project.vercel.app/api/webhook
   ```
3. Verify and save

### Step 4: Test Production

1. Send a message to your test number
2. Check Vercel logs: `vercel logs`
3. Verify calendar integration
4. Test complete booking flow

## Meta App Review Process

**Required for Production Phone Number**

### Step 1: Prepare for Review

1. Complete business verification in Meta
2. Provide:
   - Business documents
   - Website URL
   - Privacy policy
   - Terms of service

### Step 2: Request Permissions

1. In Meta app, go to **"App Review"**
2. Request these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

### Step 3: Provide Use Case

Explain your use case:
```
Our barbershop booking chatbot allows customers to:
- View available services and prices
- Check availability
- Book appointments
- Receive booking confirmations
- Cancel or modify bookings
- Get business information

All messages are initiated by customers. We do not send
promotional or marketing messages.
```

### Step 4: Submit Demo Video

Record a video showing:
1. Customer initiates conversation
2. Bot responds with options
3. Customer books appointment
4. Confirmation is sent
5. Calendar is updated

### Step 5: Add Production Phone Number

After approval:
1. Go to WhatsApp setup → **"Phone Numbers"**
2. Click **"Add Phone Number"**
3. Verify your business phone with SMS/call
4. Update `WHATSAPP_PHONE_NUMBER_ID` in Vercel

### Review Timeline

- Initial review: 2-5 business days
- Additional info requested: 1-3 days per round
- Average total time: 1-2 weeks

## Next Steps

After setup:
1. Read [CONFIGURATION.md](./CONFIGURATION.md) to customize services
2. Review [API.md](./API.md) for integration details
3. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if issues arise
4. See [DEPLOYMENT.md](./DEPLOYMENT.md) for maintenance

## Support Resources

- **Meta WhatsApp Docs:** https://developers.facebook.com/docs/whatsapp
- **Google Calendar API:** https://developers.google.com/calendar
- **xAI Docs:** https://console.x.ai/docs
- **Vercel Docs:** https://vercel.com/docs

## Security Reminders

- Never commit `.env` files to Git
- Rotate access tokens every 90 days
- Use system user tokens in production
- Enable 2FA on all accounts
- Monitor usage and set spending limits
- Regularly review webhook logs
- Keep dependencies updated
