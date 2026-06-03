import { cookies } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Option {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  assessmentId: string;
  questionText: string;
  questionType: string; // 'MULTIPLE_CHOICE' | 'MULTIPLE_CORRECT' | 'TRUE_FALSE' | 'TEXT'
  options?: Option[];
}

export interface Assessment {
  id: string;
  jobId: string;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  status: string;
  job?: {
    title: string;
  };
  questions?: Question[];
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  experienceYears: number;
}

export interface Attempt {
  id: string;
  candidateId: string;
  assessmentId: string;
  startedAt: string;
  submittedAt: string | null;
  score: number;
  percentage: number;
  candidate: Candidate;
  assessment: Assessment;
}

export interface DashboardStats {
  totalJobs: number;
  totalAssessments: number;
  totalCandidates: number;
  totalAttempts: number;
  completedAttempts: number;
  averagePercentage: number;
  passedCount: number;
  failedCount: number;
  latestAttempts: Array<{
    id: string;
    candidateName: string;
    candidateEmail: string;
    assessmentTitle: string;
    jobTitle: string;
    startedAt: string;
    submittedAt: string | null;
    score: number;
    percentage: number;
    passed: boolean | null;
  }>;
}

function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = cookies.get('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headersObj = getHeaders((options.headers as Record<string, string>) || {});
  
  const response = await fetch(url, {
    method,
    headers: headersObj,
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await response.text()) as unknown as T;
  }

  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

export const api = {
  auth: {
    login: (body: Record<string, unknown>) =>
      request<{ access_token: string; user: UserProfile }>('/auth/login', 'POST', body),
    register: (body: Record<string, unknown>) =>
      request<{ id: string; name: string; email: string }>('/auth/register', 'POST', body),
    me: () => request<UserProfile>('/auth/me', 'GET'),
  },
  jobs: {
    list: (status?: string) =>
      request<Job[]>(`/jobs${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<Job>(`/jobs/${id}`),
    create: (body: Record<string, unknown>) => request<Job>('/jobs', 'POST', body),
    update: (id: string, body: Record<string, unknown>) =>
      request<Job>(`/jobs/${id}`, 'PUT', body),
    delete: (id: string) => request<void>(`/jobs/${id}`, 'DELETE'),
  },
  assessments: {
    list: () => request<Assessment[]>('/assessments'),
    get: (id: string) => request<Assessment>(`/assessments/${id}`),
    getPublic: (id: string) =>
      request<Omit<Assessment, 'questions'>>(`/assessments/${id}/public`),
    create: (body: Record<string, unknown>) =>
      request<Assessment>('/assessments', 'POST', body),
    update: (id: string, body: Record<string, unknown>) =>
      request<Assessment>(`/assessments/${id}`, 'PUT', body),
    delete: (id: string) => request<void>(`/assessments/${id}`, 'DELETE'),
  },
  questions: {
    list: (assessmentId?: string) =>
      request<Question[]>(`/questions${assessmentId ? `?assessmentId=${assessmentId}` : ''}`),
    get: (id: string) => request<Question>(`/questions/${id}`),
    create: (body: Record<string, unknown>) =>
      request<Question>('/questions', 'POST', body),
    update: (id: string, body: Record<string, unknown>) =>
      request<Question>(`/questions/${id}`, 'PUT', body),
    delete: (id: string) => request<void>(`/questions/${id}`, 'DELETE'),
  },
  attempts: {
    start: (body: Record<string, unknown>) =>
      request<{ attemptId: string; assessmentTitle: string; duration: number; questions: Question[] }>(
        '/attempts/start',
        'POST',
        body
      ),
    submit: (id: string, body: Record<string, unknown>) =>
      request<{
        attemptId: string;
        candidateName: string;
        assessmentTitle: string;
        score: number;
        percentage: number;
        passed: boolean;
        passingScore: number;
      }>(`/attempts/${id}/submit`, 'POST', body),
    list: (params: { search?: string; jobId?: string; assessmentId?: string; status?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.jobId) query.append('jobId', params.jobId);
      if (params.assessmentId) query.append('assessmentId', params.assessmentId);
      if (params.status) query.append('status', params.status);
      return request<Attempt[]>(`/attempts?${query.toString()}`);
    },
    get: (id: string) => request<Attempt>(`/attempts/${id}`),
    exportCsvUrl: () => `${API_BASE_URL}/attempts/export`,
    exportCsv: async () => {
      const url = `${API_BASE_URL}/attempts/export`;
      const token = cookies.get('token');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to export CSV');
      return await response.text();
    },
  },
  dashboard: {
    stats: () => request<DashboardStats>('/dashboard/stats'),
  },
};
