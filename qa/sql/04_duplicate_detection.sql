-- ============================================================================
-- 04_duplicate_detection.sql – Duplicate Return Requests & Quantity Boundary Audits
-- ============================================================================
-- Purpose:
--   Verifies that no order item has active return requests exceeding purchased
--   quantity (Duplicate Prevention Oracle), and checks for concurrent duplicate items.
-- Expected Result:
--   Queries 1, 2, and 3 must return 0 rows.
--   Query 4 provides an inventory of remaining returnable quantities per order item.
-- ============================================================================

-- 1. Check: Active return quantity MUST NOT exceed order item purchased quantity
-- Active statuses: SUBMITTED, UNDER_REVIEW, APPROVED, REFUND_INITIATED, REFUNDED
WITH active_returns_per_item AS (
  SELECT 
    ri.order_item_id,
    SUM(ri.quantity) AS total_active_return_qty
  FROM return_items ri
  JOIN return_requests rr ON ri.return_request_id = rr.id
  WHERE rr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REFUND_INITIATED', 'REFUNDED')
  GROUP BY ri.order_item_id
)
SELECT 
  oi.id AS order_item_id,
  oi.order_id,
  oi.product_id,
  oi.quantity AS purchased_quantity,
  ar.total_active_return_qty,
  (ar.total_active_return_qty - oi.quantity) AS excess_returned_qty
FROM order_items oi
JOIN active_returns_per_item ar ON oi.id = ar.order_item_id
WHERE ar.total_active_return_qty > oi.quantity;

-- 2. Check: A single return request should NEVER contain duplicate entries for the same order_item_id
SELECT 
  return_request_id,
  order_item_id,
  COUNT(*) AS duplicate_item_occurrences
FROM return_items
GROUP BY return_request_id, order_item_id
HAVING COUNT(*) > 1;

-- 3. Check: Cancelled or Rejected returns must NOT block subsequent returns
-- Verify that items with cancelled/rejected returns and no active returns have available quantity equal to purchased
WITH inactive_returns AS (
  SELECT 
    ri.order_item_id,
    SUM(ri.quantity) AS released_quantity
  FROM return_items ri
  JOIN return_requests rr ON ri.return_request_id = rr.id
  WHERE rr.status IN ('REJECTED', 'CANCELLED')
  GROUP BY ri.order_item_id
),
active_returns AS (
  SELECT 
    ri.order_item_id,
    SUM(ri.quantity) AS active_quantity
  FROM return_items ri
  JOIN return_requests rr ON ri.return_request_id = rr.id
  WHERE rr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REFUND_INITIATED', 'REFUNDED')
  GROUP BY ri.order_item_id
)
SELECT 
  oi.id AS order_item_id,
  oi.order_id,
  oi.quantity AS purchased_qty,
  COALESCE(ir.released_quantity, 0) AS previously_rejected_cancelled_qty,
  COALESCE(ar.active_quantity, 0) AS current_active_qty,
  (oi.quantity - COALESCE(ar.active_quantity, 0)) AS calculated_available_qty
FROM order_items oi
JOIN inactive_returns ir ON oi.id = ir.order_item_id
LEFT JOIN active_returns ar ON oi.id = ar.order_item_id
WHERE (oi.quantity - COALESCE(ar.active_quantity, 0)) < 0;

-- 4. Audit Reporting: Per-Item Returnability Ledger
SELECT 
  o.order_number,
  o.status AS order_status,
  p.sku,
  p.title,
  oi.quantity AS purchased_qty,
  COALESCE(SUM(ri.quantity) FILTER (WHERE rr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REFUND_INITIATED', 'REFUNDED')), 0) AS active_returned_qty,
  COALESCE(SUM(ri.quantity) FILTER (WHERE rr.status IN ('REJECTED', 'CANCELLED')), 0) AS freed_quantity,
  (oi.quantity - COALESCE(SUM(ri.quantity) FILTER (WHERE rr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REFUND_INITIATED', 'REFUNDED')), 0)) AS remaining_returnable_qty
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
LEFT JOIN return_items ri ON oi.id = ri.order_item_id
LEFT JOIN return_requests rr ON ri.return_request_id = rr.id
GROUP BY o.order_number, o.status, p.sku, p.title, oi.quantity, oi.id
ORDER BY o.order_number;

