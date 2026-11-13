# Bug Report: RF-BUG-002

**Bug ID:** RF-BUG-002  
**Title:** [RefundCalculator] 15% Restocking Fee Improperly Deducted from DEFECTIVE Returns  
**Severity:** High  
**Priority:** P1  
**Status:** Open (Reproducible when `ENABLE_SEEDED_BUGS=true`)  
**Component:** `refundCalculator.ts`  
**Environment:** Staging / Local  
**Reporter:** Financial QA Engineer  

---

### 1. Description
When a customer requests a return for a DEFECTIVE item, the system calculates a 15% restocking fee deduction from the refund total. Business rules state: "Restocking fee: 15% of item refund for CHANGED_MIND and NOT_AS_DESCRIBED (waived for DEFECTIVE, DAMAGED_IN_TRANSIT, WRONG_ITEM)".

### 2. Preconditions
- Customer return request submitted with reason: `DEFECTIVE`.
- Item unit price: $50.00 (5000 cents).
- `ENABLE_SEEDED_BUGS=true` set in environment.

### 3. Steps to Reproduce
1. Execute `calculateRefund()` or `POST /returns/preview` with `reason: "DEFECTIVE"`.
2. Inspect `restockingFeeCents` in the response breakdown.

### 4. Expected Result
- `restockingFeeCents` = 0.
- Customer receives 100% item refund + proportional tax.

### 5. Actual Result
- `restockingFeeCents` = 750 ($7.50).
- Total refund is penalized by $7.50 for a manufacturer defect.

### 6. Evidence & Logs
```json
{
  "orderItemId": 1001,
  "itemRefundCents": 5000,
  "taxRefundCents": 400,
  "restockingFeeCents": 750,
  "totalRefundCents": 4650
}
```

### 7. Root Cause Analysis
In `refundCalculator.ts`:
```typescript
const shouldChargeRestock =
  RESTOCKING_FEE_REASONS.includes(reason as any) ||
  (seededBugsEnabled && reason === ReturnReason.DEFECTIVE);
```
When `ENABLE_SEEDED_BUGS=true`, `DEFECTIVE` is coerced into restocking fee calculation.

### 8. Recommended Fix
Ensure restocking fee is strictly limited to customer-fault reasons:
```typescript
const shouldChargeRestock = [ReturnReason.CHANGED_MIND, ReturnReason.NOT_AS_DESCRIBED].includes(reason);
```

