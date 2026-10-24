// Authentication & Session Management Module for Noted
// Clean-Room Implementation based on spec.md

import { getCurrentUser, setCurrentUser, DEFAULT_USER } from './comments';
import { getSessionToken, setSessionToken, clearSessionToken, getApiBaseUrl } from './session';
import { notedServerRequest } from './cloudSync';

export const AUTH_CONFIG = {
  EMAIL_MAX_LENGTH: 320,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  OTP_CODE_LENGTH: 6,
  PASSWORD_MIN_LENGTH: 6,
  REQUEST_TIMEOUT_MS: 15000,
  PAGE_WATCHDOG_TIMEOUT_MS: 90000,
  RESEND_COOLDOWN_SECONDS: 30,
  SESSION_TTL_SECONDS: 2592000,
  SESSION_TTL_MS: 2592000000,
  STORAGE_KEYS: {
    SESSION_TOKEN: 'noted_session_token_v1',
    CURRENT_USER: 'noted_current_user_v1',
    SAVED_ACCOUNTS: 'noted_saved_accounts_v1',
    PENDING_VERIFICATION: 'noted_pending_verification_v1',
    DEVICE_ID: 'noted_device_id_v1',
  },
  EVENTS: {
    AUTH_CHANGED: 'noted_auth_changed',
    AUTH_EXPIRED: 'noted_auth_expired',
  },
};

const GOOGLE_CLIENT_ID_KEY = 'noted_google_client_id_v1';
const ACCOUNTS_LIST_KEY = AUTH_CONFIG.STORAGE_KEYS.SAVED_ACCOUNTS;

export const createAuthError = (code, message, options = {}) => {
  const err = new Error(message);
  err.code = code;
  err.message = message;
  if (options.httpStatus !== undefined) err.httpStatus = options.httpStatus;
  if (options.field !== undefined) err.field = options.field;
  if (options.retryAfterSeconds !== undefined) err.retryAfterSeconds = options.retryAfterSeconds;
  return err;
};

/**
 * Normalizes an email address according to FR-02: trim whitespace and convert to lowercase.
 */
