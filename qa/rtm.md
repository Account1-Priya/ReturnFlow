# Requirements Traceability Matrix (RTM)

## ReturnFlow – Return & Refund Management System

This document maps every business rule, security requirement, financial calculation oracle, and state machine specification to its corresponding test cases and automated test suites.

---

| Req ID | Requirement Description | Test Case IDs | Verification Level | Automated Test Coverage |
|---|---|---|---|---|
| **REQ-AUTH-01** | Customer registration with email, password (min 6), and name | TC-AUTH-001, TC-AUTH-002, TC-AUTH-003, TC-AUTH-004 | Unit & Integration | `tests/integration/auth.test.ts`, Playwright E2E |
| **REQ-AUTH-02** | User login returning signed JWT with role (CUSTOMER, ADMIN) | TC-AUTH-005, TC-AUTH-006, TC-AUTH-007, TC-AUTH-008 | Integration & E2E | `tests/integration/auth.test.ts`, Playwright `auth.setup.ts` |
| **REQ-AUTH-03** | Authenticated user profile retrieval (`GET /auth/me`) | TC-AUTH-009, TC-AUTH-010, TC-AUTH-011, TC-AUTH-012 | Integration | `tests/integration/auth.test.ts` |
| **REQ-AUTH-04** | Rate limiting protection on `/auth/*` endpoints | TC-AUTH-013 | Integration & Security | `src/middleware/rateLimiter.ts` |
| **REQ-ORD-01** | Customers view only their own orders (`GET /orders`) | TC-ORD-001, TC-ORD-002 | Integration & E2E | `tests/integration/returns.test.ts`, Playwright |
| **REQ-ORD-02** | Customer cannot view or access another customer's order (IDOR) | TC-ORD-003, TC-ORD-005 | Security & Integration | `tests/integration/returns.test.ts`, `src/services/orderService.ts` |
| **REQ-ELIG-01** | Order status must be DELIVERED to request a return | TC-ELIG-001, TC-ELIG-002, TC-ELIG-003, TC-ELIG-004, TC-ELIG-005 | Unit & Integration | `tests/unit/eligibilityService.test.ts` |
| **REQ-ELIG-02** | 30-day return window policy (day 30 valid, day 31 rejected) | TC-ELIG-006, TC-ELIG-007, TC-ELIG-008, TC-ELIG-009 | Unit & Boundary | `tests/unit/eligibilityService.test.ts` |
| **REQ-ELIG-03** | Non-returnable categories: GIFT_CARD, PERISHABLE, PERSONALIZED | TC-ELIG-010, TC-ELIG-011, TC-ELIG-012 | Unit & Integration | `tests/unit/eligibilityService.test.ts`, Playwright |
| **REQ-ELIG-04** | Items marked `is_final_sale=true` cannot be returned | TC-ELIG-013 | Unit & E2E | `tests/unit/eligibilityService.test.ts`, Playwright |
| **REQ-ELIG-05** | Requested quantity boundary: 1 <= qty <= available quantity | TC-ELIG-015, TC-ELIG-016, TC-ELIG-017, TC-ELIG-018, TC-ELIG-019 | Unit & Boundary | `tests/unit/eligibilityService.test.ts` |
| **REQ-ELIG-06** | Duplicate prevention: pending/approved returns lock quantity | TC-ELIG-020, TC-ELIG-021, TC-ELIG-022, TC-ELIG-023, TC-ELIG-024 | Unit & Database | `tests/unit/eligibilityService.test.ts`, SQL Script |
| **REQ-ELIG-07** | Cancelled and rejected requests free item returnable quantity | TC-ELIG-025, TC-ELIG-026, TC-ELIG-027 | Unit & Integration | `tests/unit/eligibilityService.test.ts` |
| **REQ-ELIG-08** | Return reasons & comment requirement (OTHER >= 10 chars) | TC-ELIG-033, TC-ELIG-034, TC-ELIG-035, TC-ELIG-036 | Unit & Validation | `tests/unit/eligibilityService.test.ts` |
| **REQ-ELIG-09** | Mandatory proof images for DEFECTIVE, DAMAGED, WRONG_ITEM | TC-ELIG-028, TC-ELIG-029, TC-ELIG-030, TC-ELIG-031, TC-ELIG-032 | Unit & E2E | `tests/unit/eligibilityService.test.ts`, Playwright |
| **REQ-REF-01** | Item refund = (unit price - prorated order discount per unit) * qty | TC-REF-001, TC-REF-002, TC-REF-003 | Unit & Financial Math | `tests/unit/refundCalculator.test.ts` |
| **REQ-REF-02** | Restocking fee: 15% for CHANGED_MIND and NOT_AS_DESCRIBED | TC-REF-004, TC-REF-005 | Unit & Financial Math | `tests/unit/refundCalculator.test.ts` |
| **REQ-REF-03** | Restocking fee waived for DEFECTIVE, DAMAGED, WRONG_ITEM | TC-REF-006, TC-REF-007, TC-REF-008 | Unit & Financial Math | `tests/unit/refundCalculator.test.ts` |
| **REQ-REF-04** | Proportional tax refund calculation | TC-REF-009, TC-REF-016 | Unit & Financial Math | `tests/unit/refundCalculator.test.ts` |
| **REQ-REF-05** | Full shipping refunded ONLY if entire order returned + seller fault | TC-REF-010, TC-REF-011, TC-REF-012, TC-REF-013, TC-REF-014, TC-REF-015 | Unit & Integration | `tests/unit/refundCalculator.test.ts` |
| **REQ-REF-06** | Financial Banker's Rounding (ROUND_HALF_EVEN) with integer cents | TC-REF-016, TC-REF-017 | Unit & DB Check | `tests/unit/refundCalculator.test.ts`, SQL Script |
| **REQ-REF-07** | Preview endpoint `POST /returns/preview` without creating record | TC-REF-018 | Integration & E2E | `tests/integration/returns.test.ts`, Playwright |
| **REQ-SM-01** | Admin marks SUBMITTED -> UNDER_REVIEW | TC-SM-001 | Integration & E2E | `tests/integration/admin.test.ts`, Playwright |
| **REQ-SM-02** | Admin approves UNDER_REVIEW -> APPROVED | TC-SM-002 | Integration & E2E | `tests/integration/admin.test.ts`, Playwright |
| **REQ-SM-03** | Admin rejects UNDER_REVIEW -> REJECTED (reason required) | TC-SM-003, TC-SM-004 | Integration & E2E | `tests/integration/admin.test.ts`, Playwright |
| **REQ-SM-04** | Refund processing: APPROVED -> REFUND_INITIATED -> REFUNDED | TC-SM-005 | Integration & E2E | `tests/integration/admin.test.ts`, Playwright |
| **REQ-SM-05** | Refund failure & retry handling (REFUND_FAILED -> REFUND_INITIATED) | TC-SM-006, TC-SM-007 | Integration & E2E | `tests/integration/admin.test.ts`, Playwright |
| **REQ-SM-06** | Customer cancellation restricted to SUBMITTED state | TC-SM-008, TC-SM-009, TC-SM-010 | Integration & E2E | `tests/integration/returns.test.ts`, Playwright |
| **REQ-SM-07** | Invalid state transitions blocked with HTTP 409 CONFLICT | TC-SM-011, TC-SM-012, TC-SM-013, TC-SM-014, TC-SM-015 | Integration | `tests/integration/admin.test.ts` |
| **REQ-FILE-01** | Proof upload validation: jpg/png/webp, <= 5MB, <= 5 files | TC-FILE-001 through TC-FILE-008 | Integration & Security | `src/services/fileService.ts`, Playwright |
| **REQ-SEC-01** | IDOR protection: Customer cannot read/cancel other returns | TC-SEC-001, TC-SEC-002, TC-SEC-003 | Security Integration | `tests/integration/returns.test.ts`, Playwright |
| **REQ-SEC-02** | RBAC: Customer cannot access `/admin/*` routes (403 Forbidden) | TC-SEC-004, TC-SEC-005, TC-SEC-006, TC-SEC-007 | Security Integration | `tests/integration/admin.test.ts`, Playwright |
| **REQ-SEC-03** | XSS sanitization on customer comments and admin notes | TC-SEC-008, TC-SEC-009 | Security Integration | `src/controllers/returnController.ts` |
| **REQ-AUD-01** | Complete audit logging in `return_status_history` | TC-AUD-001 through TC-AUD-006 | Integration & SQL | `tests/integration/admin.test.ts`, SQL Script |
| **REQ-BUG-01** | Configurable defect toggle via `ENABLE_SEEDED_BUGS=true` | TC-BUG-001, TC-BUG-002, TC-BUG-003 | Regression & QA | `tests/unit/seededBugs.test.ts` |

---

### Coverage Summary
- **Total Requirements Mapped:** 34
- **Total Test Cases:** 90
- **Test Automation Coverage:** 100% of P1 & P2 business logic requirements covered by automated Jest unit/integration tests and Playwright E2E specs.

