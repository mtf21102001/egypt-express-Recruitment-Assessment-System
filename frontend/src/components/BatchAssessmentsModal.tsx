'use client';

import React, { useState } from 'react';
import { api, Job } from '../utils/api';

interface BatchAssessmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobs: Job[];
}

interface ParsedAssessment {
  jobId: string;
  jobTitle: string;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  status: string;
  isValid: boolean;
  validationError?: string;
}

export default function BatchAssessmentsModal({
  isOpen,
  onClose,
  onSuccess,
  jobs,
}: BatchAssessmentsModalProps) {
  const [parsedAssessments, setParsedAssessments] = useState<ParsedAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setError('');
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    const rows = clipboardData.split(/\r?\n/).filter((row) => row.trim() !== '');
    const newAssessments: ParsedAssessment[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split('\t');
      if (cols.length < 5) continue; // Job Title, Title, Description, Duration, Passing Score are required

      const jobInput = cols[0].trim();
      const title = cols[1].trim();
      const description = cols[2].trim();
      const duration = parseInt(cols[3].trim(), 10);
      const passingScore = parseInt(cols[4].trim(), 10);
      let status = (cols[5] || 'ACTIVE').trim().toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE') {
        status = 'ACTIVE';
      }

      // Find job by title or ID
      const matchedJob = jobs.find(
        (j) => j.title.toLowerCase() === jobInput.toLowerCase() || j.id === jobInput
      );

      const isValid = !isNaN(duration) && !isNaN(passingScore) && !!matchedJob;
      let validationError = '';
      if (!matchedJob) {
        validationError = `Job "${jobInput}" not found.`;
      } else if (isNaN(duration)) {
        validationError = 'Duration must be a number.';
      } else if (isNaN(passingScore)) {
        validationError = 'Passing Score must be a number.';
      }

      newAssessments.push({
        jobId: matchedJob ? matchedJob.id : '',
        jobTitle: matchedJob ? matchedJob.title : jobInput,
        title,
        description,
        duration: isNaN(duration) ? 30 : duration,
        passingScore: isNaN(passingScore) ? 60 : passingScore,
        status,
        isValid,
        validationError,
      });
    }

    setParsedAssessments(newAssessments);
  };

  const handleSaveAll = async () => {
    const validAssessments = parsedAssessments.filter((a) => a.isValid);
    if (validAssessments.length === 0) return;
    setLoading(true);
    setError('');

    try {
      for (const ass of validAssessments) {
        await api.assessments.create({
          jobId: ass.jobId,
          title: ass.title,
          description: ass.description,
          duration: ass.duration,
          passingScore: ass.passingScore,
          status: ass.status,
        });
      }
      setParsedAssessments([]);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import assessments.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content glass-card border-0 p-4 animate-slide-up" style={{ background: 'var(--card-bg)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">Batch Import Assessments</h5>
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

              {parsedAssessments.length === 0 ? (
                <div className="text-center p-4 border border-dashed rounded-3">
                  <i className="bi bi-clipboard-data fs-1 text-muted d-block mb-3"></i>
                  <h6 className="fw-semibold">Paste Excel Columns Here</h6>
                  <p className="text-muted small mb-4">
                    Copy columns in Excel matching this format: <br />
                    <code>[Job Title] | [Assessment Title] | [Description] | [Duration (Mins)] | [Passing Score (%)] | [Status (ACTIVE/INACTIVE)]</code>
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
                      Parsed <strong>{parsedAssessments.length}</strong> assessments. (Only valid rows will be saved).
                    </span>
                    <button
                      className="btn btn-sm btn-outline-danger border-opacity-25"
                      onClick={() => setParsedAssessments([])}
                      disabled={loading}
                    >
                      Clear and Paste Again
                    </button>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '350px' }}>
                    <table className="table custom-table mb-0 align-middle small">
                      <thead>
                        <tr>
                          <th>Target Job</th>
                          <th>Assessment Title</th>
                          <th>Description</th>
                          <th>Duration</th>
                          <th>Pass Score</th>
                          <th>Status</th>
                          <th>Validation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedAssessments.map((ass, idx) => (
                          <tr key={idx} className={ass.isValid ? '' : 'table-danger bg-danger bg-opacity-10'}>
                            <td className="fw-semibold text-main">{ass.jobTitle}</td>
                            <td>{ass.title}</td>
                            <td className="text-muted text-truncate" style={{ maxWidth: '180px' }}>{ass.description}</td>
                            <td>{ass.duration} Mins</td>
                            <td>{ass.passingScore}%</td>
                            <td>
                              <span className={`badge bg-${ass.status === 'ACTIVE' ? 'success' : 'secondary'} bg-opacity-10 text-${ass.status === 'ACTIVE' ? 'success' : 'secondary'}`}>
                                {ass.status}
                              </span>
                            </td>
                            <td>
                              {ass.isValid ? (
                                <span className="text-success fw-semibold"><i className="bi bi-check-circle me-1"></i>Valid</span>
                              ) : (
                                <span className="text-danger small">{ass.validationError}</span>
                              )}
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
                disabled={loading || parsedAssessments.filter(a => a.isValid).length === 0}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                )}
                Save Valid ({parsedAssessments.filter(a => a.isValid).length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