export const normalizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Validates an email address according to FR-02 & Section 5 (#1, #2, #3).
 */
export const validateEmailInput = (rawEmail) => {
  const trimmed = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  const normalizedEmail = trimmed.toLowerCase();

  if (trimmed.length === 0) {
    return {
      valid: false,
      normalizedEmail: '',
      error: {
        code: 'EMPTY_EMAIL',
        message: 'Masukkan alamat email yang valid.',
        field: 'email',
      },
    };
  }

  if (trimmed.length > AUTH_CONFIG.EMAIL_MAX_LENGTH) {
    return {
      valid: false,
      normalizedEmail,
      error: {
        code: 'EMAIL_TOO_LONG',
        message: 'Alamat email tidak boleh melebihi 320 karakter.',
        field: 'email',
      },
    };
  }

  if (!AUTH_CONFIG.EMAIL_REGEX.test(normalizedEmail)) {
    return {
      valid: false,
      normalizedEmail,
      error: {
        code: 'INVALID_EMAIL_FORMAT',
        message: 'Masukkan alamat email yang valid.',
        field: 'email',
      },
    };
  }

  return {
    valid: true,
    normalizedEmail,
    error: null,
  };
};

/**
 * Validates step 2 verification code or password according to FR-05 & Section 5 (#4).
 */
export const validateVerificationInput = ({
  verificationMethod = 'OTP_CODE',
  verificationCode = '',
  password = '',
} = {}) => {
  if (verificationMethod === 'PASSWORD') {
    const cleanPassword = typeof password === 'string' ? password.trim() : '';
    if (cleanPassword.length === 0) {
      return {
        valid: false,
        error: {
          code: 'EMPTY_PASSWORD',
          message: 'Masukkan kata sandi Anda.',
          field: 'password',
        },
      };
    }
    return { valid: true, error: null };
  }

  const cleanCode = typeof verificationCode === 'string' ? verificationCode.trim() : '';
  if (cleanCode.length < AUTH_CONFIG.OTP_CODE_LENGTH) {
    return {
      valid: false,
      error: {
        code: 'EMPTY_VERIFICATION_CODE',
        message: 'Masukkan kode verifikasi 6 digit.',
        field: 'verificationCode',
      },
    };
  }

  return { valid: true, error: null };
};

const toBase64Url = (str) => {
  try {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
};

const fromBase64Url = (b64Url) => {
  try {
    const base64 = String(b64Url).replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(padded);
  } catch {
    return '';
  }
};

/**
 * Builds an AuthSession object and signed/structured local session token (FR-09, Section 3.3).
 */
export const createAuthSession = (user, provider = 'email', issuedAt = Date.now()) => {
  const expiresAt = issuedAt + AUTH_CONFIG.SESSION_TTL_MS;
  const payload = {
    sub: user.id,
    userId: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture || null,
    provider: provider || user.loginProvider || 'email',
    issuedAt,
    expiresAt,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = toBase64Url(`noted_sig_${user.id}_${issuedAt}`);
  const token = `${encodedPayload}.${signature}`;

  return {
    token,
    userId: user.id,
    email: user.email,
    provider: payload.provider,
    issuedAt,
    expiresAt,
  };
};

export const decodeSessionPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    // Support both 2-part (<payload>.<sig>) and 3-part JWT (<header>.<payload>.<sig>)
    const candidates = parts.length === 3 ? [parts[1], parts[0]] : [parts[0]];
    for (const part of candidates) {
      const decoded = fromBase64Url(part);
      if (!decoded) continue;
      const json = JSON.parse(decoded);
      if (json && typeof json === 'object' && (json.sub || json.userId || json.email || json.expiresAt)) {
        return json;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Checks if a stored session token is present and not expired (FR-10).
 */
export const isSessionTokenValid = (token, now = Date.now()) => {
  if (!token || typeof token !== 'string' || !token.trim()) return false;
  const payload = decodeSessionPayload(token);
  if (payload) {
    const expiresAt = payload.expiresAt ?? (payload.exp ? payload.exp * 1000 : null);
    if (typeof expiresAt === 'number' && now >= expiresAt) {
      return false;
    }
  }
  return true;
};

/**
 * Auto-restores session from localStorage on startup (FR-10, TC-14).
 */
export const restoreAuthSession = (now = Date.now()) => {
  const token = getSessionToken();
  const user = getCurrentUser();

  if (!token) {
    return {
      status: 'IDLE',
      isAuthenticated: false,
      user: user?.isLoggedIn ? user : null,
      session: null,
    };
  }

  if (!isSessionTokenValid(token, now)) {
    handleSessionExpired({ silent: true });
    return {
      status: 'IDLE',
      isAuthenticated: false,
      user: null,
      session: null,
      expired: true,
    };
  }

  const payload = decodeSessionPayload(token);
  const restoredUser =
    user && user.isLoggedIn
      ? user
      : payload
        ? {
            id: payload.userId || payload.sub || `email_${payload.email || 'user'}`,
            email: payload.email || '',
            name: payload.name || (payload.email ? payload.email.split('@')[0] : 'Noted User'),
            picture: payload.picture || null,
            avatar: (payload.name?.[0] || payload.email?.[0] || 'N').toUpperCase(),
            color: '#2383E2',
            isLoggedIn: true,
            loginProvider: payload.provider || 'email',
            loggedInAt: payload.issuedAt || now,
          }
        : null;

  if (!restoredUser) {
    return {
      status: 'IDLE',
      isAuthenticated: false,
      user: null,
      session: null,
    };
  }

  if (!user?.isLoggedIn) {
    setCurrentUser(restoredUser);
  }

  const session = {
    token,
    userId: restoredUser.id,
    email: restoredUser.email,
    provider: restoredUser.loginProvider || payload?.provider || 'email',
    issuedAt: payload?.issuedAt || restoredUser.loggedInAt || now,
    expiresAt: payload?.expiresAt || (now + AUTH_CONFIG.SESSION_TTL_MS),
  };

  return {
    status: 'AUTHENTICATED',
    isAuthenticated: true,
    user: restoredUser,
    session,
  };
};

/**
 * Handles session expiration (HTTP 401 or noted_auth_expired event) per FR-11 & TC-14.
 */
export const handleSessionExpired = ({ silent = false } = {}) => {
  clearSessionToken();
  const guestUser = {
    ...DEFAULT_USER,
    isLoggedIn: false,
    loginProvider: 'guest',
  };
  setCurrentUser(guestUser);
  if (typeof window !== 'undefined' && !silent) {
    window.dispatchEvent(
      new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, {
        detail: {
          user: guestUser,
          expired: true,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
          },
        },
      })
    );
  }
  return guestUser;
};

// Automatically listen for global auth-expired events in browser/jsdom environments (FR-11, TC-14)
if (typeof window !== 'undefined') {
  const onExpiredEvent = () => {
    handleSessionExpired({ silent: false });
  };
  window.addEventListener(AUTH_CONFIG.EVENTS.AUTH_EXPIRED, onExpiredEvent);
  window.addEventListener('noted:auth-expired', onExpiredEvent);
  window.addEventListener('session-expired', onExpiredEvent);
}

/**
 * Helper to execute an async operation with a strict timeout and AbortController (Section 5 #8, TC-12).
 */
export const withRequestTimeout = (operationFn, timeoutMs = AUTH_CONFIG.REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  let timeoutId = null;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(
        createAuthError(
          'TIMEOUT_ERROR',
          'Waktu permintaan habis (timeout). Silakan coba lagi.',
          { field: 'general' }
        )
      );
    }, timeoutMs);
  });

  const executionPromise = new Promise((resolve, reject) => {
    try {
      Promise.resolve(operationFn({ signal: controller.signal })).then(resolve, reject);
    } catch (err) {
      reject(err);
    }
  });

  return Promise.race([executionPromise, timeoutPromise]).finally(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });
};

