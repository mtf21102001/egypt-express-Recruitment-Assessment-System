'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Assessment, Question } from '../../../../utils/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface OptionFormState {
  optionText: string;
  isCorrect: boolean;
}

export default function AssessmentDetailPage({ params }: PageProps) {
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE');
  const [options, setOptions] = useState<OptionFormState[]>([
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
  ]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolve params promise
  useEffect(() => {
    params.then((p) => setAssessmentId(p.id));
  }, [params]);

  const fetchData = useCallback(async (id: string) => {
    try {
      const [assessmentData, questionsData] = await Promise.all([
        api.assessments.get(id),
        api.questions.list(id),
      ]);
      setAssessment(assessmentData);
      setQuestions(questionsData);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assessment details.';
      setError(message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (assessmentId) {
      const timer = setTimeout(() => {
        fetchData(assessmentId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [assessmentId, fetchData]);

  // Sync options when question type changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (questionType === 'TRUE_FALSE') {
        setOptions([
          { optionText: 'True', isCorrect: true },
          { optionText: 'False', isCorrect: false },
        ]);
      } else if (questionType === 'TEXT') {
        setOptions([]);
      } else if (options.length === 0) {
        setOptions([
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [questionType, options.length]);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionType('MULTIPLE_CHOICE');
    setOptions([
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ]);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setQuestionType(question.questionType);
    setOptions(
      question.options?.map((opt) => ({
        optionText: opt.optionText,
        isCorrect: opt.isCorrect ?? false,
      })) || []
    );
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await api.questions.delete(id);
      if (assessmentId) fetchData(assessmentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete question.';
      alert(message);
    }
  };

  const handleAddOptionField = () => {
    setOptions([...options, { optionText: '', isCorrect: false }]);
  };

  const handleRemoveOptionField = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index].optionText = val;
    setOptions(updated);
  };

  const handleOptionCorrectChange = (index: number, checked: boolean) => {
    const updated = [...options];
    if (questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE') {
      // Uncheck all other choices for single choice selection
      updated.forEach((opt, idx) => {
        opt.isCorrect = idx === index;
      });
    } else {
      updated[index].isCorrect = checked;
    }
    setOptions(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!assessmentId) return;

    if (!questionText.trim()) {
      setFormError('Please enter the question text.');
      return;
    }

    if (questionType !== 'TEXT') {
      if (options.length < 2) {
        setFormError('Multiple-choice questions must have at least 2 choices.');
        return;
      }

      const hasEmpty = options.some((opt) => !opt.optionText.trim());
      if (hasEmpty) {
        setFormError('Please fill in all choice options.');
        return;
      }

      const hasCorrect = options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        setFormError('Please mark at least one option as correct.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        assessmentId,
        questionText,
        questionType,
        options: questionType === 'TEXT' ? [] : options,
      };

      if (editingQuestion) {
        await api.questions.update(editingQuestion.id, payload);
      } else {
        await api.questions.create(payload);
      }
      setShowModal(false);
      fetchData(assessmentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save question.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !assessment) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in position-relative">
      {/* Header and Details */}
      <div className="mb-4">
        <Link href="/dashboard/assessments" className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold mb-2 d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrow-left"></i> Back to Assessments
        </Link>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h3 className="fw-bold mb-1">{assessment.title}</h3>
            <p className="text-muted small mb-0">{assessment.description}</p>
          </div>
          <button className="btn gradient-btn d-flex align-items-center gap-2" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg"></i>
            Add Question
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Questions list */}
      <div className="mb-5">
        <h5 className="fw-bold mb-4 text-muted">Question Bank ({questions.length})</h5>

        {questions.length === 0 ? (
          <div className="glass-card text-center py-5">
            <i className="bi bi-journal-x fs-1 mb-2 d-block opacity-40"></i>
            <h5 className="fw-semibold">No Questions Added</h5>
            <p className="text-muted small mb-4">Create your first test question using the button above.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {questions.map((question, idx) => (
              <div key={question.id} className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>
                      {idx + 1}
                    </span>
                    <div>
                      <h6 className="fw-bold text-main mb-1 fs-5">{question.questionText}</h6>
                      <span className="badge bg-light text-dark border-0 rounded small uppercase" style={{ fontSize: '0.65rem' }}>
                        {question.questionType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary border-opacity-25 rounded-2" onClick={() => handleOpenEdit(question)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger border-opacity-25 rounded-2" onClick={() => handleDelete(question.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                {/* Question options visual list */}
                {question.questionType !== 'TEXT' && question.options && (
                  <div className="row g-2 mt-2 ps-4">
                    {question.options.map((opt) => (
                      <div key={opt.id} className="col-12 col-md-6">
                        <div className={`p-2.5 rounded-3 d-flex align-items-center gap-2 border ${opt.isCorrect ? 'bg-success bg-opacity-5 border-success border-opacity-25 text-light' : 'border-black border-opacity-5'}`}>
                          <i className={`bi ${opt.isCorrect ? 'bi-check-circle-fill text-light' : 'bi-circle text-muted'}`}></i>
                          <span className="small">{opt.optionText}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.questionType === 'TEXT' && (
                  <div className="ps-4 mt-2">
                    <div className="p-2.5 rounded-3 bg-light bg-opacity-10 border border-black border-opacity-5 text-muted small">
                      <i className="bi bi-pencil-square me-2"></i>
                      Candidates will write a paragraph or code answer here.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Question Modal */}
      {showModal && (
        <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      )}

      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex={-1} style={{ zIndex: 1050, display: showModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content glass-card border-0 p-4" style={{ background: 'var(--card-bg)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">{editingQuestion ? 'Edit Question' : 'Add Question'}</h5>
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

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-8">
                    <label className="form-label small fw-semibold text-muted" htmlFor="qText">Question Text</label>
                    <input
                      type="text"
                      id="qText"
                      className="form-control"
                      placeholder="e.g., Which of the following is correct?"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-muted" htmlFor="qType">Question Type</label>
                    <select
                      id="qType"
                      className="form-select"
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice (Single Option)</option>
                      <option value="MULTIPLE_CORRECT">Multiple Correct (Multiple Options)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="TEXT">Text / Code Response</option>
                    </select>
                  </div>
                </div>

                {/* Options Builder (Disabled for TEXT type) */}
                {questionType !== 'TEXT' && (
                  <div className="mt-4 border-top border-white border-opacity-10 pt-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label small fw-semibold text-muted mb-0">Answers & Choices</label>
                      {questionType !== 'TRUE_FALSE' && (
                        <button type="button" className="btn btn-sm btn-outline-primary border-opacity-25 rounded-3 d-flex align-items-center gap-1" onClick={handleAddOptionField}>
                          <i className="bi bi-plus"></i> Add Choice
                        </button>
                      )}
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {options.map((opt, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-3">
                          {/* Correct indicator */}
                          <div className="d-flex align-items-center">
                            {questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE' ? (
                              <input
                                type="radio"
                                className="form-check-input mt-0"
                                name="correctOption"
                                checked={opt.isCorrect}
                                onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)}
                                style={{ width: '20px', height: '20px' }}
                              />
                            ) : (
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={opt.isCorrect}
                                onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)}
                                style={{ width: '20px', height: '20px' }}
                              />
                            )}
                          </div>

                          {/* Choice text */}
                          <div className="flex-grow-1">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Choice #${idx + 1}`}
                              value={opt.optionText}
                              onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                              disabled={questionType === 'TRUE_FALSE'}
                              required
                            />
                          </div>

                          {/* Remove option */}
                          {questionType !== 'TRUE_FALSE' && options.length > 2 && (
                            <button type="button" className="btn btn-outline-danger border-opacity-25 rounded-3" onClick={() => handleRemoveOptionField(idx)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-3 px-3" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn gradient-btn btn-sm rounded-3 px-4 d-flex align-items-center gap-2" disabled={submitting}>
                  {submitting && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
