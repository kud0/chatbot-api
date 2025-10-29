# How to Add WhatsApp Button to Your Astro Site

## Files Included

- `WhatsAppButton.astro` - Floating button (bottom-right corner)
- `WhatsAppCTA.astro` - Large call-to-action button

---

## Installation

### Step 1: Copy Files

Copy both `.astro` files to your Astro project:

```
your-barbershop-site/
└── src/
    └── components/
        ├── WhatsAppButton.astro  ← Copy here
        └── WhatsAppCTA.astro     ← Copy here
```

### Step 2: Add to Your Layout

Edit your main layout file (e.g., `src/layouts/BaseLayout.astro`):

```astro
---
import WhatsAppButton from '../components/WhatsAppButton.astro';
---

<html>
  <body>
    <slot />

    <!-- Add floating button (appears on all pages) -->
    <WhatsAppButton />
  </body>
</html>
```

### Step 3: Update Phone Number

Edit both component files and replace with your WhatsApp number:

```javascript
// Change this line in both files:
const phone = "+34912345678";  // ← Your actual number
```

---

## Usage Examples

### Floating Button (Always Visible)

Already added in Step 2 above. It will appear on all pages.

### CTA Button (Specific Pages)

Add to any page where you want a large call-to-action:

```astro
---
import WhatsAppCTA from '../components/WhatsAppCTA.astro';
---

<h1>Welcome to Our Barbershop</h1>
<p>Get your haircut today!</p>

<WhatsAppCTA />
```

---

## Customization

### Change Button Color

Edit the component CSS:

```css
/* In WhatsAppButton.astro, find: */
background-color: #25D366;  /* Change this */
```

### Change Message

Edit the `message` variable:

```javascript
const message = "Hola! Me gustaría información";  // Change this
```

### Change Position

Floating button position (in WhatsAppButton.astro):

```css
.whatsapp-button {
  position: fixed;
  bottom: 20px;  /* Change distance from bottom */
  right: 20px;   /* Change distance from right */
}
```

---

## How It Works

1. User clicks button
2. Opens WhatsApp with pre-filled message
3. User sends message
4. **Your chatbot responds automatically** (from the API we deployed)

No additional setup needed on your site - the button just opens WhatsApp!

---

## Done!

The button is just a link that opens WhatsApp. The chatbot magic happens on the backend (separate Vercel deployment).
