'use client';

import React, { useState } from 'react';
import { api } from '../utils/api';

interface BatchJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedJob {
  title: string;
  description: string;
  status: string;
}

export default function BatchJobsModal({
  isOpen,
  onClose,
  onSuccess,
}: BatchJobsModalProps) {
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setError('');
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    const rows = clipboardData.split(/\r?\n/).filter((row) => row.trim() !== '');
    const newJobs: ParsedJob[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split('\t');
      if (cols.length < 2) continue; // Title and description are required

      const title = cols[0].trim();
      const description = cols[1].trim();
      let status = (cols[2] || 'ACTIVE').trim().toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE') {
        status = 'ACTIVE';
      }

      newJobs.push({ title, description, status });
    }

    setParsedJobs(newJobs);
  };

  const handleSaveAll = async () => {
    if (parsedJobs.length === 0) return;
    setLoading(true);
    setError('');

    try {
      for (const job of parsedJobs) {
        await api.jobs.create({
          title: job.title,
          description: job.description,
          status: job.status,
        });
      }
      setParsedJobs([]);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import batch jobs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content glass-card border-0 p-4 animate-slide-up" style={{ background: 'var(--card-bg)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">Batch Import Jobs</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={loading}
              ></button>
            </div>

            <div className="modal-body py-4">
              {error && (
                <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger py-2 small rounded-3 mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {parsedJobs.length === 0 ? (
                <div className="text-center p-4 border border-dashed rounded-3">
                  <i className="bi bi-clipboard-data fs-1 text-muted d-block mb-3"></i>
                  <h6 className="fw-semibold">Paste Excel Columns Here</h6>
                  <p className="text-muted small mb-4">
                    Copy columns in Excel matching this format: <br />
                    <code>[Job Title] | [Description] | [Status (ACTIVE/INACTIVE)]</code>
                  </p>
                  <textarea
                    className="form-control bg-light bg-opacity-5 text-main"
                    rows={6}
                    placeholder="Click here and press Ctrl+V to paste your Excel rows..."
                    onPaste={handlePaste}
                    readOnly
                    style={{ resize: 'none' }}
                  />
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">
                      Parsed <strong>{parsedJobs.length}</strong> jobs. Verify below before saving.
                    </span>
                    <button
                      className="btn btn-sm btn-outline-danger border-opacity-25"
                      onClick={() => setParsedJobs([])}
                      disabled={loading}
                    >
                      Clear and Paste Again
                    </button>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '300px' }}>
                    <table className="table custom-table mb-0 align-middle small">
                      <thead>
                        <tr>
                          <th>Job Title</th>
                          <th>Description</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedJobs.map((job, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-main">{job.title}</td>
                            <td className="text-muted text-truncate" style={{ maxWidth: '250px' }}>{job.description}</td>
                            <td>
                              <span className={`badge bg-${job.status === 'ACTIVE' ? 'success' : 'secondary'} bg-opacity-10 text-${job.status === 'ACTIVE' ? 'success' : 'secondary'}`}>
                                {job.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-3 px-3"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn gradient-btn btn-sm rounded-3 px-4 d-flex align-items-center gap-2"
                onClick={handleSaveAll}
                disabled={loading || parsedJobs.length === 0}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                )}
                Save All {parsedJobs.length > 0 ? `(${parsedJobs.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
