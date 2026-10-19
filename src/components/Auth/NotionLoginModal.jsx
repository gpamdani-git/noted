import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import {
  loginWithGoogleCredential,
  loginWithEmail,
  loginWithDemoGoogle,
  getGoogleClientId
} from '../../utils/auth';
import './NotionLoginModal.css';

export const NotionLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [googleClientId, setLocalGoogleClientId] = useState(getGoogleClientId());
  const [isGisRendered, setIsGisRendered] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setIsGisRendered(false);
      return;
    }
    setError('');
    const currentId = getGoogleClientId();
    setLocalGoogleClientId(currentId);

    // Initialize Google Identity Services if client ID exists and google script is loaded
    if (currentId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: currentId,
          callback: (response) => {
            if (response.credential) {
              try {
                const user = loginWithGoogleCredential(response.credential);
                if (onLoginSuccess) onLoginSuccess(user);
                onClose();
              } catch (err) {
                setError(err.message || 'Failed to authenticate with Google');
              }
            }
          }
        });

        // Clear any previous rendered children
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
  }, [isOpen, googleClientId]);

  if (!isOpen) return null;

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    try {
      const user = loginWithEmail(email);
      if (onLoginSuccess) onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal login dengan email.');
    }
  };

  const handleGoogleClick = () => {
    const clientId = getGoogleClientId();
    if (clientId && window.google?.accounts?.id) {
      // Prompt standard Google one-tap or popup
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If popup was blocked or prompt not displayed, fallback to demo user
          try {
            const user = loginWithDemoGoogle('gpamdani@gmail.com', 'Dani Gpam');
            if (onLoginSuccess) onLoginSuccess(user);
            onClose();
          } catch (e) {
            console.warn(e);
          }
        }
      });
    } else {
      // Fallback to instant demo Google login
      const user = loginWithDemoGoogle('gpamdani@gmail.com', 'Dani Gpam');
      if (onLoginSuccess) onLoginSuccess(user);
      onClose();
    }
  };

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

        {/* Primary Auth: Single Google Login Button */}
        <div className="notion-login-methods">
          <div className="google-gis-container">
            {/* Slot tombol resmi Google (GIS SDK) */}
            <div
              ref={googleBtnRef}
              className="google-rendered-button-slot"
              style={{ display: isGisRendered ? 'flex' : 'none' }}
            />

            {/* Tombol fallback hanya jika script Google belum termuat */}
            {!isGisRendered && (
              <button
                type="button"
                className="notion-auth-btn google-custom-btn"
                onClick={handleGoogleClick}
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
                <span>Continue with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="notion-login-divider">
          <span>OR</span>
        </div>

        {/* Email Login Form */}
        <form className="notion-login-form" onSubmit={handleEmailSubmit}>
          <label className="notion-login-field-label">Work or personal email</label>
          <div className="notion-login-input-group">
            <Mail size={15} className="notion-input-icon" />
            <input
              type="email"
              className="notion-login-input"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="notion-login-submit-btn">
            <span>Continue with email</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Guest Access Footer */}
        <div className="notion-login-footer">
          <button
            type="button"
            className="notion-guest-link"
            onClick={() => {
              const user = loginWithEmail('guest@noted.local', 'Guest User');
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
