import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetchAuth } from '@/constants/api';

const storageKey = (userId: string) => `joined_live_exams_${userId}`;

export function normalizeExamId(examOrId: string | { id?: string; examId?: string; _id?: string }): string {
  if (typeof examOrId === 'string') return examOrId;
  return String(examOrId?.examId || examOrId?.id || examOrId?._id || '');
}

export function isExamCompletedStatus(status?: string): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'COMPLETED' || s === 'FINISHED';
}

export async function getStoredJoinedLiveExamIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

export async function addJoinedLiveExamId(userId: string, examId: string): Promise<void> {
  if (!userId || !examId) return;
  const ids = await getStoredJoinedLiveExamIds(userId);
  if (!ids.includes(examId)) {
    ids.push(examId);
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(ids));
  }
}

export async function removeJoinedLiveExamId(userId: string, examId: string): Promise<void> {
  if (!userId || !examId) return;
  const ids = (await getStoredJoinedLiveExamIds(userId)).filter((id) => id !== examId);
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(ids));
}

/** Merge my-exams API + local storage; drop completed; persist merged set. */
export async function syncJoinedLiveExamIds(token: string, userId: string): Promise<string[]> {
  const stored = await getStoredJoinedLiveExamIds(userId);
  const fromApi: string[] = [];

  try {
    const res = await apiFetchAuth('/student/my-exams', token);
    if (res.ok && Array.isArray(res.data)) {
      for (const e of res.data) {
        if (e.examType !== 'LIVE') continue;
        const id = normalizeExamId(e);
        if (!id) continue;
        if (isExamCompletedStatus(e.status)) {
          await removeJoinedLiveExamId(userId, id);
          continue;
        }
        fromApi.push(id);
      }
    }
  } catch (error) {
      }

  const merged = [...new Set([...stored, ...fromApi])];
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(merged));
  return merged;
}

/** Exams removed from /student/exams after start — fetch live exam details for joined IDs. */
export async function mergeJoinedLiveExamsIntoExamList(
  exams: any[],
  joinedIds: string[],
  token: string
): Promise<any[]> {
  if (!joinedIds.length) return exams;

  const byId = new Map<string, any>();
  for (const exam of exams) {
    const id = normalizeExamId(exam);
    if (id) byId.set(id, exam);
  }

  const missing = joinedIds.filter((id) => !byId.has(id));
  if (!missing.length) return exams;

  const fetched: any[] = [];
  for (const id of missing) {
    try {
      const res = await apiFetchAuth(`/student/live-exams/${id}`, token);
      if (res.ok && res.data) {
        fetched.push({
          ...res.data,
          id: res.data.id || id,
          isLive: res.data.isLive ?? true,
        });
      }
    } catch {
      // skip
    }
  }

  return fetched.length ? [...fetched, ...exams] : exams;
}

export type MyExamRow = {
  id: string;
  examId: string;
  examName: string;
  examType: 'LIVE' | 'PRACTICE';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  status: string;
  completedAt?: string;
};

/** Ensure joined in-progress live exams appear on My Exams after refresh. */
export async function enrichMyExamsWithJoinedLive(
  exams: MyExamRow[],
  joinedIds: string[],
  token: string,
  userId: string
): Promise<MyExamRow[]> {
  const existing = new Set(exams.map((e) => normalizeExamId(e)));
  const additions: MyExamRow[] = [];

  for (const examId of joinedIds) {
    if (existing.has(examId)) continue;

    try {
      const partRes = await apiFetchAuth(`/student/live-exams/${examId}/participant`, token);
      if (!partRes.ok) {
        await removeJoinedLiveExamId(userId, examId);
        continue;
      }

      const liveRes = await apiFetchAuth(`/student/live-exams/${examId}`, token);
      const live = liveRes.ok ? liveRes.data : null;
      const endMs = live?.endTime ? new Date(live.endTime).getTime() : null;
      if (endMs != null && endMs <= Date.now()) {
        continue;
      }

      additions.push({
        id: examId,
        examId,
        examName: live?.title || live?.name || live?.examName || 'Live Exam',
        examType: 'LIVE',
        score: 0,
        totalQuestions: live?.totalQuestions ?? live?.questionCount ?? 0,
        correctAnswers: 0,
        timeTaken: 0,
        status: 'JOINED',
      });
    } catch {
      // keep stored id for next refresh
    }
  }

  return additions.length ? [...additions, ...exams] : exams;
}
