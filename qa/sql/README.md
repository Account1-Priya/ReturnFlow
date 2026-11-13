# ReturnFlow – Database Testing & SQL Validation Suite

This directory contains database test scripts, integrity oracles, status reconciliation checks, and constraint test cases for the **ReturnFlow Return & Refund Management System**.

---

## 📁 Directory Contents

| Script | Purpose | Test Oracle / Acceptance Criteria |
| :--- | :--- | :--- |
| [`01_data_integrity.sql`](file:///c:/Users/hp/Desktop/RetrunFlow/qa/sql/01_data_integrity.sql) | Orphan checks, negative amounts, quantity boundaries, refund caps. | All queries must return **0 rows**. |
| [`02_state_verification.sql`](file:///c:/Users/hp/Desktop/RetrunFlow/qa/sql/02_state_verification.sql) | Validates state machine invariants, required audit logs, proof images, and reason rules. | Queries 1–8 must return **0 rows**. Query 9 outputs status distribution. |
| [`03_refund_reconciliation.sql`](file:///c:/Users/hp/Desktop/RetrunFlow/qa/sql/03_refund_reconciliation.sql) | Mathematical ledger audits (item + tax - restocking + shipping = total; refund <= paid). | Queries 1–6 must return **0 rows**. Query 7 outputs executive P&L reconciliation. |
| [`04_duplicate_detection.sql`](file:///c:/Users/hp/Desktop/RetrunFlow/qa/sql/04_duplicate_detection.sql) | Duplicate request prevention, active returns vs purchased quantity checks. | Queries 1–3 must return **0 rows**. Query 4 outputs per-item returnability matrix. |
| [`05_constraint_tests.sql`](file:///c:/Users/hp/Desktop/RetrunFlow/qa/sql/05_constraint_tests.sql) | Negative DDL constraint tests (unique keys, foreign keys, check constraints). | Each negative test transaction must throw the expected exception and rollback. |

---

## 🚀 How to Execute

### Option 1: Using `psql` CLI (PostgreSQL)

You can run any script directly using `psql` with your Supabase or local PostgreSQL connection string:

```bash
# Set connection string (from backend/.env)
psql "$DATABASE_URL" -f qa/sql/01_data_integrity.sql
psql "$DATABASE_URL" -f qa/sql/02_state_verification.sql
psql "$DATABASE_URL" -f qa/sql/03_refund_reconciliation.sql
psql "$DATABASE_URL" -f qa/sql/04_duplicate_detection.sql
psql "$DATABASE_URL" -f qa/sql/05_constraint_tests.sql
```

### Option 2: Using Node.js / Prisma Query Script

From the `backend/` directory, you can also execute SQL verification using Prisma `$queryRaw`:

```bash
cd backend
npx prisma db execute --file ../qa/sql/01_data_integrity.sql
```

### Option 3: Using GUI Clients (DBeaver, pgAdmin, Supabase SQL Editor)
1. Open the SQL Editor in your Supabase Dashboard or DBeaver.
2. Paste the contents of any script.
3. Execute and verify that verification queries return 0 rows.

---

## 📊 Summary of Database Testing Oracles

1. **Orphan Records:** No child record exists in `return_items`, `return_images`, `refunds`, or `return_status_history` without a corresponding valid parent in `return_requests`.
2. **Double Refund Protection:** An order's cumulative refunded amount across all approved/completed returns can never exceed the customer's total payment for that order (`orders.total_cents`).
3. **Quantity Ceiling:** The sum of quantities across active returns (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REFUND_INITIATED`, `REFUNDED`) for any given item cannot exceed `order_items.quantity`.
4. **State Machine Integrity:** Only `SUBMITTED` returns can transition to `CANCELLED`. Only `REFUNDED` returns have a `COMPLETED` refund row. All `REJECTED` returns must document a `rejection_reason`.
5. **Auditing Completeness:** Every status change inserts an immutable audit row with timestamp, actor (`actor_user_id` or `SYSTEM`), `from_status`, `to_status`, and notes.

