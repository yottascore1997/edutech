export interface PYQExam {
  id: string;
  title: string;
  examType: string;
  year: number;
  subject?: string;
  paperType?: string;
  duration: number;
  totalMarks: number;
  _count?: { questions: number };
  myAttempts?: number;
}

export interface PYQQuestion {
  id: string;
  text: string;
  options: string[];
  marks: number;
  topic?: string;
  orderIndex: number;
}

export interface PYQResultQuestion extends PYQQuestion {
  correct: number;
  explanation?: string;
  userSelected?: number;
  isCorrect?: boolean;
}

export type Answers = Record<string, number>;

