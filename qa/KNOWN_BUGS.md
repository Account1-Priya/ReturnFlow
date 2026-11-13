# Known Seeded Defects (QA Test Oracle Toggle)

The ReturnFlow codebase includes deliberate, realistic defects that can be toggled via the environment flag `ENABLE_SEEDED_BUGS=true`.

These exist **purely so the test suite, SDET automation, and technical interviewers have real, documented bugs to catch and verify in automated test suites**.

---

## How to Toggle Seeded Bugs

In `backend/.env`:
```bash
# Set to true to inject seeded bugs
ENABLE_SEEDED_BUGS=true

# Set to false for standard production behavior
ENABLE_SEEDED_BUGS=false
```

Or pass via command line:
```bash
$env:ENABLE_SEEDED_BUGS="true"; npm test
```

---

## Catalog of Seeded Defects

### 1. Off-by-one Error on 30-Day Return Window (Bug ID: `RF-BUG-001`)
- **File:** `backend/src/services/eligibilityService.ts`
- **Specification:** Policy grants customers a 30-day return window from the delivery date (day 30 is strictly allowed, day 31 is rejected).
- **Injected Defect:** When `ENABLE_SEEDED_BUGS=true`, the threshold is set to `30.0` instead of `31.0`. Any order delivered 30 days and 1 second ago is rejected.
- **Caught By:**
  - Jest Unit Test: `tests/unit/seededBugs.test.ts`
  - Playwright E2E: Boundary test spec
  - Test Case: `TC-BUG-001` / `TC-ELIG-007`

---

### 2. Restocking Fee Charged on Defective Returns (Bug ID: `RF-BUG-002`)
- **File:** `backend/src/services/refundCalculator.ts`
- **Specification:** A 15% restocking fee is deducted for `CHANGED_MIND` and `NOT_AS_DESCRIBED` returns. Restocking fees must be strictly waived for seller-fault returns (`DEFECTIVE`, `DAMAGED_IN_TRANSIT`, `WRONG_ITEM`).
- **Injected Defect:** When `ENABLE_SEEDED_BUGS=true`, returns with reason `DEFECTIVE` are charged a 15% restocking fee deduction.
- **Caught By:**
  - Jest Unit Test: `tests/unit/seededBugs.test.ts`
  - Newman Postman Collection: Financial assertion script
  - Test Case: `TC-BUG-002` / `TC-REF-006`

---

### 3. Insecure Direct Object Reference (IDOR) on Return Detail (Bug ID: `RF-BUG-003`)
- **File:** `backend/src/services/returnService.ts`
- **Specification:** A customer must NEVER access another customer's returns or data (returns HTTP 403 Forbidden).
- **Injected Defect:** When `ENABLE_SEEDED_BUGS=true`, the customer ownership check on `GET /returns/:id` is bypassed, allowing Customer A (Alice) to read Customer B's (Bob) return request and private customer details.
- **Caught By:**
  - Jest Unit Test: `tests/unit/seededBugs.test.ts`
  - Supertest Security Integration Test: `TC-SEC-001`
  - Playwright Security E2E Spec: Cross-customer URL navigation

---

### 4. Integer Truncation Discrepancy on Discount Splits (Bug ID: `RF-BUG-004`)
- **File:** `backend/src/services/refundCalculator.ts`
- **Specification:** Prorated discount allocations must use financial Banker's Rounding (`ROUND_HALF_EVEN`) to maintain 100% cent reconciliation across multi-line splits.
- **Injected Defect:** When `ENABLE_SEEDED_BUGS=true`, individual line discounts use `Math.trunc()` instead of Banker's Rounding, resulting in a 1-cent to 2-cent loss across 3-way discount splits.
- **Caught By:**
  - Jest Unit Test: `TC-REF-016`
  - SQL Reconciliation Script: `qa/sql/03_refund_reconciliation.sql`

