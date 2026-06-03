'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

interface AssessmentResult {
  candidateName: string;
  assessmentTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
}

export default function GradedScorecardPage({ params }: PageProps) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve params
  useEffect(() => {
    params.then((p) => setAttemptId(p.attemptId));
  }, [params]);

  useEffect(() => {
    if (attemptId) {
      const savedResult = sessionStorage.getItem(`result_${attemptId}`);
      const timer = setTimeout(() => {
        if (savedResult) {
          setResult(JSON.parse(savedResult));
        }
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading results...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
        <div className="col-12 col-md-8 col-lg-6 animate-slide-up text-center">
          <div className="glass-card p-5 border-danger border-opacity-15">
            <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle mb-4" style={{ width: '72px', height: '72px' }}>
              <i className="bi bi-x-octagon-fill fs-1"></i>
            </div>
            <h3 className="fw-bold mb-2">Scorecard Missing</h3>
            <p className="text-muted small mb-4">The results could not be located. You may have reloaded the page or accessed this URL directly.</p>
            <button className="btn btn-outline-secondary btn-sm rounded-pill px-4" onClick={() => router.push('/')}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { candidateName, assessmentTitle, score, totalQuestions, percentage, passed, passingScore } = result;

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 animate-slide-up">
          <div className="glass-card p-5 text-center">
            
            {/* Visual celebration / status icon */}
            <div className="mb-4">
              {passed ? (
                <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle animate-pulse" style={{ width: '96px', height: '96px' }}>
                  <i className="bi bi-patch-check fs-1" style={{ fontSize: '3rem !important' }}></i>
                </div>
              ) : (
                <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 text-warning rounded-circle" style={{ width: '96px', height: '96px' }}>
                  <i className="bi bi-send-check fs-1" style={{ fontSize: '3rem !important' }}></i>
                </div>
              )}
            </div>

            <h2 className="fw-bold text-main mb-1">Assessment Submitted</h2>
            <p className="text-muted small">Thank you for taking the time to complete the evaluation, {candidateName}.</p>

            {/* Score Overview Board */}
            <div className="my-5 p-4 bg-light bg-opacity-10 rounded-4 border border-white border-opacity-10">
              <span className="d-block text-muted small fw-semibold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.7rem' }}>
                {assessmentTitle}
              </span>
              
              <div className="row g-3 align-items-center py-2">
                <div className="col-6 border-end border-white border-opacity-10">
                  <span className="small text-muted d-block mb-1">Total Score</span>
                  <h3 className="fw-bold text-main mb-0">{score}/{totalQuestions}</h3>
                </div>
                <div className="col-6">
                  <span className="small text-muted d-block mb-1">Grade</span>
                  <h3 className={`fw-bold mb-0 ${passed ? 'text-success' : 'text-danger'}`}>{percentage}%</h3>
                </div>
              </div>
            </div>

            {/* Status explanation */}
            <div className="mb-5 px-3">
              {passed ? (
                <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success p-3 rounded-3 small">
                  <h6 className="fw-bold mb-1"><i className="bi bi-check-circle-fill me-2"></i>Assessment Passed!</h6>
                  <span>Congratulations, you have exceeded the passing threshold of {passingScore}%. Our recruitment team will review your application and contact you shortly.</span>
                </div>
              ) : (
                <div className="alert alert-secondary border-0 bg-light bg-opacity-10 text-muted p-3 rounded-3 small text-start">
                  <h6 className="fw-bold mb-1 text-main"><i className="bi bi-info-circle-fill me-2"></i>Grading Information</h6>
                  <span>Your submission has been logged and graded. The recruitment coordinators will review your score and experience profile as part of the overall application filter.</span>
                </div>
              )}
            </div>

            <button className="btn btn-outline-secondary rounded-pill px-5 fw-semibold btn-sm" onClick={() => router.push('/')}>
              Finish and Exit
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
