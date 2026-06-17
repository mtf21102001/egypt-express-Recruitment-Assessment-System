'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, Job } from '../../../utils/api';
import BatchJobsModal from '../../../components/BatchJobsModal';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.jobs.list();
      setJobs(data);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs.';
      setError(message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const handleOpenCreate = () => {
    setEditingJob(null);
    setFormData({ title: '', description: '', status: 'ACTIVE' });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      status: job.status,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This will delete all associated assessments.')) {
      return;
    }
    try {
      await api.jobs.delete(id);
      fetchJobs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete job.';
      alert(message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title || !formData.description) {
      setFormError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingJob) {
        await api.jobs.update(editingJob.id, formData);
      } else {
        await api.jobs.create(formData);
      }
      setShowModal(false);
      fetchJobs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save job.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in position-relative">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Job Openings</h3>
          <p className="text-muted small mb-0">Create and manage your open positions for assessment targeting</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary border-opacity-25 d-flex align-items-center gap-2" onClick={() => setShowBatchModal(true)}>
            <i className="bi bi-clipboard-data"></i>
            Batch Import
          </button>
          <button className="btn gradient-btn d-flex align-items-center gap-2" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg"></i>
            Create Job
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="glass-card text-center py-5">
          <i className="bi bi-briefcase fs-1 mb-2 d-block opacity-40"></i>
          <h5 className="fw-semibold">No Job Openings Found</h5>
          <p className="text-muted small mb-4">Get started by creating your first job posting.</p>
          <button className="btn btn-primary btn-sm rounded-3 px-3" onClick={handleOpenCreate}>
            Create Job Now
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {jobs.map((job) => (
            <div key={job.id} className="col-12 col-md-6 col-xxl-4">
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold text-main mb-0 text-truncate" style={{ maxWidth: '80%' }}>
                      {job.title}
                    </h5>
                    <span className={`badge bg-${job.status === 'ACTIVE' ? 'success' : 'secondary'} bg-opacity-10 text-${job.status === 'ACTIVE' ? 'success' : 'secondary'} border-0 px-2.5 py-1 rounded-pill small fw-semibold`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-muted small mb-4 text-overflow-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '54px' }}>
                    {job.description}
                  </p>
                </div>

                <div className="d-flex justify-content-between align-items-center border-top border-white border-opacity-10 pt-3 mt-2">
                  <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                    Updated {new Date(job.updatedAt).toLocaleDateString()}
                  </span>
                  
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary border-opacity-25 rounded-2" onClick={() => handleOpenEdit(job)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger border-opacity-25 rounded-2" onClick={() => handleDelete(job.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Modal overlay using CSS states */}
      {showModal && (
        <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      )}

      {/* Batch Import Modal */}
      <BatchJobsModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSuccess={fetchJobs}
      />
      
      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex={-1} style={{ zIndex: 1050, display: showModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content glass-card border-0 p-4" style={{ background: 'var(--card-bg)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">{editingJob ? 'Edit Job Posting' : 'Create Job Posting'}</h5>
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
                  <label className="form-label small fw-semibold text-muted" htmlFor="jobTitle">Job Title</label>
                  <input
                    type="text"
                    id="jobTitle"
                    className="form-control"
                    placeholder="e.g., Senior Full-Stack Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted" htmlFor="jobDesc">Job Description</label>
                  <textarea
                    id="jobDesc"
                    className="form-control"
                    rows={4}
                    placeholder="Provide a comprehensive job description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label small fw-semibold text-muted" htmlFor="jobStatus">Status</label>
                  <select
                    id="jobStatus"
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
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
