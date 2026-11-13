# Bug Report: RF-BUG-010

**Bug ID:** RF-BUG-010  
**Title:** [State Machine] Customer Able to Cancel Return Request While Under Active Admin Review  
**Severity:** Medium  
**Priority:** P2  
**Status:** Resolved / Documented  
**Component:** `returnService.ts` / State Machine  
**Environment:** Staging / Local  
**Reporter:** SDET  

---

### 1. Description
Customer submits a cancellation request `POST /returns/:id/cancel` while an administrator is actively reviewing the return (`UNDER_REVIEW`). Business rule: "SUBMITTED -> CANCELLED (customer only, before review). Invalid transitions return 409 with a clear error."

### 2. Preconditions
- Return request in `UNDER_REVIEW` status.
- Customer logged in.

### 3. Steps to Reproduce
1. Admin patches return to `UNDER_REVIEW`.
2. Customer sends `POST /returns/:id/cancel`.

### 4. Expected Result
- HTTP 409 Conflict.
- Error message: `"Cannot cancel return in status UNDER_REVIEW. Returns can only be cancelled while in SUBMITTED status."`
- Status remains `UNDER_REVIEW`.

### 5. Actual Result (If Transition Check Missing)
- HTTP 200 OK.
- Status changes to `CANCELLED`, conflicting with ongoing admin review.

### 6. Root Cause Analysis
Cancellation handler lacked strict state validation guarding against post-review transitions.

### 7. Recommended Fix
```typescript
if (returnReq.status !== ReturnStatus.SUBMITTED) {
  throw new ConflictError(
    `Cannot cancel return in status "${returnReq.status}". Returns can only be cancelled while in SUBMITTED status.`
  );
}
```

