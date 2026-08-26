import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Eye,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mistake } from '../../types';
import { useAcademic } from '../../context/AcademicContext';
import { AnnotationCanvas } from '../mistakes/AnnotationCanvas';

interface ReviewModeViewProps {
  initialMistakes?: Mistake[];
  onFinishReview?: () => void;
}

type ReviewFilterType =
  | 'ALL_UNRESOLVED'
  | 'REPEATED_3X'
  | 'TODAY'
  | 'PHYSICS'
  | 'CHEMISTRY'
  | 'MATHEMATICS'
  | 'RANDOM';

export const ReviewModeView: React.FC<ReviewModeViewProps> = ({
  initialMistakes,
  onFinishReview,
}) => {
  const { mistakes, markMistakeStatus } = useAcademic();

  const [activeFilter, setActiveFilter] = useState<ReviewFilterType>('ALL_UNRESOLVED');
  const [queue, setQueue] = useState<Mistake[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Session Statistics
  const [rememberedCount, setRememberedCount] = useState(0);
  const [needsRevisionCount, setNeedsRevisionCount] = useState(0);
  const [stillWeakCount, setStillWeakCount] = useState(0);

  // Build review queue based on active filter
  useEffect(() => {
    if (initialMistakes && initialMistakes.length > 0) {
      setQueue(initialMistakes);
      setCurrentIndex(0);
      setIsRevealed(false);
      setSessionCompleted(false);
      return;
    }

    let filtered: Mistake[] = [];
    switch (activeFilter) {
      case 'REPEATED_3X':
        filtered = mistakes.filter((m) => (m.occurrencesCount || 1) >= 3);
        break;
      case 'TODAY': {
        const todayStr = new Date().toISOString().split('T')[0];
        filtered = mistakes.filter((m) => m.createdAt.startsWith(todayStr));
        break;
      }
      case 'PHYSICS':
        filtered = mistakes.filter((m) => m.subjectName?.toLowerCase().includes('physics'));
        break;
      case 'CHEMISTRY':
        filtered = mistakes.filter((m) => m.subjectName?.toLowerCase().includes('chemistry'));
        break;
      case 'MATHEMATICS':
        filtered = mistakes.filter((m) => m.subjectName?.toLowerCase().includes('math'));
        break;
      case 'RANDOM':
        filtered = [...mistakes].sort(() => Math.random() - 0.5);
        break;
      case 'ALL_UNRESOLVED':
      default:
        filtered = mistakes.filter((m) => m.status !== 'Resolved');
        break;
    }

    // Default to full list if filter yielded empty
    if (filtered.length === 0 && mistakes.length > 0) {
      filtered = mistakes;
    }

    setQueue(filtered);
    setCurrentIndex(0);
    setIsRevealed(false);
    setSessionCompleted(false);
  }, [activeFilter, mistakes, initialMistakes]);

  const currentMistake = queue[currentIndex];

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleNextCard = async (evaluation: 'Remembered' | 'Needs Revision' | 'Still Weak') => {
    if (!currentMistake) return;

    if (evaluation === 'Remembered') {
      setRememberedCount((c) => c + 1);
      await markMistakeStatus(currentMistake.id, 'Resolved');
    } else if (evaluation === 'Needs Revision') {
      setNeedsRevisionCount((c) => c + 1);
      await markMistakeStatus(currentMistake.id, 'Needs Revision');
    } else {
      setStillWeakCount((c) => c + 1);
      await markMistakeStatus(currentMistake.id, 'Still Weak');
    }

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((idx) => idx + 1);
      setIsRevealed(false);
    } else {
      setSessionCompleted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setSessionCompleted(false);
    setRememberedCount(0);
    setNeedsRevisionCount(0);
    setStillWeakCount(0);
  };

  if (queue.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs transition-colors">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center mx-auto">
          <RotateCcw className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
          No Mistakes in Review Queue
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          All mistakes under the selected filter are resolved or no mistakes have been recorded yet.
        </p>
      </div>
    );
  }

  if (sessionCompleted) {
    return (
      <div className="p-8 max-w-xl mx-auto space-y-6 text-center animate-in fade-in zoom-in-95 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-xs">
          <Award className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">
            Review Session Finished
          </span>
          <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 mt-1 font-display tracking-tight uppercase">
            Active Recall Summary
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Strengthening academic memory through deliberate cognitive retrieval.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-center">
            <span className="text-2xl font-black font-display text-emerald-700 dark:text-emerald-400">{rememberedCount}</span>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono font-bold uppercase mt-0.5">Remembered</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black font-display text-amber-700 dark:text-amber-400">{needsRevisionCount}</span>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono font-bold uppercase mt-0.5">Needs Revision</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black font-display text-rose-700 dark:text-rose-400">{stillWeakCount}</span>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono font-bold uppercase mt-0.5">Still Weak</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleRestartSession}
            className="px-5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-colors font-mono"
          >
            REVIEW QUEUE AGAIN
          </button>
          {onFinishReview && (
            <button
              onClick={onFinishReview}
              className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold border border-zinc-300 dark:border-zinc-700 transition-colors font-mono"
            >
              BACK TO NOTEBOOK
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Filter Selection Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setActiveFilter('ALL_UNRESOLVED')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              activeFilter === 'ALL_UNRESOLVED'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            UNRESOLVED
          </button>
          <button
            onClick={() => setActiveFilter('REPEATED_3X')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              activeFilter === 'REPEATED_3X'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-700 dark:hover:text-rose-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            3× REPEATED
          </button>
          <button
            onClick={() => setActiveFilter('PHYSICS')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              activeFilter === 'PHYSICS'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            PHYSICS
          </button>
          <button
            onClick={() => setActiveFilter('CHEMISTRY')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              activeFilter === 'CHEMISTRY'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            CHEMISTRY
          </button>
          <button
            onClick={() => setActiveFilter('MATHEMATICS')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              activeFilter === 'MATHEMATICS'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            MATH
          </button>
          <button
            onClick={() => setActiveFilter('RANDOM')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
              activeFilter === 'RANDOM'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            SHUFFLE
          </button>
        </div>

        {/* Progress Counter */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400 shrink-0 font-bold">
          <span>CARD</span>
          <span className="text-zinc-950 dark:text-zinc-100 font-black">{currentIndex + 1}</span>
          <span>OF</span>
          <span>{queue.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
        />
      </div>

      {/* Active Recall Card Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[500px] transition-colors">
        {/* Card Top Academic Taxonomy Header */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
              {currentMistake?.subjectName}
            </span>
            <span className="text-xs text-zinc-800 dark:text-zinc-200 font-display font-bold">
              {currentMistake?.chapter} → {currentMistake?.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
              {currentMistake?.source} {currentMistake?.questionNumber}
            </span>
            {currentMistake?.occurrencesCount >= 3 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
                3× REPEATED
              </span>
            )}
          </div>
        </div>

        {/* Card Content Area */}
        <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
          {/* Question Presentation (FRONT) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Question Statement
              </span>
              <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                Type: {currentMistake?.mistakeType}
              </span>
            </div>

            {currentMistake?.questionText ? (
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-100 font-sans font-medium leading-relaxed">
                {currentMistake.questionText}
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">
                Question statement not typed. Review attached annotations / image below.
              </div>
            )}

            {/* If annotations or image exists */}
            {(currentMistake?.questionImage ||
              (currentMistake?.annotations && currentMistake.annotations.length > 0)) && (
              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2">
                <AnnotationCanvas
                  backgroundImage={currentMistake.questionImage}
                  annotations={currentMistake.annotations || []}
                  onChange={() => {}}
                  readOnly={true}
                />
              </div>
            )}
          </div>

          {/* BACK: Hidden until student actively recalls */}
          {!isRevealed ? (
            <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 space-y-3">
              <HelpCircle className="w-8 h-8 text-zinc-700 dark:text-zinc-300 mx-auto stroke-[2.2]" />
              <div>
                <h4 className="text-sm font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
                  Active Recall: Think First
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                  Try to mentally derive the correct approach and recall what trap caused this error.
                </p>
              </div>
              <button
                onClick={handleReveal}
                className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-all active:scale-[0.98] font-mono"
              >
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>REVEAL TAKEAWAY & SOLUTION</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Revealed Analysis & Takeaway</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* What went wrong */}
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1">
                    <span className="font-mono text-[10px] text-rose-800 dark:text-rose-400 font-extrabold uppercase block">
                      What went wrong:
                    </span>
                    <p className="text-rose-950 dark:text-rose-200 leading-relaxed font-sans font-medium">
                      {currentMistake?.whatWentWrong || 'No notes logged.'}
                    </p>
                  </div>

                  {/* Correct Approach */}
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1">
                    <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold uppercase block">
                      Correct Approach:
                    </span>
                    <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed font-sans font-medium">
                      {currentMistake?.correctApproach || 'No notes logged.'}
                    </p>
                  </div>
                </div>

                {/* Golden Takeaway */}
                {currentMistake?.takeaway && (
                  <div className="mt-3 p-4 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-white text-xs space-y-1 border border-zinc-800 dark:border-zinc-700">
                    <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase block">
                      Golden Takeaway:
                    </span>
                    <p className="text-zinc-100 font-semibold leading-relaxed font-sans">
                      {currentMistake.takeaway}
                    </p>
                  </div>
                )}

                {/* Gemini Diagnostic */}
                {currentMistake?.geminiDiagnostic && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 space-y-1">
                    <span className="font-mono text-[10px] text-zinc-800 dark:text-zinc-300 font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                      <span>Gemini Root Cause:</span>
                    </span>
                    <p className="text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                      {currentMistake.geminiDiagnostic}
                    </p>
                  </div>
                )}
              </div>

              {/* Self Evaluation Buttons */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 block text-center mb-2.5 uppercase">
                  How well did you actively recall this problem?
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleNextCard('Still Weak')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-2 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 transition-colors active:scale-95"
                  >
                    <span className="text-xs font-bold font-mono uppercase">Still Weak</span>
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium mt-0.5">
                      Failed to recall rule
                    </span>
                  </button>

                  <button
                    onClick={() => handleNextCard('Needs Revision')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-2 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 transition-colors active:scale-95"
                  >
                    <span className="text-xs font-bold font-mono uppercase">Needs Revision</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                      Recalled partially
                    </span>
                  </button>

                  <button
                    onClick={() => handleNextCard('Remembered')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-2 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 transition-colors active:scale-95"
                  >
                    <span className="text-xs font-bold font-mono uppercase">Remembered!</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                      Mastered & Resolved
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
