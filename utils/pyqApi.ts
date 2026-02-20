import { apiFetchAuth } from '@/constants/api';
import { PYQExam, PYQQuestion, Answers } from '@/types/pyq';

export async function fetchPYQList(token: string, filters?: { examType?: string; year?: number }) {
  const qs: string[] = [];
  if (filters?.examType) qs.push(`examType=${encodeURIComponent(filters.examType)}`);
  if (filters?.year) qs.push(`year=${encodeURIComponent(String(filters.year))}`);
  const url = `/student/pyq${qs.length ? `?${qs.join('&')}` : ''}`;
  const res = await apiFetchAuth(url, token);
  return res.data as PYQExam[];
}

export async function fetchPYQDetail(token: string, examId: string) {
  const res = await apiFetchAuth(`/student/pyq/${examId}`, token);
  return res.data;
}

export async function startPYQAttempt(token: string, examId: string) {
  const res = await apiFetchAuth(`/student/pyq/${examId}/start`, token, { method: 'POST', body: {} });
  return res.data; // { attemptId, duration, totalQuestions }
}

export async function fetchPYQQuestions(token: string, examId: string, attemptId: string) {
  const res = await apiFetchAuth(`/student/pyq/${examId}/questions?attemptId=${encodeURIComponent(attemptId)}`, token);
  return res.data as PYQQuestion[];
}

export async function submitPYQAttempt(token: string, examId: string, attemptId: string, answers: Answers, timeTakenSeconds?: number) {
  const body: any = { attemptId, answers };
  if (typeof timeTakenSeconds === 'number') body.timeTakenSeconds = timeTakenSeconds;
  const res = await apiFetchAuth(`/student/pyq/${examId}/submit`, token, { method: 'POST', body });
  return res.data;
}

export async function fetchPYQResult(token: string, examId: string, attemptId: string) {
  const res = await apiFetchAuth(`/student/pyq/${examId}/result/${attemptId}`, token);
  return res.data;
}

export async function fetchPYQAnalysis(token: string) {
  const res = await apiFetchAuth('/student/pyq/analysis', token);
  return res.data;
}

