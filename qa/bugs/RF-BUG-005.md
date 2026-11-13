# Bug Report: RF-BUG-005

**Bug ID:** RF-BUG-005  
**Title:** [Concurrency] Rapid Concurrent Return Submissions Allow Over-Returning Purchased Quantity  
**Severity:** Critical  
**Priority:** P1  
**Status:** Resolved / Documented  
**Component:** `returnService.ts` / Database Transactions  
**Environment:** Staging / Production  
**Reporter:** Senior SDET  

---

### 1. Description
When two concurrent HTTP requests for the same order item are sent simultaneously (e.g. double-click on UI or automated concurrent API calls), both read the remaining quantity before either commits, resulting in duplicate returns that exceed the original purchased quantity.

### 2. Preconditions
- Order #1 with Item A (purchased quantity = 1).
- Customer submits two concurrent `POST /returns` requests within 10ms.

### 3. Steps to Reproduce
1. Execute two parallel requests:
   - Request 1: `POST /returns` (Item A, Qty 1)
   - Request 2: `POST /returns` (Item A, Qty 1)
2. Check database records in `return_items`.

### 4. Expected Result
- Request 1 succeeds (HTTP 201).
- Request 2 fails with HTTP 400 (`"Item has already been fully returned or has an active return request pending"`).
- Total returned quantity in DB = 1.

### 5. Actual Result (Without Transaction Lock)
- Both requests succeed (HTTP 201).
- Total returned quantity in DB = 2 (exceeding purchased quantity of 1).

### 6. Root Cause Analysis
Quantity eligibility check and return creation must occur inside an atomic database transaction (`prisma.$transaction`). Without serialized transaction isolation or lock, read-then-write race conditions occur.

### 7. Recommended Fix
Wrap return creation and inventory validation inside `prisma.$transaction(async (tx) => { ... })` and verify remaining available quantity directly within the transaction boundary.

