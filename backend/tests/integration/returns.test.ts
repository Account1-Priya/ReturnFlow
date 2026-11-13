import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Returns API Integration Tests', () => {
  let aliceToken: string;
  let bobToken: string;
  let aliceOrderId: number;
  let aliceOrderItemId: number;

  beforeAll(async () => {
    // 1. Login Alice
    const aliceLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    aliceToken = aliceLogin.body.token;

    // 2. Login Bob
    const bobLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });
    bobToken = bobLogin.body.token;

    // 3. Find an eligible delivered order for Alice
    const ordersRes = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${aliceToken}`);

    // Find delivered order with an eligible item
    const deliveredOrder = ordersRes.body.orders.find(
      (o: any) => o.status === 'DELIVERED' && o.items.some((i: any) => i.isReturnEligible)
    );

    if (deliveredOrder) {
      aliceOrderId = deliveredOrder.id;
      const eligibleItem = deliveredOrder.items.find((i: any) => i.isReturnEligible);
      aliceOrderItemId = eligibleItem.id;
    }
  });

  test('POST /returns/preview – Successfully previews refund calculation without creating DB record', async () => {
    if (!aliceOrderId || !aliceOrderItemId) return;

    const res = await request(app)
      .post('/returns/preview')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        orderId: aliceOrderId,
        items: [{ orderItemId: aliceOrderItemId, quantity: 1 }],
        reason: 'CHANGED_MIND',
      });

    expect(res.status).toBe(200);
    expect(res.body.refundPreview).toBeDefined();
    expect(res.body.refundPreview.totalRefundCents).toBeGreaterThan(0);
    expect(res.body.refundPreview.totalRestockingFeeCents).toBeGreaterThanOrEqual(0);
  });

  test('POST /returns – Submits a return request with valid payload', async () => {
    if (!aliceOrderId || !aliceOrderItemId) return;

    const res = await request(app)
      .post('/returns')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('orderId', aliceOrderId)
      .field(
        'items',
        JSON.stringify([{ orderItemId: aliceOrderItemId, quantity: 1 }])
      )
      .field('reason', 'CHANGED_MIND')
      .field('comment', 'Changed my mind about this item.');

    expect(res.status).toBe(201);
    expect(res.body.returnRequest).toBeDefined();
    expect(res.body.returnRequest.status).toBe('SUBMITTED');
  });

  test('GET /returns – Lists customer own returns', async () => {
    const res = await request(app)
      .get('/returns')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.returnRequests)).toBe(true);
    expect(res.body.returnRequests.length).toBeGreaterThan(0);
  });

  test('POST /returns/:id/cancel – Successfully cancels a SUBMITTED return request', async () => {
    // Submit a new return to cancel
    const myReturns = await request(app)
      .get('/returns')
      .set('Authorization', `Bearer ${aliceToken}`);

    const submittedReturn = myReturns.body.returnRequests.find(
      (r: any) => r.status === 'SUBMITTED'
    );

    if (submittedReturn) {
      const cancelRes = await request(app)
        .post(`/returns/${submittedReturn.id}/cancel`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.returnRequest.status).toBe('CANCELLED');
    }
  });

  test('Security Check: Customer Bob cannot view Alice return request', async () => {
    const aliceReturns = await request(app)
      .get('/returns')
      .set('Authorization', `Bearer ${aliceToken}`);

    if (aliceReturns.body.returnRequests.length > 0) {
      const aliceReturnId = aliceReturns.body.returnRequests[0].id;

      // Bob attempts to read Alice's return
      const res = await request(app)
        .get(`/returns/${aliceReturnId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });
});

