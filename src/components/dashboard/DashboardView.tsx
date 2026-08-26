import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Sparkles,
  RotateCcw,
  GraduationCap,
  TrendingUp,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { Mistake, Exam } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenNewMistake: () => void;
  onSelectMistake: (mistake: Mistake) => void;
  onSelectExam: (exam: Exam) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewMistake,
  onSelectMistake,
  onSelectExam,
}) => {
  const {
    mistakes,
    subjects,
    exams,
    recurringPatterns,
    insights,
    isScanning,
    scanMistakesWithGemini,
  } = useAcademic();

  const totalMistakes = mistakes.length;
  const unresolvedMistakes = mistakes.filter((m) => m.status === 'Unresolved');
  const criticalRepeatedPatterns = recurringPatterns.filter((p) => p.isRepeatedAlert && !p.resolved);
  const resolvedCount = mistakes.filter((m) => m.status === 'Resolved').length;
  const resolutionRate = totalMistakes > 0 ? Math.round((resolvedCount / totalMistakes) * 100) : 0;

  // Upcoming Exams
  const upcomingExams = exams
    .filter((e) => e.status !== 'Completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Weak Topics map
  const topicMap: Record<string, { count: number; subject: string; chapter: string }> = {};
  mistakes.forEach((m) => {
    if (m.topic) {
      if (!topicMap[m.topic]) {
        topicMap[m.topic] = { count: 0, subject: m.subjectName, chapter: m.chapter };
      }
      topicMap[m.topic].count += m.occurrencesCount || 1;
    }
  });

  const weakTopics = Object.entries(topicMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  const recentMistakes = mistakes.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 3× Repeated Alert Banner if active */}
      {criticalRepeatedPatterns.length > 0 && (
        <div className="p-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-rose-600 dark:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-extrabold text-sm text-rose-950 dark:text-rose-100 uppercase tracking-tight">
                  Critical 3× Recurrence: {criticalRepeatedPatterns[0].topic}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-mono text-[10px] font-bold">
                  {criticalRepeatedPatterns[0].occurrences} REPEATS
                </span>
              </div>
              <p className="text-xs text-rose-900 dark:text-rose-300 font-medium mt-1 leading-relaxed max-w-2xl">
                {criticalRepeatedPatterns[0].rootCause}
              </p>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-bold mt-1.5 flex items-center gap-1.5">
                <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 font-mono">Action</span>
                <span>{criticalRepeatedPatterns[0].prescribedAction}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => onNavigate('review')}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 active:scale-95 font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>REVIEW NOW</span>
            </button>
            <button
              onClick={() => onNavigate('insights')}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-rose-100/50 dark:hover:bg-zinc-800 text-rose-900 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800 transition-colors font-mono"
            >
              Diagnostics
            </button>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid - Bold Typographic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Mistakes */}
        <div
          onClick={() => onNavigate('mistakes')}
          className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">Total Mistakes</span>
            <BookOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-zinc-950 dark:text-zinc-50 tracking-tight">{totalMistakes}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">in {subjects.length} subjects</span>
          </div>
        </div>

        {/* Unresolved Mistakes */}
        <div
          onClick={() => onNavigate('mistakes')}
          className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-all hover:border-amber-300 dark:hover:border-amber-700 shadow-2xs group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono text-amber-700 dark:text-amber-400">Unresolved</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-amber-700 dark:text-amber-400 tracking-tight">{unresolvedMistakes.length}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">need review</span>
          </div>
        </div>

        {/* Repeated Patterns */}
        <div
          onClick={() => onNavigate('insights')}
          className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-all hover:border-rose-300 dark:hover:border-rose-700 shadow-2xs group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono text-rose-700 dark:text-rose-400">3× Alert Clusters</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-rose-700 dark:text-rose-400 tracking-tight">{criticalRepeatedPatterns.length}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">vulnerabilities</span>
          </div>
        </div>

        {/* Resolution Mastery */}
        <div
          onClick={() => onNavigate('review')}
          className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-all hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono text-emerald-700 dark:text-emerald-400">Mastery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-emerald-700 dark:text-emerald-400 tracking-tight">{resolutionRate}%</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{resolvedCount} resolved</span>
          </div>
        </div>
      </div>

      {/* Main Split: Left Column (Activity & Weaknesses) / Right Column (AI Intelligence & Exams) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Recent Activity & Weak Areas */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Mistakes List */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-2xs transition-colors">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[2.5]" />
                <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">Recent Mistakes</h3>
              </div>
              <button
                onClick={() => onNavigate('mistakes')}
                className="text-xs text-zinc-900 dark:text-zinc-300 hover:text-black dark:hover:text-white font-bold flex items-center gap-1 font-mono"
              >
                <span>VIEW NOTEBOOK</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {recentMistakes.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Your mistake notebook is currently empty.</p>
                <button
                  onClick={onOpenNewMistake}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold transition-colors font-mono"
                >
                  + Record First Mistake
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentMistakes.map((mistake) => (
                  <div
                    key={mistake.id}
                    onClick={() => onSelectMistake(mistake)}
                    className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-zinc-900 dark:bg-zinc-100" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold">
                            {mistake.subjectName}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-black dark:group-hover:text-white transition-colors font-display">
                            {mistake.topic || mistake.chapter}
                          </span>
                          {mistake.occurrencesCount >= 3 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                              3× ALERT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-1 max-w-md font-medium">
                          {mistake.takeaway || mistake.whatWentWrong || mistake.questionText || 'No written takeaway yet'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          mistake.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : mistake.status === 'Needs Revision'
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {mistake.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weak Topics Analysis */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-2xs transition-colors">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">Vulnerable Academic Topics</h3>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-bold">Ranked by error frequency</span>
            </div>

            {weakTopics.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center font-medium">No weak topics detected yet. Log mistakes to generate diagnostics.</p>
            ) : (
              <div className="space-y-3.5">
                {weakTopics.map(([topicName, data]) => (
                  <div key={topicName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-display">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">[{data.subject}]</span>
                        <span>{topicName}</span>
                      </span>
                      <span className="font-mono text-[11px] text-rose-700 dark:text-rose-400 font-bold">
                        {data.count} mistakes logged
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          data.count >= 3 ? 'bg-rose-600 dark:bg-rose-500' : data.count >= 2 ? 'bg-amber-500' : 'bg-zinc-800 dark:bg-zinc-200'
                        }`}
                        style={{ width: `${Math.min(100, (data.count / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Gemini Intelligence stream & Upcoming Exams */}
        <div className="lg:col-span-5 space-y-6">
          {/* Gemini AI Intelligence Stream */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-2xs relative overflow-hidden transition-colors">
            <div className="flex items-center justify-between mb-3.5 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">Gemini Intelligence</h3>
              </div>
              <button
                disabled={isScanning || mistakes.length === 0}
                onClick={scanMistakesWithGemini}
                className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 uppercase tracking-tight disabled:opacity-40"
              >
                {isScanning ? (
                  <Loader2 className="w-3 h-3 animate-spin stroke-[2.5]" />
                ) : (
                  <Sparkles className="w-3 h-3 stroke-[2.5]" />
                )}
                <span>Rescan</span>
              </button>
            </div>

            {insights.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center font-medium">Run Gemini scan once mistakes are logged to reveal error patterns.</p>
            ) : (
              <div className="space-y-3">
                {insights.slice(0, 3).map((ins) => (
                  <div
                    key={ins.id}
                    className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-black text-zinc-900 dark:text-zinc-100 tracking-wider">
                        {ins.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          ins.priority === 'Urgent'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {ins.priority}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans font-medium">{ins.content}</p>
                    {ins.recommendedAction && (
                      <div className="pt-1.5 text-[11px] text-zinc-900 dark:text-zinc-200 font-mono font-bold flex items-start gap-1">
                        <span className="text-emerald-700 dark:text-emerald-400 shrink-0">Prescription:</span>
                        <span className="text-zinc-800 dark:text-zinc-300 font-sans font-medium">{ins.recommendedAction}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Academic Exams */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-2xs transition-colors">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[2.5]" />
                <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">Upcoming Exams</h3>
              </div>
              <button
                onClick={() => onNavigate('exams')}
                className="text-xs text-zinc-900 dark:text-zinc-300 hover:text-black dark:hover:text-white font-bold flex items-center gap-1 font-mono"
              >
                <span>VIEW ALL</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center font-medium">No upcoming exams scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map((exam) => {
                  const daysLeft = Math.ceil(
                    (new Date(exam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={exam.id}
                      onClick={() => onSelectExam(exam)}
                      className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-950 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors font-display">
                          {exam.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950">
                          {daysLeft > 0 ? `In ${daysLeft} days` : 'Today'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        <span>{exam.date}</span>
                        <span>•</span>
                        <span>Target: {exam.targetScore || 'N/A'}/{exam.totalMarks || 300}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {exam.syllabus.slice(0, 3).map((topic, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
