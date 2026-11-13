# Bug Report: RF-BUG-001

**Bug ID:** RF-BUG-001  
**Title:** [Eligibility] 30-Day Window Off-By-One Rejects Returns on Day 30  
**Severity:** High  
**Priority:** P1  
**Status:** Open (Reproducible when `ENABLE_SEEDED_BUGS=true`)  
**Component:** `eligibilityService.ts`  
**Environment:** Staging / Local (Supabase PostgreSQL / Node 20)  
**Reporter:** SDET Lead  

---

### 1. Description
Customers attempting to submit a return request for orders delivered exactly 30 days ago receive an erroneous rejection stating that the 30-day return window has expired. The business specification states: "Return window: 30 days from delivery date (day 30 allowed, day 31 rejected)".

### 2. Preconditions
- Customer authenticated (`alice@example.com`).
- Order #1 delivered exactly 30 days ago (`order.deliveredAt = NOW() - 30 days`).
- `ENABLE_SEEDED_BUGS=true` set in environment.

### 3. Steps to Reproduce
1. Submit `POST /returns/preview` with `orderId: 1` and `items: [{ orderItemId: 1, quantity: 1 }]`.
2. Inspect server response status code and message.

### 4. Expected Result
- HTTP 200 OK.
- Calculation preview returned; order item marked `isEligible: true`.

### 5. Actual Result
- HTTP 400 Bad Request.
- Error message: `"The 30-day return window has expired. Order was delivered 30 days ago."`

### 6. Evidence & Logs
```json
{
  "code": "BAD_REQUEST",
  "message": "The 30-day return window has expired. Order was delivered 30 days ago.",
  "details": []
}
```

### 7. Root Cause Analysis
In `eligibilityService.ts`, when seeded bugs are enabled, the threshold operator evaluates:
```typescript
const maxDays = seededBugsEnabled ? 30.0 : 31.0;
if (diffDays >= maxDays) // When diffDays is 30.0001, it is >= 30.0 and rejects day 30
```
This causes an off-by-one boundary failure where day 30 is treated as expired instead of allowing the full 30 days (up to 31.0 days).

### 8. Recommended Fix
Set the window threshold to allow up to 31 full days so day 30 (even 30 days and 23 hours later) remains valid:
```typescript
const maxDays = 31.0;
if (diffDays >= maxDays) { ... }
```

