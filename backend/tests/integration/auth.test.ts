import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Auth API Integration Tests', () => {
  const uniqueEmail = `test_${Date.now()}@example.com`;

  test('POST /auth/register – Successfully registers a customer account', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: uniqueEmail,
        password: 'password123',
        name: 'Integration Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.token).toBeDefined();
  });

  test('POST /auth/register – Rejects duplicate email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: uniqueEmail,
        password: 'password123',
        name: 'Duplicate User',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
    expect(res.body.message).toContain('already registered');
  });

  test('POST /auth/login – Successfully logs in valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@returnflow.com',
        password: 'admin123',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@returnflow.com');
    expect(res.body.user.role).toBe('ADMIN');
  });

  test('POST /auth/login – Fails on incorrect password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@returnflow.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  test('GET /auth/me – Returns user profile with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'password123',
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('alice@example.com');
  });

  test('GET /auth/me – Rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

