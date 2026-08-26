import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Trash2,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { Mistake, Subject, MistakeType, AcademicSource, MistakeStatus } from '../../types';
import { useAcademic } from '../../context/AcademicContext';

interface MistakesListViewProps {
  onOpenNewMistake: () => void;
  onSelectMistake: (mistake: Mistake) => void;
  onStartReview: (mistakesToReview?: Mistake[]) => void;
}

export const MistakesListView: React.FC<MistakesListViewProps> = ({
  onOpenNewMistake,
  onSelectMistake,
  onStartReview,
}) => {
  const { mistakes, subjects, deleteMistake, deleteMultipleMistakes } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [only3xRepeated, setOnly3xRepeated] = useState(false);

  // Bulk selection state
  const [selectedMistakeIds, setSelectedMistakeIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Filter chapters based on selected subject
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const availableChapters = currentSubject ? currentSubject.chapters : [];

  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          (m.questionText && m.questionText.toLowerCase().includes(q)) ||
          (m.topic && m.topic.toLowerCase().includes(q)) ||
          (m.chapter && m.chapter.toLowerCase().includes(q)) ||
          (m.whatWentWrong && m.whatWentWrong.toLowerCase().includes(q)) ||
          (m.takeaway && m.takeaway.toLowerCase().includes(q)) ||
          (m.questionNumber && m.questionNumber.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }

      // Subject
      if (selectedSubjectId !== 'ALL' && m.subjectId !== selectedSubjectId) return false;

      // Chapter
      if (selectedChapter !== 'ALL' && m.chapter !== selectedChapter) return false;

      // Source
      if (selectedSource !== 'ALL' && m.source !== selectedSource) return false;

      // Mistake Type
      if (selectedType !== 'ALL' && m.mistakeType !== selectedType) return false;

      // Status
      if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false;

      // 3x Repeated
      if (only3xRepeated && (m.occurrencesCount || 1) < 3) return false;

      return true;
    });
  }, [
    mistakes,
    searchQuery,
    selectedSubjectId,
    selectedChapter,
    selectedSource,
    selectedType,
    selectedStatus,
    only3xRepeated,
  ]);

  const sourcesList: AcademicSource[] = [
    'Lecture',
    'DPP',
    'Homework',
    'Module',
    'Test',
    'PYQ',
    'Assignment',
    'AITS',
    'Custom',
  ];

  const mistakeTypesList: MistakeType[] = [
    'Conceptual',
    'Calculation',
    'Formula',
    'Misread question',
    'Careless/Silly',
    'Approach selection',
    'Memory/Recall',
    'Multi-concept',
    'Time pressure',
    'Other',
  ];

  const handleDeleteSingle = async (e: React.MouseEvent, mistake: Mistake) => {
    e.stopPropagation();
    const title = mistake.topic || mistake.chapter || 'this mistake';
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteMistake(mistake.id);
      setSelectedMistakeIds((prev) => prev.filter((id) => id !== mistake.id));
    }
  };

  const toggleSelectMistake = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedMistakeIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedMistakeIds.length === filteredMistakes.length) {
      setSelectedMistakeIds([]);
    } else {
      setSelectedMistakeIds(filteredMistakes.map((m) => m.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMistakeIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedMistakeIds.length} selected mistake record(s)?`
      )
    ) {
      await deleteMultipleMistakes(selectedMistakeIds);
      setSelectedMistakeIds([]);
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across questions, topics, takeaways, or error patterns..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 focus:bg-white dark:focus:bg-zinc-900 font-medium transition-colors"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {filteredMistakes.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedMistakeIds([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                  isSelectionMode
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isSelectionMode ? 'CANCEL SELECT' : 'SELECT'}</span>
              </button>
            )}

            <button
              onClick={() => onStartReview(filteredMistakes)}
              disabled={filteredMistakes.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-bold transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>REVIEW FILTERED ({filteredMistakes.length})</span>
            </button>

            <button
              onClick={onOpenNewMistake}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>RECORD MISTAKE</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapter('ALL');
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              disabled={selectedSubjectId === 'ALL'}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 disabled:opacity-40"
            >
              <option value="ALL">All Chapters</option>
              {availableChapters.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
            >
              <option value="ALL">All Sources</option>
              {sourcesList.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
            >
              <option value="ALL">All Error Types</option>
              {mistakeTypesList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="Unresolved">Unresolved</option>
              <option value="Needs Revision">Needs Revision</option>
              <option value="Still Weak">Still Weak</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* 3x Repeated Toggle */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setOnly3xRepeated(!only3xRepeated)}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors border flex items-center justify-center gap-1.5 ${
                only3xRepeated
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
              <span>3× Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar (When selection mode is active) */}
      {isSelectionMode && filteredMistakes.length > 0 && (
        <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl p-3 px-4 flex items-center justify-between shadow-md animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1.5 text-xs font-bold hover:text-zinc-300 font-mono"
            >
              {selectedMistakeIds.length === filteredMistakes.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-400" />
              )}
              <span>
                {selectedMistakeIds.length === filteredMistakes.length
                  ? 'DESELECT ALL'
                  : 'SELECT ALL'}
              </span>
            </button>
            <span className="text-xs text-zinc-400 font-mono">
              ({selectedMistakeIds.length} of {filteredMistakes.length} selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedMistakeIds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-colors font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE SELECTED ({selectedMistakeIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Mistake Count & Controls */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
        <span className="font-mono font-bold">
          SHOWING <span className="text-zinc-950 dark:text-zinc-100 font-black">{filteredMistakes.length}</span> OF{' '}
          {mistakes.length} MISTAKES
        </span>
      </div>

      {/* Grid of Mistake Cards */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center max-w-lg mx-auto shadow-2xs transition-colors">
          <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100 font-display">No mistakes recorded yet</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Log questions you missed from tests, DPPs, or lectures with personal takeaways, audio memos, and canvas markings.
          </p>
          <button
            onClick={onOpenNewMistake}
            className="mt-4 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold transition-colors"
          >
            + Record Mistake
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMistakes.map((mistake) => {
            const isSelected = selectedMistakeIds.includes(mistake.id);
            return (
              <div
                key={mistake.id}
                onClick={() => {
                  if (isSelectionMode) {
                    setSelectedMistakeIds((prev) =>
                      prev.includes(mistake.id)
                        ? prev.filter((id) => id !== mistake.id)
                        : [...prev, mistake.id]
                    );
                  } else {
                    onSelectMistake(mistake);
                  }
                }}
                className={`bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/80 border rounded-xl p-4.5 flex flex-col justify-between cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs relative overflow-hidden ${
                  isSelected
                    ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900 dark:ring-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                {/* Top Row: Subject & Source & 3x badge & Delete Button */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {isSelectionMode && (
                        <div
                          onClick={(e) => toggleSelectMistake(e, mistake.id)}
                          className="mr-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold">
                        {mistake.subjectName}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                        {mistake.source} {mistake.questionNumber ? `• ${mistake.questionNumber}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {mistake.occurrencesCount >= 3 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
                          3× ALERT
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          mistake.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : mistake.status === 'Needs Revision'
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {mistake.status}
                      </span>

                      {/* Quick Delete Action */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSingle(e, mistake)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-0.5"
                        title="Delete mistake record"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                    </div>
                  </div>

                  {/* Chapter & Topic */}
                  <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors font-display line-clamp-1 mb-1">
                    {mistake.topic || mistake.chapter}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1 mb-3">
                    {mistake.chapter}
                  </p>

                  {/* Problem Statement snippet */}
                  {mistake.questionText && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 mb-3 font-sans italic">
                      "{mistake.questionText}"
                    </div>
                  )}

                  {/* Takeaway / Analysis */}
                  <div className="space-y-1.5">
                    {mistake.takeaway ? (
                      <div className="text-xs text-emerald-950 dark:text-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-2.5 rounded-lg line-clamp-2 font-medium">
                        <span className="font-mono text-[9px] text-emerald-800 dark:text-emerald-400 uppercase font-bold block mb-0.5">
                          Golden Takeaway:
                        </span>
                        {mistake.takeaway}
                      </div>
                    ) : mistake.whatWentWrong ? (
                      <div className="text-xs text-rose-950 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 rounded-lg line-clamp-2 font-medium">
                        <span className="font-mono text-[9px] text-rose-800 dark:text-rose-400 uppercase font-bold block mb-0.5">
                          What went wrong:
                        </span>
                        {mistake.whatWentWrong}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Bottom Meta & Icons */}
                <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono font-bold text-[10px]">
                      {mistake.mistakeType}
                    </span>
                    {mistake.voiceMemo && (
                      <span className="flex items-center gap-0.5 text-zinc-800 dark:text-zinc-200" title="Has voice memo">
                        <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    )}
                    {mistake.annotations && mistake.annotations.length > 0 && (
                      <span className="flex items-center gap-0.5 text-zinc-800 dark:text-zinc-200" title="Has visual annotations">
                        <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    )}
                  </div>

                  <span className="font-mono font-bold text-[10px]">
                    {new Date(mistake.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
