# Bug Report: RF-BUG-006

**Bug ID:** RF-BUG-006  
**Title:** [Admin Validation] Empty Whitespace String Bypasses Admin Rejection Reason Requirement  
**Severity:** Medium  
**Priority:** P2  
**Status:** Resolved / Documented  
**Component:** `returnValidator.ts` / `adminController.ts`  
**Environment:** Staging / Local  
**Reporter:** QA Engineer  

---

### 1. Description
When an admin rejects a return, providing a reason composed solely of spaces (e.g. `"   "`) was accepted because simple length checks (`reason.length > 0`) evaluated truthy before string trimming was enforced.

### 2. Preconditions
- Return request in `UNDER_REVIEW` status.
- Admin authenticated.

### 3. Steps to Reproduce
1. Submit `POST /admin/returns/:id/reject` with payload `{"reason": "   "}`.
2. Check return status in DB.

### 4. Expected Result
- HTTP 400 Bad Request with validation message: `"Rejection reason must be at least 3 characters long"`.
- Status remains `UNDER_REVIEW`.

### 5. Actual Result (Without Zod Trim)
- HTTP 200 OK.
- Return marked as `REJECTED` with blank rejection reason.

### 6. Root Cause Analysis
Validation did not sanitize or `.trim()` leading/trailing whitespace prior to evaluating minimum character length.

### 7. Recommended Fix
Apply Zod schema trimming and minimum length validation:
```typescript
export const rejectReturnSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters long'),
});
```

