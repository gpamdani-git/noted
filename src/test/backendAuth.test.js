import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import authHandler, { otpStore } from '../../api/auth.js';
import { verifySession } from '../../api/_lib/security.js';

describe('Backend Auth API Handler (api/auth.js)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SESSION_SECRET = 'test_session_secret_at_least_16_chars_long';
    otpStore.clear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  const createMockReqRes = (body = {}, headers = {}, method = 'POST') => {
    const req = {
      method,
      headers: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
        'content-type': 'application/json',
        ...headers
      },
      body
    };

    const res = {
      statusCode: 200,
      headers: {},
      bodyData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(k, v) {
        this.headers[k.toLowerCase()] = v;
        return this;
      },
      json(data) {
        this.bodyData = data;
        return this;
      },
      end() {
        return this;
      }
    };

    return { req, res };
  };

  it('rejects requests when SESSION_SECRET is missing', async () => {
    process.env.SESSION_SECRET = '';
    const { req, res } = createMockReqRes({ action: 'send-otp', email: 'test@example.com' });
    await authHandler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.bodyData.error).toContain('SESSION_SECRET');
  });

  it('rejects invalid email formats on send-otp', async () => {
    const { req, res } = createMockReqRes({ action: 'send-otp', email: 'invalid-email' });
    await authHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.bodyData.code).toBe('INVALID_EMAIL_FORMAT');
  });

  it('rejects email exceeding 320 characters on send-otp', async () => {
    const longEmail = `${'a'.repeat(310)}@example.com`;
    const { req, res } = createMockReqRes({ action: 'send-otp', email: longEmail });
    await authHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.bodyData.code).toBe('EMAIL_TOO_LONG');
  });

  it('generates a 6-digit OTP code and records cooldown on send-otp', async () => {
    const { req, res } = createMockReqRes({ action: 'send-otp', email: 'dev.user@noted.io' });
    await authHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.bodyData.success).toBe(true);
    expect(res.bodyData.cooldownSeconds).toBe(30);
    expect(res.bodyData.devOtpCode).toMatch(/^\d{6}$/);

    const stored = otpStore.get('dev.user@noted.io');
    expect(stored).toBeTruthy();
    expect(stored.code).toBe(res.bodyData.devOtpCode);
  });

  it('enforces 30s resend cooldown on repeated send-otp calls', async () => {
    const { req: req1, res: res1 } = createMockReqRes({ action: 'send-otp', email: 'cooldown@noted.io' });
    await authHandler(req1, res1);
    expect(res1.statusCode).toBe(200);

    const { req: req2, res: res2 } = createMockReqRes({ action: 'send-otp', email: 'cooldown@noted.io' });
    await authHandler(req2, res2);

    expect(res2.statusCode).toBe(429);
    expect(res2.bodyData.code).toBe('RATE_LIMITED');
    expect(res2.headers['retry-after']).toBeTruthy();
  });

  it('verifies valid OTP, persists user, and returns signed session token', async () => {
    // 1. Send OTP
    const { req: req1, res: res1 } = createMockReqRes({ action: 'send-otp', email: 'verified@noted.io' });
    await authHandler(req1, res1);
    const otpCode = res1.bodyData.devOtpCode;

    // 2. Verify OTP
    const { req: req2, res: res2 } = createMockReqRes({
      action: 'verify-otp',
      email: 'verified@noted.io',
      verificationCode: otpCode,
      displayName: 'Verified User'
    });
    await authHandler(req2, res2);

    expect(res2.statusCode).toBe(200);
    expect(res2.bodyData.success).toBe(true);
    expect(res2.bodyData.session).toBeTruthy();
    expect(res2.bodyData.user.email).toBe('verified@noted.io');
    expect(res2.bodyData.user.name).toBe('Verified User');

    // Token must be verifiable by server security helper
    const verifiedSession = verifySession(res2.bodyData.session);
    expect(verifiedSession).toBeTruthy();
    expect(verifiedSession.email).toBe('verified@noted.io');

    // OTP should be consumed
    expect(otpStore.has('verified@noted.io')).toBe(false);
  });

  it('rejects invalid OTP code with HTTP 401 INVALID_CREDENTIALS', async () => {
    otpStore.set('test@noted.io', {
      code: '123456',
      expiresAt: Date.now() + 600000,
      resendAfter: Date.now() + 30000
    });

    const { req, res } = createMockReqRes({
      action: 'verify-otp',
      email: 'test@noted.io',
      verificationCode: '999999'
    });
    await authHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.bodyData.code).toBe('INVALID_CREDENTIALS');
  });

  it('supports password registration and subsequent password login', async () => {
    // Register
    const { req: regReq, res: regRes } = createMockReqRes({
      action: 'password-register',
      email: 'secret.user@noted.io',
      password: 'mypassword123',
      displayName: 'Secret Agent'
    });
    await authHandler(regReq, regRes);

    expect(regRes.statusCode).toBe(200);
    expect(regRes.bodyData.success).toBe(true);
    expect(regRes.bodyData.user.name).toBe('Secret Agent');
    expect(verifySession(regRes.bodyData.session)).toBeTruthy();

    // Login with wrong password
    const { req: failReq, res: failRes } = createMockReqRes({
      action: 'password-login',
      email: 'secret.user@noted.io',
      password: 'wrongpassword'
    });
    await authHandler(failReq, failRes);

    expect(failRes.statusCode).toBe(401);
    expect(failRes.bodyData.code).toBe('INVALID_CREDENTIALS');

    // Login with correct password
    const { req: loginReq, res: loginRes } = createMockReqRes({
      action: 'password-login',
      email: 'secret.user@noted.io',
      password: 'mypassword123'
    });
    await authHandler(loginReq, loginRes);

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.bodyData.success).toBe(true);
    expect(loginRes.bodyData.user.email).toBe('secret.user@noted.io');
    expect(verifySession(loginRes.bodyData.session)).toBeTruthy();
  });
});
