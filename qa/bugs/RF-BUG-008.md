# Bug Report: RF-BUG-008

**Bug ID:** RF-BUG-008  
**Title:** [RefundCalculator] Shipping Refunded on Partial Order Return Due to Seller Fault  
**Severity:** Medium  
**Priority:** P2  
**Status:** Resolved / Documented  
**Component:** `refundCalculator.ts`  
**Environment:** Staging / Local  
**Reporter:** Financial QA Engineer  

---

### 1. Description
Customer returns 1 item of a 3-item order due to `DEFECTIVE` reason. The refund calculation engine refunded the full $5.99 shipping fee. Policy rule: "Shipping refund: full original shipping ONLY IF the ENTIRE order is returned AND reason is seller-fault; otherwise 0".

### 2. Preconditions
- Order #12 with 3 items totaling $100 + $5.99 shipping.
- Customer returns 1 item (Item A) due to `DEFECTIVE`.

### 3. Steps to Reproduce
1. Execute `POST /returns/preview` with `items: [{ orderItemId: 1, quantity: 1 }]` and `reason: "DEFECTIVE"`.
2. Review `shippingRefundCents`.

### 4. Expected Result
- `shippingRefundCents` = 0.
- Customer keeps remaining 2 delivered items, so original shipping is retained by store.

### 5. Actual Result (If Only Checking Reason Without Total Order Quantity)
- `shippingRefundCents` = 599 ($5.99).
- Store loses shipping revenue on partially retained orders.

### 6. Root Cause Analysis
Code verified `isSellerFault(reason)` but failed to check `totalPurchasedQty === totalReturningQty`.

### 7. Recommended Fix
```typescript
const isEntireOrderReturned = totalPurchasedQty === totalReturningQty;
if (isEntireOrderReturned && isSellerFault) {
  shippingRefundCents = order.shippingCents;
}
```

