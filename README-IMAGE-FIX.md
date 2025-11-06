# Image Upload Issue - Fixed ✅

## Problem
Images were being uploaded to Supabase Storage as corrupted files (multipart form data instead of actual image bytes), causing them to fail to load in the browser with 403 errors.

## Root Cause
**The global Supabase client configuration** in `lib/supabase/client.ts` had:

```typescript
global: {
  headers: {
    'Content-Type': 'application/json',  // ❌ This breaks file uploads!
  },
}
```

This forced ALL Supabase requests (including file uploads) to use `Content-Type: application/json`, which caused:
1. Files to be uploaded as JSON/form-data instead of binary
2. Stored files to contain multipart boundary markers (`------WebK...`) instead of actual image data
3. Browser to refuse loading the "images" because they weren't valid image files

## Fix Applied

### 1. Fixed Supabase Client Configuration
**File**: `lib/supabase/client.ts:13`

Removed the global `Content-Type` header to allow the SDK to set the correct content type per request:
- Database queries: `application/json`
- File uploads: `image/jpeg`, `image/png`, etc.

### 2. Added Content-Type Validation
**File**: `lib/supabase/photoOperations.js:31-37`

Added validation to ensure file.type is valid and defaults to `image/jpeg` if missing

## Broken Images in Storage

Several images are currently broken (uploaded before the fix):
- `1762404360217-th52f.jpeg`
- `1762404954723-cwwhtc.jpg`
- (possibly others)

All contain corrupted data (multipart form boundaries instead of image data).

### How to Fix Broken Images

**Option 1: Delete and Re-upload (Recommended)**
1. Open the gallery in your application
2. Enter delete mode (click "Apagar" button)
3. Select all broken images (they show error icons)
4. Delete them
5. Re-upload the original images

**Option 2: Clear All and Start Fresh**
If you have access to the Supabase dashboard:
1. Go to Storage > gallery bucket > photos folder
2. Delete all files
3. Re-upload your photos through the fixed application

New uploads will work correctly with proper image data and content types.

## Testing
After the fix, all new image uploads should:
1. Be stored with the correct MIME type (`image/jpeg`, `image/png`, etc.)
2. Load correctly in the browser
3. Display properly in the gallery

## Diagnostic Scripts
Created helper scripts for debugging (can be deleted after verification):
- `diagnose-image.js` - Checks specific image details
- `fix-broken-images.js` - Attempts to fix images (requires auth)
- `check-database.js` - Checks database and storage structure
- `fix-single-image.js` - Attempts to fix single image (requires auth)

These can be removed once you verify the fix is working.
