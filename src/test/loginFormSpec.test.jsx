import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotionLoginModal } from '../components/Auth/NotionLoginModal';
import {
  AUTH_CONFIG,
  createAuthSession,
  restoreAuthSession,
  logout,
  getAuthState,
} from '../utils/auth';
import { setSessionToken, getSessionToken, clearSessionToken } from '../utils/session';
import { setCurrentUser } from '../utils/comments';

describe('Clean-Room Specification Test Suite: Autentikasi & Form Login (TC-01 s/d TC-15)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionToken();
    logout();

    vi.spyOn(global, 'fetch').mockImplementation(async (url, options) => {
      const body = options?.body ? JSON.parse(options.body) : {};
      if (body.action === 'send-otp' || body.action === 'request-code') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            email: body.email,
            cooldownSeconds: 30,
            devOtpCode: '123456'
          })
        };
      }
      if (body.action === 'verify-otp') {
        if (body.verificationCode === '000000') {
          return {
            ok: false,
            status: 401,
            json: async () => ({
              error: 'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.',
              code: 'INVALID_CREDENTIALS'
            })
          };
        }
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
      }
      if (body.action === 'password-login' || body.action === 'password-register') {
        if (body.password === '000000' || body.password === 'wrong') {
          return {
            ok: false,
            status: 401,
            json: async () => ({
              error: 'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.',
              code: 'INVALID_CREDENTIALS'
            })
          };
        }
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
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('TC-01: Render Awal Form Login (EMAIL_ENTRY)', () => {
    const { container } = render(<NotionLoginModal isOpen={true} />);

    const modal = container.querySelector('.notion-login-modal');
    expect(modal).toHaveAttribute('data-status', 'IDLE');
    expect(modal).toHaveAttribute('data-step', 'EMAIL_ENTRY');

    // SSO Buttons (Google is active, Apple/Passkey/SSO temporarily hidden)
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Continue with Apple/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Log in with passkey/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Single sign-on \(SSO\)/i })).not.toBeInTheDocument();

    // Divider "OR"
    expect(screen.getByText('OR')).toBeInTheDocument();

    // Email input is visible and empty
    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput.value).toBe('');

    // Step 2 container is hidden (is-closed)
    const step2Container = screen.getByTestId('verification-step-container');
    expect(step2Container).toHaveClass('is-closed');
    expect(step2Container).toHaveAttribute('aria-hidden', 'true');

    // Submit button displays "Continue"
    const submitBtn = screen.getByRole('button', { name: 'Continue' });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it('TC-02: Penolakan Email Kosong atau Hanya Spasi', () => {
    const { container } = render(<NotionLoginModal isOpen={true} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const submitBtn = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.click(submitBtn);

    const modal = container.querySelector('.notion-login-modal');
    expect(modal).toHaveAttribute('data-step', 'EMAIL_ENTRY');
    expect(modal).toHaveAttribute('data-status', 'ERROR');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveTextContent('Masukkan alamat email yang valid.');

    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveClass('inputRedFocusRing');
  });

  it('TC-03: Penolakan Format Email Tidak Valid', () => {
    const onRequestVerificationCode = vi.fn();
    const { container } = render(
      <NotionLoginModal isOpen={true} onRequestVerificationCode={onRequestVerificationCode} />
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const submitBtn = screen.getByRole('button', { name: 'Continue' });

    // Without TLD
    fireEvent.change(emailInput, { target: { value: 'user@domain' } });
    fireEvent.click(submitBtn);

    const modal = container.querySelector('.notion-login-modal');
    expect(modal).toHaveAttribute('data-step', 'EMAIL_ENTRY');
    expect(screen.getByRole('alert')).toHaveTextContent('Masukkan alamat email yang valid.');
    expect(onRequestVerificationCode).not.toHaveBeenCalled();

    // Without @
    fireEvent.change(emailInput, { target: { value: 'userdomain.com' } });
    fireEvent.click(submitBtn);

    expect(modal).toHaveAttribute('data-step', 'EMAIL_ENTRY');
    expect(screen.getByRole('alert')).toHaveTextContent('Masukkan alamat email yang valid.');
    expect(onRequestVerificationCode).not.toHaveBeenCalled();
  });

  it('TC-04: Penolakan Email Melebihi 320 Karakter', () => {
    const { container } = render(<NotionLoginModal isOpen={true} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const submitBtn = screen.getByRole('button', { name: 'Continue' });
    const tooLongEmail = `${'a'.repeat(309)}@example.com`; // 309 + 12 = 321 chars

    expect(tooLongEmail.length).toBe(321);
    fireEvent.change(emailInput, { target: { value: tooLongEmail } });
    fireEvent.click(submitBtn);

    const modal = container.querySelector('.notion-login-modal');
    expect(modal).toHaveAttribute('data-step', 'EMAIL_ENTRY');
    expect(modal).toHaveAttribute('data-status', 'ERROR');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-error-code', 'EMAIL_TOO_LONG');
    expect(alert).toHaveTextContent('Alamat email tidak boleh melebihi 320 karakter.');
  });

  it('TC-05: Normalisasi Email (trim & toLowerCase) dan Transisi ke Step 2', () => {
    const { container } = render(<NotionLoginModal isOpen={true} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const submitBtn = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(emailInput, { target: { value: '  User.Name@Example.COM  ' } });
    fireEvent.click(submitBtn);

    // Email is normalized
    expect(emailInput.value).toBe('user.name@example.com');

    // Status transitions to AWAITING_VERIFICATION on VERIFICATION_OR_PASSWORD step
    const modal = container.querySelector('.notion-login-modal');
    expect(modal).toHaveAttribute('data-status', 'AWAITING_VERIFICATION');
    expect(modal).toHaveAttribute('data-step', 'VERIFICATION_OR_PASSWORD');

    // Step 2 container is open
    const step2Container = screen.getByTestId('verification-step-container');
    expect(step2Container).toHaveClass('is-open');
    expect(step2Container).toHaveAttribute('aria-hidden', 'false');

    // Verification code input is visible and submit button changed to "Continue with login code"
    expect(screen.getByLabelText(/Verification code/i)).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Continue with login code' })
    ).toBeInTheDocument();
  });

  it('TC-06: Fungsi Tombol Clear Input (X) & Reset Alert Otomatis', () => {
    render(<NotionLoginModal isOpen={true} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const submitBtn = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(emailInput, { target: { value: 'salah@' } });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    const clearBtn = screen.getByTestId('clear-email-btn');
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);

    // Input is cleared, alert disappears, clear button hides, and focus returns to email input
    expect(emailInput.value).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('clear-email-btn')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(emailInput);
  });

  it('TC-07: Navigasi Kembali ke Step 1 Saat Email Diubah atau Tombol Back Ditekan', () => {
    const { container } = render(<NotionLoginModal isOpen={true} />);

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const codeInput = screen.getByLabelText(/Verification code/i);
    fireEvent.change(codeInput, { target: { value: '123' } });
    expect(codeInput.value).toBe('123');

    // Click "Back" button
    const backBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn);

    const modal = container.querySelector('.notion-login-modal');
    expect(modal).toHaveAttribute('data-step', 'EMAIL_ENTRY');
    expect(modal).toHaveAttribute('data-status', 'IDLE');
    expect(screen.getByTestId('verification-step-container')).toHaveClass('is-closed');
    expect(codeInput.value).toBe('');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('TC-08: Verifikasi Kode OTP / Password Berhasil & Penyimpanan Sesi', async () => {
    const onLoginSuccess = vi.fn();
    const authChangedSpy = vi.fn();
    window.addEventListener(AUTH_CONFIG.EVENTS.AUTH_CHANGED, authChangedSpy);

    const { container } = render(
      <NotionLoginModal isOpen={true} onLoginSuccess={onLoginSuccess} />
    );

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'rina@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const codeInput = screen.getByLabelText(/Verification code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const verifyBtn = screen.getByRole('button', { name: 'Continue with login code' });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      const modal = container.querySelector('.notion-login-modal');
      expect(modal).toHaveAttribute('data-status', 'AUTHENTICATED');
    });

    const storedToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    expect(storedToken).toBeTruthy();
    expect(getSessionToken()).toBe(storedToken);

    const storedUserRaw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER);
    expect(storedUserRaw).toBeTruthy();
    const storedUser = JSON.parse(storedUserRaw);
    expect(storedUser.email).toBe('rina@example.com');
    expect(storedUser.isLoggedIn).toBe(true);

    expect(authChangedSpy).toHaveBeenCalled();
    expect(onLoginSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'rina@example.com',
        isLoggedIn: true,
      }),
      expect.objectContaining({
        token: storedToken,
      })
    );

    window.removeEventListener(AUTH_CONFIG.EVENTS.AUTH_CHANGED, authChangedSpy);
  });

  it('TC-09: Penanganan Kode Verifikasi / Kredensial Salah (HTTP 401)', async () => {
    const { container } = render(<NotionLoginModal isOpen={true} />);

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'rina@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const codeInput = screen.getByLabelText(/Verification code/i);
    fireEvent.change(codeInput, { target: { value: '000000' } });

    const verifyBtn = screen.getByRole('button', { name: 'Continue with login code' });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      const modal = container.querySelector('.notion-login-modal');
      expect(modal).toHaveAttribute('data-status', 'ERROR');
      expect(modal).toHaveAttribute('data-step', 'VERIFICATION_OR_PASSWORD');
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-error-code', 'INVALID_CREDENTIALS');
    expect(alert).toHaveTextContent(
      'Kode verifikasi atau kata sandi tidak valid. Silakan periksa kembali.'
    );

    expect(codeInput).toHaveClass('inputRedFocusRing');
    expect(codeInput).toHaveAttribute('aria-invalid', 'true');
    expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_TOKEN)).toBeNull();
  });

  it('TC-10: Cooldown Timer pada Tombol "Resend code"', async () => {
    vi.useFakeTimers();

    render(<NotionLoginModal isOpen={true} />);

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'timer@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const resendBtn = screen.getByRole('button', { name: /Resend code/i });
    expect(resendBtn).toBeDisabled();
    expect(resendBtn).toHaveTextContent('Resend code (30s)');

    // Advance fake timers by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(resendBtn).not.toBeDisabled();
    expect(resendBtn).toHaveTextContent('Resend code');

    // Click "Resend code" and verify cooldown restarts
    await act(async () => {
      fireEvent.click(resendBtn);
    });

    expect(resendBtn).toBeDisabled();
    expect(resendBtn).toHaveTextContent('Resend code (30s)');
  });

  it('TC-11: Penanganan Rate Limit (HTTP 429)', async () => {
    const rateLimitedVerify = vi.fn().mockRejectedValue({
      httpStatus: 429,
      code: 'RATE_LIMITED',
      retryAfterSeconds: 30,
    });

    render(<NotionLoginModal isOpen={true} onVerifyCredentials={rateLimitedVerify} />);

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'ratelimit@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const codeInput = screen.getByLabelText(/Verification code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const submitBtn = screen.getByRole('button', { name: 'Continue with login code' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-error-code', 'RATE_LIMITED');
      expect(alert).toHaveTextContent(
        'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.'
      );
    });

    expect(submitBtn).toBeDisabled();
  });

  it('TC-12: Penanganan Kondisi Offline / Network Error & Timeout (15000ms)', async () => {
    vi.useFakeTimers();

    // 1. Test Timeout > 15000ms
    const hangingVerify = vi.fn(
      () =>
        new Promise(() => {
          // Never resolves
        })
    );

    const { unmount } = render(
      <NotionLoginModal
        isOpen={true}
        onVerifyCredentials={hangingVerify}
        requestTimeoutMs={15000}
      />
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'timeout@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.change(screen.getByLabelText(/Verification code/i), {
      target: { value: '123456' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Continue with login code' });
    fireEvent.click(submitBtn);

    // Advance past 15000ms timeout
    await act(async () => {
      vi.advanceTimersByTime(15100);
    });

    const timeoutAlert = screen.getByRole('alert');
    expect(timeoutAlert).toHaveAttribute('data-error-code', 'TIMEOUT_ERROR');
    expect(timeoutAlert).toHaveTextContent('Waktu permintaan habis (timeout). Silakan coba lagi.');
    expect(submitBtn).not.toBeDisabled();

    unmount();
    vi.useRealTimers();

    // 2. Test Network Error
    const networkFailVerify = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    render(<NotionLoginModal isOpen={true} onVerifyCredentials={networkFailVerify} />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'offline@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText(/Verification code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue with login code' }));

    await waitFor(() => {
      const netAlert = screen.getByRole('alert');
      expect(netAlert).toHaveAttribute('data-error-code', 'NETWORK_ERROR');
      expect(netAlert).toHaveTextContent(
        'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'
      );
    });
  });

  it('TC-13: Deduplikasi Submit Ganda (Double-Submit Guard)', async () => {
    vi.useFakeTimers();

    const delayedVerify = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ verified: true }), 500);
        })
    );

    const { container } = render(
      <NotionLoginModal isOpen={true} onVerifyCredentials={delayedVerify} />
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'guard@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.change(screen.getByLabelText(/Verification code/i), {
      target: { value: '123456' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Continue with login code' });

    // Click submit 3 times rapidly before 500ms finishes
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    // During in-flight request, button is disabled and shows .noted-spinner
    expect(submitBtn).toBeDisabled();
    expect(container.querySelector('.noted-spinner')).toBeInTheDocument();
    expect(delayedVerify).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(delayedVerify).toHaveBeenCalledTimes(1);
  });

  it('TC-14: Pemulihan Sesi Otomatis (Auto-Restore) & Penanganan Sesi Kedaluwarsa (auth-expired)', () => {
    const activeUser = {
      id: 'email_restore_user',
      email: 'restore@example.com',
      name: 'Restore User',
      picture: null,
      avatar: 'R',
      color: '#2383E2',
      isLoggedIn: true,
      loginProvider: 'email',
      loggedInAt: Date.now(),
    };
    const session = createAuthSession(activeUser, 'email', Date.now());
    setSessionToken(session.token);
    setCurrentUser(activeUser);

    // Step 1: Auto-restore session on startup
    const restored = restoreAuthSession();
    expect(restored.status).toBe('AUTHENTICATED');
    expect(restored.isAuthenticated).toBe(true);
    expect(restored.user.email).toBe('restore@example.com');

    // Step 2: Dispatch noted_auth_expired event
    render(<NotionLoginModal isOpen={true} />);
    act(() => {
      window.dispatchEvent(new CustomEvent(AUTH_CONFIG.EVENTS.AUTH_EXPIRED));
    });

    expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_TOKEN)).toBeNull();
    expect(getAuthState().isLoggedIn).toBe(false);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sesi Anda telah berakhir. Silakan masuk kembali.'
    );
  });

  it('TC-15: Fungsi Sign Out (Logout) Bersih', () => {
    const activeUser = {
      id: 'email_logout_user',
      email: 'logout@example.com',
      name: 'Logout User',
      picture: null,
      avatar: 'L',
      color: '#2383E2',
      isLoggedIn: true,
      loginProvider: 'email',
      loggedInAt: Date.now(),
    };
    const session = createAuthSession(activeUser, 'email', Date.now());
    setSessionToken(session.token);
    setCurrentUser(activeUser);

    const authChangedSpy = vi.fn();
    window.addEventListener(AUTH_CONFIG.EVENTS.AUTH_CHANGED, authChangedSpy);

    const guestUser = logout();

    expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_TOKEN)).toBeNull();
    expect(guestUser.isLoggedIn).toBe(false);
    expect(guestUser.loginProvider).toBe('guest');

    const storedCurrentRaw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER);
    const storedCurrent = JSON.parse(storedCurrentRaw);
    expect(storedCurrent.isLoggedIn).toBe(false);
    expect(storedCurrent.loginProvider).toBe('guest');

    expect(authChangedSpy).toHaveBeenCalled();
    window.removeEventListener(AUTH_CONFIG.EVENTS.AUTH_CHANGED, authChangedSpy);
  });

  it('TC-16: Fallback Inisial pada Avatar Akun Tersimpan jika Gambar Rusak atau Tidak Ada', () => {
    const savedAccounts = [
      {
        id: 'acc1',
        name: 'Dani Gpam',
        email: 'gpamdani@gmail.com',
        picture: null,
        avatar: 'D',
        color: '#00897b',
      },
      {
        id: 'acc2',
        name: 'denis',
        email: 'denisvibecoding@gmail.com',
        picture: 'https://broken-domain.invalid/photo.jpg',
        avatar: 'D',
        color: '#2383e2',
      },
    ];
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(savedAccounts));

    const { container } = render(<NotionLoginModal isOpen={true} />);

    // First account with no picture should show initial text 'D'
    expect(screen.getByText('Dani Gpam')).toBeInTheDocument();
    expect(screen.getByText('denis')).toBeInTheDocument();

    // Second account has an img tag initially
    const brokenImg = container.querySelector('img[src="https://broken-domain.invalid/photo.jpg"]');
    expect(brokenImg).not.toBeNull();

    // Trigger error event on the broken image
    fireEvent.error(brokenImg);

    // After error, image is removed and initial text 'D' is displayed
    expect(container.querySelector('img[src="https://broken-domain.invalid/photo.jpg"]')).toBeNull();
    const initials = screen.getAllByText('D');
    expect(initials.length).toBeGreaterThanOrEqual(2);
  });
});
