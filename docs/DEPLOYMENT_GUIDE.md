# Complete Deployment Guide

## Overview

Your project has TWO parts that deploy TOGETHER to Vercel:
1. **Website** (Astro frontend) - Customer-facing pages
2. **Chatbot** (API backend) - WhatsApp message handler

Both are in the same codebase and deploy as one unified project.

---

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Everything
```bash
# From project root
vercel --prod
```

That's it! ✅

**Result:**
- Website: `https://your-project.vercel.app`
- Chatbot API: `https://your-project.vercel.app/api/webhook/whatsapp`

---

## 📋 Detailed Step-by-Step

### Prerequisites

Before deploying, you need:

1. ✅ **GitHub account** (free)
2. ✅ **Vercel account** (free) - https://vercel.com/signup
3. ✅ **WhatsApp Business account** (setup after deployment)
4. ✅ **Google Calendar service account** (setup after deployment)
5. ✅ **xAI API key** (https://console.x.ai)

---

## Method 1: GitHub Integration (Recommended) ⭐

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Barbershop WhatsApp chatbot"

# Create GitHub repo at https://github.com/new
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/barbershop-bot.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Click "Import"
5. **Configure project:**
   - Framework Preset: **Astro** (auto-detected)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)

6. **Add Environment Variables** (CRITICAL):

Click "Environment Variables" and add these:

```bash
# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here
WHATSAPP_WEBHOOK_SECRET=your_secret_here

# xAI Configuration
XAI_API_KEY=your_xai_api_key_here

# Google Calendar Configuration
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account"...}
CALENDAR_ID=your_calendar_id@gmail.com

# Environment
NODE_ENV=production
```

**Where to get these values?** See "Environment Variables Setup" section below.

7. Click **"Deploy"**

8. Wait 2-3 minutes... ☕

9. **Done!** Your site is live at `https://your-project.vercel.app`

### Step 3: Enable Vercel KV (Redis)

1. In Vercel dashboard → Your project
2. Go to "Storage" tab
3. Click "Create Database"
4. Select "KV" (Redis)
5. Name it: `barbershop-sessions`
6. Click "Create"
7. **Vercel automatically adds** `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your environment variables

### Step 4: Auto-Deploy on Every Push

✅ Already configured! Every time you push to GitHub, Vercel auto-deploys.

```bash
# Make a change
edit src/config/barbershop.json

# Push
git add .
git commit -m "Update services"
git push

# Vercel automatically redeploys! 🚀
```

---

## Method 2: Vercel CLI (Manual Deploy)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```

### Step 3: Link Project (First Time Only)
```bash
# From project root
vercel link
```

Follow prompts:
- Set up and deploy? **Y**
- Scope? Select your account
- Link to existing project? **N** (first time)
- Project name? `barbershop-whatsapp-bot`
- Directory? `.` (current)

### Step 4: Add Environment Variables
```bash
# Option A: Through dashboard
vercel env add WHATSAPP_ACCESS_TOKEN

# Option B: Pull existing .env file
# (After setting up in dashboard first)
vercel env pull
```

### Step 5: Deploy to Production
```bash
vercel --prod
```

### Step 6: Enable Vercel KV
```bash
# Create KV database
vercel kv create barbershop-sessions

# Link to project
vercel env pull
```

---

## Environment Variables Setup

### 1. WhatsApp Cloud API

**Get these values:**

1. Go to https://developers.facebook.com
2. Create a Meta app (or use existing)
3. Add WhatsApp product
4. Go to WhatsApp → Getting Started

**Copy these values:**

```bash
# Phone Number ID (from "To" dropdown)
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Access Token (click "Generate" or use existing)
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxx

# Webhook Secret (YOU create this - random string)
WHATSAPP_WEBHOOK_SECRET=my_super_secret_key_12345
```

**Important:** Keep these SECRET!

### 2. xAI API Key

1. Go to https://console.x.ai
2. Sign up / Login
3. Go to API Keys
4. Click "Create API Key"
5. Copy the key

