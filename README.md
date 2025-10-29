# WhatsApp Chatbot Barbershop Booking System

An AI-powered WhatsApp chatbot that allows customers to book barbershop appointments through natural conversation. Built with serverless architecture for scalability and cost-effectiveness.

## Features

- **Natural Conversation**: AI-powered responses using xAI Grok
- **Multi-Language Support**: English and Spanish (easily extendable)
- **Real-Time Booking**: Instant appointment scheduling with Google Calendar
- **Availability Checking**: Smart calendar integration for time slot management
- **Booking Management**: Cancel, modify, or check existing appointments
- **Session Management**: Maintains conversation context across messages
- **Interactive Messages**: Buttons and lists for easy navigation
- **Serverless Architecture**: Scales automatically, pay only for what you use
- **Cost-Effective**: $5-50/month for typical barbershop usage

## Demo

**Example Conversation:**

```
Customer: Hello

Bot: Hello! 👋 Welcome to Premium Barbershop!
     How can I assist you today?
     • View services and prices
     • Check availability
     • Book appointment

Customer: What services do you offer?

Bot: Here are our services:
     💇 Haircut - $25 (30 min)
     ✂️ Beard Trim - $15 (15 min)
     💇✂️ Haircut + Beard - $35 (45 min)
     Would you like to book?

Customer: Book a haircut for tomorrow at 2pm

Bot: Perfect! Confirming details:
     Service: Haircut
     Date: Wednesday, Oct 30
     Time: 2:00 PM
     Price: $25
     [Confirm] [Change]

Customer: [Clicks Confirm]

Bot: ✅ Booking confirmed!
     See you tomorrow at 2:00 PM!
```

See [docs/CONVERSATION_FLOWS.md](./docs/CONVERSATION_FLOWS.md) for more examples.

## Tech Stack

**Backend:**
- Runtime: Node.js 18+
- Framework: Serverless functions (Vercel)
- Language: JavaScript/TypeScript

**External Services:**
- **WhatsApp**: Meta WhatsApp Business API
- **AI**: xAI Grok for natural language processing
- **Calendar**: Google Calendar API
- **Storage**: Vercel KV (Redis) for sessions
- **Hosting**: Vercel (serverless + edge functions)

**Key Libraries:**
- `@vercel/kv` - Redis session storage
- `googleapis` - Google Calendar integration
- `axios` - HTTP requests
- `crypto` - Webhook signature verification

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Accounts for: Meta Developers, Google Cloud, xAI, Vercel
- Basic knowledge of JavaScript and REST APIs

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/barbershop-chatbot.git
cd barbershop-chatbot

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev

# 5. Test with ngrok (for WhatsApp webhook)
ngrok http 3000
```

### Environment Variables

```bash
# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Google Calendar
GOOGLE_CALENDAR_ID=your_calendar_id
GOOGLE_CREDENTIALS='{"type":"service_account",...}'

# xAI
XAI_API_KEY=xai-your-api-key

# Vercel KV (auto-populated)
KV_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

### Deploy to Vercel

```bash
# Option 1: Connect GitHub repo to Vercel (recommended)
# - Push code to GitHub
# - Import repo in Vercel dashboard
# - Add environment variables
# - Deploy automatically

# Option 2: Manual deployment with CLI
vercel --prod
```

**Full setup instructions:** [docs/SETUP.md](./docs/SETUP.md)

## Documentation

Comprehensive documentation is available in the `/docs` directory:

### Getting Started
- **[SETUP.md](./docs/SETUP.md)** - Complete setup guide with step-by-step instructions
- **[CONFIGURATION.md](./docs/CONFIGURATION.md)** - Configure services, hours, and messages
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deploy to production

### Development
- **[API.md](./docs/API.md)** - API endpoint documentation
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture and design
- **[CONVERSATION_FLOWS.md](./docs/CONVERSATION_FLOWS.md)** - Chatbot conversation examples

### Operations
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[COST_OPTIMIZATION.md](./docs/COST_OPTIMIZATION.md)** - Minimize costs and stay within free tiers

### Contributing
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project

## Project Structure

```
barbershop-chatbot/
├── api/                      # Serverless API endpoints
│   ├── webhook/              # WhatsApp webhook handler
│   │   └── index.js
│   ├── calendar/             # Calendar API
│   │   ├── availability.js
│   │   └── book.js
│   └── health/               # Health check endpoint
│       └── index.js
├── src/                      # Source code
│   ├── config/               # Configuration files
│   │   ├── business.js       # Business settings
│   │   └── messages.js       # Message templates
│   ├── services/             # Business logic
│   │   ├── whatsappService.js
│   │   ├── calendarService.js
│   │   ├── aiService.js
│   │   └── sessionService.js
│   └── utils/                # Utility functions
│       ├── logger.js
│       ├── validator.js
│       └── dateUtils.js
├── tests/                    # Test files
│   ├── webhook.test.js
│   └── calendar.test.js
├── docs/                     # Documentation
│   ├── SETUP.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── CONVERSATION_FLOWS.md
│   ├── TROUBLESHOOTING.md
│   ├── DEPLOYMENT.md
│   ├── CONFIGURATION.md
│   └── COST_OPTIMIZATION.md
├── scripts/                  # Utility scripts
│   ├── test-calendar.js
│   └── cost-calculator.js
├── .env.example              # Environment variables template
├── vercel.json               # Vercel configuration
├── package.json
└── README.md
```

