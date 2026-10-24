// Vercel Serverless Function & Local API: Unified Authentication & Session Issuance
// Endpoints:
// - POST /api/auth { idToken } (Google OAuth)
// - POST /api/auth { action: 'send-otp', email }
// - POST /api/auth { action: 'verify-otp', email, verificationCode }
// - POST /api/auth { action: 'password-login', email, password }
// - POST /api/auth { action: 'password-register', email, password, displayName }

import crypto from 'node:crypto';
import { applyCors, getSessionSecret, signSession } from './_lib/security.js';
import * as dbModule from './_lib/db.js';

const rateLimitMap = new Map();
export const checkRateLimit = (key, { limit = 5, windowMs = 60000 } = {}) => {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  if (entry.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  entry.count += 1;
  rateLimitMap.set(key, entry);
  return { allowed: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
};

export const getClientIp = (req) => {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
};

const saveUser = async (userData) => {
  if (typeof dbModule.saveUser === 'function') {
    return dbModule.saveUser(userData);
  }
  return null;
};

const findUserByEmail = async (email) => {
  if (typeof dbModule.findUserByEmail === 'function') {
    return dbModule.findUserByEmail(email);
  }
  return null;
};

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory OTP storage: Map<normalizedEmail, { code: string, expiresAt: number, resendAfter: number }>
export const otpStore = new Map();

const getAllowedClientIds = () => {
  try {
    process.loadEnvFile?.();
  } catch {
    // ignore
  }
  return (process.env.GOOGLE_CLIENT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

export default async function handler(req, res) {
  try {
    process.loadEnvFile?.();
  } catch {
    // ignore if environment is already populated
  }

  const corsAllowed = applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!getSessionSecret()) {
    return res.status(503).json({
      error: 'Server is not configured for authenticated sessions (SESSION_SECRET missing)'
    });
  }

  const clientIp = getClientIp(req);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const action = body.action || (body.idToken ? 'google' : '');

  // 1. Google OAuth flow
  if (action === 'google' || body.idToken) {
    const clientIds = getAllowedClientIds();
    if (clientIds.length === 0) {
      return res.status(503).json({ error: 'GOOGLE_CLIENT_ID is not configured on the server' });
    }

    const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';
    if (!idToken) {
      return res.status(400).json({ error: 'Missing Google credential token' });
    }

    try {
      const verifyRes = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!verifyRes.ok) {
        return res.status(401).json({ error: 'Google credential could not be verified' });
      }

      const payload = await verifyRes.json();

      if (!clientIds.includes(payload.aud)) {
        return res.status(401).json({ error: 'Google credential was issued for a different application' });
      }

      if (!payload.email || payload.email_verified === 'false') {
        return res.status(401).json({ error: 'Google account email is not verified' });
      }

      const identity = {
        sub: `google_${payload.sub}`,
        email: String(payload.email).toLowerCase(),
        name: payload.name || String(payload.email).split('@')[0],
        picture: payload.picture || ''
      };

      try {
        await saveUser({
          id: identity.sub,
          email: identity.email,
          name: identity.name,
          picture: identity.picture,
          avatar: identity.name.charAt(0).toUpperCase(),
          color: '#2383e2'
        });
      } catch (dbErr) {
        console.warn('[/api/auth] User DB save warning:', dbErr.message);
      }

      const session = signSession(identity);

      return res.status(200).json({
        success: true,
        session,
        user: {
          id: identity.sub,
          email: identity.email,
          name: identity.name,
          picture: identity.picture,
          avatar: identity.name.charAt(0).toUpperCase(),
          color: '#2383e2',
          isLoggedIn: true,
          loginProvider: 'google',
          loggedInAt: Date.now()
        }
      });
    } catch (err) {
      console.error('[/api/auth] Google verification error:', err.message);
      return res.status(500).json({ error: 'Failed to verify Google credential' });
    }
  }

  // Email flows: Validate email input
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const email = rawEmail.toLowerCase();

  if (!email || email.length > 320 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      error: email.length > 320 ? 'Alamat email tidak boleh melebihi 320 karakter.' : 'Masukkan alamat email yang valid.',
      code: email.length > 320 ? 'EMAIL_TOO_LONG' : 'INVALID_EMAIL_FORMAT'
    });
  }

  // Rate limiting per IP and email
  const rateLimitKey = `auth_${clientIp}_${email}`;
  const rateLimit = checkRateLimit(rateLimitKey, { limit: 5, windowMs: 60000 });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({
      error: 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.',
      code: 'RATE_LIMITED',
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });
  }

  // 2. Action: send-otp / request-code
  if (action === 'send-otp' || action === 'request-code') {
    const existingOtp = otpStore.get(email);
    const now = Date.now();
    if (existingOtp && now < existingOtp.resendAfter) {
      const waitSeconds = Math.max(1, Math.ceil((existingOtp.resendAfter - now) / 1000));
      res.setHeader('Retry-After', String(waitSeconds));
      return res.status(429).json({
        error: 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: waitSeconds
      });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    otpStore.set(email, {
      code,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      resendAfter: now + 30 * 1000     // 30 seconds
    });

    const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Noted <onboarding@resend.dev>',
            to: [email],
            subject: `Kode Verifikasi Masuk Noted: ${code}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2c2c2b;">
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Kode Verifikasi Masuk Noted</h2>
                <p style="font-size: 14px; line-height: 1.5; color: #555;">Gunakan kode berikut untuk masuk ke akun Noted Anda. Kode ini berlaku selama 10 menit.</p>
                <div style="margin: 24px 0; padding: 16px; background-color: #f7f6f3; border-radius: 8px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2383e2; font-family: monospace;">
                  ${code}
                </div>
                <p style="font-size: 12px; color: #888;">Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini dengan aman.</p>
              </div>
            `
          })
        });

        if (!resendRes.ok) {
          const resendErr = await resendRes.json().catch(() => ({}));
          console.warn('[/api/auth] Resend email dispatch failed:', resendErr);
          if (resendErr?.message) {
            resPayload.emailDeliveryWarning = resendErr.message;
          }
        } else {
          resPayload.emailSent = true;
          console.log(`[/api/auth] Email OTP successfully sent via Resend to ${email}`);
        }
      } catch (sendErr) {
        console.warn('[/api/auth] Resend email dispatch failed:', sendErr.message);
      }
    }

    console.log(`[/api/auth] OTP for ${email}: ${code}`);

    const resPayload = {
      success: true,
      message: 'Kode verifikasi telah dikirim ke email Anda.',
      cooldownSeconds: 30
    };

    if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
      resPayload.devOtpCode = code;
    }

    return res.status(200).json(resPayload);
  }

  // 3. Action: verify-otp
  if (action === 'verify-otp') {
    const rawCode = typeof body.verificationCode === 'string' ? body.verificationCode.trim() : '';
    if (!rawCode || rawCode.length !== 6) {
      return res.status(400).json({
        error: 'Masukkan kode verifikasi 6 digit.',
        code: 'EMPTY_VERIFICATION_CODE'
      });
    }

    const storedOtp = otpStore.get(email);
    const now = Date.now();
    if (!storedOtp || now > storedOtp.expiresAt || storedOtp.code !== rawCode) {
      return res.status(401).json({
        error: 'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    otpStore.delete(email);

    let existingUser = null;
    try {
      existingUser = await findUserByEmail(email);
    } catch (e) {
      console.warn('[/api/auth] DB user query error:', e.message);
    }

    const userId = existingUser?.id || `email_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const name = body.displayName?.trim() || existingUser?.name || email.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    const userRecord = {
      id: userId,
      email,
      name: formattedName,
      picture: existingUser?.picture || null,
      avatar: formattedName.charAt(0).toUpperCase(),
      color: existingUser?.color || '#2383e2',
      isLoggedIn: true,
      loginProvider: 'email',
      loggedInAt: now
    };

    try {
      await saveUser(userRecord);
    } catch (dbErr) {
      console.warn('[/api/auth] User DB save warning:', dbErr.message);
    }

    const sessionToken = signSession({
      sub: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      picture: userRecord.picture || ''
    });

    return res.status(200).json({
      success: true,
      session: sessionToken,
      user: userRecord
    });
  }

  // 4. Action: password-login
  if (action === 'password-login') {
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Masukkan kata sandi minimal 6 karakter.',
        code: 'EMPTY_PASSWORD'
      });
    }

    let user = null;
    try {
      user = await findUserByEmail(email);
    } catch (e) {
      console.warn('[/api/auth] DB find error:', e.message);
    }

    if (!user || !user.passwordHash || !user.passwordSalt) {
      return res.status(401).json({
        error: 'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const testHash = crypto.scryptSync(password, user.passwordSalt, 64).toString('hex');
    const isValid =
      testHash.length === user.passwordHash.length &&
      crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(user.passwordHash, 'hex'));

    if (!isValid) {
      return res.status(401).json({
        error: 'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const sessionToken = signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture || ''
    });

    return res.status(200).json({
      success: true,
      session: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        avatar: user.avatar || user.name?.[0]?.toUpperCase() || 'U',
        color: user.color || '#2383e2',
        isLoggedIn: true,
        loginProvider: 'email',
        loggedInAt: Date.now()
      }
    });
  }

  // 5. Action: password-register
  if (action === 'password-register') {
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Masukkan kata sandi minimal 6 karakter.',
        code: 'EMPTY_PASSWORD'
      });
    }

    let existingUser = null;
    try {
      existingUser = await findUserByEmail(email);
    } catch (e) {
      console.warn('[/api/auth] DB find error:', e.message);
    }

    // If account already exists with password, verify whether same password or notify
    if (existingUser && existingUser.passwordHash && existingUser.passwordSalt) {
      const testHash = crypto.scryptSync(password, existingUser.passwordSalt, 64).toString('hex');
      const matches =
        testHash.length === existingUser.passwordHash.length &&
        crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(existingUser.passwordHash, 'hex'));

      if (matches) {
        const sessionToken = signSession({
          sub: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          picture: existingUser.picture || ''
        });
        return res.status(200).json({
          success: true,
          session: sessionToken,
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            picture: existingUser.picture,
            avatar: existingUser.avatar,
            color: existingUser.color,
            isLoggedIn: true,
            loginProvider: 'email',
            loggedInAt: Date.now()
          }
        });
      }

      return res.status(400).json({
        error: 'Akun dengan email ini sudah terdaftar. Silakan masuk.',
        code: 'EMAIL_ALREADY_REGISTERED'
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    const userId = existingUser?.id || `email_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const rawName = body.displayName?.trim() || existingUser?.name || email.split('@')[0];
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const userRecord = {
      id: userId,
      email,
      name,
      picture: existingUser?.picture || null,
      avatar: name.charAt(0).toUpperCase(),
      color: existingUser?.color || '#2383e2',
      passwordHash: hash,
      passwordSalt: salt,
      isLoggedIn: true,
      loginProvider: 'email',
      loggedInAt: Date.now()
    };

    try {
      await saveUser(userRecord);
    } catch (dbErr) {
      console.warn('[/api/auth] User DB save warning:', dbErr.message);
    }

    const sessionToken = signSession({
      sub: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      picture: userRecord.picture || ''
    });

    return res.status(200).json({
      success: true,
      session: sessionToken,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        picture: userRecord.picture,
        avatar: userRecord.avatar,
        color: userRecord.color,
        isLoggedIn: true,
        loginProvider: 'email',
        loggedInAt: Date.now()
      }
    });
  }

  return res.status(400).json({ error: 'Aksi autentikasi tidak valid.' });
}