```bash
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Set usage limit:** $5/month (in xAI dashboard)

### 3. Google Calendar

**Create Service Account:**

1. Go to https://console.cloud.google.com
2. Create new project (or select existing)
3. Enable "Google Calendar API"
4. Go to "Credentials"
5. Click "Create Credentials" → "Service Account"
6. Name it: `barbershop-calendar-bot`
7. Click "Create and Continue"
8. Skip optional steps → "Done"
9. Click on the service account you just created
10. Go to "Keys" tab
11. Click "Add Key" → "Create new key"
12. Select **JSON** → "Create"
13. A JSON file downloads

**Use the JSON file:**

```bash
# Open the downloaded JSON file
# Copy the ENTIRE contents (all the JSON)
# Paste as ONE LINE in environment variable

GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n..."}
```

**Share Calendar:**

1. Open Google Calendar
2. Create a new calendar: "Barbershop Bookings"
3. Settings → "Share with specific people"
4. Add the service account email (from JSON file):
   `barbershop-calendar-bot@project-id.iam.gserviceaccount.com`
5. Permission: **"Make changes to events"**
6. Copy the Calendar ID (Settings → Integrate):

```bash
CALENDAR_ID=abcd1234@group.calendar.google.com
```

### 4. Node Environment

```bash
NODE_ENV=production
```

---

## Configure WhatsApp Webhook

After deploying, you need to tell WhatsApp where to send messages.

### Step 1: Get Your Webhook URL

After Vercel deployment, your webhook URL is:
```
https://your-project.vercel.app/api/webhook/whatsapp
```

**Find it:** Vercel deployment → "Visit" button → Copy URL → Add `/api/webhook/whatsapp`

### Step 2: Configure in Meta Dashboard

1. Go to https://developers.facebook.com
2. Your App → WhatsApp → Configuration
3. Under "Webhook", click "Edit"
4. **Callback URL:** `https://your-project.vercel.app/api/webhook/whatsapp`
5. **Verify Token:** Use the same value as `WHATSAPP_WEBHOOK_SECRET`
6. Click "Verify and Save"

If successful: ✅ "Webhook verified"

### Step 3: Subscribe to Messages

1. Scroll down to "Webhook fields"
2. Click "Manage"
3. **Subscribe to:**
   - ✅ messages
   - ✅ message_status (optional)
4. Click "Save"

---

## Testing Your Deployment

### Test 1: Website is Live

1. Visit `https://your-project.vercel.app`
2. Should see: "Barbería El Clásico" homepage
3. Should see: Green WhatsApp button (bottom-right)
4. Click button → Should open WhatsApp
5. ✅ Website works!

### Test 2: Chatbot is Live

**Option A: WhatsApp Test Number**

1. In Meta dashboard → WhatsApp → API Setup
2. Under "Send and receive messages"
3. Add your phone number to test recipients
4. Send a test message from your phone
5. Should receive automated response
6. ✅ Chatbot works!

**Option B: Direct API Test**

```bash
# Test webhook is accessible
curl https://your-project.vercel.app/api/webhook/whatsapp

# Should return: Method not allowed or webhook verification response
```

### Test 3: Calendar Integration

1. Send message via WhatsApp: "Quiero un corte de pelo mañana a las 10am"
2. Follow chatbot conversation
3. Complete booking
4. Check Google Calendar → Should see new event
5. ✅ Calendar works!

### Test 4: Session Storage (Vercel KV)

1. Start a conversation in WhatsApp
2. Send a message
3. Wait 5 seconds
4. Send another message
5. Chatbot should remember context
6. ✅ KV works!

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs
```

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click latest deployment
5. View **Function Logs** for debugging

### Check Errors

Look for:
- ✅ WhatsApp webhook calls (200 status)
- ❌ 500 errors (check environment variables)
- ⚠️ API rate limits
- ⚠️ Calendar authentication errors

---

## Common Issues & Solutions

### Issue 1: Webhook Not Verified

**Error:** "Unable to verify webhook"

**Solution:**
1. Check `WHATSAPP_WEBHOOK_SECRET` matches in:
   - Vercel environment variables
   - Meta dashboard verify token
2. Ensure URL is correct: `/api/webhook/whatsapp`
3. Try redeploying: `vercel --prod`

### Issue 2: No Response from Chatbot

**Error:** Messages sent but no reply

**Solution:**
1. Check Vercel logs: `vercel logs`
2. Verify `XAI_API_KEY` is correct
3. Check KV database is created and linked
4. Ensure webhook is subscribed to "messages"

### Issue 3: Calendar Booking Fails

**Error:** "Failed to create booking"

**Solution:**
1. Verify `GOOGLE_SERVICE_ACCOUNT_JSON` is valid JSON
2. Check calendar is shared with service account email
3. Verify `CALENDAR_ID` is correct
4. Check Google Cloud Calendar API is enabled

### Issue 4: Environment Variables Not Working

**Error:** "undefined" in logs

**Solution:**
```bash
# Pull latest env vars
vercel env pull

