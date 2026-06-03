'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, UserProfile } from '../../utils/api';
import { cookies } from '../../utils/cookies';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify token and fetch profile
    api.auth.me()
      .then((profile) => {
        setUser(profile);
        cookies.set('user', JSON.stringify(profile), 7);
        setLoading(false);
      })
      .catch(() => {
        // Token invalid or expired, clear and redirect
        cookies.delete('token');
        cookies.delete('user');
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    cookies.delete('token');
    cookies.delete('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: 'bi-grid' },
    { name: 'Jobs', path: '/dashboard/jobs', icon: 'bi-briefcase' },
    { name: 'Assessments', path: '/dashboard/assessments', icon: 'bi-journal-check' },
    { name: 'Attempts', path: '/dashboard/attempts', icon: 'bi-people' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="custom-sidebar d-none d-lg-flex border-end border-white border-opacity-10">
        <div className="p-4 border-bottom border-white border-opacity-10 d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-20 text-primary rounded p-1 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            <i className="bi bi-rocket-takeoff-fill fs-5 text-light"></i>
          </div>
          <span className="fw-bold fs-5 tracking-tight">EgyptExpress</span>
        </div>

        <nav className="nav flex-column flex-grow-1 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link d-flex align-items-center gap-3 ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon} fs-5`}></i>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-top border-white border-opacity-10">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="text-light rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', backgroundColor: '#722ed1' }}>
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="small fw-semibold text-truncate">{user?.name}</div>
              <div className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 btn-sm d-flex align-items-center justify-content-center gap-2 border-opacity-20"
          >
            <i className="bi bi-box-arrow-left"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="d-flex flex-column flex-grow-1 min-vh-100 overflow-hidden">
        {/* Top Navbar */}
        <header className="navbar navbar-expand-lg border-bottom border-white border-opacity-10 px-4 py-3 bg-opacity-70 backdrop-blur-md">
          <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              {/* Mobile Sidebar Toggle (For demonstration/simplification, mobile layout redirects or displays simply) */}
              <div className="d-lg-none d-flex align-items-center gap-2">
                <i className="bi bi-rocket-takeoff-fill fs-4 text-primary"></i>
                <span className="fw-bold">EgyptExpress Recruit</span>
              </div>
              <h4 className="fw-semibold mb-0 d-none d-lg-block">
                {menuItems.find((item) => pathname === item.path)?.name || 'HR Dashboard'}
              </h4>
            </div>

            {/* Mobile Navigation Dropdown */}
            <div className="d-flex align-items-center gap-3">
              <div className="dropdown d-lg-none">
                <button className="btn btn-outline-secondary dropdown-toggle btn-sm" type="button" id="mobileMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                  Menu
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="mobileMenuButton">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link href={item.path} className={`dropdown-item d-flex align-items-center gap-2 ${pathname === item.path ? 'active' : ''}`}>
                        <i className={`bi ${item.icon}`}></i>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-left"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>

              <div className="d-flex align-items-center gap-2 bg-primary bg-opacity-10 text-light px-3 py-1.5 rounded-pill small fw-semibold">
                <span className="position-relative d-flex" style={{ width: '8px', height: '8px' }}>
                  <span className="animate-ping position-absolute inline-flex h-full w-full rounded-circle bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></span>
                </span>
                {user?.role || 'HR'} Account
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content rendering */}
        <main className="dashboard-content bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
