'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Request failed');
      }

      if (data?.token) {
        localStorage.setItem('voyaraAuthToken', data.token);
        setMessage('Success! Redirecting...');
        window.setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        setMessage('Account created successfully. You can now log in.');
        switchMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800/80 backdrop-blur rounded-2xl border border-white/10 p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <Link href="/" className="text-sm text-purple-300 hover:text-purple-200 transition-colors">← Home</Link>
        </div>

        <div className="flex gap-2 mb-6" role="tablist">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Login
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            role="tab"
            aria-selected={mode === 'register'}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Minimum 8 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded p-2">{error}</p>
          )}
          {message && (
            <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/40 rounded p-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
