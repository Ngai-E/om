# How to Add Your OMEGA Logo

## Steps:

1. **Download your logo** from Facebook:
   - Right-click on the logo image
   - Select "Save image as..."
   - Save it to your computer

2. **Add to your project:**
   - Save the logo file as `omega-logo.jpg` 
   - Place it in this folder: `/frontend/public/`
   - The file should be at: `/frontend/public/omega-logo.jpg`

3. **Refresh your browser:**
   - The logo will automatically appear in the header
   - If it doesn't show, clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)

## Logo Specifications:
- **Recommended size:** 200px x 200px or larger
- **Format:** JPG, PNG, or SVG
- **File name:** `omega-logo.jpg` (or update the header.tsx if using a different name)

## Fallback:
If the logo image fails to load, the site will automatically show the text "Ω OMEGA" instead.

## Alternative: Use a different filename
If you want to use a different filename (e.g., `logo.png`), update line 87 in:
`/frontend/src/components/layout/header.tsx`

Change:
```tsx
src="/omega-logo.jpg"
```

To:
```tsx
src="/your-filename.png"
```
