'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../utils/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.register({ name, email, password });
      // Redirect to login on success
      router.push('/login?registered=true');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Try again.';
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
                <i className="bi bi-person-plus fs-2"></i>
              </div>
              <h2 className="fw-bold mb-1">Create HR Account</h2>
              <p className="text-muted small">Register to start managing jobs and assessments</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 border-0 bg-danger bg-opacity-10 text-danger rounded-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div className="small">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted" htmlFor="name">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted"><i className="bi bi-person"></i></span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control border-start-0"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

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

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted" htmlFor="password">Password</label>
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

              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted" htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted"><i className="bi bi-lock-fill"></i></span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control border-start-0"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Register
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-muted small">Already have an account? </span>
              <Link href="/login" className="text-primary small fw-semibold text-decoration-none">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
