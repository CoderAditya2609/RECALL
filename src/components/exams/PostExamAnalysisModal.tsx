import React, { useState } from 'react';
import { X, CheckCircle2, Save, Plus } from 'lucide-react';
import { Exam } from '../../types';
import { useAcademic } from '../../context/AcademicContext';

interface PostExamAnalysisModalProps {
  exam: Exam | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenNewMistake: () => void;
}

export const PostExamAnalysisModal: React.FC<PostExamAnalysisModalProps> = ({
  exam,
  isOpen,
  onClose,
  onOpenNewMistake,
}) => {
  const { savePostExamAnalysis } = useAcademic();

  const [actualMarks, setActualMarks] = useState<number>(
    exam?.postExamAnalysis?.actualMarks || exam?.targetScore || 180
  );
  const [totalPossible, setTotalPossible] = useState<number>(
    exam?.postExamAnalysis?.totalPossible || exam?.totalMarks || 300
  );
  const [knownMistakesRepeated, setKnownMistakesRepeated] = useState<number>(
    exam?.postExamAnalysis?.knownMistakesRepeated || 0
  );
  const [newMistakesCount, setNewMistakesCount] = useState<number>(
    exam?.postExamAnalysis?.newMistakesCount || 2
  );
  const [observations, setObservations] = useState<string>(
    exam?.postExamAnalysis?.observations || ''
  );
  const [weakAreaInput, setWeakAreaInput] = useState('');
  const [weakAreas, setWeakAreas] = useState<string[]>(
    exam?.postExamAnalysis?.weakAreasIdentified || []
  );

  if (!isOpen || !exam) return null;

  const handleAddWeakArea = () => {
    if (!weakAreaInput.trim()) return;
    setWeakAreas([...weakAreas, weakAreaInput.trim()]);
    setWeakAreaInput('');
  };

  const handleRemoveWeakArea = (index: number) => {
    setWeakAreas(weakAreas.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePostExamAnalysis(exam.id, {
      recordedAt: new Date().toISOString(),
      actualMarks: Number(actualMarks),
      totalPossible: Number(totalPossible),
      knownMistakesRepeated: Number(knownMistakesRepeated),
      newMistakesCount: Number(newMistakesCount),
      observations: observations.trim(),
      weakAreasIdentified: weakAreas,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-mono font-black text-sm">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
                Post-Exam Reflection & Analysis
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold">{exam.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Marks & Target comparison */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Marks Obtained *
              </label>
              <input
                type="number"
                value={actualMarks}
                onChange={(e) => setActualMarks(Number(e.target.value))}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Total Marks Possible
              </label>
              <input
                type="number"
                value={totalPossible}
                onChange={(e) => setTotalPossible(Number(e.target.value))}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
              />
            </div>
          </div>

          {/* Separation of Known Weaknesses vs New Errors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Known Weaknesses Repeated */}
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 space-y-2">
              <label className="block text-xs font-mono font-black text-rose-800 dark:text-rose-400 uppercase tracking-wide">
                🔴 Known Weaknesses Repeated
              </label>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                Mistakes made in this exam that you had ALREADY logged before in RECALL.
              </p>
              <input
                type="number"
                min="0"
                value={knownMistakesRepeated}
                onChange={(e) => setKnownMistakesRepeated(Number(e.target.value))}
                className="w-full bg-white dark:bg-zinc-900 border border-rose-400 dark:border-rose-800 rounded-lg px-3 py-2 text-sm text-rose-900 dark:text-rose-200 font-mono font-bold focus:outline-none focus:border-rose-600"
              />
            </div>

            {/* New Mistakes Made */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 space-y-2">
              <label className="block text-xs font-mono font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                🟡 New Mistakes Discovered
              </label>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                Brand new error types or unfamiliar concepts encountered during this exam.
              </p>
              <input
                type="number"
                min="0"
                value={newMistakesCount}
                onChange={(e) => setNewMistakesCount(Number(e.target.value))}
                className="w-full bg-white dark:bg-zinc-900 border border-amber-400 dark:border-amber-800 rounded-lg px-3 py-2 text-sm text-amber-900 dark:text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Qualitative Observations */}
          <div>
            <label className="block text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1.5">
              Personal Post-Exam Observations & Exam Temperament
            </label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="e.g. Managed time well in Physics, but lost 12 marks in Chemistry due to rushed electronic configurations..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans font-medium"
            />
          </div>

          {/* Identified Weak Areas */}
          <div>
            <label className="block text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1.5">
              Identified Weak Topics to Record in Notebook
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Rotational Inertia with Cavity..."
                value={weakAreaInput}
                onChange={(e) => setWeakAreaInput(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-medium"
              />
              <button
                type="button"
                onClick={handleAddWeakArea}
                className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-mono font-bold"
              >
                ADD
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {weakAreas.map((area, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <span>{area}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWeakArea(i)}
                    className="hover:text-rose-600 dark:hover:text-rose-400 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Quick Record Mistake CTA */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium font-sans">
              Have the exam paper questions with you?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewMistake();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>RECORD MISTAKE IN NOTEBOOK</span>
            </button>
          </div>

          {/* Footer Save */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold border border-zinc-300 dark:border-zinc-700"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-mono font-bold shadow-xs transition-all"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>SAVE REFLECTION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
