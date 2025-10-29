# Quick Reference Guide

Fast lookup for developers working with the WhatsApp Chatbot API.

---

## 🔗 Endpoints at a Glance

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhook/whatsapp` | GET | Webhook verification |
| `/api/webhook/whatsapp` | POST | Receive WhatsApp messages |
| `/api/chat/process` | POST | Process with AI |
| `/api/calendar/availability` | GET | Check available slots |
| `/api/calendar/book` | POST | Create booking |
| `/api/calendar/cancel` | POST | Cancel booking |

---

## ⚡ Quick Commands

### Deploy to Vercel
```bash
vercel --prod
```

### Set Environment Variable
```bash
vercel env add WHATSAPP_ACCESS_TOKEN
```

### View Logs
```bash
vercel logs --follow
```

### Test Availability
```bash
curl "https://your-app.vercel.app/api/calendar/availability?date=2025-11-01&serviceId=haircut"
```

### Test Booking
```bash
curl -X POST https://your-app.vercel.app/api/calendar/book \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","customerName":"Test","serviceId":"haircut","dateTime":"2025-11-01T10:00:00","language":"es"}'
```

---

## 🔑 Environment Variables

```bash
# WhatsApp (4 variables)
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
WHATSAPP_WEBHOOK_SECRET

# Google Calendar (2 variables)
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

# xAI (1 variable)
XAI_API_KEY

# Vercel KV (4 variables - auto-configured)
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
```

---

## 📦 Install Dependencies

```bash
npm install @ai-sdk/xai ai @vercel/kv googleapis
```

---

## 🎯 Intent Types

- `INFO_REQUEST` - Service/price questions
- `CHECK_AVAILABILITY` - Wants to see times
- `BOOK_APPOINTMENT` - Ready to book
- `CONFIRM_BOOKING` - Confirming details
- `CANCEL_MODIFY` - Cancel/change booking
- `GENERAL` - Casual conversation

---

## 🛠 Utility Functions

### WhatsApp (`src/utils/whatsapp.js`)
```javascript
verifyWebhookSignature(signature, body, secret)
extractMessageData(body)
sendWhatsAppMessage(phone, message, accessToken, phoneNumberId)
markMessageAsRead(messageId, accessToken, phoneNumberId)
sendTypingIndicator(phone, accessToken, phoneNumberId)
```

### Vercel KV (`src/utils/kv.js`)
```javascript
getConversation(phoneNumber)
saveConversation(phoneNumber, context, ttl)
appendMessage(phoneNumber, message)
updateConversationMetadata(phoneNumber, metadata)
createBookingHold(dateTime, phoneNumber)
isSlotHeld(dateTime)
releaseBookingHold(dateTime)
getBookingHistory(phoneNumber)
addBookingToHistory(phoneNumber, booking)
clearConversation(phoneNumber)
```

### Calendar (`src/utils/calendar.js`)
```javascript
getCalendarClient()
getEvents(calendarId, startDate, endDate)
createEvent(calendarId, eventData)
deleteEvent(calendarId, eventId)
updateEvent(calendarId, eventId, updates)
isSlotAvailable(calendarId, startTime, endTime)
findEventsByPhone(calendarId, phoneNumber, fromDate)
```

---

## 🔍 Error Status Codes

- `200` - Success
- `201` - Created (booking)
- `400` - Bad request (invalid input)
- `403` - Forbidden (auth failed)
- `404` - Not found
- `405` - Method not allowed
- `409` - Conflict (slot taken)
- `500` - Server error

---

## 🚦 Rate Limits (Recommended)

- Webhook: 100/min per phone
- Chat: 30/min per phone
- Availability: 60/min
- Booking: 10/min per phone

---

## 📅 Date/Time Formats

**Input**: ISO 8601
```
2025-11-01T10:00:00
```

**Query**: YYYY-MM-DD
```
2025-11-01
```

**Display**: Localized
```javascript
new Date().toLocaleDateString('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
```

---

## 🔒 Security Checklist

- [x] Webhook signature verification
- [x] Input validation
- [x] Environment variables
- [x] Error sanitization
- [x] Rate limiting
- [x] SQL injection prevention
- [x] XSS prevention

---

## 🐛 Common Issues

### Webhook not receiving messages
- Check webhook URL in Meta dashboard
- Verify signature verification
- Check environment variables
- Review Vercel logs

### Calendar API errors
- Verify service account credentials
- Check calendar sharing permissions
- Ensure API is enabled

### AI not responding
- Check xAI API key
- Verify model name is correct
- Check rate limits

### Redis connection issues
- Ensure KV is added to project
- Verify environment variables
- Check Vercel KV dashboard

---

## 📊 File Sizes

- `/api/webhook/whatsapp.js` - 220 lines
- `/api/chat/process.js` - 340 lines
- `/api/calendar/availability.js` - 250 lines
- `/api/calendar/book.js` - 250 lines
- `/api/calendar/cancel.js` - 80 lines
- **Total**: ~1,360 lines

---

## 🎨 Services Available

1. `haircut` - Corte de pelo (30 min, €25)
2. `beard-trim` - Arreglo de barba (15 min, €10)
3. `haircut-beard-combo` - Corte + Barba (45 min, €30)
4. `hair-coloring` - Tinte de pelo (60 min, €40)
5. `kids-haircut` - Corte infantil (20 min, €15)
6. `hot-towel-shave` - Afeitado tradicional (25 min, €20)

---

## 🌐 Languages

- `es` - Spanish (default)
- `en` - English

Auto-detected from user's first message.

---

## 📈 Monitoring

```bash
# Real-time logs
vercel logs --follow

# Specific deployment
vercel logs [deployment-url]

# Production only
vercel logs --prod
```

---

## 🔄 Workflow

```
User → WhatsApp → Webhook → Chat Processor → AI Response
                              ↓
                         Availability Check → Booking → Confirmation
```

---

## 📞 Support Links

- [WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)
- [Google Calendar API](https://developers.google.com/calendar)
- [xAI Documentation](https://docs.x.ai/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)

---

## ⚡ Performance Targets

- Webhook: <200ms
- Chat AI: 1-3s
- Availability: 500ms-1s
- Booking: 1-2s

---

## 🎯 Next Steps After Deployment

1. Update webhook URL in Meta
2. Send test message
3. Check logs
4. Verify calendar sync
5. Test booking flow
6. Monitor errors

---

**Ready to go live!** 🚀