/**
 * Normalizes any thrown error or HTTP response into a structured AuthError (Section 3.5 & Section 5).
 */
export const normalizeAuthError = (err, defaultField = 'general') => {
  if (!err) {
    return createAuthError('NETWORK_ERROR', 'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.', {
      field: defaultField,
    });
  }

  if (err.code && err.message) {
    return err;
  }

  const status = err.httpStatus || err.status;
  const rawMessage = String(err.message || err.error || '');

  if (err.name === 'AbortError' || rawMessage.toLowerCase().includes('timeout') || err.code === 'TIMEOUT_ERROR') {
    return createAuthError('TIMEOUT_ERROR', 'Waktu permintaan habis (timeout). Silakan coba lagi.', {
      field: 'general',
    });
  }

  if (status === 429 || err.code === 'RATE_LIMITED' || rawMessage.includes('429') || rawMessage.toLowerCase().includes('rate limit')) {
    return createAuthError(
      'RATE_LIMITED',
      'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.',
      {
        httpStatus: 429,
        field: 'general',
        retryAfterSeconds: err.retryAfterSeconds || AUTH_CONFIG.RESEND_COOLDOWN_SECONDS,
      }
    );
  }

  if (status === 401 || err.code === 'INVALID_CREDENTIALS' || rawMessage.includes('401') || rawMessage.toLowerCase().includes('invalid credential')) {
    return createAuthError(
      'INVALID_CREDENTIALS',
      'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.',
      {
        httpStatus: 401,
        field: defaultField === 'general' ? 'verificationCode' : defaultField,
      }
    );
  }

  if (
    err instanceof TypeError ||
    err.code === 'NETWORK_ERROR' ||
    rawMessage.toLowerCase().includes('network') ||
    rawMessage.toLowerCase().includes('failed to fetch') ||
    rawMessage.toLowerCase().includes('offline')
  ) {
    return createAuthError(
      'NETWORK_ERROR',
      'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
      { field: 'general' }
    );
  }

  return createAuthError(err.code || 'INVALID_CREDENTIALS', rawMessage || 'Terjadi kesalahan autentikasi.', {
    httpStatus: status,
    field: err.field || defaultField,
  });
};

/**
 * Executes a unified authentication API request.
 * Automatically routes through Electron's native IPC bridge when running in
 * packaged desktop mode, completely avoiding file:// origin restrictions.
 */
