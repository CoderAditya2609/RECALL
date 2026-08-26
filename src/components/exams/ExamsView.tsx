import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Target,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Exam, Mistake } from '../../types';
import { useAcademic } from '../../context/AcademicContext';
import { ExamDetailModal } from './ExamDetailModal';
import { PostExamAnalysisModal } from './PostExamAnalysisModal';

interface ExamsViewProps {
  onStartExamRevision: (mistakes: Mistake[]) => void;
  onOpenNewMistake: () => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  onStartExamRevision,
  onOpenNewMistake,
}) => {
  const { exams, mistakes, addExam } = useAcademic();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPostAnalysisOpen, setIsPostAnalysisOpen] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);

  // New Exam Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [targetScore, setTargetScore] = useState<number>(200);
  const [totalMarks, setTotalMarks] = useState<number>(300);
  const [syllabusInput, setSyllabusInput] = useState('');
  const [syllabusList, setSyllabusList] = useState<string[]>([
    'Structure of Atom',
    'Electrostatics',
    'Integral Calculus',
  ]);
  const [notes, setNotes] = useState('');

  const handleAddSyllabusItem = () => {
    if (!syllabusInput.trim()) return;
    setSyllabusList([...syllabusList, syllabusInput.trim()]);
    setSyllabusInput('');
  };

  const handleRemoveSyllabusItem = (idx: number) => {
    setSyllabusList(syllabusList.filter((_, i) => i !== idx));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addExam({
      name: name.trim(),
      date,
      targetScore: Number(targetScore),
      totalMarks: Number(totalMarks),
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      syllabus: syllabusList,
      notes: notes.trim(),
      status: 'Upcoming',
    });

    setName('');
    setNotes('');
    setIsCreatingExam(false);
  };

  const upcomingExams = exams.filter((e) => e.status !== 'Completed');
  const completedExams = exams.filter((e) => e.status === 'Completed');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-2xs transition-colors">
        <div>
          <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-zinc-900 dark:text-zinc-100 stroke-[2.5]" />
            <span>Academic Exam Manager</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Connect upcoming test syllabus with historical mistake patterns for pre-exam revision.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingExam(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-colors font-mono"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD ACADEMIC EXAM</span>
        </button>
      </div>

      {/* Create Exam Modal / Form */}
      {isCreatingExam && (
        <form
          onSubmit={handleCreateExam}
          className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 p-6 rounded-2xl space-y-4 animate-in fade-in shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Schedule New Exam
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingExam(false)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                Exam Name *
              </label>
              <input
                type="text"
                placeholder="e.g. AITS Advanced 02 / JEE Mock"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                Exam Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                  Target Score
                </label>
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Syllabus Topics */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
              Syllabus Chapters / Topics
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Structure of Atom / Rotational Dynamics..."
                value={syllabusInput}
                onChange={(e) => setSyllabusInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSyllabusItem();
                  }
                }}
                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={handleAddSyllabusItem}
                className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-bold font-mono"
              >
                Add Topic
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {syllabusList.map((item, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSyllabusItem(i)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
              Exam Strategy Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prioritize Single-correct chemistry first; do not rush boundary equations..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCreatingExam(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold font-mono"
            >
              Save Exam
            </button>
          </div>
        </form>
      )}

      {/* Upcoming Exams Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Scheduled Upcoming Exams ({upcomingExams.length})
        </h3>

        {upcomingExams.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium shadow-2xs">
            No upcoming exams scheduled. Click "ADD ACADEMIC EXAM" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => {
              const daysLeft = Math.ceil(
                (new Date(exam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              // Calculate relevant mistakes
              const relevant = mistakes.filter((m) =>
                exam.syllabus.some(
                  (s) =>
                    (m.chapter && m.chapter.toLowerCase().includes(s.toLowerCase())) ||
                    (m.topic && m.topic.toLowerCase().includes(s.toLowerCase()))
                )
              );
              const repeated3xCount = relevant.filter((m) => (m.occurrencesCount || 1) >= 3).length;

              return (
                <div
                  key={exam.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-900 dark:hover:border-zinc-600 transition-all group relative overflow-hidden shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
                        {exam.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                        {daysLeft > 0 ? `In ${daysLeft} days` : 'Today'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-mono font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        <span>{exam.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                        <span>Target: {exam.targetScore || 'N/A'}/{exam.totalMarks || 300}</span>
                      </span>
                    </div>

                    {/* Syllabus Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {exam.syllabus.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Mistake indicators */}
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                        Syllabus Mistakes: <strong className="text-zinc-950 dark:text-zinc-100 font-bold">{relevant.length}</strong>
                      </span>
                      {repeated3xCount > 0 && (
                        <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                          <span>🔴 {repeated3xCount} 3× repeated traps</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedExam(exam);
                        setIsPostAnalysisOpen(true);
                      }}
                      className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 flex items-center gap-1 font-bold font-mono uppercase"
                    >
                      <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span>Post-Exam Analysis</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedExam(exam);
                        setIsDetailOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-colors font-mono"
                    >
                      <span>PREPARE FOR EXAM</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Exams & Reflections Section */}
      {completedExams.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Completed Exams & Post-Exam Reflections ({completedExams.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 shadow-2xs transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">{exam.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                    Completed
                  </span>
                </div>

                {exam.postExamAnalysis && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                      <span className="font-bold">Score Obtained:</span>
                      <span className="text-zinc-950 dark:text-zinc-100 font-black">
                        {exam.postExamAnalysis.actualMarks}/{exam.postExamAnalysis.totalPossible}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-rose-800 dark:text-rose-400">
                      <span className="font-bold">Known Weaknesses Repeated:</span>
                      <span className="font-black">{exam.postExamAnalysis.knownMistakesRepeated}</span>
                    </div>
                    <div className="flex items-center justify-between text-amber-800 dark:text-amber-400">
                      <span className="font-bold">New Mistakes Encountered:</span>
                      <span className="font-black">{exam.postExamAnalysis.newMistakesCount}</span>
                    </div>
                    {exam.postExamAnalysis.observations && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans italic pt-1 border-t border-zinc-200 dark:border-zinc-800 font-medium">
                        "{exam.postExamAnalysis.observations}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ExamDetailModal
        exam={selectedExam}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStartExamRevision={onStartExamRevision}
        onOpenPostExamAnalysis={(exam) => {
          setIsDetailOpen(false);
          setSelectedExam(exam);
          setIsPostAnalysisOpen(true);
        }}
      />

      <PostExamAnalysisModal
        exam={selectedExam}
        isOpen={isPostAnalysisOpen}
        onClose={() => setIsPostAnalysisOpen(false)}
        onOpenNewMistake={onOpenNewMistake}
      />
    </div>
  );
};
