import React, { useState } from 'react';
import {
  X,
  Sparkles,
  RotateCcw,
  Loader2,
  FileText,
  Target,
} from 'lucide-react';
import { Exam, Mistake } from '../../types';
import { useAcademic } from '../../context/AcademicContext';

interface ExamDetailModalProps {
  exam: Exam | null;
  isOpen: boolean;
  onClose: () => void;
  onStartExamRevision: (mistakes: Mistake[]) => void;
  onOpenPostExamAnalysis: (exam: Exam) => void;
}

export const ExamDetailModal: React.FC<ExamDetailModalProps> = ({
  exam,
  isOpen,
  onClose,
  onStartExamRevision,
  onOpenPostExamAnalysis,
}) => {
  const { mistakes, getExamPrepBriefWithGemini } = useAcademic();
  const [prepBrief, setPrepBrief] = useState<any>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);

  if (!isOpen || !exam) return null;

  // Filter mistakes matching syllabus
  const syllabus = exam.syllabus || [];
  const relevantMistakes = mistakes.filter((m) =>
    syllabus.some(
      (s) =>
        (m.chapter && m.chapter.toLowerCase().includes(s.toLowerCase())) ||
        (m.topic && m.topic.toLowerCase().includes(s.toLowerCase())) ||
        (m.subjectName && m.subjectName.toLowerCase().includes(s.toLowerCase()))
    )
  );

  const repeatedInSyllabus = relevantMistakes.filter((m) => (m.occurrencesCount || 1) >= 3);
  const unresolvedInSyllabus = relevantMistakes.filter((m) => m.status === 'Unresolved');

  const handleGenerateBrief = async () => {
    setIsLoadingBrief(true);
    const brief = await getExamPrepBriefWithGemini(exam);
    if (brief) {
      setPrepBrief(brief);
    }
    setIsLoadingBrief(false);
  };

  const daysUntil = Math.ceil(
    (new Date(exam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-mono font-black text-sm">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">{exam.name}</h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-black uppercase ${
                    daysUntil > 0
                      ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {daysUntil > 0 ? `In ${daysUntil} Days` : 'Completed / Today'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold mt-0.5">
                Date: {exam.date} • Target: {exam.targetScore || 'N/A'}/{exam.totalMarks || 300}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Syllabus Tags */}
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs">
            <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-2">
              Exam Syllabus
            </span>
            <div className="flex flex-wrap gap-1.5">
              {exam.syllabus.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold"
                >
                  {s}
                </span>
              ))}
            </div>
            {exam.notes && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 font-medium">
                <strong className="text-zinc-950 dark:text-zinc-100 font-bold uppercase font-mono">Exam Strategy Note:</strong> {exam.notes}
              </p>
            )}
          </div>

          {/* Syllabus Mistake Landscape Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Syllabus Mistakes
              </span>
              <span className="text-2xl font-black font-display text-zinc-950 dark:text-zinc-50">
                {relevantMistakes.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Unresolved
              </span>
              <span className="text-2xl font-black font-display text-amber-700 dark:text-amber-400">
                {unresolvedInSyllabus.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-rose-600 dark:border-rose-700 shadow-2xs">
              <span className="text-xs font-mono font-black text-rose-700 dark:text-rose-400 uppercase block mb-1">
                🔴 3× Repeated Alerts
              </span>
              <span className="text-2xl font-black font-display text-rose-700 dark:text-rose-400">
                {repeatedInSyllabus.length}
              </span>
            </div>
          </div>

          {/* Gemini Exam Strategy Brief */}
          <div className="bg-zinc-950 dark:bg-zinc-950 text-white rounded-xl p-5 space-y-3 shadow-2xs border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Gemini Exam Preparation Brief</span>
              </span>
              <button
                disabled={isLoadingBrief}
                onClick={handleGenerateBrief}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold font-mono flex items-center gap-1 transition-all"
              >
                {isLoadingBrief ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>GENERATE BRIEF</span>
              </button>
            </div>

            {prepBrief ? (
              <div className="space-y-3 pt-2 text-xs">
                <p className="text-zinc-300 leading-relaxed font-sans font-medium">{prepBrief.title}</p>

                {prepBrief.criticalTraps && (
                  <div className="space-y-1.5">
                    <span className="font-mono text-xs text-rose-400 uppercase font-black">
                      Critical Pitfalls in Exam Syllabus:
                    </span>
                    {prepBrief.criticalTraps.map((t: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200"
                      >
                        <strong className="text-white block font-mono text-xs font-bold uppercase">
                          {t.topic}:
                        </strong>
                        <span className="text-zinc-300 font-medium">{t.warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {prepBrief.prioritizedChecklist && (
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-zinc-400 uppercase font-black">
                      Pre-Exam Revision Checklist:
                    </span>
                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pl-1 font-medium">
                      {prepBrief.prioritizedChecklist.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 font-medium">
                Click "GENERATE BRIEF" to ask Gemini to cross-reference your historical
                mistakes against this exam's syllabus and highlight dangerous test traps.
              </p>
            )}
          </div>

          {/* Post-Exam Reflection Status if recorded */}
          {exam.postExamAnalysis && (
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 shadow-2xs">
              <span className="text-xs font-mono font-bold text-zinc-950 dark:text-zinc-100 uppercase">
                Post-Exam Reflection Recorded:
              </span>
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 font-bold">
                <span>
                  Score: <strong className="text-zinc-950 dark:text-zinc-100">{exam.postExamAnalysis.actualMarks}</strong>
                  /{exam.postExamAnalysis.totalPossible}
                </span>
                <span>•</span>
                <span>
                  Known Weaknesses Repeated:{' '}
                  <strong className="text-rose-700 dark:text-rose-400">
                    {exam.postExamAnalysis.knownMistakesRepeated}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  New Mistakes Logged:{' '}
                  <strong className="text-zinc-950 dark:text-zinc-100">
                    {exam.postExamAnalysis.newMistakesCount}
                  </strong>
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-sans italic pt-1 font-medium">
                "{exam.postExamAnalysis.observations}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
          <button
            onClick={() => onOpenPostExamAnalysis(exam)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold border border-zinc-300 dark:border-zinc-700 transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>
              {exam.postExamAnalysis ? 'EDIT POST-EXAM ANALYSIS' : 'RECORD POST-EXAM ANALYSIS'}
            </span>
          </button>

          <button
            disabled={relevantMistakes.length === 0}
            onClick={() => {
              onClose();
              onStartExamRevision(relevantMistakes);
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-mono font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>START EXAM REVISION ({relevantMistakes.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
