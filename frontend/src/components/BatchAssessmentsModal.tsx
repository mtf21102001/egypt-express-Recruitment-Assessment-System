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
  rawCols: string[];
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
      const cols = rows[i].split('\t').map(c => c.trim());
      const rawCols = [...cols];

      const jobInput = cols[0] || '';
      const title = cols[1] || '';
      const description = cols[2] || '';
      const durationVal = cols[3] || '';
      const passingScoreVal = cols[4] || '';
      let status = (cols[5] || 'ACTIVE').toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE') {
        status = 'ACTIVE';
      }

      const duration = parseInt(durationVal, 10);
      const passingScore = parseInt(passingScoreVal, 10);

      // Find job by title or ID
      const matchedJob = jobs.find(
        (j) => j.title.toLowerCase() === jobInput.toLowerCase() || j.id === jobInput
      );

      let isValid = true;
      let validationError = '';

      if (!jobInput) {
        isValid = false;
        validationError = 'Missing Job Title/ID (Col A).';
      } else if (!matchedJob) {
        isValid = false;
        validationError = `Job "${jobInput}" not found.`;
      } else if (!title) {
        isValid = false;
        validationError = 'Missing Assessment Title (Col B).';
      } else if (!description) {
        isValid = false;
        validationError = 'Missing Description (Col C).';
      } else if (isNaN(duration)) {
        isValid = false;
        validationError = 'Invalid Duration (Col D).';
      } else if (isNaN(passingScore)) {
        isValid = false;
        validationError = 'Invalid Passing Score (Col E).';
      }

      newAssessments.push({
        rawCols,
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

  const downloadTemplate = () => {
    const headers = [
      'Job Title',
      'Assessment Title',
      'Description / Instructions',
      'Duration (Mins)',
      'Passing Score (%)',
      'Status (ACTIVE/INACTIVE)'
    ];
    const sampleRows = [
      ['DevOps Specialist', 'AWS Cloud Infrastructure Test', 'Test covering AWS IAM, VPC, and ECS deployment.', '45', '70', 'ACTIVE'],
      ['QA Automation Engineer', 'Playwright automation basics', 'Basic test for locator strategies and page object models.', '30', '65', 'ACTIVE']
    ];
    
    const content = [headers.join('\t'), ...sampleRows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'assessments_template.tsv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '90%' }}>
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
                    <code>[Col A: Job Title] | [Col B: Assessment Title] | [Col C: Description] | [Col D: Duration (Mins)] | [Col E: Passing Score (%)] | [Col F: Status]</code>
                  </p>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-link text-decoration-none fw-semibold mb-4 d-inline-flex align-items-center gap-1"
                    onClick={downloadTemplate}
                  >
                    <i className="bi bi-file-earmark-arrow-down-fill"></i>
                    Download Excel Template (.tsv)
                  </button>
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
                      Parsed <strong>{parsedAssessments.length}</strong> assessments. Only valid rows (marked in green) will be imported.
                    </span>
                    <button
                      className="btn btn-sm btn-outline-danger border-opacity-25"
                      onClick={() => setParsedAssessments([])}
                      disabled={loading}
                    >
                      Clear and Paste Again
                    </button>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '400px' }}>
                    <table className="table table-bordered custom-table mb-0 align-middle small text-light" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <thead className="bg-dark bg-opacity-50">
                        <tr>
                          <th style={{ width: '50px' }}>#</th>
                          <th>Col A: Target Job</th>
                          <th>Col B: Assessment Title</th>
                          <th>Col C: Description</th>
                          <th style={{ width: '120px' }}>Col D: Duration</th>
                          <th style={{ width: '120px' }}>Col E: Pass Score</th>
                          <th style={{ width: '120px' }}>Col F: Status</th>
                          <th style={{ width: '180px' }}>Validation Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedAssessments.map((ass, idx) => (
                          <tr key={idx} className={ass.isValid ? '' : 'table-danger bg-danger bg-opacity-5'}>
                            <td className="font-monospace text-muted text-center">{idx + 1}</td>
                            <td className={!ass.jobId ? 'bg-danger bg-opacity-10 text-danger' : ''}>
                              {ass.jobTitle || <span className="text-danger small italic">Required</span>}
                            </td>
                            <td className={!ass.title ? 'bg-danger bg-opacity-10 text-danger' : ''}>
                              {ass.title || <span className="text-danger small italic">Required</span>}
                            </td>
                            <td className={!ass.description ? 'bg-danger bg-opacity-10 text-danger' : ''}>
                              <div className="text-truncate" style={{ maxWidth: '250px' }}>
                                {ass.description || <span className="text-danger small italic">Required</span>}
                              </div>
                            </td>
                            <td className={isNaN(ass.duration) || ass.rawCols[3] === '' ? 'bg-danger bg-opacity-10 text-danger text-center' : 'text-center'}>
                              {ass.rawCols[3] ? `${ass.duration} Mins` : <span className="text-danger small italic">Required</span>}
                            </td>
                            <td className={isNaN(ass.passingScore) || ass.rawCols[4] === '' ? 'bg-danger bg-opacity-10 text-danger text-center' : 'text-center'}>
                              {ass.rawCols[4] ? `${ass.passingScore}%` : <span className="text-danger small italic">Required</span>}
                            </td>
                            <td>
                              <span className={`badge bg-${ass.status === 'ACTIVE' ? 'success' : 'secondary'} bg-opacity-10 text-${ass.status === 'ACTIVE' ? 'success' : 'secondary'}`}>
                                {ass.status}
                              </span>
                            </td>
                            <td>
                              {ass.isValid ? (
                                <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                                  <i className="bi bi-check-circle-fill"></i> Valid
                                </span>
                              ) : (
                                <span className="text-danger small d-block" style={{ lineHeight: '1.2' }}>{ass.validationError}</span>
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
