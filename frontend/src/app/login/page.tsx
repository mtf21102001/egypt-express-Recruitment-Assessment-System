'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../utils/api';
import { cookies } from '../../utils/cookies';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      const timer = setTimeout(() => {
        setSuccess('Account created successfully! Please log in.');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { email, password } = formData;

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login({ email, password });

      // Save token and user details to cookies
      cookies.set('token', response.access_token, 7);
      cookies.set('user', JSON.stringify(response.user), 7);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-5 animate-slide-up">
          <div className="glass-card p-5">
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                <i className="bi bi-shield-lock fs-2"></i>
              </div>
              <h2 className="fw-bold mb-1">HR Portal</h2>
              <p className="text-muted small">Access the recruitment dashboard</p>
            </div>

            {success && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-4 py-2 border-0 bg-success bg-opacity-10 text-success rounded-3" role="alert">
                <i className="bi bi-check-circle-fill"></i>
                <div className="small">{success}</div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 border-0 bg-danger bg-opacity-10 text-danger rounded-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div className="small">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted" htmlFor="email">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted"><i className="bi bi-envelope"></i></span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control border-start-0"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-muted mb-0" htmlFor="password">Password</label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted"><i className="bi bi-lock"></i></span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control border-start-0"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn w-100 gradient-btn py-2 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
                suppressHydrationWarning
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In
                    <i className="bi bi-box-arrow-in-right"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
