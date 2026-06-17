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
  rawCols: string[];
  questionText: string;
  questionType: string;
  options: Array<{ optionText: string; isCorrect: boolean }>;
  isValid: boolean;
  error?: string;
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
      const cols = rows[i].split('\t').map(c => c.trim());
      const rawCols = [...cols];

      const questionText = cols[0] || '';
      const questionType = (cols[1] || '').toUpperCase(); // MULTIPLE_CHOICE, MULTIPLE_CORRECT, TRUE_FALSE, TEXT

      let isValid = true;
      let valError = '';

      if (!questionText) {
        isValid = false;
        valError = 'Missing question text.';
      } else if (!['MULTIPLE_CHOICE', 'MULTIPLE_CORRECT', 'TRUE_FALSE', 'TEXT'].includes(questionType)) {
        isValid = false;
        valError = 'Invalid type. Use MULTIPLE_CHOICE, MULTIPLE_CORRECT, TRUE_FALSE, or TEXT.';
      }

      const optionsList: Array<{ optionText: string; isCorrect: boolean }> = [];

      if (isValid) {
        if (questionType === 'TRUE_FALSE') {
          const correctVal = (cols[6] || '').toLowerCase();
          const isTrue = ['true', '1', 't', 'yes', 'y'].includes(correctVal);
          const isFalse = ['false', '2', 'f', 'no', 'n'].includes(correctVal);
          
          if (!correctVal) {
            isValid = false;
            valError = 'True/False requires correct answer in Col G (1 for True, 2 for False).';
          } else if (!isTrue && !isFalse) {
            isValid = false;
            valError = 'Col G must be 1 (True) or 2 (False).';
          } else {
            optionsList.push({ optionText: 'True', isCorrect: isTrue });
            optionsList.push({ optionText: 'False', isCorrect: isFalse });
          }
        } else if (questionType !== 'TEXT') {
          // Options columns: 2, 3, 4, 5 (Option 1, 2, 3, 4)
          const optTexts = [cols[2], cols[3], cols[4], cols[5]].filter(
            (val) => val !== undefined && val !== ''
          );

          if (optTexts.length < 2) {
            isValid = false;
            valError = 'Multiple choice must have at least 2 choices (Cols C & D).';
          }

          // Correct indexes from column 6 (1-based, so we subtract 1)
          const correctVal = cols[6] || '';
          const correctIndexes = correctVal
            .split(',')
            .map((idx) => parseInt(idx.trim(), 10) - 1)
            .filter((idx) => !isNaN(idx));

          if (correctIndexes.length === 0) {
            isValid = false;
            valError = 'Specify correct option index in Col G (e.g. 1, or 1,3).';
          }

          optTexts.forEach((text, index) => {
            optionsList.push({
              optionText: text,
              isCorrect: correctIndexes.includes(index),
            });
          });
        }
      }

      newQuestions.push({
        rawCols,
        questionText,
        questionType,
        options: optionsList,
        isValid,
        error: valError,
      });
    }

    setParsedQuestions(newQuestions);
  };

  const handleSaveAll = async () => {
    const validQuestions = parsedQuestions.filter((q) => q.isValid);
    if (validQuestions.length === 0) return;
    setLoading(true);
    setError('');

    try {
      for (const q of validQuestions) {
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

  const downloadTemplate = () => {
    const headers = [
      'Question Text',
      'Question Type',
      'Option 1',
      'Option 2',
      'Option 3',
      'Option 4',
      'Correct Index'
    ];
    const sampleRows = [
      ['What is the capital of Egypt?', 'MULTIPLE_CHOICE', 'Cairo', 'Alexandria', 'Giza', 'Luxor', '1'],
      ['Select the odd numbers.', 'MULTIPLE_CORRECT', '1', '2', '3', '8', '1,3'],
      ['TypeScript is a compiled language.', 'TRUE_FALSE', '', '', '', '', '1'],
      ['Explain the difference between SQL and NoSQL.', 'TEXT', '', '', '', '', '']
    ];
    
    const content = [headers.join('\t'), ...sampleRows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions_template.tsv';
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
                    <code>[Col A: Question Text] | [Col B: Type] | [Col C: Opt1] | [Col D: Opt2] | [Col E: Opt3] | [Col F: Opt4] | [Col G: Correct Index(es)]</code>
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
                      Parsed <strong>{parsedQuestions.length}</strong> questions. Only valid rows (marked in green) will be imported.
                    </span>
                    <button
                      className="btn btn-sm btn-outline-danger border-opacity-25"
                      onClick={() => setParsedQuestions([])}
                      disabled={loading}
                    >
                      Clear and Paste Again
                    </button>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '450px' }}>
                    <table className="table table-bordered custom-table mb-0 align-middle small text-light" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <thead className="bg-dark bg-opacity-50">
                        <tr>
                          <th style={{ width: '50px' }}>#</th>
                          <th>Col A: Question Text</th>
                          <th style={{ width: '150px' }}>Col B: Type</th>
                          <th>Col C: Option 1</th>
                          <th>Col D: Option 2</th>
                          <th>Col E: Option 3</th>
                          <th>Col F: Option 4</th>
                          <th style={{ width: '120px' }}>Col G: Correct Index</th>
                          <th style={{ width: '150px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedQuestions.map((q, idx) => (
                          <tr key={idx} className={q.isValid ? '' : 'table-danger bg-danger bg-opacity-5'}>
                            <td className="font-monospace text-muted text-center">{idx + 1}</td>
                            <td className={!q.questionText ? 'bg-danger bg-opacity-10 text-danger' : ''}>
                              {q.questionText || <span className="text-danger small italic">Missing Question</span>}
                            </td>
                            <td className={!q.questionType ? 'bg-danger bg-opacity-10 text-danger' : ''}>
                              {q.questionType ? (
                                <span className="badge bg-light text-dark">{q.questionType}</span>
                              ) : (
                                <span className="text-danger small italic">Missing</span>
                              )}
                            </td>
                            
                            {/* Options 1 to 4 */}
                            {[0, 1, 2, 3].map((optIdx) => {
                              let optText = q.rawCols[optIdx + 2];
                              let isCorrect = q.options[optIdx]?.isCorrect || false;
                              
                              if (q.questionType === 'TRUE_FALSE') {
                                if (optIdx === 0) {
                                  optText = 'True';
                                } else if (optIdx === 1) {
                                  optText = 'False';
                                } else {
                                  optText = '';
                                }
                              }

                              const isRequiredMissing = optIdx < 2 && !optText && q.questionType !== 'TEXT';
                              return (
                                <td 
                                  key={optIdx} 
                                  className={isRequiredMissing ? 'bg-danger bg-opacity-10 text-danger text-center' : ''}
                                >
                                  {optText ? (
                                    <span className={isCorrect ? 'text-success fw-semibold' : ''}>
                                      {isCorrect && <i className="bi bi-check-circle-fill me-1"></i>}
                                      {optText}
                                    </span>
                                  ) : (
                                    isRequiredMissing ? <span className="text-danger small italic">Required</span> : <span className="text-muted opacity-30">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Correct Index */}
                            <td className={q.questionType !== 'TEXT' && !q.rawCols[6] ? 'bg-danger bg-opacity-10 text-danger text-center' : 'text-center'}>
                              {q.rawCols[6] || (q.questionType === 'TEXT' ? <span className="text-muted opacity-30">-</span> : <span className="text-danger small italic">Missing</span>)}
                            </td>

                            {/* Validation Status */}
                            <td>
                              {q.isValid ? (
                                <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                                  <i className="bi bi-check-circle-fill"></i> Valid
                                </span>
                              ) : (
                                <span className="text-danger small d-block" style={{ lineHeight: '1.2' }}>{q.error}</span>
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
                disabled={loading || parsedQuestions.filter(q => q.isValid).length === 0}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                )}
                Save Valid ({parsedQuestions.filter(q => q.isValid).length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
