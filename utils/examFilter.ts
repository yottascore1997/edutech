/**
 * Utility functions for filtering exams
 */

/**
 * Filters out expired exams based on endTime or startTime
 * @param exams - Array of exam objects
 * @returns Array of active (non-expired) exams
 */
export function filterActiveExams(exams: any[]): any[] {
  const now = new Date().getTime();
  
  return exams.filter(exam => {
    // Use endTime if available, otherwise fall back to startTime
    const endTime = new Date(exam.endTime || exam.startTime).getTime();
    return endTime > now;
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
  }
): any[] {
  let filtered = exams;
  
  // Filter out expired exams unless explicitly included
  if (!filters.includeExpired) {
    filtered = filterActiveExams(filtered);
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
