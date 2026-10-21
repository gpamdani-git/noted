import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  ArrowRight,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  loginWithGoogleCredential,
  loginWithEmail,
  logout,
  getGoogleClientId,
  getSavedAccounts,
  isElectronApp,
  shouldUseNativeGoogleAuth
} from '../../utils/auth';
import { getApiBaseUrl } from '../../utils/session';
import './NotionLoginModal.css';

export const NotionLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [googleClientId, setLocalGoogleClientId] = useState(getGoogleClientId());
  const [isGisRendered, setIsGisRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const isDesktop = isElectronApp();
  const isNativeOrLocal = shouldUseNativeGoogleAuth();
  const savedAccounts = getSavedAccounts();
  const appUrl = getApiBaseUrl();

  useEffect(() => {
    if (!isOpen) {
      setIsGisRendered(false);
      setIsLoading(false);
      return;
    }
    setError('');
    const currentId = getGoogleClientId();
    setLocalGoogleClientId(currentId);

    // Google Identity Services requires a real browser origin (http/https).
    // Desktop (file://) and Capacitor cannot use the popup, so they sign in
    // through the browser hand-off instead.
    const canUseGis = !isDesktop && !isNativeOrLocal && typeof window !== 'undefined' &&
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
            setIsLoading(true);
            setError('');
            try {
              const user = await loginWithGoogleCredential(response.credential);
              if (onLoginSuccess) onLoginSuccess(user);
              onClose();
            } catch (err) {
              setError(err.message || 'Failed to authenticate with Google');
            } finally {
              setIsLoading(false);
            }
          }
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          width: 368,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left'
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Email accounts are LOCAL accounts: they work offline but cannot sync
      // to the cloud. A verified Google session is required for cloud sync.
      const user = loginWithEmail(email.trim().toLowerCase());
      if (onLoginSuccess) onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal membuat akun lokal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowserSignIn = async () => {
    if (!appUrl) {
      setError('Sign-in through the browser is not available. Set VITE_APP_URL to your deployed Noted server.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const handoffUrl = `${appUrl}/?notedAuth=desktop`;
      if (window.electronAPI?.openExternal) {
        await window.electronAPI.openExternal(handoffUrl);
      } else {
        window.open(handoffUrl, '_blank', 'noopener');
      }
    } catch (err) {
      setError(err.message || 'Gagal membuka browser untuk login.');
    } finally {
      setIsLoading(false);
    }
  };

  const canUseGis = !isDesktop && !isNativeOrLocal;
  const showBrowserHandoff = !isGisRendered && (isDesktop || isNativeOrLocal) && appUrl;

  return (
    <div className="notion-login-backdrop animate-fade-in" onClick={onClose}>
      <div className="notion-login-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="notion-login-close-btn" onClick={onClose} title="Tutup">
          <X size={16} />
        </button>

        {/* Brand Header */}
        <div className="notion-login-header">
          <div className="notion-login-logo">
            <span className="notion-logo-glyph">N</span>
          </div>
          <h2 className="notion-login-title">Think it. Plan it. Build it.</h2>
          <p className="notion-login-subtitle">Masuk ke ruang kerja Noted Anda</p>
        </div>

        {error && (
          <div className="notion-login-error animate-fade-in">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Auth: Google (verified server-side) */}
        <div className="notion-login-methods">
          <div className="google-gis-container">
            {/* Slot tombol resmi Google (GIS SDK hanya di web) */}
            <div
              ref={googleBtnRef}
              className="google-rendered-button-slot"
              style={{ display: isGisRendered ? 'flex' : 'none' }}
            />

            {!isGisRendered && showBrowserHandoff && (
              <div className="google-desktop-auth-wrap">
                <button
                  type="button"
                  className="notion-auth-btn google-custom-btn"
                  onClick={handleBrowserSignIn}
                  title="Lanjutkan login Google melalui browser (verifikasi server-side)"
                  disabled={isLoading}
                >
                  <svg className="google-icon-svg" viewBox="0 0 24 24" width="18" height="18">
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
                  <span>{isLoading ? 'Membuka browser...' : 'Continue with Google'}</span>
                  <ExternalLink size={13} />
                </button>
                <p className="notion-subtle-switch-link" style={{ marginTop: 8 }}>
                  Login dibuka di browser dan diverifikasi oleh server Noted.
                </p>
              </div>
            )}

            {!isGisRendered && !showBrowserHandoff && (
              <p className="notion-subtle-switch-link">
                Login Google belum tersedia di perangkat ini. {canUseGis ? 'Isi VITE_GOOGLE_CLIENT_ID untuk mengaktifkan.' : 'Set VITE_APP_URL untuk mengaktifkan login via browser.'}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="notion-login-divider">
          <span>OR</span>
        </div>

        {/* Local Account (offline) */}
        <form className="notion-login-form" onSubmit={handleEmailSubmit}>
          <label className="notion-login-field-label">Work or personal email (akun lokal)</label>
          <div className="notion-login-input-group">
            <Mail size={15} className="notion-input-icon" />
            <input
              type="email"
              className="notion-login-input"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <button type="submit" className="notion-login-submit-btn" disabled={isLoading}>
            <span>{isLoading ? 'Memproses...' : 'Continue offline'}</span>
            <ArrowRight size={14} />
          </button>
          <p className="notion-subtle-switch-link" style={{ marginTop: 6 }}>
            Akun lokal disimpan di perangkat ini dan tidak tersinkron ke cloud.
          </p>
        </form>

        {/* Saved accounts */}
        {savedAccounts.length > 0 && (
          <div className="google-accounts-picker animate-fade-in" style={{ marginTop: 12 }}>
            {savedAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                className="google-account-item"
                onClick={() => {
                  if (acc.session) {
                    window.dispatchEvent(new CustomEvent('noted_switch_account', { detail: { accountId: acc.id } }));
                  }
                }}
                disabled={isLoading || !acc.session}
              >
                <div className="google-account-avatar" style={{ backgroundColor: acc.color || '#2383e2' }}>
                  {acc.picture ? <img src={acc.picture} alt={acc.name} /> : (acc.avatar || acc.name?.[0] || 'N')}
                </div>
                <div className="google-account-text">
                  <span className="google-account-name">{acc.name}</span>
                  <span className="google-account-email">{acc.email}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Guest Access Footer */}
        <div className="notion-login-footer">
          <button
            type="button"
            className="notion-guest-link"
            onClick={() => {
              // A real guest session: no account is created and no cloud
              // session is issued, so the workspace stays local.
              const user = logout();
              if (onLoginSuccess) onLoginSuccess(user);
              onClose();
            }}
          >
            Lanjutkan sebagai Tamu (Offline Mode)
          </button>

          <p className="notion-login-legal">
            Dengan melanjutkan, Anda menyetujui Ketentuan Penggunaan dan Kebijakan Privasi Noted.
          </p>
        </div>
      </div>
    </div>
  );
};
