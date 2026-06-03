'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Question } from '../../../../utils/api';

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

interface SavedAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export default function ActiveExamPage({ params }: PageProps) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  
  // Exam metadata and questions
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [startedAt, setStartedAt] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Active state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 mins in seconds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Refs for tracking timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save answers to localStorage on modification
  const saveAnswersToStorage = (updatedAnswers: Record<string, SavedAnswer>) => {
    if (attemptId) {
      localStorage.setItem(`answers_${attemptId}`, JSON.stringify(updatedAnswers));
    }
  };

  const triggerAutoSubmit = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const payloadAnswers = Object.values(answers);
      const res = await api.attempts.submit(attemptId, { answers: payloadAnswers });
      
      // Clean up localStorage for this attempt
      localStorage.removeItem(`attempt_data_${attemptId}`);
      localStorage.removeItem(`answers_${attemptId}`);
      
      // Navigate to success scorecard screen
      sessionStorage.setItem(`result_${attemptId}`, JSON.stringify(res));
      router.push(`/assessments/attempt/${attemptId}/result`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Time expired! Your assessment was force-submitted but encountered an error: ' + message);
      router.push('/');
    }
  }, [attemptId, answers, router]);

  // Resolve params
  useEffect(() => {
    params.then((p) => setAttemptId(p.attemptId));
  }, [params]);

  // Load exam state
  useEffect(() => {
    if (!attemptId) return;

    const timer = setTimeout(() => {
      const savedDataStr = localStorage.getItem(`attempt_data_${attemptId}`);
      if (!savedDataStr) {
        setError('Exam session details could not be found. Please return to the registration page.');
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(savedDataStr);
        setExamTitle(parsed.assessment?.title || 'Assessment');
        setQuestions(parsed.questions || []);
        setStartedAt(parsed.startedAt);
        setDurationMinutes(parsed.assessment?.duration || 30);

        // Load saved answers if any
        const savedAnswersStr = localStorage.getItem(`answers_${attemptId}`);
        if (savedAnswersStr) {
          setAnswers(JSON.parse(savedAnswersStr));
        }

        setLoading(false);
      } catch {
        setError('Failed to parse assessment state.');
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [attemptId]);

  // Handle countdown timer
  useEffect(() => {
    if (loading || !startedAt || !attemptId || error) return;

    const calculateTimeLeft = () => {
      const startTime = new Date(startedAt).getTime();
      const endTime = startTime + durationMinutes * 60 * 1000;
      const remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Auto-submit when time reaches 0
        triggerAutoSubmit();
      }
    };

    calculateTimeLeft();
    timerRef.current = setInterval(calculateTimeLeft, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, startedAt, durationMinutes, attemptId, error, triggerAutoSubmit]);

  const handleSelectRadio = (questionId: string, optionId: string) => {
    const updated = {
      ...answers,
      [questionId]: {
        questionId,
        selectedOptionId: optionId,
      },
    };
    setAnswers(updated);
    saveAnswersToStorage(updated);
  };

  const handleSelectCheckbox = (questionId: string, optionId: string, checked: boolean) => {
    const existing = answers[questionId] || { questionId, selectedOptionIds: [] };
    const currentList = existing.selectedOptionIds || [];
    
    let updatedList: string[];
    if (checked) {
      updatedList = [...currentList, optionId];
    } else {
      updatedList = currentList.filter((id) => id !== optionId);
    }

    const updated = {
      ...answers,
      [questionId]: {
        questionId,
        selectedOptionIds: updatedList,
      },
    };
    setAnswers(updated);
    saveAnswersToStorage(updated);
  };

  const handleTextChange = (questionId: string, text: string) => {
    const updated = {
      ...answers,
      [questionId]: {
        questionId,
        textAnswer: text,
      },
    };
    setAnswers(updated);
    saveAnswersToStorage(updated);
  };

  // Check if a question is answered
  const isQuestionAnswered = (q: Question) => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
      return !!ans.selectedOptionId;
    }
    if (q.questionType === 'MULTIPLE_CORRECT') {
      return !!(ans.selectedOptionIds && ans.selectedOptionIds.length > 0);
    }
    if (q.questionType === 'TEXT') {
      return !!(ans.textAnswer && ans.textAnswer.trim().length > 0);
    }
    return false;
  };

  const handleManualSubmit = async () => {
    if (!attemptId) return;

    // Check for unanswered questions
    const unansweredCount = questions.filter((q) => !isQuestionAnswered(q)).length;
    let confirmMsg = 'Are you sure you want to submit your assessment?';
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setSubmitting(true);
    try {
      const payloadAnswers = Object.values(answers);
      const res = await api.attempts.submit(attemptId, { answers: payloadAnswers });
      
      // Clean up
      localStorage.removeItem(`attempt_data_${attemptId}`);
      localStorage.removeItem(`answers_${attemptId}`);
      
      // Store result in sessionStorage for safe transit
      sessionStorage.setItem(`result_${attemptId}`, JSON.stringify(res));
      router.push(`/assessments/attempt/${attemptId}/result`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit answers. Please try again.';
      setError(message);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading exam...</span>
          </div>
          <p className="text-muted small">Loading exam workspace...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
        <div className="col-12 col-md-8 col-lg-6 animate-slide-up text-center">
          <div className="glass-card p-5 border-danger border-opacity-15">
            <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle mb-4" style={{ width: '72px', height: '72px' }}>
              <i className="bi bi-shield-slash fs-1"></i>
            </div>
            <h3 className="fw-bold mb-2">Session Error</h3>
            <p className="text-muted small mb-4">{error || 'This exam session is invalid.'}</p>
            <button className="btn btn-outline-secondary btn-sm rounded-pill px-4" onClick={() => router.push('/')}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const activeAnswer = answers[currentQuestion.id] || {};

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column bg-opacity-10 py-4 px-lg-5">
      {/* Exam Header */}
      <header className="navbar glass-card border-0 p-3 mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold text-main mb-0">{examTitle}</h4>
          <span className="text-muted small">Question {currentIdx + 1} of {questions.length}</span>
        </div>

        {/* Live Timer */}
        <div className="d-flex align-items-center gap-3">
          <div className={`d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold text-white ${timeLeft < 180 ? 'bg-danger animate-pulse' : 'bg-primary'}`}>
            <i className="bi bi-clock-history"></i>
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button 
            className="btn btn-success fw-bold px-4 rounded-pill d-flex align-items-center gap-2"
            onClick={handleManualSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <>
                Submit Exam
                <i className="bi bi-check-lg"></i>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="row g-4 flex-grow-1 align-items-start">
        {/* Left Side: Navigation grid */}
        <div className="col-12 col-lg-3">
          <div className="glass-card p-4">
            <h6 className="fw-bold mb-3 text-muted">Questions Overview</h6>
            <div className="row row-cols-5 g-2 mb-4">
              {questions.map((q, idx) => {
                const isSelected = idx === currentIdx;
                const isAnswered = isQuestionAnswered(q);

                let btnClass = 'btn-outline-secondary border-opacity-25';
                if (isAnswered) btnClass = 'btn-success bg-opacity-10 text-success border-success border-opacity-20';
                if (isSelected) btnClass = 'btn-primary';

                return (
                  <div key={q.id} className="col">
                    <button
                      className={`btn w-100 p-2.5 rounded-3 fw-bold small ${btnClass}`}
                      onClick={() => setCurrentIdx(idx)}
                    >
                      {idx + 1}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-top border-white border-opacity-10 pt-3 text-muted small">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="bg-primary rounded-circle" style={{ width: '10px', height: '10px' }}></span>
                <span>Currently Viewing</span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="bg-success rounded-circle" style={{ width: '10px', height: '10px' }}></span>
                <span>Answered</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="border border-secondary rounded-circle bg-transparent" style={{ width: '10px', height: '10px' }}></span>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Pane: Active question details */}
        <div className="col-12 col-lg-9">
          <div className="glass-card p-5" style={{ minHeight: '400px' }}>
            <span className="badge bg-primary bg-opacity-10 text-primary border-0 px-2.5 py-1 rounded small mb-3">
              {currentQuestion.questionType.replace('_', ' ')}
            </span>
            
            <h3 className="fw-bold text-main mb-4">{currentQuestion.questionText}</h3>

            {/* Answer Options renderers */}
            <div className="mb-5 mt-4">
              {/* Radio buttons for SINGLE_CHOICE or TRUE_FALSE */}
              {(currentQuestion.questionType === 'MULTIPLE_CHOICE' || currentQuestion.questionType === 'TRUE_FALSE') && currentQuestion.options && (
                <div className="d-flex flex-column gap-3">
                  {currentQuestion.options.map((opt) => (
                    <label 
                      key={opt.id} 
                      className={`p-3 rounded-3 border d-flex align-items-center gap-3 cursor-pointer transition-all ${activeAnswer.selectedOptionId === opt.id ? 'bg-primary bg-opacity-5 border-primary text-primary fw-semibold' : 'border-black border-opacity-5'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQuestion.id}`}
                        checked={activeAnswer.selectedOptionId === opt.id}
                        onChange={() => handleSelectRadio(currentQuestion.id, opt.id)}
                        className="form-check-input mt-0"
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span>{opt.optionText}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Checkboxes for MULTIPLE_CORRECT */}
              {currentQuestion.questionType === 'MULTIPLE_CORRECT' && currentQuestion.options && (
                <div className="d-flex flex-column gap-3">
                  {currentQuestion.options.map((opt) => {
                    const isChecked = activeAnswer.selectedOptionIds?.includes(opt.id) || false;
                    return (
                      <label 
                        key={opt.id} 
                        className={`p-3 rounded-3 border d-flex align-items-center gap-3 cursor-pointer transition-all ${isChecked ? 'bg-primary bg-opacity-5 border-primary text-primary fw-semibold' : 'border-black border-opacity-5'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectCheckbox(currentQuestion.id, opt.id, e.target.checked)}
                          className="form-check-input mt-0"
                          style={{ width: '20px', height: '20px' }}
                        />
                        <span>{opt.optionText}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Text Area for TEXT written response */}
              {currentQuestion.questionType === 'TEXT' && (
                <div>
                  <textarea
                    className="form-control font-monospace p-3"
                    rows={8}
                    placeholder="Write your answer or code snippet here..."
                    value={activeAnswer.textAnswer || ''}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                  />
                  <div className="text-muted small mt-2">Answers are auto-saved to avoid progress loss.</div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="d-flex justify-content-between align-items-center border-top border-white border-opacity-10 pt-4">
              <button
                className="btn btn-outline-secondary px-4 rounded-3 d-flex align-items-center gap-2"
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
              >
                <i className="bi bi-arrow-left"></i> Previous
              </button>
              
              {currentIdx < questions.length - 1 ? (
                <button
                  className="btn btn-primary px-4 rounded-3 d-flex align-items-center gap-2"
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                >
                  Next <i className="bi bi-arrow-right"></i>
                </button>
              ) : (
                <button
                  className="btn gradient-btn px-4 rounded-3 d-flex align-items-center gap-2 animate-pulse"
                  onClick={handleManualSubmit}
                  disabled={submitting}
                >
                  Submit Exam <i className="bi bi-check-circle"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
