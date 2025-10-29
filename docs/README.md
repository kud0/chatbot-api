# Barbershop WhatsApp Bot - Project Documentation

## Project Overview

This is a WhatsApp chatbot for "Barbería El Clásico", a traditional barbershop in Madrid, Spain. The bot handles appointment bookings, service inquiries, and integrates with Google Calendar for real-time availability.

## Tech Stack

- **Frontend**: Astro (static site generation)
- **Backend**: Vercel Serverless Functions
- **AI**: xAI Grok-4-fast-nonreasoning via Vercel AI SDK
- **Calendar**: Google Calendar API
- **Storage**: Vercel KV (Redis)
- **Messaging**: WhatsApp Cloud API

## Project Structure

```
/
├── api/                      # Vercel serverless functions
│   ├── webhook/             # WhatsApp webhook handlers
│   ├── chat/                # Chat processing endpoints
│   └── calendar/            # Calendar operations endpoints
│
├── src/                     # Source code
│   ├── config/              # Configuration files
│   │   └── barbershop.json  # Business configuration
│   └── utils/               # Utility functions
│
├── tests/                   # Test files
│
├── docs/                    # Documentation
│   └── README.md            # This file
│
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variables template
└── .gitignore              # Git ignore rules
```

## Directory Details

### `/api` - Serverless Functions

Contains Vercel serverless functions for handling:
- **webhook/**: Incoming WhatsApp messages and webhook verification
- **chat/**: AI-powered chat processing and conversation management
- **calendar/**: Google Calendar integration for bookings and availability

### `/src/config` - Configuration

- **barbershop.json**: Complete business configuration including:
  - Services offered (haircut, beard trim, combos, etc.)
  - Business hours and breaks
  - Staff information
  - Pricing and durations
  - Multilingual support (Spanish/English)
  - Booking policies

### `/src/utils` - Utilities

Helper functions for:
- Date/time operations with timezone support
- Message formatting and translations
- Validation and error handling
- Calendar slot calculations

### `/tests` - Testing

Unit and integration tests using Vitest:
- API endpoint tests
- Calendar logic tests
- Message processing tests
- Integration tests

## Key Features

1. **Bilingual Support**: Spanish (default) and English
2. **Smart Scheduling**: Google Calendar integration with conflict detection
3. **Service Management**: 6 different services with dynamic pricing
4. **Business Hours**: Respects operating hours and lunch breaks
5. **Staff Assignment**: Multiple barbers with different specialties
6. **Conversation Memory**: Redis-based session storage
7. **AI-Powered Chat**: Natural language understanding via xAI Grok

## Getting Started

1. Copy `.env.example` to `.env` and fill in your credentials
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Run tests: `npm test`

## Environment Setup

See `.env.example` for required environment variables. You'll need:
- WhatsApp Cloud API credentials
- xAI API key
- Google Service Account JSON
- Vercel KV credentials

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - Code linting

## Deployment

Deploy to Vercel with automatic serverless function detection:

```bash
vercel
```

Make sure to add all environment variables in the Vercel dashboard.

## Support

For issues and questions, refer to the main project repository or contact the development team.
