# ReturnFlow – Master Quality Assurance Test Plan (SDET)

## 1. Document Overview & Executive Summary
- **Project Name:** ReturnFlow – Return & Refund Management System
- **Document Version:** 1.0.0
- **Authors:** Senior SDET / QA Lead
- **Target Audience:** Engineering Team, QA Engineers, Product Managers, Technical Interviewers

ReturnFlow is an enterprise-grade e-commerce returns and refund processing platform. This Master Test Plan outlines the testing strategy, test levels, verification oracles, environment configurations, and acceptance criteria required to validate business rules, financial calculations, data integrity, role-based security, and end-to-end user journeys.

---

## 2. Scope & Objectives

### 2.1 In-Scope Modules
1. **Authentication & Authorization:** Customer & Admin registration, JWT authentication, session handling, and role-based access control (RBAC).
2. **Order Eligibility & Policy Validation:**
   - 30-day window policy enforcement (day 30 valid, day 31 invalid).
   - Order delivery status checks (`DELIVERED` required).
   - Non-returnable product category exclusions (`GIFT_CARD`, `PERISHABLE`, `PERSONALIZED`, and `is_final_sale=true`).
   - Line item quantity boundaries & duplicate request locking across active returns.
   - Mandatory proof image rules based on return reasons.
3. **Financial Refund Calculation Engine:**
   - Unit price minus prorated order-level discount per unit.
   - Proportional sales tax refund.
   - 15% restocking fee on customer-fault returns (`CHANGED_MIND`, `NOT_AS_DESCRIBED`).
   - Full original shipping refund on entire-order seller-fault returns (`DEFECTIVE`, `DAMAGED_IN_TRANSIT`, `WRONG_ITEM`).
   - Financial Banker's Rounding (`ROUND_HALF_EVEN`) with integer cents precision.
4. **Returns State Machine:**
   - `SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED`
   - `APPROVED → REFUND_INITIATED → REFUNDED | REFUND_FAILED`
   - Customer-only cancellation in `SUBMITTED` state.
   - Invariant check: Terminal states (`REJECTED`, `CANCELLED`, `REFUNDED`) are immutable.
5. **Database Integrity & Audit Logging:**
   - Every status transition logged to `return_status_history` with actor, timestamp, and notes.
   - Referential integrity, check constraints, and orphan record prevention.
6. **Security & Vulnerability Testing:**
   - IDOR (Insecure Direct Object Reference) prevention.
   - File upload validation (MIME types, extensions, size <= 5 MB, count <= 5).
   - XSS sanitization on comments and rejection reasons.
   - Rate limiting on authentication endpoints.

### 2.2 Out-of-Scope
- Physical warehouse logistics scanning / carrier barcoding hardware.
- Live credit card processor settlement (simulated mock gateway used).

---

## 3. Testing Strategy & Test Types

| Test Level | Scope | Primary Tools | Execution Cadence |
|---|---|---|---|
| **Unit Tests** | Business logic oracles (`eligibilityService`, `refundCalculator`), seeded bug toggles | Jest, ts-jest, Decimal.js | Pre-commit & CI |
| **API Integration Tests** | REST endpoints, JWT authentication, status transitions, validation | Supertest, Express, Jest | CI & Daily |
| **API Automated Collection** | Comprehensive Postman collection, pre-request auth scripts, assertion tests | Postman, Newman CLI | Nightly & CI |
| **Database & SQL Tests** | Referential integrity, financial consistency, state machine queries | PostgreSQL CLI, Node-Prisma | Post-deployment & Data Audit |
| **End-to-End (E2E) Tests** | Multi-role user journeys, Page Object Model, hybrid API+UI assertions | Playwright (Chromium, Firefox, WebKit) | PR Gate & Nightly |
| **Security Tests** | IDOR verification, mass assignment, unauthenticated tampering | Supertest, Zod schemas | Security Audit |

---

## 4. Test Environments & Configurations

### 4.1 Environments
- **Local Dev / Testing:** Node.js v20+, Vite local dev server (`http://localhost:5173`), API server (`http://localhost:3001`).
- **Database:** Supabase PostgreSQL cloud instance / SQLite fallback for offline execution.
- **Continuous Integration (CI):** GitHub Actions runner (`ubuntu-latest`) executing backend tests and Playwright E2E suites.

### 4.2 Seeded Baseline Dataset
The test database contains a deterministic baseline:
- 2 Admins (`admin@returnflow.com`, `admin2@returnflow.com`)
- 5 Customers (`alice@example.com`, `bob@example.com`, `charlie@example.com`, `diana@example.com`, `eve@example.com`)
- 22 Products across categories (`ELECTRONICS`, `CLOTHING`, `BOOKS`, `GIFT_CARD`, `PERISHABLE`, `PERSONALIZED`, `HOME`, `SPORTS`, `OTHER`)
- 36 Orders covering exact edge cases:
  - Delivered exactly 30 days ago today (boundary valid)
  - Delivered exactly 31 days ago today (boundary invalid)
  - Delivered 1 day ago / 60 days ago
  - Non-delivered statuses (`PENDING`, `PROCESSING`, `SHIPPED`, `CANCELLED`)
  - Order-level discount variations (0%, 10%, 20%)
  - Free shipping vs paid shipping
  - Pre-seeded returns across all statuses

---

## 5. Entry & Exit Criteria

### 5.1 Entry Criteria
- Clean compile of backend TypeScript (`tsc --noEmit`).
- Database schema synchronized and verified via Prisma.
- Baseline seed data loaded without constraint violations.
- API documentation available via `/api/docs`.

### 5.2 Exit Criteria
- 100% pass rate on all unit tests (`eligibilityService`, `refundCalculator`).
- 100% pass rate on Supertest API integration test suites.
- 100% pass rate on Newman Postman automated test collection.
- 0 failed integrity assertions on SQL database test suite.
- 100% pass rate on Playwright E2E smoke and regression suites.
- All documented seeded bugs verified catchable when `ENABLE_SEEDED_BUGS=true`.

---

## 6. Risk Assessment & Mitigation

| Identified Risk | Impact | Probability | Mitigation Strategy |
|---|---|---|---|
| Floating point arithmetic inaccuracies in financial refunds | High | High | Use `Decimal.js` with `ROUND_HALF_EVEN` Banker's Rounding and store all monetary values as integer cents. |
| Insecure Direct Object Reference (Customer accessing other returns) | Critical | Medium | Enforce strict customer ownership check on all order and return query filters. |
| Malicious or oversized file uploads | High | Medium | Dual validation via Multer: MIME type sniffing + file extension verification + 5MB size limit. |
| Race condition causing double return submissions | High | Medium | Execute return creation within an atomic database transaction (`prisma.$transaction`) with remaining quantity verification. |
| External database connectivity drops | Medium | Low | Pooler configuration with connection limits (`connection_limit=5`) and local SQLite fallback. |

---

## 7. QA Roles & Responsibilities

- **Senior SDET:** Architecture of automation frameworks (Jest, Postman, Playwright), CI/CD workflow pipeline, test data management.
- **QA Automation Engineer:** Implementation of Playwright Page Object Model, API test collections in Newman, regression execution.
- **Manual QA / SDET:** Exploratory testing, edge case scenario validation, bug report documentation, verification of bug fixes.

