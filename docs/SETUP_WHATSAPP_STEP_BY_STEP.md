# WhatsApp Cloud API Setup - Step by Step Guide

**Time required:** 30-45 minutes
**Cost:** FREE (test mode)

---

## Prerequisites

- [ ] Facebook/Meta account (personal account is fine)
- [ ] Phone number to receive test messages (your personal phone)
- [ ] Email access for verification

---

## Step 1: Create Meta Business Account (5 minutes)

### 1.1 Go to Meta for Developers

Open your browser and go to:
```
https://developers.facebook.com
```

### 1.2 Log In or Sign Up

- Click **"Log In"** (top right)
- Use your Facebook credentials
- If you don't have Facebook, click **"Create Account"**

### 1.3 Accept Terms

- Read and accept the Developer Terms
- Click **"Continue"**

**✅ You're now in the Meta for Developers portal**

---

## Step 2: Create a New App (10 minutes)

### 2.1 Create App

1. Click **"My Apps"** (top right)
2. Click **"Create App"** button (green)

### 2.2 Select Use Case

You'll see options like:
- Consumer
- Business
- Other

**Select:** **"Business"** (or "Other" if Business isn't available)

Click **"Next"**

### 2.3 App Details

Fill in the form:

| Field | Value |
|-------|-------|
| **App Name** | `Barbershop Bot` (or any name you want) |
| **App Contact Email** | Your email address |
| **Business Account** | Create new or select existing |

Click **"Create App"**

### 2.4 Security Check

- Complete the security verification (CAPTCHA)
- Check your email for verification code (if required)
- Enter the code

**✅ App created! You'll see the app dashboard**

---

## Step 3: Add WhatsApp Product (5 minutes)

### 3.1 Find WhatsApp

On your app dashboard, scroll down to find products:

```
Add products to your app
[Facebook Login] [Instagram] [WhatsApp] [Messenger]
```

Find **WhatsApp** card

### 3.2 Add WhatsApp

1. Click **"Set up"** button on WhatsApp card
2. Wait for it to load (10-15 seconds)

**✅ WhatsApp is now added to your app!**

You'll see the WhatsApp setup page with:
- Get Started
- API Setup
- Configuration

---

## Step 4: Get Your Test Phone Number (2 minutes)

### 4.1 Navigate to API Setup

In the left sidebar:
1. Click **"WhatsApp"** to expand
2. Click **"API Setup"**

### 4.2 View Test Number

You'll see a section: **"From" dropdown**

This shows your **test phone number**:
```
+1 555-XXX-XXXX (this is Meta's test number)
```

**Important:** This is NOT your number. This is Meta's test number that will send messages on your behalf.

### 4.3 Get Phone Number ID

Under the phone number dropdown, you'll see:

**Phone number ID:** `123456789012345`

**📝 COPY THIS** - You'll need it later!

```
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

Save this in a text file for now.

---

## Step 5: Get Your Access Token (3 minutes)

### 5.1 Find Access Token Section

On the same "API Setup" page, scroll down to:

**"Temporary access token"**

You'll see a token like:
```
EAABsbCS1iHgBOZC8za...  (very long string)
```

### 5.2 Copy Token

1. Click the **"Copy"** button next to the token
2. **📝 SAVE THIS** to your text file

```
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBOZC8za...
```

**⚠️ Important Notes:**
- This is a **temporary token** (24-72 hours)
- For testing only
- We'll get a permanent token later
- Keep this SECRET (never share publicly)

---

## Step 6: Add Your Test Phone Number (5 minutes)

### 6.1 Add Test Recipient

On the "API Setup" page, find:

**"To" section** (Send and receive messages)

You'll see:
```
To: [Manage phone number list]
```

Click **"Manage phone number list"**

### 6.2 Add Your Phone

1. Click **"Add phone number"** button
2. Enter YOUR personal phone number
   - Country code + number
   - Example: `+34 612 345 678` (Spain)
   - Example: `+1 555 123 4567` (USA)
3. Click **"Send code"**

### 6.3 Verify Your Phone

1. **Check WhatsApp** on your phone
2. You'll receive a message from WhatsApp
3. It contains a **6-digit code**
4. Enter the code in the Meta dashboard
5. Click **"Verify"**

**✅ Your phone is now verified!**

You can now receive test messages on this number.

---

## Step 7: Send a Test Message (2 minutes)

Let's verify everything works!

### 7.1 Send Test from Dashboard

On the "API Setup" page:

1. **From:** (should show your test number)
2. **To:** (select your verified phone number)
3. **Message:** Click **"Send message"** button

### 7.2 Check Your Phone

**Open WhatsApp on your phone**

You should see a message from:
```
+1 555-XXX-XXXX
Hello World!
```

**✅ If you received it, WhatsApp is working!**

---

## Step 8: Configure Webhook (LATER - After Deployment)

**⚠️ SKIP THIS FOR NOW**

We'll do this AFTER deploying to Vercel. For now, just understand:

- Webhook = URL where WhatsApp sends incoming messages
- Format: `https://your-app.vercel.app/api/webhook/whatsapp`
- We'll set this up in Step 10

---

## Step 9: Create Webhook Verify Token (1 minute)

You need to create a secret password for webhook verification.

### 9.1 Generate a Random String

**Option A:** Use your own
```
my_super_secret_webhook_token_12345
```

**Option B:** Generate random (recommended)
```bash
# On Mac/Linux terminal:
openssl rand -base64 32

# Or use this online:
# https://passwordsgenerator.net/
# Settings: 32 characters, letters + numbers
```

### 9.2 Save It

**📝 COPY AND SAVE:**
```
WHATSAPP_WEBHOOK_SECRET=your_generated_secret_here
```

Add to your text file with other credentials.

---

## Step 10: Get Permanent Access Token (Optional - Production Only)

**⚠️ SKIP FOR NOW - Only for production**

The temporary token expires. For production, you'll need a permanent token.

### Later Steps (after testing):

1. Create a **System User** in Business Settings
2. Generate a **permanent token**
3. Assign appropriate permissions

For now, the temporary token is fine for testing!

---

## Summary - What You Should Have Now

**📝 Your credentials (save these):**

```bash
# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=123456789012345  # From Step 4
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO...   # From Step 5
WHATSAPP_WEBHOOK_SECRET=my_secret_token   # From Step 9

# Test Phone
Your personal phone: +34 612 345 678       # From Step 6 (verified)
```

---

## Next Steps

Now that WhatsApp is set up, you need:

1. ✅ WhatsApp credentials (DONE!)
2. ⏳ xAI API key (Next)
3. ⏳ Google Calendar setup (After xAI)
4. ⏳ Deploy to Vercel (Final step)

---

## Testing Notes

**Current status:**
- ✅ You can SEND messages from Meta dashboard to your phone
- ❌ You can't RECEIVE messages yet (webhook not configured)
- ❌ Chatbot won't respond yet (not deployed)

**After deployment:**
- ✅ You can send messages TO the bot
- ✅ Bot will respond automatically
- ✅ Full conversation works!

---

## Troubleshooting

### Problem: Can't verify phone number

**Solution:**
1. Make sure WhatsApp is installed on your phone
2. Phone number must match exactly (country code!)
3. Check spam/unknown senders in WhatsApp
4. Try a different phone number

### Problem: Token expired

**Solution:**
1. Go back to API Setup page
2. Click "Generate new token"
3. Copy the new token
4. Update in your environment variables

### Problem: Can't find WhatsApp product

**Solution:**
1. Make sure you selected "Business" app type
2. Try creating a new app
3. Check if your account is restricted (verify email)

### Problem: Phone number already used

**Solution:**
1. Each phone can only be verified for ONE app at a time
2. Remove it from previous apps
3. Or use a different phone number

---

## Important Warnings

### ⚠️ Security

- **NEVER** share your access token publicly
- **DON'T** commit it to GitHub
- **USE** environment variables only

### ⚠️ Rate Limits (Free Tier)

- **Sending:** 1,000 free messages per month
- **Conversations:** 1,000 free conversations per month
- **Test recipients:** Max 5 phone numbers

### ⚠️ Test vs Production

**Test Mode (now):**
- Can only message verified test numbers (max 5)
- Messages show "Test" badge
- Free forever
- Limited features

**Production Mode (later):**
- Can message ANY WhatsApp number
- No "Test" badge
- Requires Meta Business Verification (1-3 days)
- First 1,000 conversations free, then pay

---

## Quick Reference

### Find Your Credentials

1. **Phone Number ID:**
   - WhatsApp → API Setup → Phone number ID

2. **Access Token:**
   - WhatsApp → API Setup → Temporary access token

3. **Test Your Number:**
   - WhatsApp → API Setup → "To" section → Manage list

### Common URLs

- **Meta for Developers:** https://developers.facebook.com
- **Your Apps:** https://developers.facebook.com/apps
- **Business Manager:** https://business.facebook.com

---

## Status Check

After completing this guide, you should have:

- ✅ Meta Developer account
- ✅ App created
- ✅ WhatsApp product added
- ✅ Phone Number ID (saved)
- ✅ Access Token (saved)
- ✅ Webhook Secret (created and saved)
- ✅ Test phone verified
- ✅ Successfully sent test message

**Ready for next step: xAI API setup!**

---

## Still Stuck?

1. Check Meta's official guide: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
2. Watch a video tutorial on YouTube: "WhatsApp Cloud API setup"
3. Ask in Meta Developers Community
4. Check troubleshooting section above

Good luck! 🚀
