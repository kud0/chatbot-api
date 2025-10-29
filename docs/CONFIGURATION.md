# Configuration Guide

## Table of Contents
- [Overview](#overview)
- [Business Configuration](#business-configuration)
- [Services and Pricing](#services-and-pricing)
- [Business Hours](#business-hours)
- [Multi-Language Content](#multi-language-content)
- [Contact Information](#contact-information)
- [Booking Rules](#booking-rules)
- [Message Templates](#message-templates)
- [Calendar Settings](#calendar-settings)
- [Advanced Configuration](#advanced-configuration)

## Overview

This guide explains how to customize the chatbot for your barbershop. All configuration is centralized in configuration files and environment variables.

**Configuration Files:**
- `src/config/business.js` - Business details, services, hours
- `src/config/messages.js` - Message templates (English/Spanish)
- `.env.local` - Environment-specific settings
- `vercel.json` - Deployment configuration

## Business Configuration

### Basic Information

**File:** `src/config/business.js`

```javascript
module.exports = {
  // Business Identity
  name: 'Premium Barbershop',
  nameSpanish: 'Barbería Premium',

  // Contact Details
  phone: '+15551234567',
  email: 'info@premiumbarbershop.com',
  website: 'https://premiumbarbershop.com',

  // Location
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA'
  },

  // Maps URL (Google Maps link)
  mapsUrl: 'https://goo.gl/maps/YOUR_MAP_LINK',

  // Social Media
  social: {
    instagram: '@premiumbarbershop',
    facebook: 'facebook.com/premiumbarbershop',
    twitter: '@premiumbarber'
  },

  // Timezone (IANA format)
  timezone: 'America/New_York',

  // Currency
  currency: 'USD',
  currencySymbol: '$'
};
```

### Updating Business Info

```bash
# 1. Edit config file
nano src/config/business.js

# 2. Update values
# Change name, address, phone, etc.

# 3. Test locally
npm run dev

# 4. Commit and deploy
git add src/config/business.js
git commit -m "Update business configuration"
git push
```

## Services and Pricing

### Adding Services

**File:** `src/config/business.js`

```javascript
module.exports = {
  // ... other config

  services: [
    {
      id: 'haircut',
      name: 'Haircut',
      nameSpanish: 'Corte de Pelo',
      description: 'Classic or modern haircut styles',
      descriptionSpanish: 'Estilos de corte clásicos o modernos',
      duration: 30,  // minutes
      price: 25,     // in your currency
      emoji: '💇',
      category: 'hair'
    },
    {
      id: 'beard-trim',
      name: 'Beard Trim',
      nameSpanish: 'Recorte de Barba',
      description: 'Shape and style your beard',
      descriptionSpanish: 'Da forma y estilo a tu barba',
      duration: 15,
      price: 15,
      emoji: '✂️',
      category: 'beard'
    },
    {
      id: 'haircut-beard',
      name: 'Haircut + Beard',
      nameSpanish: 'Corte + Barba',
      description: 'Complete grooming package',
      descriptionSpanish: 'Paquete completo de aseo',
      duration: 45,
      price: 35,
      emoji: '💇✂️',
      category: 'combo',
      isCombo: true  // Marks as combo service
    },
    {
      id: 'hot-shave',
      name: 'Hot Shave',
      nameSpanish: 'Afeitado Caliente',
      description: 'Traditional straight razor shave',
      descriptionSpanish: 'Afeitado tradicional con navaja',
      duration: 30,
      price: 30,
      emoji: '🪒',
      category: 'shave'
    }
  ]
};
```

### Service Schema

Each service must have:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier (lowercase, hyphens) |
| name | string | Yes | English name |
| nameSpanish | string | Yes | Spanish name |
| description | string | Yes | English description |
| descriptionSpanish | string | Yes | Spanish description |
| duration | number | Yes | Duration in minutes |
| price | number | Yes | Price in base currency |
| emoji | string | No | Emoji for visual appeal |
| category | string | No | Grouping category |
| isCombo | boolean | No | Marks combo services |

### Updating Prices

```javascript
// Quick price update
services: [
  {
    id: 'haircut',
    // ... other fields
    price: 30  // Changed from 25 to 30
  }
]
```

**After price change:**
1. Update config file
2. Test locally to verify
3. Commit and push to deploy
4. Update any printed materials
5. Notify customers if significant change

### Adding New Services

```javascript
// Add new service to services array
{
  id: 'kids-haircut',  // New unique ID
  name: 'Kids Haircut',
  nameSpanish: 'Corte Infantil',
  description: 'Haircut for children under 12',
  descriptionSpanish: 'Corte de pelo para niños menores de 12',
  duration: 20,
  price: 18,
  emoji: '👶',
  category: 'hair'
}
```

### Removing Services

```javascript
// Option 1: Delete from array
// Simply remove the service object

// Option 2: Mark as inactive (preserves data)
{
  id: 'old-service',
  name: 'Old Service',
  // ... other fields
  active: false  // Add this field
}

// Update service handler to filter inactive:
const activeServices = services.filter(s => s.active !== false);
```

## Business Hours

### Basic Hours Configuration

**File:** `src/config/business.js`

```javascript
module.exports = {
  // ... other config

  businessHours: {
    // Standard hours
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '19:00', closed: false },  // Later on Friday
    saturday: { open: '10:00', close: '16:00', closed: false }, // Shorter on Saturday
    sunday: { closed: true }  // Closed on Sunday
  },

  // Slot configuration
  slotDuration: 15,  // Time slots every 15 minutes

  // Buffer between appointments
  bufferTime: 5,  // 5 minutes between appointments

  // Advanced booking
  maxDaysAdvance: 30,  // Can book up to 30 days ahead
  minHoursAdvance: 2   // Must book at least 2 hours in advance
};
```

### Time Format

- Use 24-hour format: `'09:00'`, `'18:00'`, `'23:30'`
- Always include leading zero: `'09:00'` not `'9:00'`
- Minutes must be 00, 15, 30, or 45 (for 15-min slots)

### Special Hours

**Holidays and exceptions:**

```javascript
module.exports = {
  // ... other config

  specialHours: {
    // Format: 'YYYY-MM-DD': { hours }
    '2025-12-25': { closed: true, reason: 'Christmas Day' },
    '2025-12-24': { open: '09:00', close: '14:00', reason: 'Christmas Eve' },
    '2025-01-01': { closed: true, reason: 'New Year\'s Day' },
    '2025-07-04': { closed: true, reason: 'Independence Day' }
  }
};
```

### Lunch Break

```javascript
module.exports = {
  // ... other config

  breaks: [
    {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start: '13:00',
      end: '14:00',
      reason: 'Lunch break'
    }
  ]
};
```

### Multiple Shifts

```javascript
module.exports = {
  // ... other config

  // For shops with multiple barbers/shifts
  businessHours: {
    monday: [
      { open: '08:00', close: '12:00', barber: 'John' },
      { open: '13:00', close: '19:00', barber: 'Mike' }
    ]
    // ... other days
  }
};
```

## Multi-Language Content

### Message Templates

**File:** `src/config/messages.js`

```javascript
module.exports = {
  welcome: {
    en: `Hello! 👋 Welcome to {businessName}!

I can help you with:
• View our services and prices
• Check available appointments
• Book an appointment
• Manage your existing bookings

How can I assist you today?`,

    es: `¡Hola! 👋 Bienvenido a {businessName}

¿En qué puedo ayudarte hoy?

• Ver servicios y precios
• Consultar disponibilidad
• Reservar una cita
• Gestionar tu reserva`
  },

  services: {
    en: `Here are our services:

{servicesList}

Would you like to book an appointment?`,

    es: `Estos son nuestros servicios:

{servicesList}

¿Te gustaría reservar una cita?`
  },

  bookingConfirmed: {
    en: `✅ Booking confirmed!

**Details:**
👤 Customer: {customerName}
💇 Service: {serviceName}
📅 Date: {date}
🕐 Time: {time}
📍 Location: {businessAddress}

See you there!`,

    es: `✅ ¡Reserva confirmada!

**Detalles:**
👤 Cliente: {customerName}
💇 Servicio: {serviceName}
📅 Fecha: {date}
🕐 Hora: {time}
📍 Ubicación: {businessAddress}

¡Te esperamos!`
  }

  // Add more templates as needed
};
```

### Template Variables

Use curly braces for variables that get replaced:

- `{businessName}` - Your business name
- `{customerName}` - Customer's name
- `{serviceName}` - Selected service
- `{date}` - Appointment date
- `{time}` - Appointment time
- `{price}` - Service price
- `{duration}` - Service duration
- `{businessAddress}` - Your address
- `{businessPhone}` - Your phone

### Adding New Languages

```javascript
// To add French:
module.exports = {
  welcome: {
    en: 'English text...',
    es: 'Spanish text...',
    fr: 'Bonjour! 👋 Bienvenue à {businessName}!'  // Add French
  }
};

// Update language detection logic
// File: src/utils/languageDetector.js
function detectLanguage(message) {
  if (/hola|buenos|gracias/i.test(message)) return 'es';
  if (/bonjour|merci/i.test(message)) return 'fr';  // Add French
  return 'en';  // Default
}
```

## Contact Information

### Email Configuration

**For sending confirmation emails (optional):**

```javascript
// .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Premium Barbershop <noreply@premiumbarbershop.com>
```

**Email template:**

```javascript
// src/config/emailTemplates.js
module.exports = {
  bookingConfirmation: {
    subject: {
      en: 'Appointment Confirmed - {businessName}',
      es: 'Cita Confirmada - {businessName}'
    },
    body: {
      en: `
Dear {customerName},

Your appointment is confirmed!

Service: {serviceName}
Date: {date}
Time: {time}
Duration: {duration} minutes
Price: {price}

Location:
{businessAddress}

If you need to cancel or reschedule, please contact us at least 2 hours in advance.

Thank you!
{businessName}
{businessPhone}
      `,
      es: `
Estimado/a {customerName},

¡Tu cita está confirmada!

Servicio: {serviceName}
Fecha: {date}
Hora: {time}
Duración: {duration} minutos
Precio: {price}

Ubicación:
{businessAddress}

Si necesitas cancelar o reprogramar, contáctanos con al menos 2 horas de anticipación.

¡Gracias!
{businessName}
{businessPhone}
      `
    }
  }
};
```

## Booking Rules

### Cancellation Policy

**File:** `src/config/business.js`

```javascript
module.exports = {
  // ... other config

  bookingRules: {
    // Minimum time before appointment to cancel
    cancellationHours: 2,

    // Allow same-day bookings?
    sameDayBooking: true,

    // Require deposit?
    requireDeposit: false,
    depositAmount: 10,  // If true

    // Maximum active bookings per customer
    maxActiveBookings: 2,

    // Prevent duplicate bookings
    preventDuplicateSameDay: true,

    // No-show policy
    noShowPenalty: false,
    noShowPenaltyHours: 24  // Block for 24 hours after no-show
  }
};
```

### Availability Rules

```javascript
module.exports = {
  // ... other config

  availabilityRules: {
    // Show availability for next N days
    daysToShow: 14,

    // Minimum time before appointment
    minAdvanceHours: 2,

    // Maximum time before appointment
    maxAdvanceDays: 30,

    // Hide slots if less than N minutes away
    hideIfWithinMinutes: 30,

    // Blackout dates (no bookings)
    blackoutDates: [
      '2025-12-25',  // Christmas
      '2025-01-01'   // New Year
    ]
  }
};
```

## Message Templates

### Customizing Bot Responses

**Quick replies:**

```javascript
// src/config/messages.js
module.exports = {
  quickReplies: {
    viewServices: {
      en: '📋 View Services',
      es: '📋 Ver Servicios'
    },
    bookAppointment: {
      en: '📅 Book Appointment',
      es: '📅 Reservar Cita'
    },
    checkAvailability: {
      en: '🗓️ Check Availability',
      es: '🗓️ Ver Disponibilidad'
    },
    myBookings: {
      en: '📖 My Bookings',
      es: '📖 Mis Reservas'
    }
  }
};
```

### Error Messages

```javascript
module.exports = {
  errors: {
    slotUnavailable: {
      en: `I'm sorry, but that time slot is no longer available. Here are other options:

{alternativeTimes}

Which time works for you?`,

      es: `Lo siento, pero ese horario ya no está disponible. Aquí hay otras opciones:

{alternativeTimes}

¿Qué hora te funciona?`
    },

    outsideBusinessHours: {
      en: `We're closed at that time. Our hours are:

{businessHours}

Would you like to book during business hours?`,

      es: `Estamos cerrados en ese horario. Nuestro horario es:

{businessHours}

¿Te gustaría reservar durante nuestro horario de atención?`
    }
  }
};
```

### Confirmation Messages

```javascript
module.exports = {
  confirmations: {
    bookingRequest: {
      en: `Let me confirm the details:

📅 **Service:** {serviceName}
📆 **Date:** {date}
🕐 **Time:** {time}
⏱️ **Duration:** {duration} minutes
💵 **Price:** {price}

Is this correct?

[Yes, confirm] [No, change]`,

      es: `Déjame confirmar los detalles:

📅 **Servicio:** {serviceName}
📆 **Fecha:** {date}
🕐 **Hora:** {time}
⏱️ **Duración:** {duration} minutos
💵 **Precio:** {price}

¿Es correcto?

[Sí, confirmar] [No, cambiar]`
    }
  }
};
```

## Calendar Settings

### Google Calendar Configuration

**Environment variables:**

```bash
# .env.local

# Calendar ID (from Google Calendar settings)
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# Service account email
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com

# Credentials (JSON as single line)
GOOGLE_CREDENTIALS='{"type":"service_account",...}'
```

### Calendar Event Format

**Customize event details:**

```javascript
// src/services/calendarService.js

function createEventDetails(booking) {
  return {
    summary: `${booking.service} - ${booking.customerName}`,

    description: `
Customer: ${booking.customerName}
Phone: ${booking.customerPhone}
Service: ${booking.service}
Price: $${booking.price}
Notes: ${booking.notes || 'None'}

Booked via WhatsApp Chatbot
    `.trim(),

    location: process.env.BUSINESS_ADDRESS,

    colorId: getColorByService(booking.service),

    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },  // 1 hour before
        { method: 'popup', minutes: 1440 }  // 1 day before
      ]
    }
  };
}

function getColorByService(service) {
  const colors = {
    'haircut': '9',      // Blue
    'beard-trim': '2',   // Green
    'hot-shave': '11',   // Red
    'haircut-beard': '5' // Yellow
  };
  return colors[service] || '1';  // Default lavender
}
```

## Advanced Configuration

### Multiple Barbers

**For shops with multiple barbers:**

```javascript
// src/config/business.js
module.exports = {
  // ... other config

  barbers: [
    {
      id: 'john',
      name: 'John Smith',
      services: ['haircut', 'beard-trim', 'haircut-beard'],
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        // ... rest of week
        sunday: { closed: true }
      }
    },
    {
      id: 'mike',
      name: 'Mike Johnson',
      services: ['haircut', 'hot-shave'],
      schedule: {
        // Different schedule
      }
    }
  ],

  // Allow customer to choose barber
  allowBarberSelection: true
};
```

### Custom Slot Duration by Service

```javascript
// Override default slot duration per service
services: [
  {
    id: 'quick-trim',
    name: 'Quick Trim',
    duration: 15,
    slotDuration: 15  // This service uses 15-min slots
  },
  {
    id: 'full-service',
    name: 'Full Service',
    duration: 60,
    slotDuration: 30  // This uses 30-min slots
  }
]
```

### Dynamic Pricing

```javascript
// Implement dynamic pricing based on time/day
function getPrice(serviceId, date, time) {
  const basePrice = services.find(s => s.id === serviceId).price;

  // Weekend surcharge
  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return basePrice * 1.2;  // 20% more on weekends
  }

  // Peak hours surcharge (5-7 PM)
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 17 && hour < 19) {
    return basePrice * 1.1;  // 10% more during peak
  }

  return basePrice;
}
```

### Membership System

```javascript
// Track member status
const memberDiscounts = {
  basic: 0.05,    // 5% off
  premium: 0.10,  // 10% off
  vip: 0.15       // 15% off
};

// Check membership in session
function getDiscount(phone) {
  const member = getMembershipStatus(phone);
  return memberDiscounts[member] || 0;
}
```

## Testing Configuration

**After making configuration changes:**

```bash
# 1. Validate config syntax
node -e "require('./src/config/business.js')"

# 2. Test locally
npm run dev

# 3. Send test messages
# - "What services do you offer?"
# - "What are your hours?"
# - "Book a haircut for tomorrow"

# 4. Verify:
# - Services display correctly
# - Prices are accurate
# - Hours are correct
# - Messages in both languages work

# 5. Deploy
git add src/config/
git commit -m "Update configuration"
git push
```

## Configuration Checklist

Before going live, verify:

- [ ] Business name, phone, address correct
- [ ] All services listed with accurate prices
- [ ] Business hours for each day set correctly
- [ ] Special hours/holidays configured
- [ ] Both English and Spanish messages complete
- [ ] Contact information up to date
- [ ] Booking rules match your policy
- [ ] Calendar integration working
- [ ] Timezone set correctly
- [ ] Currency and formatting correct

---

For more information:
- [SETUP.md](./SETUP.md) - Initial setup
- [API.md](./API.md) - API details
- [CONVERSATION_FLOWS.md](./CONVERSATION_FLOWS.md) - Example conversations
