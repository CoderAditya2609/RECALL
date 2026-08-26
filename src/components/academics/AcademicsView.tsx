import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Tag,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Subject, ChapterItem, TopicItem, Mistake } from '../../types';
import { useAcademic } from '../../context/AcademicContext';
import { ChapterManagerModal } from './ChapterManagerModal';

interface AcademicsViewProps {
  onSelectMistakeFilter: (subjectId: string, chapterName?: string, topicName?: string) => void;
}

export const AcademicsView: React.FC<AcademicsViewProps> = ({ onSelectMistakeFilter }) => {
  const {
    subjects,
    mistakes,
    addSubject,
    updateSubject,
    deleteSubject,
    addChapterToSubject,
    addChaptersBatchToSubject,
    updateChapterInSubject,
    deleteChapterFromSubject,
    addTopicToChapter,
    deleteTopicFromChapter,
  } = useAcademic();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Modals and inline add
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#18181b');

  const [addingChapterForSubj, setAddingChapterForSubj] = useState<string | null>(null);
  const [newChapterName, setNewChapterName] = useState('');
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [batchChaptersInput, setBatchChaptersInput] = useState('');

  // Editing chapter
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterName, setEditingChapterName] = useState('');

  // Adding topic
  const [addingTopicForChap, setAddingTopicForChap] = useState<{ subjId: string; chapId: string } | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const toggleChapter = (chapId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapId]: !prev[chapId],
    }));
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const newId = await addSubject({
      name: newSubjectName.trim(),
      code: newSubjectCode.trim().toUpperCase() || newSubjectName.slice(0, 3).toUpperCase(),
      color: newSubjectColor,
      chapters: [],
    });
    setSelectedSubjectId(newId);
    setNewSubjectName('');
    setNewSubjectCode('');
    setIsAddingSubject(false);
  };

  const handleCreateChapter = async (subjectId: string) => {
    if (isBatchAdding) {
      const names = batchChaptersInput
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      if (names.length > 0) {
        await addChaptersBatchToSubject(subjectId, names);
      }
      setBatchChaptersInput('');
      setIsBatchAdding(false);
    } else {
      if (!newChapterName.trim()) return;
      await addChapterToSubject(subjectId, newChapterName.trim());
      setNewChapterName('');
    }
    setAddingChapterForSubj(null);
  };

  const handleSaveChapterRename = async (subjectId: string, chapterId: string) => {
    if (!editingChapterName.trim()) return;
    await updateChapterInSubject(subjectId, chapterId, editingChapterName.trim());
    setEditingChapterId(null);
    setEditingChapterName('');
  };

  const handleDeleteChapter = async (subjectId: string, chapterId: string, chapName: string) => {
    const count = mistakes.filter(
      (m) => m.subjectId === subjectId && m.chapter?.toLowerCase() === chapName.toLowerCase()
    ).length;

    const confirm = window.confirm(
      count > 0
        ? `Chapter "${chapName}" has ${count} mistake record(s) linked to it. Are you sure you want to delete this chapter?`
        : `Delete chapter "${chapName}"?`
    );

    if (confirm) {
      await deleteChapterFromSubject(subjectId, chapterId);
    }
  };

  const handleCreateTopic = async (subjectId: string, chapterId: string) => {
    if (!newTopicName.trim()) return;
    await addTopicToChapter(subjectId, chapterId, newTopicName.trim());
    setNewTopicName('');
    setAddingTopicForChap(null);
  };

  const handleDeleteTopic = async (subjectId: string, chapterId: string, topicId: string) => {
    await deleteTopicFromChapter(subjectId, chapterId, topicId);
  };

  const getTopicMistakeStats = (subjectName: string, chapterName: string, topicName: string) => {
    const matched = mistakes.filter(
      (m) =>
        m.subjectName?.toLowerCase() === subjectName.toLowerCase() &&
        m.chapter?.toLowerCase() === chapterName.toLowerCase() &&
        m.topic?.toLowerCase() === topicName.toLowerCase()
    );
    const unresolved = matched.filter((m) => m.status === 'Unresolved').length;
    const isRepeated = matched.some((m) => (m.occurrencesCount || 1) >= 3);
    return {
      total: matched.length,
      unresolved,
      isRepeated,
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Chapter Manager Dialog */}
      <ChapterManagerModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        initialSubjectId={activeSubject?.id}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-2xs transition-colors">
        <div>
          <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-zinc-900 dark:text-zinc-100 stroke-[2.5]" />
            <span>Academic Curriculum Taxonomy</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Explicit academic structure (Subject → Chapter → Topic) with error volume tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChapterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold border border-zinc-300 dark:border-zinc-700 transition-colors shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>MANAGE CHAPTERS</span>
          </button>

          <button
            onClick={() => setIsAddingSubject(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ADD SUBJECT</span>
          </button>
        </div>
      </div>

      {/* Add Subject Inline Form */}
      {isAddingSubject && (
        <form
          onSubmit={handleCreateSubject}
          className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 p-5 rounded-xl space-y-3 animate-in fade-in shadow-xs"
        >
          <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            Create New Subject
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Subject Name (e.g. Biology)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
            />
            <input
              type="text"
              placeholder="Code (e.g. BIO)"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 uppercase font-mono font-bold"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newSubjectColor}
                onChange={(e) => setNewSubjectColor(e.target.value)}
                className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
              />
              <div className="flex gap-2 flex-1">
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-white"
                >
                  Save Subject
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Subject Tabs */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
          {subjects.map((sub) => {
            const isSelected = activeSubject?.id === sub.id;
            const subMistakes = mistakes.filter((m) => m.subjectId === sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x relative shrink-0 ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800 shadow-2xs -mb-[1px] border-b-white dark:border-b-zinc-900 z-10'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color || '#18181b' }} />
                <span className="font-display uppercase tracking-tight">{sub.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold">
                  {subMistakes.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Subject Taxonomy Explorer */}
      {activeSubject ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-10 rounded-full"
                style={{ backgroundColor: activeSubject.color || '#18181b' }}
              />
              <div>
                <h3 className="text-lg font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
                  {activeSubject.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold">
                  {activeSubject.chapters.length} CHAPTERS •{' '}
                  {activeSubject.chapters.reduce((acc, c) => acc + c.topics.length, 0)} DEFINED TOPICS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAddingChapterForSubj(activeSubject.id);
                  setIsBatchAdding(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ADD CHAPTER</span>
              </button>
            </div>
          </div>

          {/* Add Chapter Form */}
          {addingChapterForSubj === activeSubject.id && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                  {isBatchAdding ? 'Batch Add Chapters (Comma or line separated)' : 'Add Single Chapter'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBatchAdding(!isBatchAdding)}
                  className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 underline uppercase"
                >
                  {isBatchAdding ? 'Switch to single' : 'Switch to batch paste'}
                </button>
              </div>

              {isBatchAdding ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Chapter 1, Chapter 2, Chapter 3..."
                    value={batchChaptersInput}
                    onChange={(e) => setBatchChaptersInput(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingChapterForSubj(null)}
                      className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateChapter(activeSubject.id)}
                      className="px-4 py-1.5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-mono font-bold"
                    >
                      Save Chapters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Chapter Name (e.g. Thermodynamics, Optics)..."
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateChapter(activeSubject.id)}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-mono font-bold shrink-0"
                  >
                    Add Chapter
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingChapterForSubj(null)}
                    className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chapters and Topics Tree */}
          <div className="space-y-4">
            {activeSubject.chapters.length === 0 ? (
              <div className="p-8 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-3">
                  No chapters added to {activeSubject.name} yet.
                </p>
                <button
                  onClick={() => setAddingChapterForSubj(activeSubject.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Chapter</span>
                </button>
              </div>
            ) : (
              activeSubject.chapters.map((chapter) => {
                const isExpanded = !!expandedChapters[chapter.id];
                const isEditing = editingChapterId === chapter.id;
                const chapterMistakes = mistakes.filter(
                  (m) =>
                    m.subjectId === activeSubject.id &&
                    m.chapter?.toLowerCase() === chapter.name.toLowerCase()
                );

                return (
                  <div
                    key={chapter.id}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs transition-colors"
                  >
                    {/* Chapter Header */}
                    <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingChapterName}
                            onChange={(e) => setEditingChapterName(e.target.value)}
                            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveChapterRename(activeSubject.id, chapter.id)}
                            className="p-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingChapterId(null)}
                            className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => toggleChapter(chapter.id)}
                          className="flex items-center gap-2.5 cursor-pointer flex-1 select-none"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-zinc-700 dark:text-zinc-300 stroke-[2.5]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-700 dark:text-zinc-300 stroke-[2.5]" />
                          )}
                          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-100 font-display">
                            {chapter.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                            {chapter.topics.length} topics • {chapterMistakes.length} mistakes
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setAddingTopicForChap({ subjId: activeSubject.id, chapId: chapter.id })
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Add Topic</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingChapterId(chapter.id);
                              setEditingChapterName(chapter.name);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            title="Rename Chapter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteChapter(activeSubject.id, chapter.id, chapter.name)
                            }
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Chapter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add Topic Input */}
                    {addingTopicForChap?.chapId === chapter.id && (
                      <div className="p-3 bg-zinc-100/60 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
                        <input
                          type="text"
                          placeholder="Topic name (e.g. Photoelectric Equation)..."
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateTopic(activeSubject.id, chapter.id)
                          }
                          className="px-3 py-1.5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-bold hover:bg-zinc-800 dark:hover:bg-white"
                        >
                          Save Topic
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingTopicForChap(null)}
                          className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Topics List */}
                    {isExpanded && (
                      <div className="p-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                        {chapter.topics.length === 0 ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center font-medium">
                            No topics defined in this chapter yet.
                          </p>
                        ) : (
                          chapter.topics.map((topic) => {
                            const stats = getTopicMistakeStats(
                              activeSubject.name,
                              chapter.name,
                              topic.name
                            );

                            return (
                              <div
                                key={topic.id}
                                className="py-2.5 px-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-lg transition-colors group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Tag className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors stroke-[2.2]" />
                                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-display">
                                    {topic.name}
                                  </span>
                                  {stats.isRepeated && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
                                      3× REPEATED WEAKNESS
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                                    {stats.total} mistake{stats.total === 1 ? '' : 's'} (
                                    <span className={stats.unresolved > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                                      {stats.unresolved} unresolved
                                    </span>
                                    )
                                  </span>
                                  {stats.total > 0 && (
                                    <button
                                      onClick={() =>
                                        onSelectMistakeFilter(
                                          activeSubject.id,
                                          chapter.name,
                                          topic.name
                                        )
                                      }
                                      className="text-xs text-zinc-950 dark:text-zinc-100 hover:text-black dark:hover:text-white font-bold font-mono uppercase underline decoration-zinc-300 dark:decoration-zinc-600 flex items-center gap-1"
                                    >
                                      <span>View</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleDeleteTopic(activeSubject.id, chapter.id, topic.id)
                                    }
                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity p-1"
                                    title="Delete Topic"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center shadow-2xs">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">No subjects found. Click "ADD SUBJECT" to begin building your academic taxonomy.</p>
        </div>
      )}
    </div>
  );
};
