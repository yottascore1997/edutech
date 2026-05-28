/**
 * Utility functions for filtering exams
 */

export function hasUserJoinedExam(
  exam: any,
  userId?: string,
  joinedExamIds?: string[]
): boolean {
  const examIds = [exam?.id, exam?.examId, exam?._id].filter(Boolean).map(String);
  if (joinedExamIds?.length) {
    if (joinedExamIds.some((jid) => examIds.includes(String(jid)))) {
      return true;
    }
  }
  if (userId && exam?.participants) {
    return exam.participants.some(
      (p: any) =>
        String(p.userId) === String(userId) || String(p.user?.id) === String(userId)
    );
  }
  return false;
}

/**
 * Filters live exams based on API requirements:
 * - isLive: true
 * - endTime: null OR endTime > now (upcoming + ongoing)
 * - spotsLeft > 0 (except for joined users)
 * - Hide started exams for users who haven't joined
 */
export function filterActiveExams(
  exams: any[],
  userId?: string,
  joinedExamIds?: string[]
): any[] {
  const now = new Date().getTime();

  return exams.filter((exam) => {
    const joined = hasUserJoinedExam(exam, userId, joinedExamIds);

    // Joined users keep seeing their exam until it ends (not when it merely starts)
    if (joined) {
      if (exam.endTime) {
        const endTime = new Date(exam.endTime).getTime();
        if (endTime <= now) {
          return false;
        }
      }
      return true;
    }

    if (exam.isLive !== true && exam.isLive !== undefined) {
      return false;
    }

    if (exam.endTime) {
      const endTime = new Date(exam.endTime).getTime();
      if (endTime <= now) {
        return false;
      }
    }

    if (exam.startTime) {
      const startTime = new Date(exam.startTime).getTime();
      if (startTime <= now) {
        if (userId && exam.participants) {
          const hasJoined = exam.participants.some(
            (p: any) =>
              String(p.userId) === String(userId) || String(p.user?.id) === String(userId)
          );
          if (!hasJoined) {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    if (exam.spotsLeft !== undefined && exam.spotsLeft !== null) {
      if (exam.spotsLeft <= 0) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filters exams by category
 */
export function filterExamsByCategory(exams: any[], category: string): any[] {
  if (category === 'all') {
    return exams;
  }
  if (category === 'uncategorized') {
    return exams.filter((exam) => !exam.category || exam.category === null);
  }
  return exams.filter((exam) => exam.category === category);
}

/**
 * Filters exams by search query
 */
export function filterExamsBySearch(exams: any[], searchQuery: string): any[] {
  if (!searchQuery.trim()) {
    return exams;
  }

  const query = searchQuery.toLowerCase();
  return exams.filter((exam) => {
    const examName = exam.name || exam.examName || exam.title || '';
    return examName.toLowerCase().includes(query);
  });
}

/**
 * Applies all filters to exams (active, category, search)
 */
export function applyExamFilters(
  exams: any[],
  filters: {
    category?: string;
    searchQuery?: string;
    includeExpired?: boolean;
    userId?: string;
    joinedExamIds?: string[];
  }
): any[] {
  let filtered = exams;

  if (!filters.includeExpired) {
    filtered = filterActiveExams(filtered, filters.userId, filters.joinedExamIds);
  }

  if (filters.category) {
    filtered = filterExamsByCategory(filtered, filters.category);
  }

  if (filters.searchQuery) {
    filtered = filterExamsBySearch(filtered, filters.searchQuery);
  }

  return filtered;
}
