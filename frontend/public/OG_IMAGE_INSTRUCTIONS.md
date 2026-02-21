# Open Graph Image Instructions

## Current Status
The Open Graph metadata is configured to use `/omega-logo.jpg`.

## For Best WhatsApp/Social Media Previews

### Recommended Image Specifications
- **Size**: 1200 x 630 pixels (Facebook/WhatsApp recommended)
- **Format**: JPG or PNG
- **File size**: Under 8MB (preferably under 1MB)
- **Aspect ratio**: 1.91:1

### How to Create the Perfect OG Image

#### Option 1: Use Canva (Free & Easy)
1. Go to https://www.canva.com
2. Search for "Facebook Post" or "Open Graph" template
3. Use dimensions: 1200 x 630 px
4. Add your omega-logo.jpg
5. Add text: "OMEGA Afro Caribbean Superstore"
6. Download as JPG or PNG
7. Save as `/public/og-image.jpg`

#### Option 2: Use an Online Tool
1. Go to https://www.opengraph.xyz/
2. Upload your logo
3. Add title and description
4. Download the generated image
5. Save as `/public/og-image.jpg`

#### Option 3: Manual Creation
1. Open your favorite image editor (Photoshop, GIMP, etc.)
2. Create a new image: 1200 x 630 px
3. Add your logo centered or positioned nicely
4. Add brand colors and text
5. Export as JPG (quality 80-90%)
6. Save as `/public/og-image.jpg`

### After Creating the Image
1. Save it as `/public/og-image.jpg`
2. Update `src/app/layout.tsx`:
   ```typescript
   images: [
     {
       url: '/og-image.jpg',
       width: 1200,
       height: 630,
       alt: 'OMEGA Afro Caribbean Superstore',
     },
   ],
   ```

### Testing Your OG Image
After deploying, test at:
- https://www.opengraph.xyz/url/
- https://cards-dev.twitter.com/validator
- WhatsApp: Send your URL to yourself

### Important Notes
- WhatsApp caches previews aggressively
- Use absolute URLs in production: `https://www.omegaafro.com/og-image.jpg`
- Clear WhatsApp cache by sending URL with `?v=2` at the end
- First share might take a few seconds to load preview

## Current Configuration
- OG Image: `/omega-logo.jpg`
- Twitter Card: `summary_large_image`
- Locale: `en_GB`
