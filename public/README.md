# Public Assets for Barbería El Clásico Website

This directory contains static assets that are served directly.

## Required Assets

### 1. favicon.ico
- **Size:** 32x32px (or 16x16px)
- **Format:** ICO or PNG
- **Content:** Barber scissors, comb, or barbershop pole icon
- **Color:** Match brand colors (dark blue #1a2332, gold #d4af37)

**How to create:**
- Use a free icon generator: https://favicon.io/
- Use design tools: Figma, Canva, or Adobe Illustrator
- Or download a free barber icon from: https://www.flaticon.com/

### 2. og-image.jpg
- **Size:** 1200x630px (Facebook/Twitter recommended size)
- **Format:** JPG or PNG
- **Content:**
  - Option 1: Barbershop interior photo
  - Option 2: Logo + business name + tagline
  - Option 3: Professional barber at work
- **Text overlay (optional):**
  - "Barbería El Clásico"
  - "Tu barbería de confianza en Madrid"

**Best practices:**
- Keep important content in the center (safe zone: 1200x600px)
- Avoid text near edges (some platforms crop images)
- Use high-quality images (not pixelated)
- Match brand colors and style
- File size: < 1MB for fast loading

**How to create:**
- Use Canva: https://www.canva.com/create/facebook-posts/
- Use Figma: Create 1200x630px frame
- Take a professional photo and add text overlay

## Temporary Placeholders

Until you have the actual assets, you can use:

1. **Favicon:** Generate one quickly at https://favicon.io/favicon-generator/
   - Use "BC" initials for "Barbería Clásico"
   - Use brand colors

2. **OG Image:** Use a free stock photo from:
   - https://unsplash.com/s/photos/barbershop
   - https://pexels.com/search/barbershop/
   - Add text overlay with your business name

## Installation

Place your files directly in this `/public` directory:

```
/public
  ├── favicon.ico       # Browser tab icon
  ├── og-image.jpg      # Social media preview image
  └── README.md         # This file
```

The files will be accessible at:
- `https://your-domain.com/favicon.ico`
- `https://your-domain.com/og-image.jpg`

## Testing

### Test Favicon
Open your site and check the browser tab for the icon.

### Test OG Image
Use these tools to preview how your site looks when shared:
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

Enter your website URL and see the preview with your og-image.

## Notes

- Icons should be simple and recognizable at small sizes
- Use SVG for scalability (but ICO for favicon compatibility)
- Optimize images for web (compress without losing quality)
- Test on different devices and social platforms
