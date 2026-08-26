import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { QuestionBankDocument, QuestionBankAnnotation, DoodleStroke, DocumentHighlight, DocumentMark } from '../types';

interface QuestionBankContextType {
  documents: QuestionBankDocument[];
  loadingDocuments: boolean;
  activeDoc: QuestionBankDocument | null;
  activeAnnotation: QuestionBankAnnotation | null;
  isSavingAnnotation: boolean;
  setActiveDoc: (doc: QuestionBankDocument | null) => void;
  uploadDocument: (docData: Omit<QuestionBankDocument, 'id' | 'createdAt' | 'uploaderId' | 'uploaderUsername'>) => Promise<string>;
  deleteDocument: (docId: string) => Promise<void>;
  saveAnnotation: (docId: string, annotationData: {
    strokes: DoodleStroke[];
    highlights: DocumentHighlight[];
    marks: DocumentMark[];
    personalNotes?: string;
  }) => Promise<void>;
  loadUserAnnotation: (docId: string) => Promise<QuestionBankAnnotation | null>;
}

const SAMPLE_PUBLIC_DOCUMENTS: QuestionBankDocument[] = [
  {
    id: 'qb-doc-1',
    uploaderId: 'system-recall',
    uploaderUsername: 'recall_curator',
    title: 'Rotational Dynamics & Rolling Motion — 20 Advanced Diagnostic Problems',
    subject: 'Physics',
    chapter: 'Rotational Motion',
    fileType: 'image',
    fileSize: 1420000,
    fileUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
    tags: ['JEE Advanced', 'Rolling', 'Torque Conservation', 'High Yield'],
    description: 'Comprehensive high-level conceptual drill covering pure rolling, instantaneous center of rotation, and angular momentum conservation under external impulse.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'qb-doc-2',
    uploaderId: 'system-recall',
    uploaderUsername: 'recall_curator',
    title: 'Electrostatics & Gauss Law Boundary Traps Collection',
    subject: 'Physics',
    chapter: 'Electrostatics',
    fileType: 'image',
    fileSize: 2150000,
    fileUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80',
    tags: ['Gauss Law', 'Conductors', 'Dielectric Boundary', 'Tricky Traps'],
    description: 'Curated 15-question problem set on non-uniform charge densities, spherical shells earthing, and cavity field shielding.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'qb-doc-3',
    uploaderId: 'system-recall',
    uploaderUsername: 'recall_curator',
    title: 'Wave Optics & Polarisation Master Sheet (PYQ & AITS)',
    subject: 'Physics',
    chapter: 'Wave Optics',
    fileType: 'image',
    fileSize: 1890000,
    fileUrl: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=1600&q=80',
    tags: ['YDSE', 'Phase Change', 'Brewster Angle', 'Optical Path'],
    description: 'Standard and multi-slit interference problems with dielectric thin film insertions and Doppler effect in light.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export const QuestionBankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, publicProfile } = useAuth();
  const [documents, setDocuments] = useState<QuestionBankDocument[]>(SAMPLE_PUBLIC_DOCUMENTS);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [activeDoc, setActiveDoc] = useState<QuestionBankDocument | null>(null);
  const [activeAnnotation, setActiveAnnotation] = useState<QuestionBankAnnotation | null>(null);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);

  // Sync public documents from /publicQuestionBank
  useEffect(() => {
    const qbCol = collection(db, 'publicQuestionBank');
    const q = query(qbCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedDocs: QuestionBankDocument[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as QuestionBankDocument),
          id: docSnap.id,
        }));
        setDocuments(fetchedDocs);
      } else {
        // Seed default sample documents if cloud collection is empty
        seedInitialDocs();
      }
      setLoadingDocuments(false);
    }, (err) => {
      console.warn('Question bank listener notice (using local sample set):', err);
      setLoadingDocuments(false);
    });

    return () => unsubscribe();
  }, []);

  const seedInitialDocs = async () => {
    try {
      for (const sample of SAMPLE_PUBLIC_DOCUMENTS) {
        await setDoc(doc(db, 'publicQuestionBank', sample.id), sample);
      }
    } catch (err) {
      console.warn('Initial seeding question bank notice:', err);
    }
  };

  // Load user annotation when activeDoc changes
  useEffect(() => {
    if (!activeDoc) {
      setActiveAnnotation(null);
      return;
    }

    if (!user) {
      // Local fallback for guest
      setActiveAnnotation({
        id: `ann-${activeDoc.id}`,
        documentId: activeDoc.id,
        userId: 'guest',
        strokes: [],
        highlights: [],
        marks: [],
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const annDocRef = doc(db, `users/${user.uid}/qbAnnotations`, activeDoc.id);
    const unsub = onSnapshot(annDocRef, (snap) => {
      if (snap.exists()) {
        setActiveAnnotation(snap.data() as QuestionBankAnnotation);
      } else {
        setActiveAnnotation({
          id: `ann-${activeDoc.id}`,
          documentId: activeDoc.id,
          userId: user.uid,
          strokes: [],
          highlights: [],
          marks: [],
          updatedAt: new Date().toISOString(),
        });
      }
    }, (err) => console.warn('Annotation listener notice:', err));

    return () => unsub();
  }, [activeDoc, user]);

  const uploadDocument = async (
    docData: Omit<QuestionBankDocument, 'id' | 'createdAt' | 'uploaderId' | 'uploaderUsername'>
  ): Promise<string> => {
    const id = `qb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newDoc: QuestionBankDocument = {
      ...docData,
      id,
      uploaderId: user?.uid || 'guest',
      uploaderUsername: publicProfile?.username || 'anonymous_student',
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setDocuments((prev) => [newDoc, ...prev]);

    try {
      await setDoc(doc(db, 'publicQuestionBank', id), newDoc);
    } catch (err) {
      console.error('Failed to upload question bank doc to firestore:', err);
    }
    return id;
  };

  const deleteDocument = async (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    try {
      await deleteDoc(doc(db, 'publicQuestionBank', docId));
    } catch (err) {
      console.error('Failed to delete question bank doc:', err);
    }
  };

  const saveAnnotation = async (
    docId: string,
    annotationData: {
      strokes: DoodleStroke[];
      highlights: DocumentHighlight[];
      marks: DocumentMark[];
      personalNotes?: string;
    }
  ) => {
    if (!user) return;
    setIsSavingAnnotation(true);

    const fullAnnotation: QuestionBankAnnotation = {
      id: `ann-${docId}`,
      documentId: docId,
      userId: user.uid,
      strokes: annotationData.strokes,
      highlights: annotationData.highlights,
      marks: annotationData.marks,
      personalNotes: annotationData.personalNotes || '',
      updatedAt: new Date().toISOString(),
    };

    setActiveAnnotation(fullAnnotation);

    try {
      const annDocRef = doc(db, `users/${user.uid}/qbAnnotations`, docId);
      await setDoc(annDocRef, fullAnnotation, { merge: true });
    } catch (err) {
      console.warn('Error saving annotation to Firestore:', err);
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  const loadUserAnnotation = async (docId: string): Promise<QuestionBankAnnotation | null> => {
    if (!user) return null;
    try {
      const snap = await getDoc(doc(db, `users/${user.uid}/qbAnnotations`, docId));
      if (snap.exists()) {
        return snap.data() as QuestionBankAnnotation;
      }
    } catch (err) {
      console.warn('Error loading annotation:', err);
    }
    return null;
  };

  return (
    <QuestionBankContext.Provider
      value={{
        documents,
        loadingDocuments,
        activeDoc,
        activeAnnotation,
        isSavingAnnotation,
        setActiveDoc,
        uploadDocument,
        deleteDocument,
        saveAnnotation,
        loadUserAnnotation,
      }}
    >
      {children}
    </QuestionBankContext.Provider>
  );
};

export const useQuestionBank = () => {
  const context = useContext(QuestionBankContext);
  if (!context) {
    throw new Error('useQuestionBank must be used within a QuestionBankProvider');
  }
  return context;
};
