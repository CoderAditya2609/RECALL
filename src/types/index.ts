export type MistakeType =
  | 'Conceptual'
  | 'Calculation'
  | 'Formula'
  | 'Misread question'
  | 'Careless/Silly'
  | 'Approach selection'
  | 'Memory/Recall'
  | 'Multi-concept'
  | 'Time pressure'
  | 'Other';

export type AcademicSource =
  | 'Lecture'
  | 'DPP'
  | 'Homework'
  | 'Module'
  | 'Test'
  | 'PYQ'
  | 'Assignment'
  | 'AITS'
  | 'Custom';

export type MistakeStatus = 'Unresolved' | 'Needs Revision' | 'Still Weak' | 'Resolved';

export type SeverityLevel = 'Low' | 'Medium' | 'Critical';

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface AnnotationItem {
  id: string;
  type: 'pen' | 'highlighter' | 'text' | 'arrow' | 'circle' | 'rectangle' | 'sticky';
  points?: AnnotationPoint[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  opacity?: number;
}

export interface VoiceMemo {
  id: string;
  audioUrl?: string; // base64 or blob URL
  durationSeconds: number;
  createdAt: string;
  transcript?: string;
  summary?: string;
}

export interface Mistake {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  chapter: string;
  topic: string;
  source: AcademicSource;
  sourceDetails?: string; // e.g. "Lecture 03", "DPP-12", "PYQ 2023"
  questionNumber?: string; // e.g. "Q5"
  questionText?: string;
  questionImage?: string; // data URL / image URL
  annotations: AnnotationItem[];
  
  // Written analysis personal academic notes
  whatWentWrong: string; // What did I do wrong?
  correctApproach: string; // What is the correct approach?
  whyMadeMistake: string; // Why did I make this mistake?
  takeaway: string; // My takeaway
  
  mistakeType: MistakeType;
  severity: SeverityLevel;
  status: MistakeStatus;
  
  voiceMemo?: VoiceMemo;
  
  occurrencesCount: number; // Alert triggers at 3
  relatedPatternId?: string;
  examIds?: string[];
  
  geminiDiagnostic?: string;
  geminiRootCause?: string;
  geminiTakeawaySuggestion?: string;
  preventativeRule?: string;
  
  lastReviewedAt?: string;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicItem {
  id: string;
  name: string;
  description?: string;
  mistakeCount?: number;
  unresolvedCount?: number;
}

export interface ChapterItem {
  id: string;
  name: string;
  topics: TopicItem[];
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color: string;
  icon?: string;
  chapters: ChapterItem[];
  createdAt: string;
}

export interface Exam {
  id: string;
  name: string; // e.g. "AITS Advanced - Phase 1"
  date: string; // YYYY-MM-DD
  time?: string;
  targetScore?: number;
  totalMarks?: number;
  actualScore?: number;
  subjects: string[]; // Subject names
  syllabus: string[]; // Chapter/Topic names
  notes?: string;
  status: 'Upcoming' | 'Completed' | 'Missed';
  
  // Post-exam reflection
  postExamAnalysis?: {
    recordedAt: string;
    actualMarks: number;
    totalPossible: number;
    knownMistakesRepeated: number;
    newMistakesCount: number;
    observations: string;
    weakAreasIdentified: string[];
  };
  createdAt: string;
}

export interface RecurringPattern {
  id: string;
  patternTitle: string;
  subject: string;
  chapter: string;
  topic: string;
  occurrences: number;
  isRepeatedAlert: boolean; // >= 3 occurrences
  severity: 'Medium' | 'High' | 'Critical';
  rootCause: string;
  relatedMistakeIds: string[];
  firstOccurrenceDate?: string;
  latestOccurrenceDate?: string;
  prescribedAction: string;
  resolved?: boolean;
}

export interface GeminiInsight {
  id: string;
  type: 'diagnostic' | 'trend' | 'trap_warning' | 'scan_summary';
  title: string;
  content: string;
  subject?: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  detectedAt: string;
  recommendedAction?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: 'exam' | 'test' | 'revision_session' | 'academic_deadline' | 'review_reminder';
  subject?: string;
  relatedExamId?: string;
  relatedTopic?: string;
  relatedMistakeIds?: string[];
  completed?: boolean;
  notes?: string;
}

export interface ReviewSessionState {
  totalInQueue: number;
  currentIndex: number;
  rememberedCount: number;
  needsRevisionCount: number;
  stillWeakCount: number;
  resolvedCount: number;
  startTime: number;
}

// User Profile & People System
export interface AuthUser {
  uid: string;
  username: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

export interface AppAccount {
  id: string;
  username: string;
  displayName: string;
  password?: string;
  photoURL?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface PublicUserProfile {
  id: string; // User ID
  username: string; // unique handle e.g. "alex_phys", "aditya"
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserSettings {
  geminiApiKey?: string;
  theme?: 'dark' | 'light';
  dailyTargetMistakes?: number;
  studyGoal?: string;
}

// Chat System Types
export interface Conversation {
  id: string;
  participantIds: string[]; // [userA_id, userB_id]
  participantUsernames: Record<string, string>; // { [userId]: username }
  participantDisplayNames?: Record<string, string>;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

// Question Bank Types (Public Resource)
export interface QuestionBankDocument {
  id: string;
  uploaderId: string;
  uploaderUsername: string;
  title: string;
  subject: string;
  chapter?: string;
  fileType: 'image' | 'pdf';
  fileSize: number; // in bytes (<= 50MB)
  fileUrl: string; // cloud url or persistent storage base64
  totalPages?: number;
  tags: string[];
  description?: string;
  createdAt: string;
}

// User-Specific Annotation Layer on Question Bank
export interface DoodleStroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
}

export interface DocumentMark {
  id: string;
  type: 'star' | 'flag' | 'question' | 'check';
  x: number; // percentage coordinates 0-100%
  y: number;
  note?: string;
  page?: number;
}

export interface DocumentHighlight {
  id: string;
  page?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  note?: string;
}

export interface QuestionBankAnnotation {
  id: string;
  documentId: string;
  userId: string;
  strokes: DoodleStroke[];
  highlights: DocumentHighlight[];
  marks: DocumentMark[];
  personalNotes?: string;
  updatedAt: string;
}

