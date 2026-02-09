/**
 * Utility functions for filtering exams
 */

/**
 * Filters live exams based on API requirements:
 * - isLive: true
 * - endTime: null OR endTime > now (upcoming + ongoing)
 * - spotsLeft > 0
 * - User hasn't joined (optional - can be checked separately)
 * @param exams - Array of exam objects
 * @param userId - Optional user ID to check if user has joined
 * @returns Array of active live exams
 */
export function filterActiveExams(
  exams: any[],
  userId?: string,
  joinedExamIds?: string[]
): any[] {
  const now = new Date().getTime();
  
  return exams.filter(exam => {
    // 1. Check isLive: true
    if (exam.isLive !== true && exam.isLive !== undefined) {
      return false;
    }
    
    // 2. Check endTime: null OR endTime > now
    if (exam.endTime) {
      const endTime = new Date(exam.endTime).getTime();
      if (endTime <= now) {
        return false; // Exam has ended
      }
    }
    // If endTime is null, that's fine (ongoing exam)

    // 2b. Hide started exams for users who haven't joined
    if (exam.startTime) {
      const startTime = new Date(exam.startTime).getTime();
      if (startTime <= now) {
        if (joinedExamIds && joinedExamIds.includes(exam.id)) {
          return true; // Joined exam should remain visible
        }
        if (userId && exam.participants) {
          const hasJoined = exam.participants.some((p: any) => 
            p.userId === userId || p.user?.id === userId || p.userId === userId
          );
          if (!hasJoined) {
            return false; // Exam started and user did not join
          }
        } else {
          return false; // No user info; hide started exam
        }
      }
    }
    
    // 3. Check spotsLeft > 0
    if (exam.spotsLeft !== undefined && exam.spotsLeft !== null) {
      if (exam.spotsLeft <= 0) {
        return false; // No spots left
      }
    }
    
    // 4. Do not hide joined exams; joined users should always see their exam
    
    return true;
  });
}

/**
 * Filters exams by category
 * @param exams - Array of exam objects
 * @param category - Category to filter by ('all' for all categories)
 * @returns Filtered array of exams
 */
export function filterExamsByCategory(exams: any[], category: string): any[] {
  if (category === 'all') {
    return exams;
  } else if (category === 'uncategorized') {
    return exams.filter(exam => !exam.category || exam.category === null);
  } else {
    return exams.filter(exam => exam.category === category);
  }
}

/**
 * Filters exams by search query
 * @param exams - Array of exam objects
 * @param searchQuery - Search term
 * @returns Filtered array of exams
 */
export function filterExamsBySearch(exams: any[], searchQuery: string): any[] {
  if (!searchQuery.trim()) {
    return exams;
  }
  
  const query = searchQuery.toLowerCase();
  return exams.filter(exam => {
    const examName = exam.name || exam.examName || exam.title || '';
    return examName.toLowerCase().includes(query);
  });
}

/**
 * Applies all filters to exams (active, category, search)
 * @param exams - Array of exam objects
 * @param filters - Filter options
 * @returns Filtered array of exams
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
  
  // Filter out expired exams unless explicitly included
  if (!filters.includeExpired) {
    filtered = filterActiveExams(filtered, filters.userId, filters.joinedExamIds);
  }
  
  // Apply category filter
  if (filters.category) {
    filtered = filterExamsByCategory(filtered, filters.category);
  }
  
  // Apply search filter
  if (filters.searchQuery) {
    filtered = filterExamsBySearch(filtered, filters.searchQuery);
  }
  
  return filtered;
}
