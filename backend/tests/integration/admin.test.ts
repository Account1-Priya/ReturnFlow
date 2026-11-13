import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Admin API Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    // 1. Login Admin
    const adminLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@returnflow.com', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // 2. Login Customer
    const customerLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;
  });

  test('GET /admin/returns – Rejects non-admin with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/admin/returns')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('GET /admin/stats – Returns aggregated return metrics and financials', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.byStatus).toBeDefined();
    expect(typeof res.body.stats.totalReturns).toBe('number');
  });

  test('GET /admin/returns – Lists all return requests with pagination and filters', async () => {
    const res = await request(app)
      .get('/admin/returns?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.returnRequests)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  test('State Machine Flow: SUBMITTED -> UNDER_REVIEW -> APPROVED -> REFUNDED', async () => {
    // 1. Find a SUBMITTED return
    const queueRes = await request(app)
      .get('/admin/returns?status=SUBMITTED')
      .set('Authorization', `Bearer ${adminToken}`);

    const targetReturn = queueRes.body.returnRequests[0];
    if (!targetReturn) return;

    const returnId = targetReturn.id;

    // 2. Step: Mark UNDER_REVIEW
    const reviewRes = await request(app)
      .patch(`/admin/returns/${returnId}/review`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.returnRequest.status).toBe('UNDER_REVIEW');

    // 3. Step: Approve return
    const approveRes = await request(app)
      .post(`/admin/returns/${returnId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.returnRequest.status).toBe('APPROVED');

    // 4. Step: Process Refund (simulated gateway success)
    const refundRes = await request(app)
      .post(`/admin/returns/${returnId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ forceFail: false });

    expect(refundRes.status).toBe(200);
    expect(refundRes.body.status).toBe('REFUNDED');
    expect(refundRes.body.gatewayRef).toBeDefined();

    // 5. Audit History Verification
    const historyRes = await request(app)
      .get(`/admin/returns/${returnId}/history`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.history.length).toBeGreaterThanOrEqual(4);
  });

  test('POST /admin/returns/:id/reject – Requires rejection reason', async () => {
    const res = await request(app)
      .post('/admin/returns/999999/reject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

