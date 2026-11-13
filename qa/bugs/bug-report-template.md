# Bug Report Template

**Bug ID:** RF-BUG-XXX  
**Title:** [Module] Concise summary of the defect  
**Severity:** Critical | High | Medium | Low  
**Priority:** P1 | P2 | P3  
**Status:** Open | In Progress | Resolved | Verified  
**Component:** Backend | Frontend | Database | State Machine | Financial Math  
**Environment:** Local / Staging (Node.js 20, PostgreSQL 16 / Supabase, Chrome 122)  
**Reporter:** Senior SDET / QA Engineer  

---

### 1. Description
Brief paragraph describing the unexpected behavior and business impact.

### 2. Preconditions
- User authenticated with role: [CUSTOMER / ADMIN]
- Specific database state required (e.g. delivered order, delivery date, item state)

### 3. Steps to Reproduce
1. Navigate to / Execute API call...
2. Enter payload...
3. Submit request...

### 4. Expected Result
What should happen according to the business rules oracle and PRD specifications.

### 5. Actual Result
What actually happened (including error codes, wrong status, or wrong financial values).

### 6. Evidence & Logs
```json
{
  "code": "EXAMPLE_ERROR",
  "message": "Actual server response..."
}
```

### 7. Root Cause Analysis (RCA)
Technical explanation of why the defect occurs in the code (e.g. comparison operator, missing transaction lock, off-by-one).

### 8. Recommended Fix & Acceptance Criteria
Concrete code patch or logic recommendation to resolve the issue.

