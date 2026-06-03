'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Attempt, Question } from '../../../../utils/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface GradeDetailQuestion extends Omit<Question, 'options'> {
  options?: Array<{ id: string; questionId: string; optionText: string; isCorrect?: boolean }>;
  correctAnswers: string[];
  candidateAnswer: string;
  isCorrect: boolean;
}

interface AttemptHRDetail extends Omit<Attempt, 'assessment'> {
  questions: GradeDetailQuestion[];
  totalQuestions: number;
  passed: boolean;
  assessment: Attempt['assessment'] & {
    jobTitle: string;
  };
}

export default function AttemptDetailPage({ params }: PageProps) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptHRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolve params promise
  useEffect(() => {
    params.then((p) => setAttemptId(p.id));
  }, [params]);

  useEffect(() => {
    if (attemptId) {
      api.attempts.get(attemptId)
        .then((data) => {
          setAttempt(data as unknown as AttemptHRDetail);
          setLoading(false);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to fetch attempt details.';
          setError(message);
          setLoading(false);
        });
    }
  }, [attemptId]);

  if (loading || !attempt) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading scorecard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 rounded-3 mb-4" role="alert">
        <i className="bi bi-exclamation-octagon-fill me-2"></i>
        {error}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Back button & title */}
      <div className="mb-4">
        <Link href="/dashboard/attempts" className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold mb-2 d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrow-left"></i> Back to Attempts
        </Link>
        <h3 className="fw-bold mb-1">Assessment Scorecard</h3>
        <p className="text-muted small mb-0">Detailed results breakdown for candidate {attempt.candidate?.fullName}</p>
      </div>

      {/* Candidate and Exam Summary */}
      <div className="row g-4 mb-5">
        {/* Candidate Profile Details */}
        <div className="col-12 col-lg-6">
          <div className="glass-card p-4 h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-person-badge text-primary"></i>
              Candidate Profile
            </h5>

            <div className="row g-3">
              <div className="col-6">
                <span className="d-block text-muted small fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Full Name</span>
                <span className="fw-bold text-main">{attempt.candidate?.fullName}</span>
              </div>
              <div className="col-6">
                <span className="d-block text-muted small fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Email Address</span>
                <span className="text-main word-break-all small">{attempt.candidate?.email}</span>
              </div>
              <div className="col-6">
                <span className="d-block text-muted small fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Phone Number</span>
                <span className="text-main small">{attempt.candidate?.phone}</span>
              </div>
              <div className="col-6">
                <span className="d-block text-muted small fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Residence City</span>
                <span className="text-main">{attempt.candidate?.city}</span>
              </div>
              <div className="col-12">
                <span className="d-block text-muted small fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Professional Experience</span>
                <span className="badge bg-primary bg-opacity-10 text-primary border-0 px-2.5 py-1 rounded small fw-semibold mt-1">
                  {attempt.candidate?.experienceYears} Years of Experience
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Summary Card */}
        <div className="col-12 col-lg-6">
          <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-award text-success"></i>
                Performance Summary
              </h5>

              <div className="d-flex align-items-center gap-4 mb-4">
                <div className="d-flex flex-column align-items-center justify-content-center bg-light bg-opacity-10 rounded-4 p-3" style={{ minWidth: '110px' }}>
                  <span className="small text-muted mb-1">Total Score</span>
                  <h2 className="fw-bold mb-0 text-main">{attempt.score}<span className="text-muted fs-4">/{attempt.totalQuestions}</span></h2>
                </div>
                <div>
                  <span className="small text-muted d-block mb-1">Grade Percentage</span>
                  <h1 className="fw-bold mb-0 gradient-text">{attempt.percentage}%</h1>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center border-top border-white border-opacity-10 pt-3">
              <div>
                <span className="d-block text-muted small">Passing Threshold: {attempt.assessment?.passingScore}%</span>
                <span className="small text-muted">
                  Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'In Progress'}
                </span>
              </div>
              <div>
                {attempt.passed ? (
                  <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 rounded-pill px-4 py-2 fw-bold fs-6">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    PASSED
                  </span>
                ) : (
                  <span className="badge bg-danger bg-opacity-15 text-light border border-danger border-opacity-20 rounded-pill px-4 py-2 fw-bold fs-6">
                    <i className="bi bi-x-circle-fill me-2"></i>
                    FAILED
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer key breakdown */}
      <div>
        <h5 className="fw-bold mb-4 text-muted">Questions & Answers Breakdown</h5>

        <div className="d-flex flex-column gap-4">
          {attempt.questions.map((q: GradeDetailQuestion, idx: number) => (
            <div key={q.id} className={`glass-card p-4 border-start border-4 ${q.isCorrect ? 'border-start-success' : 'border-start-danger'}`} style={{ borderLeftColor: q.isCorrect ? '#198754 !important' : '#dc3545 !important' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-start gap-3">
                  <span className={`badge ${q.isCorrect ? 'bg-success' : 'bg-danger'} text-white rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>
                    {idx + 1}
                  </span>
                  <div>
                    <h6 className="fw-bold text-main mb-1 fs-5">{q.questionText}</h6>
                    <span className="badge bg-light text-muted border-0 rounded small uppercase" style={{ fontSize: '0.65rem' }}>
                      {q.questionType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div>
                  {q.isCorrect ? (
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 border-0 small fw-semibold">
                      <i className="bi bi-check-circle-fill me-1.5"></i> Correct
                    </span>
                  ) : (
                    <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2.5 py-1 border-0 small fw-semibold">
                      <i className="bi bi-x-circle-fill me-1.5"></i> Incorrect
                    </span>
                  )}
                </div>
              </div>

              {/* Multiple option displaying */}
              {q.questionType !== 'TEXT' && q.options && (
                <div className="row g-2 mt-3 ps-4">
                  {q.options.map((opt) => {
                    const isCandidateSelected = q.candidateAnswer.includes(opt.optionText);
                    const isCorrectOption = opt.isCorrect;

                    let bgBorderClass = 'border-black border-opacity-5';
                    let iconClass = 'bi-circle text-muted';

                    if (isCorrectOption) {
                      bgBorderClass = 'bg-success bg-opacity-5 border-success border-opacity-25 text-success';
                      iconClass = 'bi-check-circle-fill text-success';
                    } else if (isCandidateSelected && !isCorrectOption) {
                      bgBorderClass = 'bg-danger bg-opacity-5 border-danger border-opacity-25 text-danger';
                      iconClass = 'bi-x-circle-fill text-danger';
                    }

                    return (
                      <div key={opt.id} className="col-12 col-md-6">
                        <div className={`p-2.5 rounded-3 d-flex align-items-center justify-content-between border ${bgBorderClass} text-light`}>
                          <div className="d-flex align-items-center gap-2">
                            <i className={`bi ${iconClass}`}></i>
                            <span className="small">{opt.optionText}</span>
                          </div>

                          {isCandidateSelected && (
                            <span className="badge bg-primary bg-opacity-100 text-light border-0 small fw-semibold px-2 py-0.5 rounded" style={{ fontSize: '0.65rem' }}>
                              Candidate Selection
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text answer displaying */}
              {q.questionType === 'TEXT' && (
                <div className="ps-4 mt-3">
                  <div className="mb-3">
                    <span className="d-block text-muted small fw-semibold mb-1">Candidate Answer:</span>
                    <div className="p-3 rounded-3 bg-light bg-opacity-10 border border-black border-opacity-5 small text-main font-monospace text-wrap">
                      {q.candidateAnswer || <span className="text-muted italic">No answer submitted</span>}
                    </div>
                  </div>

                  {q.correctAnswers && q.correctAnswers.length > 0 && (
                    <div>
                      <span className="d-block text-muted small fw-semibold mb-1 text-success">Reference Answer:</span>
                      <div className="p-3 rounded-3 bg-success bg-opacity-5 border border-success border-opacity-10 small text-success font-monospace text-wrap">
                        {q.correctAnswers[0]}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
