-- ============================================================================
-- 03_refund_reconciliation.sql – Financial Ledger & Refund Calculation Reconciliation
-- ============================================================================
-- Purpose:
--   Verifies mathematical and accounting integrity across all return items,
--   return requests, refunds, and original order transactions.
-- Expected Result:
--   Queries 1 through 6 must return 0 rows (0 discrepancies).
--   Query 7 provides financial summary totals for reconciliation reporting.
-- ============================================================================

-- 1. Check: return_items arithmetic consistency:
-- total_refund_cents MUST EQUAL (item_refund_cents + tax_refund_cents - restocking_fee_cents + shipping_refund_cents)
SELECT 
  id AS return_item_id,
  return_request_id,
  item_refund_cents,
  tax_refund_cents,
  restocking_fee_cents,
  shipping_refund_cents,
  total_refund_cents,
  (item_refund_cents + tax_refund_cents - restocking_fee_cents + shipping_refund_cents) AS expected_total,
  (total_refund_cents - (item_refund_cents + tax_refund_cents - restocking_fee_cents + shipping_refund_cents)) AS discrepancy
FROM return_items
WHERE total_refund_cents != (item_refund_cents + tax_refund_cents - restocking_fee_cents + shipping_refund_cents);

-- 2. Check: return_requests.estimated_refund_cents MUST EQUAL SUM(return_items.total_refund_cents)
WITH calculated_returns AS (
  SELECT 
    return_request_id,
    SUM(total_refund_cents) AS sum_items_refund
  FROM return_items
  GROUP BY return_request_id
)
SELECT 
  rr.id AS return_id,
  rr.estimated_refund_cents,
  cr.sum_items_refund,
  (rr.estimated_refund_cents - cr.sum_items_refund) AS discrepancy
FROM return_requests rr
JOIN calculated_returns cr ON rr.id = cr.return_request_id
WHERE rr.estimated_refund_cents != cr.sum_items_refund;

-- 3. Check: refunds table totals MUST MATCH return_requests.estimated_refund_cents
SELECT 
  ref.id AS refund_id,
  ref.return_request_id,
  ref.total_refund_cents AS refund_table_total,
  rr.estimated_refund_cents AS return_request_total,
  (ref.total_refund_cents - rr.estimated_refund_cents) AS discrepancy
FROM refunds ref
JOIN return_requests rr ON ref.return_request_id = rr.id
WHERE ref.total_refund_cents != rr.estimated_refund_cents;

-- 4. Check: Restocking fee rule verification
-- CHANGED_MIND or NOT_AS_DESCRIBED -> restocking_fee = ROUND(item_refund_cents * 0.15)
-- DEFECTIVE, DAMAGED_IN_TRANSIT, WRONG_ITEM -> restocking_fee MUST BE 0
SELECT 
  ri.id AS return_item_id,
  ri.reason,
  ri.item_refund_cents,
  ri.restocking_fee_cents,
  CASE 
    WHEN ri.reason IN ('CHANGED_MIND', 'NOT_AS_DESCRIBED') THEN ROUND(ri.item_refund_cents * 0.15)
    ELSE 0
  END AS expected_fee
FROM return_items ri
WHERE 
  (ri.reason IN ('DEFECTIVE', 'DAMAGED_IN_TRANSIT', 'WRONG_ITEM') AND ri.restocking_fee_cents != 0)
  OR
  (ri.reason IN ('CHANGED_MIND', 'NOT_AS_DESCRIBED') AND ABS(ri.restocking_fee_cents - ROUND(ri.item_refund_cents * 0.15)) > 1);

-- 5. Check: Shipping refund is 0 unless reason is seller fault (DEFECTIVE/DAMAGED/WRONG)
SELECT 
  ri.id AS return_item_id,
  ri.reason,
  ri.shipping_refund_cents
FROM return_items ri
WHERE ri.reason IN ('CHANGED_MIND', 'NOT_AS_DESCRIBED', 'OTHER')
  AND ri.shipping_refund_cents > 0;

-- 6. Check: Cumulative refunds across all returns for an order CANNOT EXCEED order.total_cents
WITH order_refund_sums AS (
  SELECT 
    rr.order_id,
    SUM(rr.estimated_refund_cents) AS total_returned_cents
  FROM return_requests rr
  WHERE rr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REFUND_INITIATED', 'REFUNDED')
  GROUP BY rr.order_id
)
SELECT 
  o.id AS order_id,
  o.order_number,
  o.total_cents AS order_total_cents,
  ors.total_returned_cents,
  (ors.total_returned_cents - o.total_cents) AS over_refund_amount
FROM orders o
JOIN order_refund_sums ors ON o.id = ors.order_id
WHERE ors.total_returned_cents > o.total_cents;

-- 7. Management Financial Reconciliation Summary
SELECT 
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.total_cents) / 100.0 AS gross_sales_dollars,
  COUNT(DISTINCT rr.id) AS total_return_requests,
  COALESCE(SUM(ref.total_refund_cents) FILTER (WHERE ref.status = 'COMPLETED'), 0) / 100.0 AS net_refunds_issued_dollars,
  ROUND(
    (COALESCE(SUM(ref.total_refund_cents) FILTER (WHERE ref.status = 'COMPLETED'), 0)::numeric / 
     NULLIF(SUM(o.total_cents), 0)::numeric) * 100, 
    2
  ) AS return_rate_percentage
FROM orders o
LEFT JOIN return_requests rr ON o.id = rr.order_id
LEFT JOIN refunds ref ON rr.id = ref.return_request_id;

