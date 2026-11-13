# Bug Report: RF-BUG-007

**Bug ID:** RF-BUG-007  
**Title:** [Eligibility] Final Sale Products Allowed When Mixed with Non-Final Sale Items in Multi-Item Request  
**Severity:** High  
**Priority:** P1  
**Status:** Resolved / Documented  
**Component:** `eligibilityService.ts`  
**Environment:** Staging / Local  
**Reporter:** SDET  

---

### 1. Description
When a customer submits a multi-item return containing one standard item and one `is_final_sale=true` item, if the overall eligibility check loop terminates on the first eligible item without an all-items assertion (`every()` vs `some()`), final sale items can erroneously be accepted.

### 2. Preconditions
- Order delivered with Item 1 (`isFinalSale: false`) and Item 2 (`isFinalSale: true`).
- Customer submits return for both items.

### 3. Steps to Reproduce
1. Submit `POST /returns` with items: `[{ orderItemId: 1, quantity: 1 }, { orderItemId: 2, quantity: 1 }]`.

### 4. Expected Result
- HTTP 400 Bad Request.
- Error message specifies: `"Item is marked as final sale and cannot be returned"`.
- Return is NOT created.

### 5. Actual Result (If Flawed Loop Logic Used)
- Return request created covering both items, violating store final-sale policy.

### 6. Root Cause Analysis
Loop logic must flag `allItemsEligible = false` and reject the entire batch if ANY requested item is final sale or non-returnable.

### 7. Recommended Fix
```typescript
let allItemsEligible = true;
for (const reqItem of requestedItems) {
  if (orderItem.product.isFinalSale) {
    allItemsEligible = false;
    // record failure
  }
}
if (!allItemsEligible) return { isEligible: false, ... };
```

