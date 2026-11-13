# Bug Report: RF-BUG-009

**Bug ID:** RF-BUG-009  
**Title:** [Security] File Upload Relies Solely on Client Extension, Allowing Spoofed Payloads  
**Severity:** High  
**Priority:** P1  
**Status:** Resolved / Documented  
**Component:** `fileService.ts` / Multer Middleware  
**Environment:** Staging / Local  
**Reporter:** AppSec Specialist / SDET  

---

### 1. Description
If file upload validation only verifies either the file extension (`.png`) OR the client-sent `Content-Type` header without checking both, an attacker can upload an executable file (`script.sh.png` or `malware.exe` with `Content-Type: image/png`).

### 2. Preconditions
- Customer authenticated.
- Submitting `POST /returns` with multipart form data.

### 3. Steps to Reproduce
1. Upload file with extension `.exe` and `Content-Type: image/png`.
2. Upload file with extension `.jpg` and `Content-Type: application/x-msdownload`.

### 4. Expected Result
- HTTP 400 Bad Request: `"Invalid file type. Allowed formats: JPG, PNG, WEBP"`.
- File is rejected and deleted from server storage.

### 5. Actual Result (If Single-Check Used)
- File accepted and stored in `/uploads`.

### 6. Root Cause Analysis
Multer `fileFilter` must validate both `ALLOWED_MIME_TYPES` and `ALLOWED_EXTENSIONS` concurrently.

### 7. Recommended Fix
```typescript
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
  return cb(new BadRequestError('Invalid file type...'));
}
```

