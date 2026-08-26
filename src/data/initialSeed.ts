import { Subject, Mistake, Exam, CalendarEvent, RecurringPattern, GeminiInsight } from '../types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-physics',
    name: 'Physics',
    code: 'PHY',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    chapters: [],
  },
  {
    id: 'subj-chemistry',
    name: 'Chemistry',
    code: 'CHEM',
    color: '#10B981',
    createdAt: new Date().toISOString(),
    chapters: [],
  },
  {
    id: 'subj-mathematics',
    name: 'Mathematics',
    code: 'MATH',
    color: '#8B5CF6',
    createdAt: new Date().toISOString(),
    chapters: [],
  },
];

// Default empty arrays for user-recorded data
export const INITIAL_MISTAKES: Mistake[] = [];
export const INITIAL_EXAMS: Exam[] = [];
export const INITIAL_RECURRING_PATTERNS: RecurringPattern[] = [];
export const INITIAL_INSIGHTS: GeminiInsight[] = [];
export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [];
