import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AUTH_CONFIG,
  normalizeEmail,
  validateEmailInput,
  validateVerificationInput,
  createAuthSession,
  isSessionTokenValid,
  restoreAuthSession,
  verifyLoginCredentials,
  getGoogleClientId,
  setGoogleClientId,
  parseJwt,
  getAuthState,
  loginWithGoogleCredential,
  loginWithEmail,
  logout,
  updateUserProfile,
  getSavedAccounts,
  switchAccount,
  removeAccountFromList,
  logoutAllAccounts
} from '../utils/auth';
import { getSessionToken, setSessionToken, clearSessionToken } from '../utils/session';

describe('Authentication & Notion Login Module', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionToken();
    logout();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('manages Google Client ID in localStorage correctly', () => {
    const envFallback = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    expect(getGoogleClientId()).toBe(envFallback);
    setGoogleClientId('test-client-id-12345.apps.googleusercontent.com');
    expect(getGoogleClientId()).toBe('test-client-id-12345.apps.googleusercontent.com');

    // Clears if set to empty, reverting to env fallback
    setGoogleClientId('');
    expect(getGoogleClientId()).toBe(envFallback);
  });

  it('correctly parses base64 encoded JWT payload', () => {
    // Standard mock JWT: header.payload.signature
    const mockPayload = {
      sub: 'google_109823471',
      name: 'Dani Akbar',
      email: 'dani@example.com',
      picture: 'https://example.com/avatar.jpg'
    };
    const b64Payload = btoa(JSON.stringify(mockPayload));
    const mockToken = `eyJhbGciOiJIUzI1NiJ9.${b64Payload}.mockSignature`;

    const parsed = parseJwt(mockToken);
    expect(parsed).toBeTruthy();
    expect(parsed.sub).toBe('google_109823471');
    expect(parsed.name).toBe('Dani Akbar');
    expect(parsed.email).toBe('dani@example.com');
    expect(parsed.picture).toBe('https://example.com/avatar.jpg');
  });

  it('verifies the Google credential on the server and stores the returned session', async () => {
    const mockPayload = {
      sub: 'google_user_999',
      name: 'Dani Akbar',
      email: 'dani.noted@gmail.com',
      picture: 'https://example.com/dani.jpg'
    };
    const b64Payload = btoa(JSON.stringify(mockPayload));
    const mockToken = `header.${b64Payload}.sig`;

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        session: 'server-issued-session-token',
        user: {
          id: 'google_user_999',
          name: 'Dani Akbar',
          email: 'dani.noted@gmail.com',
          picture: 'https://example.com/dani.jpg',
          avatar: 'D',
          color: '#2383e2'
        }
      })
    });

    const user = await loginWithGoogleCredential(mockToken);
    expect(user.isLoggedIn).toBe(true);
    expect(user.loginProvider).toBe('google');
    expect(user.email).toBe('dani.noted@gmail.com');
    expect(user.name).toBe('Dani Akbar');
    expect(user.picture).toBe('https://example.com/dani.jpg');

    // The credential is exchanged server-side, never trusted from the client
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/auth'), expect.objectContaining({
      method: 'POST'
    }));
    expect(getSessionToken()).toBe('server-issued-session-token');

    const authState = getAuthState();
    expect(authState.isLoggedIn).toBe(true);
    expect(authState.user.email).toBe('dani.noted@gmail.com');
    expect(authState.hasCloudSession).toBe(true);
  });

  it('rejects a Google credential that the server refuses to verify', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Google credential could not be verified' })
    });

    await expect(loginWithGoogleCredential('header.payload.sig')).rejects.toThrow(
      'Kredensial Google ditolak server'
    );
    expect(getSessionToken()).toBe('');
  });

  it('explains a server that has no session secret configured', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Server is not configured for authenticated sessions (SESSION_SECRET missing)' })
    });

    await expect(loginWithGoogleCredential('header.payload.sig')).rejects.toThrow('SESSION_SECRET');
  });

  it('explains an origin that the server does not allow', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Origin not allowed' })
    });

    await expect(loginWithGoogleCredential('header.payload.sig')).rejects.toThrow('ALLOWED_ORIGINS');
  });

  it('explains a server that has no Google client id configured', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'GOOGLE_CLIENT_ID is not configured on the server' })
    });

    await expect(loginWithGoogleCredential('header.payload.sig')).rejects.toThrow('GOOGLE_CLIENT_ID');
  });

  it('creates a local (offline) account with an email address', () => {
    const user = loginWithEmail('dani.akbar@company.com');
    expect(user.isLoggedIn).toBe(true);
    expect(user.email).toBe('dani.akbar@company.com');
    expect(user.name).toBe('Dani akbar');
    expect(user.loginProvider).toBe('local');

    const authState = getAuthState();
    expect(authState.isLoggedIn).toBe(true);
  });

  it('throws on invalid email input', () => {
    expect(() => loginWithEmail('invalid-email-format')).toThrow();
  });

  it('clears the cloud session on logout', () => {
    setSessionToken('session-to-clear');
    expect(getSessionToken()).toBe('session-to-clear');

    logout();
    expect(getSessionToken()).toBe('');
  });

  it('logs out and reverts to guest mode', () => {
    loginWithEmail('test@noted.com');
    expect(getAuthState().isLoggedIn).toBe(true);

    const guestUser = logout();
    expect(guestUser.isLoggedIn).toBe(false);
    expect(guestUser.loginProvider).toBe('guest');

    const authState = getAuthState();
    expect(authState.isLoggedIn).toBe(false);
  });

  it('updates user profile display name and avatar', () => {
    loginWithEmail('designer@noted.com');
    const updated = updateUserProfile({ name: 'Alexander Supertramp' });
    expect(updated.name).toBe('Alexander Supertramp');
    expect(updated.avatar).toBe('A');

    const active = getAuthState().user;
    expect(active.name).toBe('Alexander Supertramp');
  });

  it('maintains a list of saved accounts and supports switching between them', () => {
    const user1 = loginWithEmail('user1@example.com');
    const user2 = loginWithEmail('user2@example.com');

    const accounts = getSavedAccounts();
    expect(accounts.length).toBe(2);
    expect(accounts.some((a) => a.email === 'user1@example.com')).toBe(true);
    expect(accounts.some((a) => a.email === 'user2@example.com')).toBe(true);

    // Switch back to user 1
    const switched = switchAccount(user1.id);
    expect(switched.email).toBe('user1@example.com');
    expect(getAuthState().user.email).toBe('user1@example.com');

    // Remove an account
    removeAccountFromList(user2.id);
    const updatedAccounts = getSavedAccounts();
    expect(updatedAccounts.some((a) => a.email === 'user2@example.com')).toBe(false);

    // Logout all accounts
    logoutAllAccounts();
    expect(getSavedAccounts().length).toBe(0);
    expect(getAuthState().isLoggedIn).toBe(false);
  });

  it('normalizes and validates email inputs according to spec.md (FR-02)', () => {
    expect(normalizeEmail('  Rina.Dev@Noted.IO  ')).toBe('rina.dev@noted.io');
    expect(validateEmailInput('   ').error.code).toBe('EMPTY_EMAIL');
    expect(validateEmailInput('a'.repeat(310) + '@example.com').error.code).toBe('EMAIL_TOO_LONG');
    expect(validateEmailInput('user@domain').error.code).toBe('INVALID_EMAIL_FORMAT');

    const validRes = validateEmailInput('  User@Example.COM ');
    expect(validRes.valid).toBe(true);
    expect(validRes.normalizedEmail).toBe('user@example.com');
  });

  it('validates verification code and password inputs according to spec.md (FR-05)', () => {
    expect(validateVerificationInput({ verificationMethod: 'OTP_CODE', verificationCode: '123' }).error.code)
      .toBe('EMPTY_VERIFICATION_CODE');
    expect(validateVerificationInput({ verificationMethod: 'OTP_CODE', verificationCode: '123456' }).valid)
      .toBe(true);
    expect(validateVerificationInput({ verificationMethod: 'PASSWORD', password: '   ' }).error.code)
      .toBe('EMPTY_PASSWORD');
    expect(validateVerificationInput({ verificationMethod: 'PASSWORD', password: 'secret' }).valid)
      .toBe(true);
  });

  it('creates, validates, and expires session tokens (FR-09, FR-10, FR-11)', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url, options) => {
      const body = options?.body ? JSON.parse(options.body) : {};
      const user = {
        id: `email_${body.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: body.email,
        name: body.displayName || body.email.split('@')[0],
        picture: null,
        avatar: body.email[0].toUpperCase(),
        color: '#2383E2',
        isLoggedIn: true,
        loginProvider: 'email',
        loggedInAt: Date.now()
      };
      const session = createAuthSession(user, 'email');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          session: session.token,
          user
        })
      };
    });

    const { user, session } = await verifyLoginCredentials({
      email: 'session@noted.io',
      verificationMethod: 'OTP_CODE',
      verificationCode: '654321',
    });

    expect(user.email).toBe('session@noted.io');
    expect(session.expiresAt).toBe(session.issuedAt + AUTH_CONFIG.SESSION_TTL_MS);
    expect(isSessionTokenValid(session.token, session.issuedAt + 1000)).toBe(true);
    expect(isSessionTokenValid(session.token, session.expiresAt + 1)).toBe(false);

    const expiredRestore = restoreAuthSession(session.expiresAt + 1000);
    expect(expiredRestore.isAuthenticated).toBe(false);
    expect(expiredRestore.status).toBe('IDLE');
  });
});
