'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Assessment, Job } from '../../../utils/api';
import BatchAssessmentsModal from '../../../components/BatchAssessmentsModal';

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState({
    jobId: '',
    title: '',
    description: '',
    duration: 30, // in minutes
    passingScore: 60, // percentage e.g., 60%
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [assessmentData, jobData] = await Promise.all([
        api.assessments.list(),
        api.jobs.list('ACTIVE'), // Only fetch active jobs to link new assessments
      ]);
      setAssessments(assessmentData);
      setJobs(jobData);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assessments data.';
      setError(message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOpenCreate = () => {
    if (jobs.length === 0) {
      alert('You must have at least one ACTIVE Job posting before creating an assessment.');
      return;
    }
    setEditingAssessment(null);
    setFormData({
      jobId: jobs[0].id,
      title: '',
      description: '',
      duration: 30,
      passingScore: 60,
      status: 'ACTIVE',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      jobId: assessment.jobId,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      passingScore: assessment.passingScore,
      status: assessment.status,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assessment? All questions and candidate attempt scorecards will be permanently deleted.')) {
      return;
    }
    try {
      await api.assessments.delete(id);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete assessment.';
      alert(message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { jobId, title, description, duration, passingScore } = formData;
    if (!jobId || !title || !description || !duration || !passingScore) {
      setFormError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        duration: Number(duration),
        passingScore: Number(passingScore),
      };

      if (editingAssessment) {
        await api.assessments.update(editingAssessment.id, payload);
      } else {
        await api.assessments.create(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save assessment.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading assessments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in position-relative">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Assessments</h3>
          <p className="text-muted small mb-0">Design entry exams, configure timers, and build question papers</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary border-opacity-25 d-flex align-items-center gap-2" onClick={() => setShowBatchModal(true)}>
            <i className="bi bi-clipboard-data"></i>
            Batch Import
          </button>
          <button className="btn gradient-btn d-flex align-items-center gap-2" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg"></i>
            Create Assessment
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="glass-card text-center py-5">
          <i className="bi bi-journal-check fs-1 mb-2 d-block opacity-40"></i>
          <h5 className="fw-semibold">No Assessments Configured</h5>
          <p className="text-muted small mb-4">Assessments let candidates demonstrate their skills for active jobs.</p>
          <button className="btn btn-primary btn-sm rounded-3 px-3" onClick={handleOpenCreate}>
            Create Assessment Now
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="col-12 col-md-6 col-xxl-4">
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary border-0 px-2 py-1 rounded small fw-semibold" style={{ fontSize: '0.7rem' }}>
                      {assessment.job?.title || 'Unknown Job'}
                    </span>
                    <span className={`badge bg-${assessment.status === 'ACTIVE' ? 'success' : 'secondary'} bg-opacity-10 text-${assessment.status === 'ACTIVE' ? 'success' : 'secondary'} border-0 px-2 py-0.5 rounded-pill small fw-semibold`} style={{ fontSize: '0.7rem' }}>
                      {assessment.status}
                    </span>
                  </div>
                  
                  <h5 className="fw-bold text-main mb-2 text-truncate">{assessment.title}</h5>
                  <p className="text-muted small mb-3 text-overflow-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '36px' }}>
                    {assessment.description}
                  </p>

                  <div className="row g-2 mb-4 bg-dark bg-opacity-5 p-2 rounded-3 small">
                    <div className="col-6 d-flex align-items-center gap-2">
                      <i className="bi bi-clock text-primary"></i>
                      <span>{assessment.duration} Minutes</span>
                    </div>
                    <div className="col-6 d-flex align-items-center gap-2">
                      <i className="bi bi-award text-success"></i>
                      <span>Pass Score: {assessment.passingScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center border-top border-white border-opacity-10 pt-3 mt-1">
                  {/* Public exam sharing link */}
                  <div className="d-flex align-items-center gap-1">
                    <button 
                      className="btn btn-sm btn-link text-decoration-none fw-semibold p-0"
                      onClick={() => {
                        const publicUrl = `${window.location.origin}/assessments/${assessment.id}`;
                        navigator.clipboard.writeText(publicUrl);
                        alert('Candidate Assessment Link copied to clipboard!');
                      }}
                      title="Copy assessment entry link for candidates"
                    >
                      <i className="bi bi-share me-1"></i>
                      Share Exam
                    </button>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Link href={`/dashboard/assessments/${assessment.id}`} className="btn btn-sm btn-outline-primary border-opacity-25 rounded-2" title="Manage questions and options">
                      <i className="bi bi-list-task"></i> Questions
                    </Link>
                    <button className="btn btn-sm btn-outline-secondary border-opacity-25 rounded-2" onClick={() => handleOpenEdit(assessment)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger border-opacity-25 rounded-2" onClick={() => handleDelete(assessment.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      )}

      {/* Batch Import Modal */}
      <BatchAssessmentsModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSuccess={fetchData}
        jobs={jobs}
      />
      
      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex={-1} style={{ zIndex: 1050, display: showModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content glass-card border-0 p-4" style={{ background: 'var(--card-bg)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">{editingAssessment ? 'Edit Assessment' : 'Create Assessment'}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)}></button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body py-4">
                {formError && (
                  <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger py-2 small rounded-3 mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {formError}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted" htmlFor="targetJob">Linked Job Posting</label>
                  <select
                    id="targetJob"
                    className="form-select"
                    value={formData.jobId}
                    onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                    required
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted" htmlFor="assTitle">Assessment Title</label>
                  <input
                    type="text"
                    id="assTitle"
                    className="form-control"
                    placeholder="e.g., React & TypeScript Mid-Level Test"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted" htmlFor="assDesc">Assessment Instructions / Description</label>
                  <textarea
                    id="assDesc"
                    className="form-control"
                    rows={3}
                    placeholder="Instructions for the candidates before taking the test..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted" htmlFor="assDuration">Duration (Minutes)</label>
                    <input
                      type="number"
                      id="assDuration"
                      className="form-control"
                      min={1}
                      max={360}
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted" htmlFor="assPassingScore">Passing Score (%)</label>
                    <input
                      type="number"
                      id="assPassingScore"
                      className="form-control"
                      min={10}
                      max={100}
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-semibold text-muted" htmlFor="assStatus">Status</label>
                  <select
                    id="assStatus"
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-3 px-3" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn gradient-btn btn-sm rounded-3 px-4 d-flex align-items-center gap-2" disabled={submitting}>
                  {submitting && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
