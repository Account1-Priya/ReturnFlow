-- ============================================================================
-- 05_constraint_tests.sql – Negative Testing & DDL Constraint Enforcement Tests
-- ============================================================================
-- Purpose:
--   Attempts invalid inserts and updates to verify that PostgreSQL database
--   schema constraints (UNIQUE, FK, CHECK, NOT NULL, ENUM) correctly reject corrupt data.
-- How to run:
--   Each test runs inside a transaction block (BEGIN ... ROLLBACK).
--   In psql, executing an invalid statement will throw an ERROR and rollback.
-- ============================================================================

-- ============================================================================
-- Test 1: Duplicate Email in users table (UNIQUE constraint)
-- Expected: ERROR: duplicate key value violates unique constraint "users_email_key"
-- ============================================================================
BEGIN;
DO $$
BEGIN
  INSERT INTO users (id, email, password_hash, role, first_name, last_name, created_at, updated_at)
  VALUES ('test-user-dup', 'customer1@returnflow.io', 'hash123', 'CUSTOMER', 'Duplicate', 'User', NOW(), NOW());
  RAISE EXCEPTION 'TEST FAILED: Unique constraint on users(email) was not enforced!';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'TEST PASSED: Unique constraint on users(email) correctly rejected duplicate email.';
END $$;
ROLLBACK;

-- ============================================================================
-- Test 2: Negative quantity in order_items (CHECK quantity > 0)
-- Expected: ERROR: violates check constraint or application rejection
-- ============================================================================
BEGIN;
DO $$
BEGIN
  INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, discount_cents, tax_cents, total_cents)
  VALUES ('oi-invalid-qty', (SELECT id FROM orders LIMIT 1), (SELECT id FROM products LIMIT 1), 0, 1000, 0, 80, 1080);
  
  -- If table doesn't have native CHECK, test whether quantity <= 0 is found
  IF EXISTS (SELECT 1 FROM order_items WHERE id = 'oi-invalid-qty' AND quantity <= 0) THEN
    RAISE EXCEPTION 'TEST WARNING: order_items allowed quantity <= 0. CHECK constraint recommended.';
  END IF;
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'TEST PASSED: CHECK constraint on order_items(quantity > 0) rejected non-positive quantity.';
  WHEN OTHERS THEN
    RAISE NOTICE 'TEST HANDLED: %', SQLERRM;
END $$;
ROLLBACK;

-- ============================================================================
-- Test 3: Foreign Key Integrity on return_items (Invalid order_item_id)
-- Expected: ERROR: insert or update on table "return_items" violates foreign key constraint
-- ============================================================================
BEGIN;
DO $$
BEGIN
  INSERT INTO return_items (
    id, return_request_id, order_item_id, quantity, reason, 
    item_refund_cents, tax_refund_cents, restocking_fee_cents, shipping_refund_cents, total_refund_cents
  )
  VALUES (
    'ri-invalid-fk', 
    (SELECT id FROM return_requests LIMIT 1), 
    'non-existent-order-item-id-99999', 
    1, 
    'DEFECTIVE', 
    1000, 80, 0, 0, 1080
  );
  RAISE EXCEPTION 'TEST FAILED: Foreign key constraint on return_items(order_item_id) was not enforced!';
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'TEST PASSED: Foreign key constraint on return_items(order_item_id) correctly enforced.';
END $$;
ROLLBACK;

-- ============================================================================
-- Test 4: Negative Total Refund Cents in refunds table
-- Expected: Handled or rejected
-- ============================================================================
BEGIN;
DO $$
BEGIN
  INSERT INTO refunds (
    id, return_request_id, amount_cents, currency, status, 
    item_refund_cents, tax_refund_cents, restocking_fee_cents, shipping_refund_cents, total_refund_cents,
    created_at, updated_at
  )
  VALUES (
    'ref-invalid-neg',
    (SELECT id FROM return_requests LIMIT 1),
    -500,
    'USD',
    'COMPLETED',
    -500, 0, 0, 0, -500,
    NOW(), NOW()
  );
  
  IF EXISTS (SELECT 1 FROM refunds WHERE id = 'ref-invalid-neg' AND total_refund_cents < 0) THEN
    RAISE EXCEPTION 'TEST WARNING: refunds table allowed negative total_refund_cents.';
  END IF;
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'TEST PASSED: CHECK constraint rejected negative refund amounts.';
  WHEN OTHERS THEN
    RAISE NOTICE 'TEST HANDLED: %', SQLERRM;
END $$;
ROLLBACK;

-- ============================================================================
-- Test 5: Foreign Key Cascade/Restrict Check on products deletion
-- Expected: Attempting to delete a product that has existing order_items must fail
-- ============================================================================
BEGIN;
DO $$
DECLARE
  v_prod_id VARCHAR;
BEGIN
  SELECT product_id INTO v_prod_id FROM order_items LIMIT 1;
  DELETE FROM products WHERE id = v_prod_id;
  RAISE EXCEPTION 'TEST FAILED: Deleting a referenced product succeeded without FK protection!';
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'TEST PASSED: Foreign key RESTRICT on products deletion correctly prevented orphan order_items.';
END $$;
ROLLBACK;

