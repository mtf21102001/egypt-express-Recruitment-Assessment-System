'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Attempt, Job, Assessment } from '../../../utils/api';

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchFiltersData = useCallback(async () => {
    try {
      const [jobsData, assessmentsData] = await Promise.all([
        api.jobs.list(),
        api.assessments.list(),
      ]);
      setJobs(jobsData);
      setAssessments(assessmentsData);
    } catch (err) {
      console.error('Failed to load filter definitions', err);
    }
  }, []);

  const fetchAttempts = useCallback(async () => {
    try {
      const params = {
        search: search.trim() || undefined,
        jobId: selectedJobId || undefined,
        assessmentId: selectedAssessmentId || undefined,
        status: selectedStatus || undefined,
      };
      const data = await api.attempts.list(params);
      setAttempts(data);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch candidate attempts.';
      setError(message);
      setLoading(false);
    }
  }, [search, selectedJobId, selectedAssessmentId, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFiltersData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFiltersData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchAttempts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAttempts]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const csvText = await api.attempts.exportCsv();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attempts_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export CSV report.';
      alert(message);
    } finally {
      setExporting(false);
    }
  };

  if (loading && attempts.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading attempts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Candidate Attempts</h3>
          <p className="text-muted small mb-0">Monitor test execution, track grading, and export performance lists</p>
        </div>
        <button 
          className="btn btn-outline-primary border-opacity-25 rounded-3 d-flex align-items-center gap-2 small fw-semibold"
          onClick={handleExportCsv}
          disabled={exporting}
        >
          {exporting ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <i className="bi bi-download"></i>
          )}
          Export CSV Spreadsheet
        </button>
      </div>

      {error && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted" htmlFor="candidateSearch">Search Candidates</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-muted"><i className="bi bi-search"></i></span>
              <input
                type="text"
                id="candidateSearch"
                className="form-control border-start-0"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted" htmlFor="filterJob">Job Role</label>
            <select
              id="filterJob"
              className="form-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted" htmlFor="filterAssessment">Assessment</label>
            <select
              id="filterAssessment"
              className="form-select"
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
            >
              <option value="">All Exams</option>
              {assessments.map((ass) => (
                <option key={ass.id} value={ass.id}>{ass.title}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label small fw-semibold text-muted" htmlFor="filterStatus">Status</label>
            <select
              id="filterStatus"
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading data...</span>
            </div>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people fs-1 mb-2 d-block opacity-40"></i>
            <h5 className="fw-semibold">No Matching Attempts Found</h5>
            <p className="text-muted small mb-0">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Title</th>
                  <th>Assessment</th>
                  <th>Experience</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => {
                  const passingScore = attempt.assessment?.passingScore ?? 60;
                  const isPassed = attempt.percentage >= passingScore;
                  
                  return (
                    <tr key={attempt.id}>
                      <td>
                        <div>
                          <span className="fw-semibold text-main d-block">{attempt.candidate?.fullName}</span>
                          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{attempt.candidate?.email}</span>
                        </div>
                      </td>
                      <td>{attempt.assessment?.job?.title || 'Unknown Job'}</td>
                      <td>{attempt.assessment?.title}</td>
                      <td>
                        <span className="badge bg-light text-muted border-0 px-2 py-1 rounded small">
                          {attempt.candidate?.experienceYears} Yrs Exp
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold">{attempt.score}</span>
                        <span className="text-muted small"> ({attempt.percentage}%)</span>
                      </td>
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
                        {attempt.submittedAt ? (
                          isPassed ? (
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
                          View Breakdown
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
