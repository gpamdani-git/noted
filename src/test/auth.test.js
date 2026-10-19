import { describe, it, expect, beforeEach } from 'vitest';
import {
  getGoogleClientId,
  setGoogleClientId,
  parseJwt,
  getAuthState,
  loginWithGoogleCredential,
  loginWithEmail,
  loginWithDemoGoogle,
  logout,
  updateUserProfile,
  getSavedAccounts,
  switchAccount,
  removeAccountFromList,
  logoutAllAccounts
} from '../utils/auth';

describe('Authentication & Notion Login Module', () => {
  beforeEach(() => {
    localStorage.clear();
    logout();
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

  it('logs in successfully using Google OAuth credential JWT token', () => {
    const mockPayload = {
      sub: 'google_user_999',
      name: 'Dani Akbar',
      email: 'dani.noted@gmail.com',
      picture: 'https://example.com/dani.jpg'
    };
    const b64Payload = btoa(JSON.stringify(mockPayload));
    const mockToken = `header.${b64Payload}.sig`;

    const user = loginWithGoogleCredential(mockToken);
    expect(user.isLoggedIn).toBe(true);
    expect(user.loginProvider).toBe('google');
    expect(user.email).toBe('dani.noted@gmail.com');
    expect(user.name).toBe('Dani Akbar');
    expect(user.picture).toBe('https://example.com/dani.jpg');

    const authState = getAuthState();
    expect(authState.isLoggedIn).toBe(true);
    expect(authState.user.email).toBe('dani.noted@gmail.com');
  });

  it('logs in with email and formats display name correctly', () => {
    const user = loginWithEmail('dani.akbar@company.com');
    expect(user.isLoggedIn).toBe(true);
    expect(user.email).toBe('dani.akbar@company.com');
    expect(user.name).toBe('Dani akbar');
    expect(user.loginProvider).toBe('email');

    const authState = getAuthState();
    expect(authState.isLoggedIn).toBe(true);
  });

  it('throws on invalid email input', () => {
    expect(() => loginWithEmail('invalid-email-format')).toThrow();
  });

  it('logs in with demo Google account for instant offline testing', () => {
    const user = loginWithDemoGoogle();
    expect(user.isLoggedIn).toBe(true);
    expect(user.loginProvider).toBe('google');
    expect(user.email).toBe('dani.akbarr@gmail.com');
    expect(user.name).toBe('Dani Akbar');
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
});
