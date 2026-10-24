import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast, showToast } from '../components/common/Toast';

describe('Toast Notification System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a toast notification when showToast is called', () => {
    render(<Toast />);

    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      showToast('Berhasil masuk sebagai Dani Gpam', 'success');
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Berhasil masuk sebagai Dani Gpam')).toBeInTheDocument();
  });

  it('renders logout and account notification styles', () => {
    render(<Toast />);

    act(() => {
      showToast('Berhasil keluar. Beralih ke Mode Tamu (Offline)', 'logout');
    });

    expect(screen.getByText('Berhasil keluar. Beralih ke Mode Tamu (Offline)')).toBeInTheDocument();

    act(() => {
      showToast('Beralih ke akun denis', 'account');
    });

    expect(screen.getByText('Beralih ke akun denis')).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', () => {
    render(<Toast />);

    act(() => {
      showToast('Pesan sementara', 'info');
    });

    expect(screen.getByText('Pesan sementara')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Tutup notifikasi');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Pesan sementara')).toBeNull();
  });

  it('auto-dismisses toast after duration expires', () => {
    render(<Toast />);

    act(() => {
      showToast('Auto dismiss test', 'info', 2000);
    });

    expect(screen.getByText('Auto dismiss test')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.queryByText('Auto dismiss test')).toBeNull();
  });
});

