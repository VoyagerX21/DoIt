'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../lib/api';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!form.email || !form.password) {
        throw new Error('Email and password are required');
      }

      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      if (isRegister && !form.name) {
        throw new Error('Name is required');
      }

      const data = await api(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Debugging output to help trace redirect issues
      console.log('Auth response:', data);
    
      if (data && data.success) {
        console.log("Redirecting to dashboard...");
        router.push('/dashboard');
        
      } else {
        setError('Authentication failed: unexpected response');
      }
    } catch (submitError) {
      setError(submitError.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
      {isRegister && (
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          disabled={loading}
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
        required
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
        required
        disabled={loading}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Loading...' : isRegister ? 'Register' : 'Login'}</button>
      
      {!isRegister && (
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <Link href="/auth/forgot-password" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
            Forgot Password?
          </Link>
        </div>
      )}
    </form>
  );
}
