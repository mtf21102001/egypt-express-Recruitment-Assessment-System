'use client';

import React, { useState } from 'react';
import { api } from '../utils/api';

interface BatchQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onSuccess: () => void;
}

interface ParsedQuestion {
  questionText: string;
  questionType: string;
  options: Array<{ optionText: string; isCorrect: boolean }>;
}

export default function BatchQuestionsModal({
  isOpen,
  onClose,
  assessmentId,
  onSuccess,
}: BatchQuestionsModalProps) {
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setError('');
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    const rows = clipboardData.split(/\r?\n/).filter((row) => row.trim() !== '');
    const newQuestions: ParsedQuestion[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split('\t');
      if (cols.length < 2) continue; // Must have at least Question Text and Type

      const questionText = cols[0].trim();
      const questionType = cols[1].trim().toUpperCase(); // MULTIPLE_CHOICE, MULTIPLE_CORRECT, TRUE_FALSE, TEXT

      const optionsList: Array<{ optionText: string; isCorrect: boolean }> = [];

      if (questionType === 'TRUE_FALSE') {
        const correctVal = (cols[6] || '').trim().toLowerCase();
        optionsList.push({ optionText: 'True', isCorrect: correctVal === 'true' || correctVal === '0' });
        optionsList.push({ optionText: 'False', isCorrect: correctVal === 'false' || correctVal === '1' });
      } else if (questionType !== 'TEXT') {
        // Options columns: 2, 3, 4, 5 (Option 1, 2, 3, 4)
        const optTexts = [cols[2], cols[3], cols[4], cols[5]].filter(
          (val) => val !== undefined && val.trim() !== ''
        );

        // Correct indexes from column 6
        const correctIndexes = (cols[6] || '')
          .split(',')
          .map((idx) => parseInt(idx.trim(), 10))
          .filter((idx) => !isNaN(idx));

        optTexts.forEach((text, index) => {
          optionsList.push({
            optionText: text.trim(),
            isCorrect: correctIndexes.includes(index),
          });
        });
      }

      newQuestions.push({
        questionText,
        questionType,
        options: optionsList,
      });
    }

    setParsedQuestions(newQuestions);
  };

  const handleSaveAll = async () => {
    if (parsedQuestions.length === 0) return;
    setLoading(true);
    setError('');

    try {
      // Send sequential requests to avoid DB locking and keep API lightweight
      for (const q of parsedQuestions) {
        await api.questions.create({
          assessmentId,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
        });
      }
      setParsedQuestions([]);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import batch questions.';
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
              <h5 className="modal-title fw-bold">Batch Import Questions</h5>
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

              {parsedQuestions.length === 0 ? (
                <div className="text-center p-4 border border-dashed rounded-3">
                  <i className="bi bi-clipboard-data fs-1 text-muted d-block mb-3"></i>
                  <h6 className="fw-semibold">Paste Excel Columns Here</h6>
                  <p className="text-muted small mb-4">
                    Copy columns in Excel matching this format: <br />
                    <code>[Question Text] | [Type] | [Opt1] | [Opt2] | [Opt3] | [Opt4] | [Correct Index(es)]</code>
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
                      Parsed <strong>{parsedQuestions.length}</strong> questions. Verify below before saving.
                    </span>
                    <button
                      className="btn btn-sm btn-outline-danger border-opacity-25"
                      onClick={() => setParsedQuestions([])}
                      disabled={loading}
                    >
                      Clear and Paste Again
                    </button>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '400px' }}>
                    <table className="table custom-table mb-0 align-middle small">
                      <thead>
                        <tr>
                          <th>Question</th>
                          <th>Type</th>
                          <th>Options / Correct Answer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedQuestions.map((q, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-main">{q.questionText}</td>
                            <td>
                              <span className="badge bg-light text-dark">{q.questionType}</span>
                            </td>
                            <td>
                              {q.questionType === 'TEXT' ? (
                                <span className="text-muted italic">Text Answer</span>
                              ) : (
                                <div className="d-flex flex-wrap gap-2">
                                  {q.options.map((opt, oIdx) => (
                                    <span
                                      key={oIdx}
                                      className={`badge ${
                                        opt.isCorrect
                                          ? 'bg-success text-white'
                                          : 'bg-light text-muted'
                                      }`}
                                    >
                                      {opt.optionText}
                                    </span>
                                  ))}
                                </div>
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
                disabled={loading || parsedQuestions.length === 0}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                )}
                Save All {parsedQuestions.length > 0 ? `(${parsedQuestions.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
