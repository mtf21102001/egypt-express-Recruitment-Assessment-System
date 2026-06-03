'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, DashboardStats } from '../../utils/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard.stats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard metrics.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-4 rounded-3" role="alert">
        <h5 className="alert-heading fw-bold d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-octagon-fill"></i>
          Error Loading Metrics
        </h5>
        <p className="mb-0 small">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate percentages
  const passRate = stats.completedAttempts > 0 
    ? Math.round((stats.passedCount / stats.completedAttempts) * 100) 
    : 0;

  const failRate = stats.completedAttempts > 0 
    ? Math.round((stats.failedCount / stats.completedAttempts) * 100) 
    : 0;

  const kpis = [
    { title: 'Total Jobs', value: stats.totalJobs, icon: 'bi-briefcase', color: 'primary', link: '/dashboard/jobs' },
    { title: 'Assessments', value: stats.totalAssessments, icon: 'bi-journal-check', color: 'info', link: '/dashboard/assessments' },
    { title: 'Candidates', value: stats.totalCandidates, icon: 'bi-people', color: 'success', link: '/dashboard/attempts' },
    { title: 'Attempts', value: stats.totalAttempts, icon: 'bi-clipboard-data', color: 'warning', link: '/dashboard/attempts' },
  ];

  return (
    <div className="animate-fade-in">
      {/* KPI Cards */}
      <div className="row g-4 mb-5">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-xl-3">
            <Link href={kpi.link} className="text-decoration-none">
              <div className="glass-card p-4 h-100 d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small fw-semibold mb-1 text-uppercase tracking-wider">{kpi.title}</p>
                  <h2 className="fw-bold mb-0 text-main">{kpi.value}</h2>
                </div>
                <div className={`bg-${kpi.color} bg-opacity-10 text-${kpi.color} rounded-3 p-3 d-flex align-items-center justify-content-center`} style={{ width: '56px', height: '56px' }}>
                  <i className={`bi ${kpi.icon} fs-3`}></i>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Ratios & Scores Section */}
      <div className="row g-4 mb-5">
        {/* Pass / Fail Rate Card */}
        <div className="col-12 col-lg-6">
          <div className="glass-card p-4 h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-pie-chart text-primary"></i>
              Assessment Performance Rates
            </h5>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <span className="d-block text-muted small fw-medium">Completed Exams</span>
                <h3 className="fw-bold mb-0">{stats.completedAttempts}</h3>
              </div>
              <div className="text-end">
                <span className="d-block text-muted small fw-medium">Average Score</span>
                <h3 className="fw-bold mb-0 text-primary">{stats.averagePercentage}%</h3>
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between small fw-medium mb-1">
                <span>Passing Candidates ({stats.passedCount})</span>
                <span className="text-success">{passRate}%</span>
              </div>
              <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: `${passRate}%` }} aria-valuenow={passRate} aria-valuemin={0} aria-valuemax={100}></div>
              </div>
            </div>

            <div>
              <div className="d-flex justify-content-between small fw-medium mb-1">
                <span>Failed Candidates ({stats.failedCount})</span>
                <span className="text-danger">{failRate}%</span>
              </div>
              <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${failRate}%` }} aria-valuenow={failRate} aria-valuemin={0} aria-valuemax={100}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center Quick Links */}
        <div className="col-12 col-lg-6">
          <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-lightning text-warning"></i>
                Quick Actions
              </h5>
              <p className="text-muted small">Easily configure your recruitment workflow and access reports.</p>
            </div>
            
            <div className="d-grid gap-3">
              <Link href="/dashboard/jobs" className="btn btn-outline-primary text-start p-3 d-flex align-items-center justify-content-between border-opacity-25 rounded-3">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-briefcase fs-4"></i>
                  <div>
                    <span className="fw-semibold d-block">Manage Job Openings</span>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Create, update or close job positions</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
              
              <Link href="/dashboard/assessments" className="btn btn-outline-primary text-start p-3 d-flex align-items-center justify-content-between border-opacity-25 rounded-3">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-journal-plus fs-4"></i>
                  <div>
                    <span className="fw-semibold d-block">Configure Assessments</span>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Define evaluation questions and test duration</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Attempts Table */}
      <div className="glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-success"></i>
            Recent Assessment Attempts
          </h5>
          <Link href="/dashboard/attempts" className="btn btn-sm btn-link text-decoration-none fw-semibold">
            View All
            <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>

        {stats.latestAttempts.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-clipboard-x fs-1 mb-2 d-block opacity-40"></i>
            <p className="mb-0 small">No assessments have been attempted yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Title</th>
                  <th>Assessment</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.latestAttempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>
                      <div>
                        <span className="fw-semibold text-main d-block">{attempt.candidateName}</span>
                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{attempt.candidateEmail}</span>
                      </div>
                    </td>
                    <td>{attempt.jobTitle}</td>
                    <td>{attempt.assessmentTitle}</td>
                    <td>
                      <span className="small text-muted">
                        {new Date(attempt.startedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold">{attempt.score}</span>
                      <span className="text-muted small"> ({attempt.percentage}%)</span>
                    </td>
                    <td>
                      {attempt.submittedAt ? (
                        attempt.passed ? (
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 border-0 small fw-semibold">Passed</span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2.5 py-1 border-0 small fw-semibold">Failed</span>
                        )
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2.5 py-1 border-0 small fw-semibold">In Progress</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Link href={`/dashboard/attempts/${attempt.id}`} className="btn btn-sm btn-outline-primary border-opacity-25 rounded-2">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
