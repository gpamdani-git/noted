import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import {
  AUTH_CONFIG,
  normalizeEmail,
  validateEmailInput,
  validateVerificationInput,
  requestEmailVerification,
  verifyLoginCredentials,
  normalizeAuthError,
  loginWithGoogleCredential,
  logout,
  switchAccount,
  getGoogleClientId,
  getSavedAccounts,
  isElectronApp,
  shouldUseNativeGoogleAuth,
} from '../../utils/auth';
import { getApiBaseUrl } from '../../utils/session';
import './NotionLoginModal.css';

export const AccountAvatar = ({ user }) => {
  const [imgError, setImgError] = useState(false);
  const initial = (user?.avatar || user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div
      className="google-account-avatar"
      style={{ backgroundColor: user?.color || '#2383e2' }}
    >
      {user?.picture && !imgError ? (
        <img
          src={user.picture}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

const LOGIN_I18N = {
  id: {
    title: 'Pikirkan. Wujudkan.',
    subtitle: 'Masuk ke akun Noted Anda',
    googleBtn: 'Lanjutkan dengan Google',
    guestBtn: 'Lanjutkan sebagai Tamu (Offline Mode)',
    legal: 'Dengan melanjutkan, Anda menyetujui Ketentuan Penggunaan dan Kebijakan Privasi Noted.',
    closeTitle: 'Tutup'
  },
  en: {
    title: 'Think it. Make it.',
    subtitle: 'Log in to your Noted account',
    googleBtn: 'Continue with Google',
    guestBtn: 'Continue as Guest (Offline Mode)',
    legal: "By continuing, you agree to Noted's Terms of Use and Privacy Policy.",
    closeTitle: 'Close'
  }
};

export const NotionLoginModal = ({
  isOpen = true,
  onClose = () => {},
  onLoginSuccess,
  onRequestVerificationCode,
  onVerifyCredentials,
  onSsoLogin,
  initialVerificationMethod = 'OTP_CODE',
  requestTimeoutMs = AUTH_CONFIG.REQUEST_TIMEOUT_MS,
  resendCooldownSeconds = AUTH_CONFIG.RESEND_COOLDOWN_SECONDS,
  showEmailAuth = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test',
  lang = 'id',
}) => {
  const txt = LOGIN_I18N[lang] || LOGIN_I18N.id;
  const [status, setStatus] = useState('IDLE');
  const [step, setStep] = useState('EMAIL_ENTRY');
  const [verificationMethod, setVerificationMethod] = useState(initialVerificationMethod);
  const [email, setEmail] = useState('');
  const [normalizedEmail, setNormalizedEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryNotice, setDeliveryNotice] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [googleClientId, setLocalGoogleClientId] = useState(getGoogleClientId());
  const [isGisRendered, setIsGisRendered] = useState(false);

  const googleBtnRef = useRef(null);
  const emailInputRef = useRef(null);
  const codeInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const isLoading = status === 'VALIDATING_EMAIL' || status === 'VERIFYING_CREDENTIALS';
  const isDesktop = isElectronApp();
  const isNativeOrLocal = shouldUseNativeGoogleAuth();
  const savedAccounts = getSavedAccounts();
  const appUrl = getApiBaseUrl();

  // Resend code cooldown countdown timer (FR-06, TC-10)
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const intervalId = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [resendCooldown > 0]);

  // Rate limit cooldown countdown timer (FR-11 / Section 5 #6, TC-11)
  useEffect(() => {
    if (rateLimitCooldown <= 0) return undefined;
    const intervalId = setInterval(() => {
      setRateLimitCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [rateLimitCooldown > 0]);

  // Listen for session expiration events (FR-11, TC-14)
  useEffect(() => {
    const handleExpired = () => {
      setStep('EMAIL_ENTRY');
      setStatus('IDLE');
      setVerificationCode('');
      setPassword('');
      setError({
        code: 'SESSION_EXPIRED',
        message: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
        field: 'general',
      });
    };
    window.addEventListener(AUTH_CONFIG.EVENTS.AUTH_EXPIRED, handleExpired);
    window.addEventListener('noted:auth-expired', handleExpired);
    window.addEventListener('session-expired', handleExpired);
    return () => {
      window.removeEventListener(AUTH_CONFIG.EVENTS.AUTH_EXPIRED, handleExpired);
      window.removeEventListener('noted:auth-expired', handleExpired);
      window.removeEventListener('session-expired', handleExpired);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsGisRendered(false);
      isSubmittingRef.current = false;
      return;
    }
    const currentId = getGoogleClientId();
    setLocalGoogleClientId(currentId);

    const canUseGis =
      !isDesktop &&
      !isNativeOrLocal &&
      typeof window !== 'undefined' &&
      (window.location.protocol === 'http:' || window.location.protocol === 'https:');

    if (!canUseGis) {
      setIsGisRendered(false);
      return;
    }

    if (currentId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: currentId,
          callback: async (response) => {
            if (!response.credential) return;
            isSubmittingRef.current = true;
            setStatus('VERIFYING_CREDENTIALS');
            setError(null);
            try {
              const user = await loginWithGoogleCredential(response.credential);
              setStatus('AUTHENTICATED');
              if (onLoginSuccess) onLoginSuccess(user);
              onClose();
            } catch (err) {
              setStatus('ERROR');
              setError(normalizeAuthError(err, 'general'));
            } finally {
              isSubmittingRef.current = false;
            }
          },
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
        setIsGisRendered(true);
      } catch (err) {
        console.warn('Google Identity initialization warning:', err);
        setIsGisRendered(false);
      }
    } else {
      setIsGisRendered(false);
    }
  }, [isOpen, googleClientId, isDesktop, isNativeOrLocal]);

  if (!isOpen) return null;

  // Auto-clear error & reset Step 2 when email changes (Section 4.3, FR-07, TC-06, TC-07)
  const handleEmailChange = (e) => {
    const nextValue = e.target.value;
    setEmail(nextValue);
    if (error) {
      setError(null);
    }
    setDeliveryNotice(null);
    if (step === 'VERIFICATION_OR_PASSWORD') {
      setStep('EMAIL_ENTRY');
      setStatus('IDLE');
      setVerificationCode('');
      setPassword('');
      setResendCooldown(0);
    } else if (status === 'ERROR') {
      setStatus('IDLE');
    }
  };

  // Clear email button handler (FR-03, TC-06, TC-07)
  const handleClearEmail = () => {
    setEmail('');
    setNormalizedEmail('');
    setError(null);
    setDeliveryNotice(null);
    setVerificationCode('');
    setPassword('');
    setResendCooldown(0);
    setStep('EMAIL_ENTRY');
    setStatus('IDLE');
    emailInputRef.current?.focus();
  };

  // Clear verification code button handler (FR-03)
  const handleClearVerificationCode = () => {
    setVerificationCode('');
    setError(null);
    if (status === 'ERROR') {
      setStatus('AWAITING_VERIFICATION');
    }
    codeInputRef.current?.focus();
  };

  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
    if (error) {
      setError(null);
    }
    if (status === 'ERROR') {
      setStatus('AWAITING_VERIFICATION');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) {
      setError(null);
    }
    if (status === 'ERROR') {
      setStatus('AWAITING_VERIFICATION');
    }
  };

  // Navigate back to Step 1 (FR-07, TC-07)
  const handleBackToEmail = () => {
    setStep('EMAIL_ENTRY');
    setStatus('IDLE');
    setVerificationCode('');
    setPassword('');
    setError(null);
    setDeliveryNotice(null);
    setResendCooldown(0);
    emailInputRef.current?.focus();
  };

  // Resend verification code with 30s cooldown (FR-06, TC-10)
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading || rateLimitCooldown > 0) return;
    const targetEmail = normalizedEmail || normalizeEmail(email);
    setError(null);
    setDeliveryNotice(null);
    setStatus('VALIDATING_EMAIL');
    isSubmittingRef.current = true;
    try {
      const res = await requestEmailVerification(targetEmail, {
        onRequestCode: onRequestVerificationCode,
        timeoutMs: requestTimeoutMs,
      });
      setStatus('AWAITING_VERIFICATION');
      setResendCooldown(resendCooldownSeconds);
      if (res?.emailDeliveryWarning) {
        setDeliveryNotice({ type: 'warning', text: res.emailDeliveryWarning });
      } else if (res?.emailSent) {
        setDeliveryNotice({ type: 'success', text: `Kode verifikasi baru telah dikirim ke ${targetEmail}` });
      }
    } catch (err) {
      const authErr = normalizeAuthError(err, 'general');
      setStatus('ERROR');
      setError(authErr);
      if (authErr.code === 'RATE_LIMITED') {
        setRateLimitCooldown(authErr.retryAfterSeconds || resendCooldownSeconds);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Primary form submit handler for Step 1 and Step 2 (FR-02, FR-04, FR-05, TC-02..TC-13)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // Double-submit guard (Section 5 #9, TC-13)
    if (isSubmittingRef.current || isLoading || rateLimitCooldown > 0) {
      return;
    }

    if (step === 'EMAIL_ENTRY') {
      const validation = validateEmailInput(email);
      if (!validation.valid) {
        setStatus('ERROR');
        setError(validation.error);
        emailInputRef.current?.focus();
        return;
      }

      const cleanEmail = validation.normalizedEmail;
      setEmail(cleanEmail);
      setNormalizedEmail(cleanEmail);
      setError(null);
      setDeliveryNotice(null);

      if (typeof onRequestVerificationCode === 'function') {
        isSubmittingRef.current = true;
        setStatus('VALIDATING_EMAIL');
        try {
          const res = await requestEmailVerification(cleanEmail, {
            onRequestCode: onRequestVerificationCode,
            timeoutMs: requestTimeoutMs,
          });
          setStep('VERIFICATION_OR_PASSWORD');
          setStatus('AWAITING_VERIFICATION');
          setResendCooldown(resendCooldownSeconds);
          if (res?.emailDeliveryWarning) {
            setDeliveryNotice({ type: 'warning', text: res.emailDeliveryWarning });
          } else if (res?.emailSent) {
            setDeliveryNotice({ type: 'success', text: `Kode verifikasi telah dikirim ke ${cleanEmail}` });
          }
        } catch (err) {
          const authErr = normalizeAuthError(err, 'email');
          setStatus('ERROR');
          setError(authErr);
          if (authErr.code === 'RATE_LIMITED') {
            setRateLimitCooldown(authErr.retryAfterSeconds || resendCooldownSeconds);
          }
        } finally {
          isSubmittingRef.current = false;
        }
      } else {
        // Transition to Step 2 immediately with pending state saved (FR-04, TC-05)
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            AUTH_CONFIG.STORAGE_KEYS.PENDING_VERIFICATION,
            JSON.stringify({ email: cleanEmail, sentAt: Date.now() })
          );
        }
        setStep('VERIFICATION_OR_PASSWORD');
        setStatus('AWAITING_VERIFICATION');
        setResendCooldown(resendCooldownSeconds);

        // Dispatch real email OTP request to server asynchronously
        requestEmailVerification(cleanEmail, {
          timeoutMs: requestTimeoutMs,
        }).then((res) => {
          if (res?.emailDeliveryWarning) {
            setDeliveryNotice({ type: 'warning', text: res.emailDeliveryWarning });
          } else if (res?.emailSent) {
            setDeliveryNotice({ type: 'success', text: `Kode verifikasi telah dikirim ke ${cleanEmail}` });
          }
        }).catch((err) => {
          const authErr = normalizeAuthError(err, 'email');
          if (authErr.code === 'RATE_LIMITED') {
            setStatus('ERROR');
            setError(authErr);
            setRateLimitCooldown(authErr.retryAfterSeconds || resendCooldownSeconds);
          }
        });
      }
      return;
    }

    // Step 2: VERIFICATION_OR_PASSWORD
    const step2Validation = validateVerificationInput({
      verificationMethod,
      verificationCode,
      password,
    });

    if (!step2Validation.valid) {
      setStatus('ERROR');
      setError(step2Validation.error);
      if (verificationMethod === 'PASSWORD') {
        passwordInputRef.current?.focus();
      } else {
        codeInputRef.current?.focus();
      }
      return;
    }

    isSubmittingRef.current = true;
    setStatus('VERIFYING_CREDENTIALS');
    setError(null);

    try {
      const { user, session } = await verifyLoginCredentials(
        {
          step,
          email: normalizedEmail || email,
          normalizedEmail: normalizedEmail || normalizeEmail(email),
          verificationMethod,
          verificationCode,
          password,
          displayName,
          isRegister: isRegisterMode,
        },
        {
          onVerifyCredentials,
          timeoutMs: requestTimeoutMs,
        }
      );

      setStatus('AUTHENTICATED');
      if (onLoginSuccess) onLoginSuccess(user, session);
      onClose();
    } catch (err) {
      const authErr = normalizeAuthError(
        err,
        verificationMethod === 'PASSWORD' ? 'password' : 'verificationCode'
      );
      setStatus('ERROR');
      setError(authErr);
      if (authErr.code === 'RATE_LIMITED') {
        setRateLimitCooldown(authErr.retryAfterSeconds || resendCooldownSeconds);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleBrowserSignIn = async () => {
    if (isSubmittingRef.current || isLoading) return;

    if (!appUrl && !onSsoLogin) {
      setStatus('ERROR');
      setError({
        code: 'SERVER_MISCONFIGURED',
        message: 'Sign-in through the browser is not available. Set VITE_APP_URL to your deployed Noted server.',
        field: 'general',
      });
      return;
    }

    if (window.electronAPI?.isProtocolRegistered) {
      try {
        const { registered } = await window.electronAPI.isProtocolRegistered();
        if (!registered) {
          setStatus('ERROR');
          setError({
            code: 'PROTOCOL_NOT_REGISTERED',
            message:
              'Aplikasi desktop ini belum terdaftar sebagai penangan noted://, jadi sesi tidak bisa dikembalikan ke sini. Daftarkan ulang aplikasi, atau masuk lewat browser.',
            field: 'general',
          });
          return;
        }
      } catch {
        // Proceed with handoff attempt
      }
    }

    isSubmittingRef.current = true;
    setStatus('VERIFYING_CREDENTIALS');
    setError(null);
    try {
      if (typeof onSsoLogin === 'function') {
        const res = await onSsoLogin('google');
        if (res?.popupClosed) {
          setStatus('IDLE');
          return;
        }
      } else {
        const handoffUrl = `${appUrl}/?notedAuth=desktop`;
        if (window.electronAPI?.openExternal) {
          await window.electronAPI.openExternal(handoffUrl);
        } else {
          window.open(handoffUrl, '_blank', 'noopener');
        }
      }
      setStatus('IDLE');
    } catch (err) {
      setStatus('ERROR');
      setError(normalizeAuthError(err, 'general'));
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleThirdPartySso = async (provider) => {
    if (isSubmittingRef.current || isLoading || rateLimitCooldown > 0) return;
    if (provider === 'google' && (isDesktop || isNativeOrLocal) && appUrl) {
      return handleBrowserSignIn();
    }

    if (provider === 'google' && googleBtnRef.current) {
      const innerClickable =
        googleBtnRef.current.querySelector('div[role="button"]') ||
        googleBtnRef.current.querySelector('iframe');
      if (innerClickable) {
        innerClickable.click();
        return;
      }
    }

    if (typeof onSsoLogin === 'function') {
      isSubmittingRef.current = true;
      setStatus('VERIFYING_CREDENTIALS');
      setError(null);
      try {
        const result = await onSsoLogin(provider);
        if (result?.popupClosed) {
          setStatus('IDLE');
          return;
        }
        if (result?.user) {
          setStatus('AUTHENTICATED');
          if (onLoginSuccess) onLoginSuccess(result.user, result.session);
          onClose();
        } else {
          setStatus('IDLE');
        }
      } catch (err) {
        if (err?.code === 'OAUTH_POPUP_CLOSED') {
          setStatus('IDLE');
          return;
        }
        setStatus('ERROR');
        setError(normalizeAuthError(err, 'general'));
      } finally {
        isSubmittingRef.current = false;
      }
    }
  };

  const isEmailError =
    status === 'ERROR' &&
    error &&
    (error.field === 'email' ||
      error.code === 'EMPTY_EMAIL' ||
      error.code === 'INVALID_EMAIL_FORMAT' ||
      error.code === 'EMAIL_TOO_LONG');

  const isCodeError =
    status === 'ERROR' &&
    error &&
    step === 'VERIFICATION_OR_PASSWORD' &&
    verificationMethod === 'OTP_CODE' &&
    (error.field === 'verificationCode' ||
      error.code === 'EMPTY_VERIFICATION_CODE' ||
      error.code === 'INVALID_VERIFICATION_CODE' ||
      error.code === 'INVALID_CREDENTIALS');

  const isPasswordError =
    status === 'ERROR' &&
    error &&
    step === 'VERIFICATION_OR_PASSWORD' &&
    verificationMethod === 'PASSWORD' &&
    (error.field === 'password' ||
      error.code === 'EMPTY_PASSWORD' ||
      error.code === 'INVALID_CREDENTIALS');

  const submitButtonLabel =
    step === 'EMAIL_ENTRY'
      ? 'Continue'
      : verificationMethod === 'PASSWORD'
        ? (isRegisterMode ? 'Create account' : 'Log in')
        : 'Continue with login code';

  return (
    <div className="notion-login-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="notion-login-modal animate-scale-up"
        data-status={status}
        data-step={step}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="notion-login-close-btn"
          onClick={onClose}
          title={txt.closeTitle}
          aria-label="Close login modal"
        >
          <X size={16} />
        </button>

        <div className="noted-login-container">
          {/* Brand Header */}
          <div className="notion-login-header">
            <div className="notion-login-logo">
              <img
                src="/noted-brand-logo.png"
                alt="Noted"
                className="notion-login-logo-img"
              />
            </div>
            <h2 className="notion-login-title">{txt.title}</h2>
            <p className="notion-login-subtitle">{txt.subtitle}</p>
          </div>

          {/* Multi-Method SSO Buttons (FR-01, FR-08, Section 6.3 #5) */}
          <div className="notion-login-methods">
            <div className="google-gis-container">
              <button
                type="button"
                className="noted-sso-btn notion-auth-btn google-custom-btn"
                onClick={() => handleThirdPartySso('google')}
                disabled={isLoading || rateLimitCooldown > 0}
                aria-label={lang === 'id' ? 'Continue with Google (Lanjutkan dengan Google)' : 'Continue with Google'}
              >
                <span className="noted-sso-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </span>
                <span>{txt.googleBtn}</span>
                {(isDesktop || isNativeOrLocal) && appUrl && <ExternalLink size={13} />}
              </button>

              {/* Seamless Google GIS Invisible Click-Capture Layer */}
              <div
                ref={googleBtnRef}
                className="google-rendered-button-slot"
                style={{ display: isGisRendered ? 'block' : 'none' }}
              />
            </div>

            {/* Apple, Passkey, and SSO temporarily hidden to focus on Google and Email */}
            {false && (
              <>
                <button
                  type="button"
                  className="noted-sso-btn notion-auth-btn apple-custom-btn"
                  onClick={() => handleThirdPartySso('apple')}
                  disabled={isLoading || rateLimitCooldown > 0}
                >
                  <span className="noted-sso-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  </span>
                  <span>Continue with Apple</span>
                </button>

                <button
                  type="button"
                  className="noted-sso-btn notion-auth-btn passkey-custom-btn"
                  onClick={() => handleThirdPartySso('passkey')}
                  disabled={isLoading || rateLimitCooldown > 0}
                >
                  <span className="noted-sso-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="7.5" cy="15.5" r="5.5" />
                      <path d="m21 2-9.6 9.6" />
                      <path d="m15.5 7.5 3 3L22 7l-3-3" />
                    </svg>
                  </span>
                  <span>Log in with passkey</span>
                </button>

                <button
                  type="button"
                  className="noted-sso-btn notion-auth-btn sso-custom-btn"
                  onClick={() => handleThirdPartySso('sso')}
                  disabled={isLoading || rateLimitCooldown > 0}
                >
                  <span className="noted-sso-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <span>Single sign-on (SSO)</span>
                </button>
              </>
            )}
          </div>

          {/* Error Alert (Always visible across all login methods) */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              aria-atomic="true"
              className="noted-login-alert notion-login-error"
              data-error-code={error.code || 'ERROR'}
              style={{ margin: '12px 0' }}
            >
              {error.message || String(error)}
            </div>
          )}

          {/* Email Login Form (Hidden by default in live UI, toggled via showEmailAuth) */}
          {showEmailAuth && (
            <>
              {/* Horizontal Divider ("OR") */}
              <div className="noted-login-divider notion-login-divider">
                <span>OR</span>
              </div>

              {/* Multi-Step Login Form (FR-01 .. FR-07) */}
              <form className="notion-login-form" onSubmit={handleFormSubmit} noValidate>
            <div className="noted-field-group">
              <label htmlFor="noted-login-email" className="noted-field-label notion-login-field-label">
                Email
              </label>
              <div className="notion-login-input-group">
                <input
                  ref={emailInputRef}
                  id="noted-login-email"
                  type="email"
                  className={`notion-login-input ${
                    isEmailError ? 'inputRedFocusRing noted-input-error' : ''
                  }`}
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  aria-invalid={isEmailError ? 'true' : 'false'}
                  autoComplete="email"
                />
                {email.length > 0 && !isLoading && (
                  <button
                    type="button"
                    className="noted-clear-input-btn"
                    aria-label="Clear input"
                    data-testid="clear-email-btn"
                    onClick={handleClearEmail}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm2.65 8.94a.5.5 0 0 1-.71.71L8 8.71l-1.94 1.94a.5.5 0 0 1-.71-.71L7.29 8 5.35 6.06a.5.5 0 0 1 .71-.71L8 7.29l1.94-1.94a.5.5 0 0 1 .71.71L8.71 8l1.94 1.94z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Step 2 Animated Expansion Container (FR-04, FR-05, FR-06, FR-07) */}
            <div
              className={`noted-animated-step ${
                step === 'VERIFICATION_OR_PASSWORD' ? 'is-open' : 'is-closed'
              }`}
              data-testid="verification-step-container"
              aria-hidden={step !== 'VERIFICATION_OR_PASSWORD'}
            >
              {deliveryNotice && (
                <div
                  className={`noted-delivery-notice ${deliveryNotice.type === 'warning' ? 'noted-delivery-warning' : 'noted-delivery-success'}`}
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.4',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    backgroundColor: deliveryNotice.type === 'warning' ? 'rgba(235, 87, 87, 0.08)' : 'rgba(35, 131, 226, 0.08)',
                    color: deliveryNotice.type === 'warning' ? '#cd3c3a' : '#2383e2',
                    border: deliveryNotice.type === 'warning' ? '1px solid rgba(205, 60, 58, 0.2)' : '1px solid rgba(35, 131, 226, 0.2)'
                  }}
                >
                  {deliveryNotice.text}
                </div>
              )}

              {verificationMethod === 'OTP_CODE' ? (
                <div className="noted-field-group">
                  <label
                    htmlFor="noted-verification-code"
                    className="noted-field-label notion-login-field-label"
                  >
                    Verification code
                  </label>
                  <div className="notion-login-input-group">
                    <input
                      ref={codeInputRef}
                      id="noted-verification-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={AUTH_CONFIG.OTP_CODE_LENGTH}
                      className={`notion-login-input noted-otp-input ${
                        isCodeError ? 'inputRedFocusRing noted-input-error' : ''
                      }`}
                      placeholder="Paste or type 6-digit code..."
                      value={verificationCode}
                      onChange={handleVerificationCodeChange}
                      disabled={isLoading || step !== 'VERIFICATION_OR_PASSWORD'}
                      aria-invalid={isCodeError ? 'true' : 'false'}
                      autoComplete="one-time-code"
                    />
                    {verificationCode.length > 0 && !isLoading && (
                      <button
                        type="button"
                        className="noted-clear-input-btn"
                        aria-label="Clear verification code"
                        data-testid="clear-code-btn"
                        onClick={handleClearVerificationCode}
                      >
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm2.65 8.94a.5.5 0 0 1-.71.71L8 8.71l-1.94 1.94a.5.5 0 0 1-.71-.71L7.29 8 5.35 6.06a.5.5 0 0 1 .71-.71L8 7.29l1.94-1.94a.5.5 0 0 1 .71.71L8.71 8l1.94 1.94z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="noted-field-group">
                    <label
                      htmlFor="noted-login-password"
                      className="noted-field-label notion-login-field-label"
                    >
                      Password
                    </label>
                    <div className="notion-login-input-group">
                      <input
                        ref={passwordInputRef}
                        id="noted-login-password"
                        type="password"
                        className={`notion-login-input ${
                          isPasswordError ? 'inputRedFocusRing noted-input-error' : ''
                        }`}
                        placeholder="Enter your password..."
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading || step !== 'VERIFICATION_OR_PASSWORD'}
                        aria-invalid={isPasswordError ? 'true' : 'false'}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <div className="noted-field-group" style={{ marginTop: 8 }}>
                    <label
                      htmlFor="noted-login-display-name"
                      className="noted-field-label notion-login-field-label"
                    >
                      Display name (optional)
                    </label>
                    <div className="notion-login-input-group">
                      <input
                        id="noted-login-display-name"
                        type="text"
                        className="notion-login-input"
                        placeholder="Your name..."
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isLoading || step !== 'VERIFICATION_OR_PASSWORD'}
                        autoComplete="name"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="noted-step2-actions">
                <button
                  type="button"
                  className="noted-back-btn"
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                >
                  Back
                </button>

                {verificationMethod === 'OTP_CODE' && (
                  <button
                    type="button"
                    className="noted-secondary-action-btn"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading || rateLimitCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                  </button>
                )}

                {verificationMethod === 'PASSWORD' && (
                  <button
                    type="button"
                    className="noted-secondary-action-btn"
                    onClick={() => {
                      setError(null);
                      setIsRegisterMode((prev) => !prev);
                    }}
                    disabled={isLoading}
                  >
                    {isRegisterMode ? 'Have an account? Log in' : 'New account? Register'}
                  </button>
                )}

                <button
                  type="button"
                  className="noted-secondary-action-btn"
                  onClick={() => {
                    setError(null);
                    setVerificationMethod((prev) =>
                      prev === 'OTP_CODE' ? 'PASSWORD' : 'OTP_CODE'
                    );
                  }}
                  disabled={isLoading}
                >
                  {verificationMethod === 'OTP_CODE' ? 'Use password' : 'Use login code'}
                </button>
              </div>
            </div>

            {/* Primary Submit Button (Section 6.3 #4, #7) */}
            <button
              type="submit"
              className="noted-submit-btn notion-login-submit-btn"
              disabled={isLoading || rateLimitCooldown > 0}
            >
              {isLoading && <span className="noted-spinner" aria-hidden="true" />}
              <span>{submitButtonLabel}</span>
            </button>
          </form>
        </>
      )}

          {/* Saved accounts picker */}
          {savedAccounts.length > 0 && (
            <div className="google-accounts-picker animate-fade-in" style={{ marginTop: 12 }}>
              {savedAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className="google-account-item"
                  onClick={() => {
                    const switched = switchAccount(acc.id);
                    if (!switched) {
                      setStatus('ERROR');
                      setError({
                        code: 'INVALID_CREDENTIALS',
                        message: 'Akun ini tidak bisa dipulihkan. Masuk ulang dengan Google.',
                        field: 'general',
                      });
                      return;
                    }
                    setStatus('AUTHENTICATED');
                    if (onLoginSuccess) onLoginSuccess(switched);
                    onClose();
                  }}
                  disabled={isLoading}
                >
                  <AccountAvatar user={acc} />
                  <div className="google-account-text">
                    <span className="google-account-name">{acc.name}</span>
                    <span className="google-account-email">{acc.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Guest Access & Legal Footer */}
          <div className="notion-login-footer">
            <button
              type="button"
              className="notion-guest-link"
              onClick={() => {
                const user = logout();
                if (onLoginSuccess) onLoginSuccess(user);
                onClose();
              }}
            >
              {txt.guestBtn}
            </button>

            <p className="notion-login-legal">
              {txt.legal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
