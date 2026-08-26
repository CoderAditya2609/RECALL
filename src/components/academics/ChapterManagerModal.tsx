import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  Tag,
  BookOpen,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

interface ChapterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubjectId?: string;
}

export const ChapterManagerModal: React.FC<ChapterManagerModalProps> = ({
  isOpen,
  onClose,
  initialSubjectId,
}) => {
  const {
    subjects,
    mistakes,
    addChapterToSubject,
    addChaptersBatchToSubject,
    updateChapterInSubject,
    deleteChapterFromSubject,
    addTopicToChapter,
    deleteTopicFromChapter,
    addSubject,
  } = useAcademic();

  const [selectedSubjId, setSelectedSubjId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ''
  );
  const [newChapterName, setNewChapterName] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchChaptersText, setBatchChaptersText] = useState('');

  // Editing chapter
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterName, setEditingChapterName] = useState('');

  // Adding topic to specific chapter
  const [addingTopicChapId, setAddingTopicChapId] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  // Quick Add Subject
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjId) || subjects[0];

  const handleAddSingleChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterName.trim() || !currentSubject) return;
    await addChapterToSubject(currentSubject.id, newChapterName.trim());
    setNewChapterName('');
  };

  const handleAddBatchChapters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchChaptersText.trim() || !currentSubject) return;
    const names = batchChaptersText
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length > 0) {
      await addChaptersBatchToSubject(currentSubject.id, names);
    }
    setBatchChaptersText('');
    setIsBatchMode(false);
  };

  const handleStartEdit = (chapId: string, currentName: string) => {
    setEditingChapterId(chapId);
    setEditingChapterName(currentName);
  };

  const handleSaveEdit = async (chapId: string) => {
    if (!editingChapterName.trim() || !currentSubject) return;
    await updateChapterInSubject(currentSubject.id, chapId, editingChapterName.trim());
    setEditingChapterId(null);
    setEditingChapterName('');
  };

  const handleDeleteChapter = async (chapId: string, chapName: string) => {
    if (!currentSubject) return;
    const mistakesInChap = mistakes.filter(
      (m) => m.subjectId === currentSubject.id && m.chapter?.toLowerCase() === chapName.toLowerCase()
    ).length;

    const confirmMsg = mistakesInChap > 0
      ? `This chapter has ${mistakesInChap} associated mistake records. Are you sure you want to delete chapter "${chapName}"?`
      : `Delete chapter "${chapName}"?`;

    if (window.confirm(confirmMsg)) {
      await deleteChapterFromSubject(currentSubject.id, chapId);
    }
  };

  const handleAddTopic = async (chapId: string) => {
    if (!newTopicName.trim() || !currentSubject) return;
    await addTopicToChapter(currentSubject.id, chapId, newTopicName.trim());
    setNewTopicName('');
    setAddingTopicChapId(null);
  };

  const handleDeleteTopic = async (chapId: string, topicId: string) => {
    if (!currentSubject) return;
    await deleteTopicFromChapter(currentSubject.id, chapId, topicId);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const newId = await addSubject({
      name: newSubjectName.trim(),
      code: newSubjectCode.trim().toUpperCase() || newSubjectName.slice(0, 3).toUpperCase(),
      color: '#18181b',
      chapters: [],
    });
    setSelectedSubjId(newId);
    setNewSubjectName('');
    setNewSubjectCode('');
    setIsAddingNewSubject(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-mono font-black text-sm">
              <FolderPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
                Curriculum & Chapter Manager
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Add, rename, or organize academic chapters and sub-topics per subject.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Subject Selector Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Select Subject
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewSubject(!isAddingNewSubject)}
                className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-1 uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Subject</span>
              </button>
            </div>

            {isAddingNewSubject && (
              <form
                onSubmit={handleCreateSubject}
                className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl flex gap-2 animate-in fade-in"
              >
                <input
                  type="text"
                  placeholder="Subject Name (e.g. Biology)..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                />
                <input
                  type="text"
                  placeholder="Code (BIO)"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-24 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono uppercase font-bold focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-mono font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewSubject(false)}
                  className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
              </form>
            )}

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {subjects.map((sub) => {
                const isSelected = (currentSubject?.id === sub.id) || (selectedSubjId === sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjId(sub.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sub.color || '#18181b' }}
                    />
                    <span className="font-display uppercase tracking-tight">{sub.name}</span>
                    <span className="text-[10px] font-mono font-bold opacity-80">
                      ({sub.chapters.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Chapter Form Box */}
          {currentSubject && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Chapter to {currentSubject.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 underline uppercase"
                >
                  {isBatchMode ? 'Switch to Single Add' : 'Batch Add Multiple Chapters'}
                </button>
              </div>

              {isBatchMode ? (
                <form onSubmit={handleAddBatchChapters} className="space-y-2">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    Enter multiple chapter names separated by commas or lines (e.g. "Electrostatics, Current Electricity, Magnetism"):
                  </p>
                  <textarea
                    rows={3}
                    value={batchChaptersText}
                    onChange={(e) => setBatchChaptersText(e.target.value)}
                    placeholder="Chapter 1&#10;Chapter 2&#10;Chapter 3..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBatchMode(false)}
                      className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-mono font-bold"
                    >
                      Add All Chapters
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddSingleChapter} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`e.g. Rotational Dynamics, Thermodynamics...`}
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors"
                  >
                    ADD CHAPTER
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Chapters List */}
          {currentSubject && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Chapters in {currentSubject.name} ({currentSubject.chapters.length})
                </span>
              </div>

              {currentSubject.chapters.length === 0 ? (
                <div className="p-8 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  No chapters yet. Add your first chapter using the form above.
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                  {currentSubject.chapters.map((chap) => {
                    const isEditing = editingChapterId === chap.id;
                    const chapMistakes = mistakes.filter(
                      (m) =>
                        m.subjectId === currentSubject.id &&
                        m.chapter?.toLowerCase() === chap.name.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={chap.id}
                        className="p-4 space-y-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingChapterName}
                                onChange={(e) => setEditingChapterName(e.target.value)}
                                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-400 dark:border-zinc-600 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(chap.id)}
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
                            <div className="flex items-center gap-2.5">
                              <BookOpen className="w-4 h-4 text-zinc-400 dark:text-zinc-500 stroke-[2.2]" />
                              <span className="text-xs font-black text-zinc-950 dark:text-zinc-100 font-display">
                                {chap.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                                {chap.topics.length} topics • {chapMistakes} mistake{chapMistakes === 1 ? '' : 's'}
                              </span>
                            </div>
                          )}

                          {!isEditing && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setAddingTopicChapId(
                                    addingTopicChapId === chap.id ? null : chap.id
                                  )
                                }
                                className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                                <span>Add Topic</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEdit(chap.id, chap.name)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                title="Rename Chapter"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(chap.id, chap.name)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete Chapter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Add Topic input for this chapter */}
                        {addingTopicChapId === chap.id && (
                          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg flex gap-2 animate-in fade-in">
                            <input
                              type="text"
                              placeholder="New Sub-topic (e.g. Moment of Inertia of Disc)..."
                              value={newTopicName}
                              onChange={(e) => setNewTopicName(e.target.value)}
                              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTopic(chap.id)}
                              className="px-3 py-1 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md text-xs font-mono font-bold"
                            >
                              Save Topic
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingTopicChapId(null)}
                              className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Topics badges */}
                        {chap.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-6">
                            {chap.topics.map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono flex items-center gap-1.5"
                              >
                                <Tag className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500" />
                                <span>{t.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTopic(chap.id, t.id)}
                                  className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold ml-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-mono font-bold transition-colors"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