export const requestAuthApi = async (bodyPayload, signal) => {
  const baseUrl = getApiBaseUrl();

  if (typeof window !== 'undefined' && window.electronAPI?.apiRequest) {
    const result = await window.electronAPI.apiRequest({
      path: '/api/auth',
      method: 'POST',
      body: bodyPayload,
      appUrl: baseUrl || undefined,
    });
    if (!result?.ok) {
      const err = new Error(result?.error || 'Authentication server request failed');
      err.httpStatus = result?.status || 500;
      err.status = result?.status || 500;
      err.retryAfterSeconds = result?.retryAfterSeconds;
      throw err;
    }
    return result.data;
  }

  const res = await fetch(`${baseUrl}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload),
    signal,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'Authentication server request failed');
    err.httpStatus = res.status;
    err.status = res.status;
    err.retryAfterSeconds = data?.retryAfterSeconds;
    throw err;
  }
  return data;
};

/**
 * Step 1: Validates email and initiates verification code delivery (FR-02, FR-04, FR-06).
 */
export const requestEmailVerification = async (rawEmail, options = {}) => {
  const validation = validateEmailInput(rawEmail);
  if (!validation.valid) {
    throw createAuthError(validation.error.code, validation.error.message, {
      field: validation.error.field,
    });
  }

  const { normalizedEmail } = validation;
  const timeoutMs = options.timeoutMs ?? AUTH_CONFIG.REQUEST_TIMEOUT_MS;

  try {
    let apiResponse = null;
    if (typeof options.onRequestCode === 'function') {
      await withRequestTimeout(({ signal }) => options.onRequestCode({ email: normalizedEmail, signal }), timeoutMs);
    } else {
      const isOffline =
        typeof window !== 'undefined' &&
        window.navigator &&
        window.navigator.onLine === false;

      if (!isOffline) {
        apiResponse = await withRequestTimeout(async ({ signal }) => {
          return requestAuthApi({ action: 'send-otp', email: normalizedEmail }, signal);
        }, timeoutMs);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEYS.PENDING_VERIFICATION,
        JSON.stringify({
          email: normalizedEmail,
          sentAt: Date.now(),
        })
      );
    }

    return {
      success: true,
      normalizedEmail,
      cooldownSeconds: apiResponse?.cooldownSeconds || AUTH_CONFIG.RESEND_COOLDOWN_SECONDS,
      devOtpCode: apiResponse?.devOtpCode,
      emailSent: apiResponse?.emailSent,
      emailDeliveryWarning: apiResponse?.emailDeliveryWarning,
    };
  } catch (err) {
    throw normalizeAuthError(err, 'email');
  }
};

/**
 * Step 2: Verifies OTP code or password and issues an authenticated session (FR-05, FR-09, TC-08..TC-13).
 */
export const verifyLoginCredentials = async (payload = {}, options = {}) => {
  const emailValidation = validateEmailInput(payload.email || payload.normalizedEmail || '');
  if (!emailValidation.valid) {
    throw createAuthError(emailValidation.error.code, emailValidation.error.message, {
      field: 'email',
    });
  }

  const verificationMethod = payload.verificationMethod || 'OTP_CODE';
  const step2Validation = validateVerificationInput({
    verificationMethod,
    verificationCode: payload.verificationCode,
    password: payload.password,
  });

  if (!step2Validation.valid) {
    throw createAuthError(step2Validation.error.code, step2Validation.error.message, {
      field: step2Validation.error.field,
    });
  }

  const normalizedEmail = emailValidation.normalizedEmail;
  const code = String(payload.verificationCode || '').trim();
  const password = String(payload.password || '');
  const timeoutMs = options.timeoutMs ?? AUTH_CONFIG.REQUEST_TIMEOUT_MS;
  const targetField = verificationMethod === 'PASSWORD' ? 'password' : 'verificationCode';

  try {
    const result = await withRequestTimeout(async ({ signal }) => {
      const isOffline =
        typeof window !== 'undefined' &&
        window.navigator &&
        window.navigator.onLine === false;

      if (isOffline) {
        const saved = lookupSavedAccountByEmail(normalizedEmail);
        return {
          offline: true,
          user: {
            id: saved ? saved.id : `local_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: saved ? saved.name : normalizedEmail.split('@')[0],
            email: normalizedEmail,
            picture: saved?.picture || null,
            avatar: (saved?.name?.[0] || normalizedEmail[0] || 'N').toUpperCase(),
            color: saved?.color || '#2383e2',
            isLoggedIn: true,
            loginProvider: 'local',
          }
        };
      }

      if (typeof options.onVerifyCredentials === 'function') {
        const customRes = await options.onVerifyCredentials({
          email: normalizedEmail,
          normalizedEmail,
          verificationMethod,
          verificationCode: code,
          password,
          displayName: payload.displayName,
          signal,
        });

        if (customRes && (customRes.ok === false || customRes.status >= 400)) {
          throw createAuthError(
            customRes.status === 429 ? 'RATE_LIMITED' : 'INVALID_CREDENTIALS',
            customRes.error || customRes.message || '',
            {
              httpStatus: customRes.status || 401,
              field: targetField,
              retryAfterSeconds: customRes.retryAfterSeconds,
            }
          );
        }
        return customRes;
      }

      // Real server verification call
      const baseUrl = getApiBaseUrl();
      const action =
        payload.action ||
        (verificationMethod === 'PASSWORD'
          ? (payload.isRegister ? 'password-register' : 'password-login')
          : 'verify-otp');

      const bodyPayload = {
        action,
        email: normalizedEmail,
        ...(verificationMethod === 'PASSWORD'
          ? { password, displayName: payload.displayName }
          : { verificationCode: code }),
      };

      try {
        return await requestAuthApi(bodyPayload, signal);
      } catch (err) {
        throw createAuthError(
          err.status === 429 || err.httpStatus === 429 ? 'RATE_LIMITED' : 'INVALID_CREDENTIALS',
          err.message || 'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.',
          {
            httpStatus: err.httpStatus || err.status || 401,
            field: targetField,
            retryAfterSeconds: err.retryAfterSeconds,
          }
        );
      }
    }, timeoutMs);

    const saved = lookupSavedAccountByEmail(normalizedEmail);
    const rawDisplayName =
      payload.displayName?.trim() ||
      result?.user?.name ||
      (saved ? saved.name : normalizedEmail.split('@')[0].replace(/[._-]/g, ' '));
    const formattedName = rawDisplayName.charAt(0).toUpperCase() + rawDisplayName.slice(1);
    const accountId =
      result?.user?.id ||
      (saved ? saved.id : `email_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);

    const now = Date.now();
    const authenticatedUser = {
      id: accountId,
      name: formattedName,
      email: normalizedEmail,
      picture: result?.user?.picture || saved?.picture || null,
      avatar: formattedName[0].toUpperCase(),
      color: result?.user?.color || saved?.color || '#2383E2',
      isLoggedIn: true,
      loginProvider: result?.user?.loginProvider || (result?.offline ? 'local' : 'email'),
      loggedInAt: now,
    };

    let session;
    if (result?.session && typeof result.session === 'string') {
      const decoded = decodeSessionPayload(result.session);
      session = {
        token: result.session,
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        provider: authenticatedUser.loginProvider,
        issuedAt: decoded?.iat ? decoded.iat * 1000 : now,
        expiresAt: decoded?.exp ? decoded.exp * 1000 : (now + AUTH_CONFIG.SESSION_TTL_MS),
      };
    } else {
      session = createAuthSession(authenticatedUser, authenticatedUser.loginProvider, now);
    }

    setSessionToken(session.token);
    setCurrentUser(authenticatedUser);
    saveAccountToList(authenticatedUser);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.PENDING_VERIFICATION);
      window.dispatchEvent(
        new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, {
          detail: { user: authenticatedUser, session },
        })
      );
    }

    return { user: authenticatedUser, session };
  } catch (err) {
    throw normalizeAuthError(err, targetField);
  }
};

export const getGoogleClientId = () => {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
  if (stored && stored.trim()) return stored.trim();
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
};

export const setGoogleClientId = (clientId) => {
  if (typeof window === 'undefined') return;
  if (!clientId || !clientId.trim()) {
    localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
  } else {
    localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
  }
  window.dispatchEvent(new CustomEvent('noted_auth_config_changed', { detail: { clientId } }));
};

// Parse JWT from Google OAuth response safely without external dependencies.
// Note: parsing never authenticates - the token is verified server-side.
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse JWT token:', err);
    return null;
  }
};

export const getAuthState = () => {
  const token = getSessionToken();
  if (token && !isSessionTokenValid(token)) {
    handleSessionExpired({ silent: true });
  }
  const user = getCurrentUser();
  const clientId = getGoogleClientId();
  const activeToken = getSessionToken();
  return {
    user,
    isLoggedIn: Boolean(user?.isLoggedIn),
    provider: user?.loginProvider || 'guest',
    googleClientId: clientId,
    hasCloudSession: Boolean(activeToken),
  };
};

export const getSavedAccounts = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_LIST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const saveAccountToList = (user) => {
  if (typeof window === 'undefined' || !user || !user.id || !user.isLoggedIn) return;
  try {
    const list = getSavedAccounts();
    const existingIdx = list.findIndex(
      (a) =>
        a.id === user.id ||
        (a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase())
    );
    const accountEntry = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      color: user.color,
      picture: user.picture,
      loginProvider: user.loginProvider,
      session: getSessionToken() || null,
      lastActive: Date.now(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = accountEntry;
    } else {
      list.push(accountEntry);
    }
    localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save account to list:', err);
  }
};

export const removeAccountFromList = (accountId) => {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedAccounts().filter((a) => a.id !== accountId);
    localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(list));
    const activeUser = getCurrentUser();
    if (activeUser?.id === accountId) {
      logout();
    }
  } catch (err) {
    console.error('Failed to remove account from list:', err);
  }
};

export const switchAccount = (accountId) => {
  if (accountId === 'guest') {
    return logout();
  }
  const accounts = getSavedAccounts();
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return null;

  // Restore the cloud session that belongs to the selected account.
  setSessionToken(target.session || '');

  const switchedUser = {
    ...target,
    isLoggedIn: true,
    lastActive: Date.now(),
  };
  setCurrentUser(switchedUser);
  saveAccountToList(switchedUser);
  window.dispatchEvent(new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, { detail: { user: switchedUser } }));
  return switchedUser;
};

export const updateUserProfile = (updates) => {
  const current = getCurrentUser();
  if (!current) return null;

  const updatedUser = {
    ...current,
    ...updates,
    // Keep avatar monogram updated if name changed and no picture
    avatar: updates.avatar || (updates.name ? updates.name[0].toUpperCase() : current.avatar),
  };

  setCurrentUser(updatedUser);
  if (updatedUser.isLoggedIn) {
    saveAccountToList(updatedUser);
  }
  window.dispatchEvent(new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, { detail: { user: updatedUser } }));
  return updatedUser;
};

/**
 * Turns a server error into a message that says what to do about it.
 */
const describeAuthError = (status, serverMessage) => {
  const message = String(serverMessage || '');

  if (message.includes('SESSION_SECRET')) {
    return 'Server belum dikonfigurasi untuk sesi login. Set SESSION_SECRET di environment server (Vercel), lalu deploy ulang.';
  }
  if (message.includes('GOOGLE_CLIENT_ID')) {
    return 'Server belum dikonfigurasi untuk Google login. Set GOOGLE_CLIENT_ID di environment server, lalu deploy ulang.';
  }
  if (message.includes('Origin not allowed')) {
    return 'Origin aplikasi belum diizinkan server. Tambahkan origin ini ke ALLOWED_ORIGINS di environment server.';
  }
  if (status === 429) {
    return 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.';
  }
  if (status === 503) {
    return 'Server sedang tidak dikonfigurasi untuk login. Periksa environment server.';
  }
  if (status === 403) {
    return 'Server menolak permintaan ini. Periksa ALLOWED_ORIGINS di environment server.';
  }
  if (message.includes('could not be verified')) {
    return 'Kredensial Google ditolak server. Coba login ulang, dan pastikan GOOGLE_CLIENT_ID di server sama dengan yang di aplikasi.';
  }
  return message || 'Login Google gagal. Coba lagi beberapa saat lagi.';
};

/**
 * Signs in with a Google Identity Services credential.
 * The credential is verified server-side; the server returns a session token
 * that authorizes /api/sync calls.
 */
export const loginWithGoogleCredential = async (credentialToken) => {
  if (!credentialToken) {
    throw new Error('Missing Google credential token');
  }

  let data;
  try {
    data = await requestAuthApi({ idToken: credentialToken });
  } catch (err) {
    throw createAuthError(
      err.status === 429 || err.httpStatus === 429 ? 'RATE_LIMITED' : 'INVALID_CREDENTIALS',
      describeAuthError(err.status || err.httpStatus || 500, err.message),
      { httpStatus: err.status || err.httpStatus || 500, field: 'general' }
    );
  }
  if (!data?.session || !data?.user) {
    throw new Error('Invalid response from the authentication server');
  }

  const authenticatedUser = {
    ...data.user,
    isLoggedIn: true,
    loginProvider: 'google',
    loggedInAt: Date.now(),
  };

  setSessionToken(data.session);
  setCurrentUser(authenticatedUser);
  saveAccountToList(authenticatedUser);
  window.dispatchEvent(
    new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, { detail: { user: authenticatedUser } })
  );
  return authenticatedUser;
};

/**
 * Applies a session token received from a desktop hand-off (noted://auth deep link).
 */
export const applyDesktopSession = async (sessionToken) => {
  if (!sessionToken) return null;

  setSessionToken(sessionToken);

  try {
    // The request goes through the main process on the desktop, because a
    // file:// origin is refused by the server.
    const data = await notedServerRequest('/api/sync', {
      method: 'GET',
      session: sessionToken,
    });
    if (!data) throw new Error('Session rejected by server');
    if (!data.resolvedUserId && !data.success) throw new Error('Invalid session response');
  } catch (err) {
    clearSessionToken();
    throw new Error(err.message || 'Invalid session token');
  }

  const sessionPayload = decodeSessionPayload(sessionToken);
  const email = sessionPayload?.email || null;
  // The session subject is issued by the server and is identical to the id
  // used by the web login. Deriving a local id instead would scope the
  // desktop workspace under a different key and hide the user's pages.
  const sessionUserId = sessionPayload?.sub || null;

  if (!sessionUserId) {
    clearSessionToken();
    throw new Error('Session does not carry a verified identity');
  }

  const authenticatedUser = {
    id: sessionUserId,
    name: sessionPayload.name || (email ? email.split('@')[0] : 'Noted User'),
    email: email || null,
    picture: sessionPayload.picture || null,
    avatar: (email ? email[0] : 'N').toUpperCase(),
    color: '#2383e2',
    isLoggedIn: true,
    loginProvider: 'google',
    loggedInAt: Date.now(),
  };

  setCurrentUser(authenticatedUser);
  saveAccountToList(authenticatedUser);
  window.dispatchEvent(
    new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, { detail: { user: authenticatedUser } })
  );
  return authenticatedUser;
};

/**
 * Looks up a locally known account by email (offline only).
 */
export const lookupSavedAccountByEmail = (email) => {
  if (!email || !email.includes('@')) return null;
  const cleanEmail = email.trim().toLowerCase();
  return (
    getSavedAccounts().find((a) => a.email && a.email.toLowerCase() === cleanEmail) || null
  );
};

/**
 * Creates a LOCAL (offline) account.
 * Local accounts cannot sync to the cloud - a verified Google session is required.
 */
export const loginWithEmail = (email, name = null) => {
  const validation = validateEmailInput(email);
  if (!validation.valid) {
    throw createAuthError(validation.error.code, validation.error.message, {
      field: validation.error.field,
    });
  }

  const cleanEmail = validation.normalizedEmail;
  const saved = lookupSavedAccountByEmail(cleanEmail);
  const displayName =
    name || (saved ? saved.name : cleanEmail.split('@')[0].replace(/[._-]/g, ' '));
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const accountId = saved
    ? saved.id
    : `local_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const authenticatedUser = {
    id: accountId,
    name: formattedName,
    email: cleanEmail,
    picture: saved?.picture || null,
    avatar: formattedName[0].toUpperCase(),
    color: saved?.color || '#00897b',
    isLoggedIn: true,
    loginProvider: 'local',
    loggedInAt: Date.now(),
  };

  setCurrentUser(authenticatedUser);
  saveAccountToList(authenticatedUser);
  window.dispatchEvent(
    new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, { detail: { user: authenticatedUser } })
  );

  return authenticatedUser;
};

