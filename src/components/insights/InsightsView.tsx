import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  Brain,
  RotateCcw,
  Layers,
  PieChart,
  Loader2,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { Mistake } from '../../types';

interface InsightsViewProps {
  onStartReview: (mistakesToReview?: Mistake[]) => void;
  onSelectMistake: (mistake: Mistake) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  onStartReview,
  onSelectMistake,
}) => {
  const {
    recurringPatterns,
    insights,
    mistakes,
    isScanning,
    scanProgress,
    scanMistakesWithGemini,
  } = useAcademic();

  const repeatedPatterns = recurringPatterns.filter((p) => p.isRepeatedAlert);

  // Type Breakdown Calculation
  const typeCounts: Record<string, number> = {};
  mistakes.forEach((m) => {
    typeCounts[m.mistakeType] = (typeCounts[m.mistakeType] || 0) + 1;
  });

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  // Source Breakdown Calculation
  const sourceCounts: Record<string, number> = {};
  mistakes.forEach((m) => {
    sourceCounts[m.source] = (sourceCounts[m.source] || 0) + 1;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* AI Scanner Banner */}
      <div className="bg-zinc-950 dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white dark:text-zinc-100" />
              <span className="font-mono text-xs font-black text-zinc-400 uppercase tracking-widest">
                Gemini Academic Diagnostics Engine
              </span>
            </div>
            <h2 className="text-xl font-black text-white dark:text-zinc-50 font-display uppercase tracking-tight">
              Autonomous Mistake Pattern Recognition
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed font-medium">
              Scans your mistake history to uncover hidden conceptual traps, calculation slip frequencies,
              and 3× repeated weaknesses before exam day.
            </p>
          </div>

          <button
            disabled={isScanning || mistakes.length === 0}
            onClick={scanMistakesWithGemini}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-100 dark:hover:bg-white text-zinc-950 text-xs font-bold shadow-xs transition-all active:scale-[0.98] shrink-0 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>{scanProgress || 'ANALYZING NOTEBOOK...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>RUN MISTAKE INTELLIGENCE SCAN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3× Repeated Weakness Alerts (Core Feature) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
            <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              3× Repeated Mistake Alerts ({repeatedPatterns.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-bold">
            Threshold: ≥3 errors in identical topic
          </span>
        </div>

        {repeatedPatterns.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium shadow-2xs">
            No 3× repeated mistake clusters detected. Excellent retention!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repeatedPatterns.map((pattern) => {
              const relatedMistakes = mistakes.filter((m) =>
                pattern.mistakeIds?.includes(m.id)
              );

              return (
                <div
                  key={pattern.id}
                  className="bg-white dark:bg-zinc-900 border-2 border-rose-600 dark:border-rose-700 rounded-xl p-5 space-y-4 shadow-2xs relative overflow-hidden transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-black uppercase">
                          🔴 3× ALERT • {pattern.occurrences} OCCURRENCES
                        </span>
                        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 font-bold">{pattern.subject}</span>
                      </div>
                      <h4 className="text-sm font-black text-zinc-950 dark:text-zinc-50 mt-1.5 font-display uppercase tracking-tight">
                        {pattern.topic}
                      </h4>
                    </div>

                    <button
                      onClick={() => onStartReview(relatedMistakes)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                      <span>REVIEW ({relatedMistakes.length})</span>
                    </button>
                  </div>

                  {/* Root Cause & Prescription */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 uppercase font-bold block">
                        Diagnosed Root Cause:
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans font-medium">{pattern.rootCause}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 uppercase font-bold block">
                        Prescribed Action:
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans font-medium">
                        {pattern.prescribedAction}
                      </p>
                    </div>
                  </div>

                  {/* Related Mistake list */}
                  {relatedMistakes.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase block mb-1.5 font-bold">
                        Associated Mistake Entries:
                      </span>
                      <div className="space-y-1">
                        {relatedMistakes.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => onSelectMistake(m)}
                            className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center justify-between transition-colors border border-zinc-200 dark:border-zinc-800"
                          >
                            <span className="truncate max-w-[280px] font-medium">
                              {m.questionText || m.takeaway || m.topic}
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-950 dark:text-zinc-100 shrink-0">
                              View →
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mistake Taxonomy Analytics (Charts / Distributions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Types Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                Mistake Type Classification
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">Total: {mistakes.length}</span>
          </div>

          <div className="space-y-2.5">
            {sortedTypes.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center font-medium">No mistake data to classify.</p>
            ) : (
              sortedTypes.map(([type, count]) => {
                const pct = Math.round((count / (mistakes.length || 1)) * 100);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{type}</span>
                      <span className="font-mono text-zinc-500 dark:text-zinc-400 font-bold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-950 dark:bg-zinc-100 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Source Origin Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                Mistakes by Academic Source
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">Context breakdown</span>
          </div>

          <div className="space-y-2.5">
            {Object.keys(sourceCounts).length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center font-medium">No source data available.</p>
            ) : (
              Object.entries(sourceCounts).map(([source, count]) => {
                const pct = Math.round((count / (mistakes.length || 1)) * 100);
                return (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{source}</span>
                      <span className="font-mono text-zinc-500 dark:text-zinc-400 font-bold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-800 dark:bg-zinc-300 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Complete Gemini Diagnostic Feed */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              All Gemini Diagnostic Observations
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
            {insights.length} active insights
          </span>
        </div>

        {insights.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center font-medium">
            No diagnostic observations yet. Click "RUN MISTAKE INTELLIGENCE SCAN" above.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-950 dark:text-zinc-100 font-display uppercase tracking-tight">{ins.title}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      ins.priority === 'Urgent'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {ins.priority}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans font-medium">{ins.content}</p>

                {ins.recommendedAction && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-200 flex items-start gap-1">
                    <span className="shrink-0 font-bold text-emerald-700 dark:text-emerald-400">Action:</span>
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium font-sans">{ins.recommendedAction}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
