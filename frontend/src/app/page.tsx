'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="container min-vh-100 d-flex flex-column justify-content-between py-5 animate-fade-in">
      {/* Top navbar info */}
      <header className="d-flex justify-content-between align-items-center mb-5">
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-20 text-primary rounded p-1.5 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-rocket-takeoff-fill fs-4"></i>
          </div>
          <span className="fw-bold fs-4 tracking-tight">EgyptExpress Recruit</span>
        </div>
        <div>
          <Link href="/login" className="btn btn-outline-primary border-opacity-25 rounded-pill px-4 fw-semibold small">
            HR Login
          </Link>
        </div>
      </header>

      {/* Hero Body */}
      <main className="row align-items-center my-auto g-5">
        <div className="col-12 col-lg-6">
          <span className="badge bg-primary bg-opacity-10 text-primary border-0 px-3 py-1.5 rounded-pill small fw-bold mb-3">
            NEXT-GEN SKILL EVALUATION
          </span>
          <h1 className="display-4 fw-bold text-main mb-3">
            Automate and Grade Candidates <span className="gradient-text">Effortlessly</span>.
          </h1>
          <p className="text-muted fs-5 mb-4" style={{ maxWidth: '90%' }}>
            Design custom skill assessments, set duration limits, track candidate progress, and receive instantly graded scorecards to accelerate your HR filters.
          </p>

          <div className="d-flex flex-wrap gap-3">
            <Link href="/login" className="btn btn-primary gradient-btn px-4 py-2.5 rounded-3 d-flex align-items-center gap-2">
              Get Started as HR
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="glass-card p-5 border-white border-opacity-10">
            <h4 className="fw-bold text-main mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-mortarboard text-secondary"></i>
              Are you a Candidate?
            </h4>
            <p className="text-muted small mb-4">
              Assessments are shared directly by recruitment coordinators via unique links. If you received an assessment invite link, copy-paste it into your browser to begin.
            </p>

            <div className="bg-light bg-opacity-5 p-3 rounded-3 small text-muted border border-black border-opacity-5">
              <div className="fw-bold mb-1"><i className="bi bi-info-circle-fill text-primary me-2"></i>Link Format:</div>
              <code className="text-primary font-monospace">https://egypt-express-recruitment-assessment.netlify.app/assessments/9d440e93-32bb-0bd8ecc2ae22</code>
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="text-center mt-5 pt-4 border-top border-white border-opacity-10 text-muted small">
        &copy; {new Date().getFullYear()} EgyptExpress Travel Inc. All rights reserved. Created with ❤️ by Development Team.
      </footer>
    </div>
  );
}
