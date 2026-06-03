'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Assessment } from '../../../utils/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CandidateLandingPage({ params }: PageProps) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Omit<Assessment, 'questions'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    experienceYears: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => setAssessmentId(p.id));
  }, [params]);

  useEffect(() => {
    if (assessmentId) {
      api.assessments.getPublic(assessmentId)
        .then((data) => {
          setAssessment(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Assessment not found or is currently inactive.');
          setLoading(false);
        });
    }
  }, [assessmentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.name === 'experienceYears' ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { fullName, email, phone, city, experienceYears } = formData;
    if (!fullName || !email || !phone || !city) {
      setError('Please fill in all details.');
      return;
    }

    if (!assessmentId) return;

    setSubmitting(true);
    try {
      const payload = {
        assessmentId,
        fullName,
        email,
        phone,
        city,
        experienceYears: Number(experienceYears),
      };

      const response = await api.attempts.start(payload);

      // Store attempt questions and details temporarily in localStorage for stability
      localStorage.setItem(`attempt_data_${response.attemptId}`, JSON.stringify(response));

      // Redirect candidate to active exam workspace
      router.push(`/assessments/attempt/${response.attemptId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start assessment. Try again.';
      setError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading assessment details...</span>
          </div>
          <p className="text-muted small">Loading assessment environment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
        <div className="col-12 col-md-8 col-lg-6 animate-slide-up text-center">
          <div className="glass-card p-5 border-danger border-opacity-15">
            <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle mb-4" style={{ width: '72px', height: '72px' }}>
              <i className="bi bi-x-octagon-fill fs-1"></i>
            </div>
            <h3 className="fw-bold mb-2">Access Denied</h3>
            <p className="text-muted small mb-4">{error || 'This assessment cannot be loaded. It might be inactive or deleted.'}</p>
            <button className="btn btn-outline-secondary btn-sm rounded-pill px-4" onClick={() => router.push('/')} suppressHydrationWarning>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center g-4 align-items-stretch">
        {/* Left Side: Assessment details & instructions */}
        <div className="col-12 col-lg-6 d-flex flex-column justify-content-between py-4 animate-slide-up">
          <div>
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-rocket-takeoff-fill fs-4 text-primary"></i>
              <span className="fw-bold text-main fs-5">Candidate Portal</span>
            </div>

            <h1 className="fw-bold text-main mb-3 fs-2">{assessment.title}</h1>
            <p className="text-muted mb-4">{assessment.description}</p>

            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6">
                <div className="d-flex align-items-center gap-3 p-3 bg-light bg-opacity-10 rounded-3 border border-white border-opacity-10">
                  <div className="bg-primary bg-opacity-10 text-primary rounded p-2.5 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-clock fs-5"></i>
                  </div>
                  <div>
                    <span className="d-block text-muted small" style={{ fontSize: '0.75rem' }}>Duration Limit</span>
                    <span className="fw-bold text-main">{assessment.duration} Minutes</span>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div className="d-flex align-items-center gap-3 p-3 bg-light bg-opacity-10 rounded-3 border border-white border-opacity-10">
                  <div className="bg-success bg-opacity-10 text-success rounded p-2.5 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-award fs-5"></i>
                  </div>
                  <div>
                    <span className="d-block text-muted small" style={{ fontSize: '0.75rem' }}>Passing Score</span>
                    <span className="fw-bold text-main">{assessment.passingScore}% Correct</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="alert alert-warning border-0 bg-warning bg-opacity-10 text-warning p-3 rounded-3 small" role="alert">
              <h6 className="alert-heading fw-bold mb-1"><i className="bi bi-exclamation-triangle-fill me-2"></i>Important Instructions:</h6>
              <ul className="mb-0 ps-3">
                <li>Once started, the countdown timer cannot be paused.</li>
                <li>Do not reload the browser page during the exam.</li>
                <li>When the timer expires, your answers will automatically submit.</li>
              </ul>
            </div>
          </div>

          <div className="text-muted small mt-4">
            Powered by MTF Developer
          </div>
        </div>

        {/* Right Side: Registration form */}
        <div className="col-12 col-lg-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card p-5 h-100 d-flex flex-column justify-content-center">
            <h4 className="fw-bold mb-1">Candidate Details</h4>
            <p className="text-muted small mb-4">Please fill in your correct details to register and begin the test</p>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 border-0 bg-danger bg-opacity-10 text-danger rounded-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div className="small">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted" htmlFor="candName">Full Name</label>
                <input
                  type="text"
                  id="candName"
                  name="fullName"
                  className="form-control"
                  placeholder="e.g., John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  suppressHydrationWarning
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted" htmlFor="candEmail">Email Address</label>
                <input
                  type="email"
                  id="candEmail"
                  name="email"
                  className="form-control"
                  placeholder="e.g., johndoe@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  suppressHydrationWarning
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted" htmlFor="candPhone">Phone Number</label>
                  <input
                    type="tel"
                    id="candPhone"
                    name="phone"
                    className="form-control"
                    placeholder="e.g., +201012345678"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    suppressHydrationWarning
                  />
                </div>

                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted" htmlFor="candCity">Current City</label>
                  <input
                    type="text"
                    id="candCity"
                    name="city"
                    className="form-control"
                    placeholder="e.g., Cairo"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted" htmlFor="candExp">Professional Experience (Years)</label>
                <input
                  type="number"
                  id="candExp"
                  name="experienceYears"
                  className="form-control"
                  min={0}
                  max={50}
                  value={formData.experienceYears}
                  onChange={handleChange}
                  required
                  suppressHydrationWarning
                />
              </div>

              <button
                type="submit"
                className="btn w-100 gradient-btn py-2.5 d-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
                suppressHydrationWarning
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Starting Assessment...
                  </>
                ) : (
                  <>
                    Begin Exam
                    <i className="bi bi-play-circle-fill"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
