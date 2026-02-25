'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email) {
        throw new Error('Email is required');
      }

      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      setSuccess('If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.');
      setEmail('');
    } catch (submitError) {
      setError(submitError.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Forgot Password?</h2>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        disabled={loading}
      />

      {error && <p className="error">{error}</p>}
      {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}

      <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href="/auth/login" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
          Back to Login
        </Link>
      </div>
    </form>
  );
}
