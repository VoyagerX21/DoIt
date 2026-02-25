'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
    setValidating(false);
  }, [token]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!password || !confirmPassword) {
        throw new Error('Both password fields are required');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (!/[A-Z]/.test(password)) {
        throw new Error('Password must include at least one uppercase letter');
      }

      if (!/[a-z]/.test(password)) {
        throw new Error('Password must include at least one lowercase letter');
      }

      if (!/[0-9]/.test(password)) {
        throw new Error('Password must include at least one number');
      }

      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (submitError) {
      setError(submitError.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
        <p>Validating reset link...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
        <h2>Invalid Reset Link</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          The password reset link is invalid or has expired.
        </p>
        <Link href="/auth/forgot-password" style={{ color: '#007bff', textDecoration: 'none' }}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Reset Password</h2>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        Enter your new password below. It must be at least 8 characters and include uppercase, lowercase, and a number.
      </p>

      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        disabled={loading}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        disabled={loading}
        style={{ marginTop: '10px' }}
      />

      {error && <p className="error">{error}</p>}
      {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}

      <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href="/auth/login" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
          Back to Login
        </Link>
      </div>
    </form>
  );
}