# Check if they're set
vercel env ls

# Redeploy after adding vars
vercel --prod
```

---

## Update Phone Number

### In barbershop.json:

```json
{
  "contact": {
    "phone": "+34912345678"  ← Update this
  }
}
```

### Deploy:
```bash
git add src/config/barbershop.json
git commit -m "Update phone number"
git push  # Auto-deploys if using GitHub integration
```

---

## Costs Checklist

All these are FREE for your usage:

- ✅ Vercel Hosting: FREE (Hobby plan)
- ✅ Vercel Functions: FREE (100 GB-hours/month)
- ✅ Vercel KV: FREE (256 MB + 200K commands/month)
- ✅ WhatsApp Cloud API: FREE (1,000 conversations/month)
- ✅ xAI Grok-4-fast: ~$0.01/month (100 messages)
- ✅ Google Calendar API: FREE (1M requests/day)

**Total: ~$0.01/month** 🎉

---

## Production Checklist

Before going live with customers:

### Security
- [ ] All environment variables set
- [ ] Webhook secret is strong (20+ characters)
- [ ] Service account JSON is secure (not in code)
- [ ] `.env` is in `.gitignore`

### Configuration
- [ ] Phone number updated in `barbershop.json`
- [ ] Business hours are correct
- [ ] Services and prices are accurate
- [ ] Calendar ID is correct

### Testing
- [ ] Website loads correctly
- [ ] WhatsApp buttons work
- [ ] Chatbot responds to messages
- [ ] Calendar bookings work
- [ ] Confirmations are sent
- [ ] Multi-language works (Spanish/English)

### Meta Approval
- [ ] Submit app for review (if using production WhatsApp)
- [ ] Provide test credentials
- [ ] Wait 1-3 days for approval

### Monitoring
- [ ] Set up Vercel notifications (deploy failures)
- [ ] Check logs daily (first week)
- [ ] Monitor xAI usage (set $5 limit)
- [ ] Test bookings weekly

---

## Going Live 🚀

### Phase 1: Test Mode (Now)
- Use Meta test phone number
- Test with friends/family
- Verify everything works
- Cost: $0

### Phase 2: Production (After Testing)
1. Submit Meta app for review
2. Get approved (1-3 days)
3. Switch to production WhatsApp number
4. Add phone number to website
5. **Announce to customers!**

### Phase 3: Scale (When Busy)
- Monitor usage in Vercel dashboard
- If exceeding free tiers, upgrade (still cheap)
- Add analytics (optional)
- Consider paid features (appointments reminders, etc.)

---

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Pull environment variables
vercel env pull

# Check environment variables
vercel env ls

# Link local project to Vercel
vercel link

# Run local dev
npm run dev

# Build locally (test before deploy)
npm run build

# Run tests
npm test
```

---

## Support & Resources

**Documentation:**
- Vercel Docs: https://vercel.com/docs
- WhatsApp API: https://developers.facebook.com/docs/whatsapp
- xAI Docs: https://docs.x.ai
- Google Calendar API: https://developers.google.com/calendar

**Your Project Docs:**
- Setup: `/docs/SETUP.md`
- API Reference: `/docs/API.md`
- Troubleshooting: `/docs/TROUBLESHOOTING.md`
- Architecture: `/docs/ARCHITECTURE.md`

**Need Help?**
- Check logs: `vercel logs`
- Read troubleshooting guide
- Test locally: `npm run dev`
- Verify environment variables

---

## Success! 🎉

Once deployed and tested, you have:

✅ Professional website with WhatsApp integration
✅ 24/7 AI chatbot for customer service
✅ Automatic appointment booking
✅ Google Calendar synchronization
✅ Multi-language support
✅ All for ~$0.01/month

**Congratulations!** Your barbershop is now tech-enabled and ready to serve customers automatically! 💈🤖