## Configuration

### Customize for Your Barbershop

1. **Business Information** (`src/config/business.js`):
   - Business name, address, phone
   - Operating hours
   - Timezone

2. **Services and Pricing** (`src/config/business.js`):
   ```javascript
   services: [
     {
       id: 'haircut',
       name: 'Haircut',
       nameSpanish: 'Corte de Pelo',
       duration: 30,  // minutes
       price: 25,     // USD
       emoji: '💇'
     },
     // Add more services...
   ]
   ```

3. **Message Templates** (`src/config/messages.js`):
   - Welcome messages
   - Confirmation templates
   - Error messages
   - Both English and Spanish

**Full configuration guide:** [docs/CONFIGURATION.md](./docs/CONFIGURATION.md)

## Usage

### For Customers

Customers interact with the bot through WhatsApp:

1. Send "Hello" to initiate conversation
2. Ask questions or request bookings in natural language
3. Use interactive buttons for quick actions
4. Receive instant confirmation
5. Manage bookings through conversation

### For Barbershop Owners

Monitor and manage the system:

```bash
# View logs
vercel logs --prod

# Check health
curl https://your-project.vercel.app/api/health

# Monitor costs
# Vercel Dashboard → Analytics → Usage

# View bookings
# Google Calendar → Your booking calendar
```

## Testing

```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Type checking (if using TypeScript)
npm run typecheck

# Test webhook locally
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"15551234567","text":{"body":"Hello"}}]}}]}]}'
```

## Cost Estimate

**Monthly costs for typical small barbershop:**

| Service | Usage | Cost |
|---------|-------|------|
| Vercel Hosting | 1000 messages | $0 (free tier) |
| Vercel KV | Session storage | $0 (free tier) |
| Meta WhatsApp | Unlimited (approved) | $0 |
| Google Calendar | 5000 bookings | $0 (free tier) |
| xAI Grok | 1000 AI requests | $5-20 |
| **Total** | - | **$5-20/month** |

**Scale:** Costs scale linearly with usage. 5000 bookings/month ≈ $50/month

**See:** [docs/COST_OPTIMIZATION.md](./docs/COST_OPTIMIZATION.md) for optimization tips

## Security

- **Webhook Verification**: HMAC-SHA256 signature validation
- **Environment Variables**: All secrets in environment, not code
- **HTTPS Only**: Enforced by Vercel
- **Rate Limiting**: Per-user message limits
- **Input Validation**: All user inputs sanitized
- **No PII in Logs**: Customer data protected

## Performance

- **Response Time**: <2 seconds (95th percentile)
- **Availability**: 99.9% uptime (Vercel SLA)
- **Scalability**: Auto-scales to thousands of concurrent users
- **Cold Start**: <500ms (Edge functions)

## Roadmap

**Planned Features:**

- [ ] SMS notifications for appointment reminders
- [ ] Payment integration (Stripe) for deposits
- [ ] Multi-location support
- [ ] Barber selection
- [ ] Customer reviews and ratings
- [ ] Loyalty program integration
- [ ] Voice message support
- [ ] Image support (send portfolio photos)
- [ ] Analytics dashboard

**Want to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md)

## Troubleshooting

**Common Issues:**

**Webhook not receiving messages?**
- Check webhook URL in Meta dashboard
- Verify WHATSAPP_VERIFY_TOKEN matches
- Test with ngrok for local development
- See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md#webhook-not-receiving-messages)

**Bot not responding?**
- Check Vercel logs: `vercel logs --prod`
- Verify WHATSAPP_ACCESS_TOKEN is valid
- Ensure all environment variables set
- See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md#webhook-receives-messages-but-doesnt-respond)

**Calendar integration not working?**
- Verify service account shared with calendar
- Check GOOGLE_CREDENTIALS format
- Ensure Calendar API enabled
- See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md#calendar-authentication-failed)

**Full troubleshooting guide:** [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

## Support

**Documentation:**
- Check `/docs` folder for comprehensive guides
- Review [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for common issues
- See [API.md](./docs/API.md) for technical details

**External Resources:**
- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)
- [Google Calendar API](https://developers.google.com/calendar)
- [Vercel Documentation](https://vercel.com/docs)
- [xAI Documentation](https://console.x.ai/docs)

**Issues:**
- Report bugs: [GitHub Issues](https://github.com/yourusername/barbershop-chatbot/issues)
- Feature requests: [GitHub Discussions](https://github.com/yourusername/barbershop-chatbot/discussions)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code style guidelines
- Development setup
- Testing requirements
- Pull request process
- Code of conduct

## License

MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments

- **Meta** for WhatsApp Business API
- **Google** for Calendar API
- **xAI** for Grok language model
- **Vercel** for serverless hosting
- All contributors and users

## Contact

- **Email:** your-email@example.com
- **Website:** https://your-website.com
- **Twitter:** @yourhandle

---

**Built with ❤️ for barbershops**

If this project helps your business, consider giving it a ⭐ on GitHub!

## Quick Links

- [Documentation](./docs/)
- [Setup Guide](./docs/SETUP.md)
- [API Reference](./docs/API.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Contributing](./CONTRIBUTING.md)
- [License](#license)
