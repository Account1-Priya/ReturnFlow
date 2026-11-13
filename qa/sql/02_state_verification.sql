-- ============================================================================
-- 02_state_verification.sql – ReturnFlow Status Machine & Workflow State Verification
-- ============================================================================
-- Purpose:
--   Verifies that database state accurately reflects business rules and state machine
--   invariants across return requests, refunds, status histories, and reasons.
-- Expected Result:
--   Queries 1 through 8 must return 0 rows (0 violations).
--   Query 9 displays the current aggregate status distribution for audit reporting.
-- ============================================================================

-- 1. Check: REFUNDED return requests MUST have a COMPLETED refund record
SELECT rr.id AS return_id, rr.status AS return_status, ref.id AS refund_id, ref.status AS refund_status
FROM return_requests rr
LEFT JOIN refunds ref ON rr.id = ref.return_request_id
WHERE rr.status = 'REFUNDED'
  AND (ref.id IS NULL OR ref.status != 'COMPLETED');

-- 2. Check: REJECTED return requests MUST have a non-empty rejection_reason
SELECT rr.id AS return_id, rr.status, rr.rejection_reason
FROM return_requests rr
WHERE rr.status = 'REJECTED'
  AND (rr.rejection_reason IS NULL OR TRIM(rr.rejection_reason) = '');

-- 3. Check: CANCELLED return requests must NOT have been reviewed or approved before cancellation
-- In the state machine: CANCELLED can only be reached directly from SUBMITTED
SELECT rr.id AS return_id, rsh.from_status, rsh.to_status, rsh.created_at
FROM return_requests rr
JOIN return_status_history rsh ON rr.id = rsh.return_request_id
WHERE rr.status = 'CANCELLED'
  AND rsh.to_status = 'CANCELLED'
  AND rsh.from_status != 'SUBMITTED';

-- 4. Check: Every return_request MUST have an initial audit history entry (to_status = 'SUBMITTED')
SELECT rr.id AS return_id, rr.status, rr.created_at
FROM return_requests rr
LEFT JOIN return_status_history rsh 
       ON rr.id = rsh.return_request_id 
      AND rsh.to_status = 'SUBMITTED'
WHERE rsh.id IS NULL;

-- 5. Check: Latest return_status_history to_status MUST match current return_requests.status
WITH latest_history AS (
  SELECT DISTINCT ON (return_request_id)
    return_request_id,
    to_status,
    created_at
  FROM return_status_history
  ORDER BY return_request_id, created_at DESC
)
SELECT rr.id AS return_id, rr.status AS current_status, lh.to_status AS audit_status
FROM return_requests rr
JOIN latest_history lh ON rr.id = lh.return_request_id
WHERE rr.status != lh.to_status;

-- 6. Check: Proof images MUST be present for DEFECTIVE, DAMAGED_IN_TRANSIT, WRONG_ITEM
SELECT DISTINCT rr.id AS return_id, ri.reason
FROM return_requests rr
JOIN return_items ri ON rr.id = ri.return_request_id
LEFT JOIN return_images img ON rr.id = img.return_request_id
WHERE ri.reason IN ('DEFECTIVE', 'DAMAGED_IN_TRANSIT', 'WRONG_ITEM')
  AND img.id IS NULL;

-- 7. Check: Reason 'OTHER' must have a comment of at least 10 characters
SELECT ri.id AS return_item_id, ri.return_request_id, ri.reason, ri.customer_comment,
       LENGTH(COALESCE(ri.customer_comment, '')) AS comment_len
FROM return_items ri
WHERE ri.reason = 'OTHER'
  AND (ri.customer_comment IS NULL OR LENGTH(TRIM(ri.customer_comment)) < 10);

-- 8. Check: Ineligible categories or final sale items should NEVER be in return_items
SELECT ri.id AS return_item_id, ri.return_request_id, p.id AS product_id, p.title, p.category, p.is_final_sale
FROM return_items ri
JOIN order_items oi ON ri.order_item_id = oi.id
JOIN products p ON oi.product_id = p.id
WHERE p.is_final_sale = TRUE
   OR p.category IN ('GIFT_CARD', 'PERISHABLE', 'PERSONALIZED');

-- 9. Audit Reporting: Return Requests Count by Status
SELECT status, COUNT(*) AS total_count, MIN(created_at) AS earliest, MAX(created_at) AS latest
FROM return_requests
GROUP BY status
ORDER BY total_count DESC;

