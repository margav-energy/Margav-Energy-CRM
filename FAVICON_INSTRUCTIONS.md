# Favicon Setup Instructions

## Creating Favicon from Margav Logo

To create a proper favicon from the Margav logo:

1. **Use the provided logo**: `Margav_favicon.png`
2. **Convert to ICO format**:

   - Use an online converter like https://favicon.io/favicon-converter/
   - Or use ImageMagick: `convert Margav_favicon.png -resize 32x32 favicon.ico`
   - Or use GIMP/Photoshop to export as ICO

3. **Place the favicon.ico file** in:

   - `frontend/public/favicon.ico` (for React build)
   - `backend/staticfiles/favicon.ico` (for Django serving)

4. **Multiple sizes** (optional):
   - 16x16, 32x32, 48x48, 64x64 pixels
   - Use https://realfavicongenerator.net/ for comprehensive favicon generation

## Current Setup

The HTML template already includes:

```html
<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
```

Once you place the favicon.ico file in `frontend/public/`, it will be automatically included in the build.