export const isElectronApp = () => {
  return (
    typeof window !== 'undefined' &&
    Boolean(
      window.electronAPI?.isElectron ||
        window.location.protocol === 'file:' ||
        navigator.userAgent?.toLowerCase().includes('electron')
    )
  );
};

export const isMobileNativeApp = () => {
  if (typeof window === 'undefined') return false;
  // Only a real native runtime counts as "native". A browser that happens to
  // run on localhost (the Vite dev server) is a normal web context and must
  // keep the Google Identity Services button available.
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
      window.location.protocol === 'capacitor:' ||
      window.location.origin === 'capacitor://localhost'
  );
};

export const shouldUseNativeGoogleAuth = () => {
  return isElectronApp() || isMobileNativeApp();
};

export const logout = () => {
  clearSessionToken();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.PENDING_VERIFICATION);
    } catch {
      // Ignore storage error
    }
  }
  const guestUser = {
    ...DEFAULT_USER,
    isLoggedIn: false,
    loginProvider: 'guest',
  };
  setCurrentUser(guestUser);
  window.dispatchEvent(
    new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_CHANGED, { detail: { user: guestUser } })
  );
  return guestUser;
};

export const logoutAllAccounts = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ACCOUNTS_LIST_KEY);
    } catch (e) {
      console.warn(e);
    }
  }
  return logout();
};
