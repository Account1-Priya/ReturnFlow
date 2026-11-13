-- ============================================================================
-- 01_data_integrity.sql – ReturnFlow Database Integrity & Constraint Verification
-- ============================================================================
-- Purpose:
--   Verifies that no orphan records exist, monetary values are strictly non-negative,
--   quantities are strictly positive, and returned quantities never exceed purchased limits.
-- Expected Result:
--   All queries should return 0 rows. Any rows returned indicate data corruption.
-- ============================================================================

-- 1. Check for Orphan Return Items (return_items referencing non-existent return_requests)
SELECT ri.id, ri.return_request_id, ri.order_item_id
FROM return_items ri
LEFT JOIN return_requests rr ON ri.return_request_id = rr.id
WHERE rr.id IS NULL;

-- 2. Check for Orphan Return Images (return_images referencing non-existent return_requests)
SELECT img.id, img.return_request_id, img.file_name
FROM return_images img
LEFT JOIN return_requests rr ON img.return_request_id = rr.id
WHERE rr.id IS NULL;

-- 3. Check for Orphan Refunds (refunds referencing non-existent return_requests)
SELECT ref.id, ref.return_request_id, ref.total_refund_cents
FROM refunds ref
LEFT JOIN return_requests rr ON ref.return_request_id = rr.id
WHERE rr.id IS NULL;

-- 4. Check for Negative Monetary Values in Products & Orders
SELECT id, sku, unit_price_cents
FROM products
WHERE unit_price_cents < 0;

SELECT id, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents
FROM orders
WHERE subtotal_cents < 0 
   OR discount_cents < 0 
   OR shipping_cents < 0 
   OR tax_cents < 0 
   OR total_cents < 0;

-- 5. Check for Negative Monetary Values in Return Items
SELECT id, return_request_id, item_refund_cents, tax_refund_cents, restocking_fee_cents, shipping_refund_cents, total_refund_cents
FROM return_items
WHERE item_refund_cents < 0
   OR tax_refund_cents < 0
   OR restocking_fee_cents < 0
   OR shipping_refund_cents < 0
   OR total_refund_cents < 0;

-- 6. Check for Zero or Negative Quantities
SELECT id, order_id, quantity
FROM order_items
WHERE quantity <= 0;

SELECT id, return_request_id, quantity_returned
FROM return_items
WHERE quantity_returned <= 0;

-- 7. Check for Single-Line Return Quantity Exceeding Line Purchased Quantity
SELECT ri.id AS return_item_id, ri.quantity_returned, oi.quantity AS purchased_quantity, oi.id AS order_item_id
FROM return_items ri
JOIN order_items oi ON ri.order_item_id = oi.id
WHERE ri.quantity_returned > oi.quantity;

-- 8. Check for Refund Exceeding Order Item Total Paid Amount
SELECT ri.id AS return_item_id, ri.total_refund_cents, (oi.line_total_cents + oi.tax_cents) AS max_allowable_cents
FROM return_items ri
JOIN order_items oi ON ri.order_item_id = oi.id
WHERE ri.total_refund_cents > (oi.line_total_cents + oi.tax_cents);

