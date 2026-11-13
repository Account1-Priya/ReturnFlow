# Bug Report: RF-BUG-003

**Bug ID:** RF-BUG-003  
**Title:** [Security] Insecure Direct Object Reference (IDOR) on GET /returns/:id Exposes Customer Data  
**Severity:** Critical  
**Priority:** P1  
**Status:** Open (Reproducible when `ENABLE_SEEDED_BUGS=true`)  
**Component:** `returnService.ts` / `returnController.ts`  
**Environment:** Staging / Local  
**Reporter:** Application Security Engineer / SDET  

---

### 1. Description
Customer A (e.g. Alice) can view Customer B's (e.g. Bob) sensitive return details, including customer names, emails, items returned, and uploaded proof images, simply by providing Bob's return ID in `GET /returns/:id`.

### 2. Preconditions
- Return #3 belongs to Bob (`customerId: 4`).
- Alice (`customerId: 3`) is authenticated and possesses a valid JWT token.
- `ENABLE_SEEDED_BUGS=true` set in environment.

### 3. Steps to Reproduce
1. Log in as Alice (`alice@example.com`) and retrieve access token.
2. Send request: `GET /returns/3` with header `Authorization: Bearer <alice_token>`.
3. Inspect HTTP response.

### 4. Expected Result
- HTTP 403 Forbidden.
- Error message: `"You do not have permission to view this return request"`.

### 5. Actual Result
- HTTP 200 OK.
- Full details of Bob's return request, personal information, and uploaded images are returned.

### 6. Evidence & Logs
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "returnRequest": {
    "id": 3,
    "customerId": 4,
    "customer": {
      "name": "Bob Jones",
      "email": "bob@example.com"
    },
    "reason": "CHANGED_MIND"
  }
}
```

### 7. Root Cause Analysis
In `returnService.ts`:
```typescript
const seededBugsEnabled = process.env.ENABLE_SEEDED_BUGS === 'true';
if (!seededBugsEnabled && userRole !== 'ADMIN' && returnReq.customerId !== userId) {
  throw new ForbiddenError('You do not have permission to view this return request');
}
```
When `ENABLE_SEEDED_BUGS=true`, the authorization condition is bypassed.

### 8. Recommended Fix
Enforce ownership check unconditionally for all non-admin requests:
```typescript
if (userRole !== Role.ADMIN && returnReq.customerId !== userId) {
  throw new ForbiddenError('You do not have permission to view this return request');
}
```

