import React, { useState, useEffect } from 'react';
import { CheckCircle2, LogOut, User, Info, AlertCircle, X } from 'lucide-react';
import './Toast.css';

export const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const { message, type = 'info', duration = 3500 } = e.detail || {};
      if (!message) return;
      const id = Date.now() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    window.addEventListener('noted:toast', handleToastEvent);
    return () => window.removeEventListener('noted:toast', handleToastEvent);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="noted-toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={16} className="toast-icon success" />;
      case 'logout':
        return <LogOut size={16} className="toast-icon logout" />;
      case 'account':
        return <User size={16} className="toast-icon account" />;
      case 'error':
        return <AlertCircle size={16} className="toast-icon error" />;
      default:
        return <Info size={16} className="toast-icon info" />;
    }
  };

  return (
    <div className={`noted-toast-pill animate-toast ${toast.type || 'info'}`}>
      <span className="toast-icon-wrap">{getIcon()}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        type="button"
        className="toast-close-btn"
        onClick={onRemove}
        aria-label="Tutup notifikasi"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export const showToast = (message, type = 'info', duration = 3500) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('noted:toast', { detail: { message, type, duration } })
    );
  }
};

