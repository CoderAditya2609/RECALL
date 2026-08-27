import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Subject,
  Mistake,
  Exam,
  RecurringPattern,
  GeminiInsight,
  CalendarEvent,
  MistakeStatus,
} from '../types';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_SUBJECTS,
  INITIAL_MISTAKES,
  INITIAL_EXAMS,
  INITIAL_RECURRING_PATTERNS,
  INITIAL_INSIGHTS,
  INITIAL_CALENDAR_EVENTS,
} from '../data/initialSeed';

interface AcademicContextType {
  subjects: Subject[];
  mistakes: Mistake[];
  exams: Exam[];
  recurringPatterns: RecurringPattern[];
  insights: GeminiInsight[];
  calendarEvents: CalendarEvent[];
  isScanning: boolean;
  scanProgress: string | null;
  
  // Mistake Actions
  addMistake: (mistake: Omit<Mistake, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMistake: (id: string, updates: Partial<Mistake>) => Promise<void>;
  deleteMistake: (id: string) => Promise<void>;
  deleteMultipleMistakes: (ids: string[]) => Promise<void>;
  markMistakeStatus: (id: string, status: MistakeStatus) => Promise<void>;
  
  // Subject & Taxonomy Actions
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Promise<string>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addChapterToSubject: (subjectId: string, chapterName: string) => Promise<void>;
  addChaptersBatchToSubject: (subjectId: string, chapterNames: string[]) => Promise<void>;
  updateChapterInSubject: (subjectId: string, chapterId: string, newName: string) => Promise<void>;
  deleteChapterFromSubject: (subjectId: string, chapterId: string) => Promise<void>;
  addTopicToChapter: (subjectId: string, chapterId: string, topicName: string) => Promise<void>;
  deleteTopicFromChapter: (subjectId: string, chapterId: string, topicId: string) => Promise<void>;
  
  // Exam Actions
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Promise<string>;
  updateExam: (id: string, updates: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  savePostExamAnalysis: (examId: string, analysis: Exam['postExamAnalysis']) => Promise<void>;
  
  // Calendar Actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<string>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  
  // Gemini Intelligence
  scanMistakesWithGemini: () => Promise<void>;
  analyzeMistakeWithGemini: (mistake: Partial<Mistake>) => Promise<any>;
  getExamPrepBriefWithGemini: (exam: Exam) => Promise<any>;
  
  // Pattern Actions
  resolvePattern: (patternId: string) => Promise<void>;
  
  // Reset / Clearing Actions
  resetToSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userSettings } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [mistakes, setMistakes] = useState<Mistake[]>(INITIAL_MISTAKES);
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>(INITIAL_RECURRING_PATTERNS);
  const [insights, setInsights] = useState<GeminiInsight[]>(INITIAL_INSIGHTS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string | null>(null);

  // Sync with Firestore if authenticated
  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;
    const metaDoc = doc(db, `users/${userId}/meta/init`);
    const subjectsCol = collection(db, `users/${userId}/subjects`);
    const mistakesCol = collection(db, `users/${userId}/mistakes`);
    const examsCol = collection(db, `users/${userId}/exams`);
    const insightsCol = collection(db, `users/${userId}/insights`);
    const patternsCol = collection(db, `users/${userId}/recurringPatterns`);
    const calendarCol = collection(db, `users/${userId}/calendarEvents`);

    // Check if user has initialized data, if not seed it in Firestore
    const initFirestoreUser = async () => {
      try {
        const metaSnap = await getDoc(metaDoc);
        if (!metaSnap.exists()) {
          // Check for legacy localStorage migration data
          let localMistakes: Mistake[] = [];
          try {
            const stored = localStorage.getItem('recall_mistakes') || localStorage.getItem('academic_mistakes');
            if (stored) {
              localMistakes = JSON.parse(stored);
            }
          } catch {}

          const batch = writeBatch(db);
          INITIAL_SUBJECTS.forEach((s) => {
            batch.set(doc(subjectsCol, s.id), s);
          });

          const initialMistakesToSeed = localMistakes.length > 0 ? localMistakes : INITIAL_MISTAKES;
          initialMistakesToSeed.forEach((m) => {
            batch.set(doc(mistakesCol, m.id), { ...m, userId });
          });
          INITIAL_EXAMS.forEach((e) => {
            batch.set(doc(examsCol, e.id), e);
          });
          INITIAL_INSIGHTS.forEach((i) => {
            batch.set(doc(insightsCol, i.id), i);
          });
          INITIAL_RECURRING_PATTERNS.forEach((p) => {
            batch.set(doc(patternsCol, p.id), p);
          });
          INITIAL_CALENDAR_EVENTS.forEach((c) => {
            batch.set(doc(calendarCol, c.id), c);
          });
          batch.set(metaDoc, { initialized: true, seededAt: new Date().toISOString() });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Firestore initial check notice:', err);
      }
    };

    initFirestoreUser();

    // Listeners
    const unsubSubjects = onSnapshot(subjectsCol, (snap) => {
      if (!snap.empty) {
        setSubjects(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Subject)));
      }
    }, (err) => console.warn('Subjects listener notice:', err));

    const unsubMistakes = onSnapshot(mistakesCol, (snap) => {
      const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Mistake));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMistakes(items);
    }, (err) => console.warn('Mistakes listener notice:', err));

    const unsubExams = onSnapshot(examsCol, (snap) => {
      setExams(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Exam)));
    }, (err) => console.warn('Exams listener notice:', err));

    const unsubInsights = onSnapshot(insightsCol, (snap) => {
      setInsights(snap.docs.map((d) => ({ ...d.data(), id: d.id } as GeminiInsight)));
    }, (err) => console.warn('Insights listener notice:', err));

    const unsubPatterns = onSnapshot(patternsCol, (snap) => {
      setRecurringPatterns(snap.docs.map((d) => ({ ...d.data(), id: d.id } as RecurringPattern)));
    }, (err) => console.warn('Patterns listener notice:', err));

    const unsubCalendar = onSnapshot(calendarCol, (snap) => {
      setCalendarEvents(snap.docs.map((d) => ({ ...d.data(), id: d.id } as CalendarEvent)));
    }, (err) => console.warn('Calendar listener notice:', err));

    return () => {
      unsubSubjects();
      unsubMistakes();
      unsubExams();
      unsubInsights();
      unsubPatterns();
      unsubCalendar();
    };
  }, [user]);

  // Recalculate 3x repeated occurrences whenever mistakes change
  const autoDetect3xAlerts = (currentMistakes: Mistake[]): RecurringPattern[] => {
    const topicMap = new Map<string, Mistake[]>();
    currentMistakes.forEach((m) => {
      const key = `${m.subjectName}::${m.chapter}::${m.topic}`;
      const existing = topicMap.get(key) || [];
      existing.push(m);
      topicMap.set(key, existing);
    });

    const patterns: RecurringPattern[] = [];
    topicMap.forEach((mistakeList, key) => {
      const [subject, chapter, topic] = key.split('::');
      const totalOccurrences = mistakeList.reduce((acc, m) => acc + (m.occurrencesCount || 1), 0);
      if (totalOccurrences >= 2 || mistakeList.length >= 2) {
        const sorted = [...mistakeList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        patterns.push({
          id: `pat-${topic.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`,
          patternTitle: `${topic} Conceptual Vulnerability`,
          subject,
          chapter,
          topic,
          occurrences: totalOccurrences,
          isRepeatedAlert: totalOccurrences >= 3 || mistakeList.length >= 3,
          severity: (totalOccurrences >= 3 || mistakeList.length >= 3) ? 'Critical' : 'High',
          rootCause: `Detected ${totalOccurrences} error events logged across ${mistakeList.length} distinct problem records.`,
          relatedMistakeIds: mistakeList.map((m) => m.id),
          firstOccurrenceDate: sorted[0]?.createdAt,
          latestOccurrenceDate: sorted[sorted.length - 1]?.createdAt,
          prescribedAction: `Revise fundamental constraints and definitions in ${topic} before next exam.`,
          resolved: mistakeList.every((m) => m.status === 'Resolved'),
        });
      }
    });
    return patterns;
  };

  // MISTAKE ACTIONS
  const addMistake = async (mistakeData: Omit<Mistake, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `mistake-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newMistake: Mistake = {
      ...mistakeData,
      id,
      userId: user?.uid || 'guest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      occurrencesCount: mistakeData.occurrencesCount || 1,
    };

    const updatedList = [newMistake, ...mistakes];
    setMistakes(updatedList);

    // Update patterns
    const newPatterns = autoDetect3xAlerts(updatedList);
    setRecurringPatterns(newPatterns);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/mistakes`, id), newMistake);
      } catch (err) {
        console.warn('Firestore write mistake notice:', err);
      }
    }
    return id;
  };

  const updateMistake = async (id: string, updates: Partial<Mistake>) => {
    const updatedList = mistakes.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m));
    setMistakes(updatedList);

    const newPatterns = autoDetect3xAlerts(updatedList);
    setRecurringPatterns(newPatterns);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/mistakes`, id), { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore update mistake notice:', err);
      }
    }
  };

  const deleteMistake = async (id: string) => {
    const updatedList = mistakes.filter((m) => m.id !== id);
    setMistakes(updatedList);
    const newPatterns = autoDetect3xAlerts(updatedList);
    setRecurringPatterns(newPatterns);

    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/mistakes`, id));
      } catch (err) {
        console.warn('Firestore delete mistake notice:', err);
      }
    }
  };

  const deleteMultipleMistakes = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const updatedList = mistakes.filter((m) => !idSet.has(m.id));
    setMistakes(updatedList);
    const newPatterns = autoDetect3xAlerts(updatedList);
    setRecurringPatterns(newPatterns);

    if (user) {
      try {
        const batch = writeBatch(db);
        ids.forEach((id) => {
          batch.delete(doc(db, `users/${user.uid}/mistakes`, id));
        });
        await batch.commit();
      } catch (err) {
        console.warn('Firestore batch delete mistake notice:', err);
      }
    }
  };

  const markMistakeStatus = async (id: string, status: MistakeStatus) => {
    await updateMistake(id, { status, lastReviewedAt: new Date().toISOString() });
  };

  // SUBJECT & TAXONOMY ACTIONS
  const addSubject = async (subjectData: Omit<Subject, 'id' | 'createdAt'>): Promise<string> => {
    const id = `subj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newSubject: Subject = {
      ...subjectData,
      id,
      createdAt: new Date().toISOString(),
    };
    const updated = [...subjects, newSubject];
    setSubjects(updated);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/subjects`, id), newSubject);
      } catch (err) {
        console.warn('Firestore add subject notice:', err);
      }
    }
    return id;
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const updated = subjects.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSubjects(updated);

    if (user) {
      try {
        const fullSubject = updated.find((s) => s.id === id);
        if (fullSubject) {
          await setDoc(doc(db, `users/${user.uid}/subjects`, id), fullSubject);
        }
      } catch (err) {
        console.warn('Firestore update subject notice:', err);
      }
    }
  };

  const deleteSubject = async (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);

    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/subjects`, id));
      } catch (err) {
        console.warn('Firestore delete subject notice:', err);
      }
    }
  };

  const addChapterToSubject = async (subjectId: string, chapterName: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject || !chapterName.trim()) return;

    const newChapter = {
      id: `chap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: chapterName.trim(),
      topics: [],
    };
    const updatedChapters = [...subject.chapters, newChapter];
    await updateSubject(subjectId, { chapters: updatedChapters });
  };

  const addChaptersBatchToSubject = async (subjectId: string, chapterNames: string[]) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject || !chapterNames || chapterNames.length === 0) return;

    const filtered = chapterNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (filtered.length === 0) return;

    const newChapters = filtered.map((name, index) => ({
      id: `chap-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      topics: [],
    }));

    const updatedChapters = [...subject.chapters, ...newChapters];
    await updateSubject(subjectId, { chapters: updatedChapters });
  };

  const updateChapterInSubject = async (subjectId: string, chapterId: string, newName: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject || !newName.trim()) return;

    const oldChapter = subject.chapters.find((c) => c.id === chapterId);
    const oldName = oldChapter?.name;

    const updatedChapters = subject.chapters.map((chap) => {
      if (chap.id === chapterId) {
        return { ...chap, name: newName.trim() };
      }
      return chap;
    });

    await updateSubject(subjectId, { chapters: updatedChapters });

    // Also update any mistakes referencing this chapter name if renamed
    if (oldName && oldName !== newName.trim()) {
      const affectedMistakes = mistakes.filter(
        (m) => m.subjectId === subjectId && m.chapter === oldName
      );
      for (const m of affectedMistakes) {
        await updateMistake(m.id, { chapter: newName.trim() });
      }
    }
  };

  const deleteChapterFromSubject = async (subjectId: string, chapterId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const updatedChapters = subject.chapters.filter((chap) => chap.id !== chapterId);
    await updateSubject(subjectId, { chapters: updatedChapters });
  };

  const addTopicToChapter = async (subjectId: string, chapterId: string, topicName: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject || !topicName.trim()) return;

    const updatedChapters = subject.chapters.map((chap) => {
      if (chap.id === chapterId) {
        return {
          ...chap,
          topics: [...chap.topics, { id: `top-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name: topicName.trim() }],
        };
      }
      return chap;
    });

    await updateSubject(subjectId, { chapters: updatedChapters });
  };

  const deleteTopicFromChapter = async (subjectId: string, chapterId: string, topicId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const updatedChapters = subject.chapters.map((chap) => {
      if (chap.id === chapterId) {
        return {
          ...chap,
          topics: chap.topics.filter((t) => t.id !== topicId),
        };
      }
      return chap;
    });

    await updateSubject(subjectId, { chapters: updatedChapters });
  };

  // EXAM ACTIONS
  const addExam = async (examData: Omit<Exam, 'id' | 'createdAt'>): Promise<string> => {
    const id = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newExam: Exam = {
      ...examData,
      id,
      createdAt: new Date().toISOString(),
    };
    const updated = [newExam, ...exams];
    setExams(updated);

    // Also auto-create a Calendar event for the exam
    const newCalEvent: CalendarEvent = {
      id: `cal-${id}`,
      title: newExam.name,
      date: newExam.date,
      type: 'exam',
      relatedExamId: id,
      completed: false,
      notes: newExam.notes,
    };
    const updatedCal = [...calendarEvents, newCalEvent];
    setCalendarEvents(updatedCal);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/exams`, id), newExam);
        await setDoc(doc(db, `users/${user.uid}/calendarEvents`, newCalEvent.id), newCalEvent);
      } catch (err) {
        console.warn('Firestore add exam notice:', err);
      }
    }
    return id;
  };

  const updateExam = async (id: string, updates: Partial<Exam>) => {
    const updated = exams.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setExams(updated);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/exams`, id), updates, { merge: true });
      } catch (err) {
        console.warn('Firestore update exam notice:', err);
      }
    }
  };

  const deleteExam = async (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);

    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/exams`, id));
      } catch (err) {
        console.warn('Firestore delete exam notice:', err);
      }
    }
  };

  const savePostExamAnalysis = async (examId: string, analysis: Exam['postExamAnalysis']) => {
    await updateExam(examId, { postExamAnalysis: analysis, status: 'Completed' });
  };

  // CALENDAR ACTIONS
  const addCalendarEvent = async (eventData: Omit<CalendarEvent, 'id'>): Promise<string> => {
    const id = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newEvent: CalendarEvent = {
      ...eventData,
      id,
    };
    const updated = [...calendarEvents, newEvent];
    setCalendarEvents(updated);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/calendarEvents`, id), newEvent);
      } catch (err) {
        console.warn('Firestore add calendar event notice:', err);
      }
    }
    return id;
  };

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const updated = calendarEvents.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCalendarEvents(updated);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/calendarEvents`, id), updates, { merge: true });
      } catch (err) {
        console.warn('Firestore update calendar notice:', err);
      }
    }
  };

  const deleteCalendarEvent = async (id: string) => {
    const updated = calendarEvents.filter((c) => c.id !== id);
    setCalendarEvents(updated);

    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/calendarEvents`, id));
      } catch (err) {
        console.warn('Firestore delete calendar notice:', err);
      }
    }
  };

  // GEMINI INTELLIGENCE SCAN
  const scanMistakesWithGemini = async () => {
    setIsScanning(true);
    setScanProgress('Analyzing academic taxonomy and recurrence patterns...');

    try {
      const response = await fetch('/api/gemini/scan-mistakes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userSettings?.geminiApiKey || '',
        },
        body: JSON.stringify({ mistakes, subjects, exams }),
      });

      if (!response.ok) {
        throw new Error('Failed to run Gemini scan');
      }

      const result = await response.json();
      setScanProgress('Synthesizing weakness diagnostics & 3× alerts...');

      if (result.recurringPatterns && Array.isArray(result.recurringPatterns)) {
        const formattedPatterns: RecurringPattern[] = result.recurringPatterns.map((p: any, idx: number) => ({
          id: `pat-ai-${Date.now()}-${idx}`,
          patternTitle: p.patternTitle || 'Recurring Concept Weakness',
          subject: p.subject || 'General',
          chapter: p.chapter || 'General',
          topic: p.topic || 'General',
          occurrences: p.occurrences || 3,
          isRepeatedAlert: p.occurrences >= 3 || p.isRepeatedAlert,
          severity: p.severity || (p.occurrences >= 3 ? 'Critical' : 'High'),
          rootCause: p.rootCause || 'Recurring misconception identified by Gemini analysis.',
          relatedMistakeIds: p.relatedMistakeIds || [],
          prescribedAction: p.prescribedAction || 'Targeted active recall revision required.',
          firstOccurrenceDate: new Date(Date.now() - 5 * 86400000).toISOString(),
          latestOccurrenceDate: new Date().toISOString(),
        }));
        setRecurringPatterns(formattedPatterns);
      }

      if (result.insights && Array.isArray(result.insights)) {
        const newInsights: GeminiInsight[] = result.insights.map((ins: any, idx: number) => ({
          id: `ins-ai-${Date.now()}-${idx}`,
          type: ins.type || 'diagnostic',
          title: ins.title || 'Diagnostic Observation',
          content: ins.content || '',
          subject: ins.subject || 'General',
          priority: ins.priority || 'High',
          detectedAt: new Date().toISOString(),
          recommendedAction: ins.recommendedAction || '',
        }));

        // Add summary insight if present
        if (result.summary) {
          newInsights.unshift({
            id: `ins-summary-${Date.now()}`,
            type: 'scan_summary',
            title: '✨ RECALL Intelligence Scan Summary',
            content: result.summary,
            subject: 'System Diagnostic',
            priority: result.overallHealth === 'Critical' ? 'Urgent' : 'High',
            detectedAt: new Date().toISOString(),
          });
        }
        setInsights(newInsights);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  const analyzeMistakeWithGemini = async (mistake: Partial<Mistake>) => {
    try {
      const response = await fetch('/api/gemini/analyze-mistake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userSettings?.geminiApiKey || '',
        },
        body: JSON.stringify({ mistake }),
      });
      return await response.json();
    } catch (err) {
      console.error('Single mistake analyze error:', err);
      return null;
    }
  };

  const getExamPrepBriefWithGemini = async (exam: Exam) => {
    try {
      const response = await fetch('/api/gemini/exam-prep-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userSettings?.geminiApiKey || '',
        },
        body: JSON.stringify({ exam, mistakes }),
      });
      return await response.json();
    } catch (err) {
      console.error('Exam prep brief error:', err);
      return null;
    }
  };

  const resolvePattern = async (patternId: string) => {
    const updated = recurringPatterns.map((p) => (p.id === patternId ? { ...p, resolved: true } : p));
    setRecurringPatterns(updated);
  };

  const resetToSampleData = async () => {
    setSubjects(INITIAL_SUBJECTS);
    setMistakes(INITIAL_MISTAKES);
    setExams(INITIAL_EXAMS);
    setRecurringPatterns(INITIAL_RECURRING_PATTERNS);
    setInsights(INITIAL_INSIGHTS);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
  };

  const clearAllData = async () => {
    setMistakes([]);
    setExams([]);
    setRecurringPatterns([]);
    setInsights([]);
    setCalendarEvents([]);

    if (user) {
      try {
        const userId = user.uid;
        const mistakesSnap = await getDocs(collection(db, `users/${userId}/mistakes`));
        const examsSnap = await getDocs(collection(db, `users/${userId}/exams`));
        const insightsSnap = await getDocs(collection(db, `users/${userId}/insights`));
        const patternsSnap = await getDocs(collection(db, `users/${userId}/recurringPatterns`));
        const calSnap = await getDocs(collection(db, `users/${userId}/calendarEvents`));

        const batch = writeBatch(db);
        mistakesSnap.forEach((d) => batch.delete(d.ref));
        examsSnap.forEach((d) => batch.delete(d.ref));
        insightsSnap.forEach((d) => batch.delete(d.ref));
        patternsSnap.forEach((d) => batch.delete(d.ref));
        calSnap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        console.warn('Firestore clear all data notice:', err);
      }
    }
  };

  return (
    <AcademicContext.Provider
      value={{
        subjects,
        mistakes,
        exams,
        recurringPatterns,
        insights,
        calendarEvents,
        isScanning,
        scanProgress,
        addMistake,
        updateMistake,
        deleteMistake,
        deleteMultipleMistakes,
        markMistakeStatus,
        addSubject,
        updateSubject,
        deleteSubject,
        addChapterToSubject,
        addChaptersBatchToSubject,
        updateChapterInSubject,
        deleteChapterFromSubject,
        addTopicToChapter,
        deleteTopicFromChapter,
        addExam,
        updateExam,
        deleteExam,
        savePostExamAnalysis,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        scanMistakesWithGemini,
        analyzeMistakeWithGemini,
        getExamPrepBriefWithGemini,
        resolvePattern,
        resetToSampleData,
        clearAllData,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
