# Bug Report: RF-BUG-004

**Bug ID:** RF-BUG-004  
**Title:** [Financial Math] Integer Truncation on Discount Split Causes 1-Cent Discrepancy  
**Severity:** Medium  
**Priority:** P2  
**Status:** Open (Reproducible when `ENABLE_SEEDED_BUGS=true`)  
**Component:** `refundCalculator.ts`  
**Environment:** Staging / Local  
**Reporter:** SDET  

---

### 1. Description
When distributing an order-level discount across items with non-terminating decimal shares (e.g. 3 items of equal price sharing a $10.00 discount), using integer truncation (`Math.trunc`) instead of financial Banker's Rounding causes a 1-cent drift where the sum of item refunds fails to reconcile with the order total.

### 2. Preconditions
- Order with 3 equal items totaling $99.99 ($33.33 each) and a $10.00 order discount.
- `ENABLE_SEEDED_BUGS=true` set in environment.

### 3. Steps to Reproduce
1. Execute refund calculation across all 3 items.
2. Sum individual line refunds.

### 4. Expected Result
- Banker's rounded item refund = $30.00 ($33.33 - $3.33).
- Sum of refunds matches total paid.

### 5. Actual Result
- `itemRefundCents` truncated to integer: $29.99 per item. Total = $89.97 instead of $89.99 (2-cent discrepancy).

### 6. Root Cause Analysis
```typescript
let itemRefundCents = seededBugsEnabled
  ? Math.trunc(itemRefund.toNumber()) // Defective truncation
  : itemRefund.round().toNumber();
```

### 7. Recommended Fix
Always use `Decimal.ROUND_HALF_EVEN` financial rounding:
```typescript
let itemRefundCents = itemRefund.round().toNumber();
```

