# Favicon Setup Instructions

## Current Status
The favicon has been configured to use `/public/omega-logo.jpg`.

## For Better Browser Support

### Option 1: Use an Online Converter (Recommended)
1. Go to https://favicon.io/favicon-converter/
2. Upload your `omega-logo.jpg` file
3. Download the generated favicon package
4. Extract and copy these files to `/public/`:
   - `favicon.ico` (for older browsers)
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png`

### Option 2: Use Next.js App Directory Convention
1. Create a square version of your logo (recommended: 512x512px)
2. Save it as one of these in `/src/app/`:
   - `icon.png` or `icon.jpg`
   - `apple-icon.png` or `apple-icon.jpg`

Next.js will automatically generate all required favicon sizes!

## Current Configuration
The metadata in `src/app/layout.tsx` is set to use:
- Icon: `/omega-logo.jpg`
- Apple Touch Icon: `/omega-logo.jpg`

## Testing
After deploying, test your favicon at:
- https://realfavicongenerator.net/favicon_checker

## Notes
- Clear browser cache to see changes
- Some browsers cache favicons aggressively
- JPG works but PNG or ICO is preferred for favicons
