import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Save,
  Trash2,
  Plus,
  Loader2,
  FileImage,
  Layers,
} from 'lucide-react';
import {
  Mistake,
  AcademicSource,
  MistakeType,
  SeverityLevel,
  MistakeStatus,
  AnnotationItem,
  VoiceMemo,
} from '../../types';
import { useAcademic } from '../../context/AcademicContext';
import { AnnotationCanvas } from './AnnotationCanvas';
import { VoiceRecorder } from './VoiceRecorder';

interface MistakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMistake?: Mistake | null;
  mistakeToEdit?: Mistake | null;
}

export const MistakeModal: React.FC<MistakeModalProps> = ({
  isOpen,
  onClose,
  initialMistake,
  mistakeToEdit,
}) => {
  const activeMistake = mistakeToEdit || initialMistake;

  const {
    subjects,
    addMistake,
    updateMistake,
    deleteMistake,
    addChapterToSubject,
    addTopicToChapter,
    analyzeMistakeWithGemini,
  } = useAcademic();

  // Form State
  const [subjectId, setSubjectId] = useState('');
  const [chapter, setChapter] = useState('');
  const [newChapterInput, setNewChapterInput] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [topic, setTopic] = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const [source, setSource] = useState<AcademicSource>('DPP');
  const [sourceDetails, setSourceDetails] = useState('');
  const [questionNumber, setQuestionNumber] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState<string | undefined>(undefined);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);

  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [correctApproach, setCorrectApproach] = useState('');
  const [whyMadeMistake, setWhyMadeMistake] = useState('');
  const [takeaway, setTakeaway] = useState('');

  const [mistakeType, setMistakeType] = useState<MistakeType>('Conceptual');
  const [severity, setSeverity] = useState<SeverityLevel>('Medium');
  const [status, setStatus] = useState<MistakeStatus>('Unresolved');
  const [occurrencesCount, setOccurrencesCount] = useState(1);

  const [voiceMemo, setVoiceMemo] = useState<VoiceMemo | undefined>(undefined);

  // Gemini Diagnostic State
  const [geminiDiagnostic, setGeminiDiagnostic] = useState<string | undefined>(undefined);
  const [preventativeRule, setPreventativeRule] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<'workspace' | 'analysis'>('workspace');

  useEffect(() => {
    if (activeMistake) {
      setSubjectId(activeMistake.subjectId);
      setChapter(activeMistake.chapter);
      setTopic(activeMistake.topic);
      setSource(activeMistake.source);
      setSourceDetails(activeMistake.sourceDetails || '');
      setQuestionNumber(activeMistake.questionNumber || '');
      setQuestionText(activeMistake.questionText || '');
      setQuestionImage(activeMistake.questionImage);
      setAnnotations(activeMistake.annotations || []);
      setWhatWentWrong(activeMistake.whatWentWrong || '');
      setCorrectApproach(activeMistake.correctApproach || '');
      setWhyMadeMistake(activeMistake.whyMadeMistake || '');
      setTakeaway(activeMistake.takeaway || '');
      setMistakeType(activeMistake.mistakeType || 'Conceptual');
      setSeverity(activeMistake.severity || 'Medium');
      setStatus(activeMistake.status || 'Unresolved');
      setOccurrencesCount(activeMistake.occurrencesCount || 1);
      setVoiceMemo(activeMistake.voiceMemo);
      setGeminiDiagnostic(activeMistake.geminiDiagnostic);
      setPreventativeRule(activeMistake.preventativeRule);
    } else {
      // Defaults
      if (subjects.length > 0) {
        setSubjectId(subjects[0].id);
        if (subjects[0].chapters.length > 0) {
          setChapter(subjects[0].chapters[0].name);
          if (subjects[0].chapters[0].topics.length > 0) {
            setTopic(subjects[0].chapters[0].topics[0].name);
          }
        }
      }
      setSource('DPP');
      setSourceDetails('');
      setQuestionNumber('');
      setQuestionText('');
      setQuestionImage(undefined);
      setAnnotations([]);
      setWhatWentWrong('');
      setCorrectApproach('');
      setWhyMadeMistake('');
      setTakeaway('');
      setMistakeType('Conceptual');
      setSeverity('Medium');
      setStatus('Unresolved');
      setOccurrencesCount(1);
      setVoiceMemo(undefined);
      setGeminiDiagnostic(undefined);
      setPreventativeRule(undefined);
    }
  }, [activeMistake, isOpen, subjects]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
  const currentChapter = currentSubject?.chapters.find((c) => c.name === chapter);

  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const sub = subjects.find((s) => s.id === newSubjectId);
    if (sub && sub.chapters.length > 0) {
      setChapter(sub.chapters[0].name);
      if (sub.chapters[0].topics.length > 0) {
        setTopic(sub.chapters[0].topics[0].name);
      } else {
        setTopic('');
      }
    } else {
      setChapter('');
      setTopic('');
    }
  };

  const handleChapterChange = (newChapterName: string) => {
    setChapter(newChapterName);
    const chap = currentSubject?.chapters.find((c) => c.name === newChapterName);
    if (chap && chap.topics.length > 0) {
      setTopic(chap.topics[0].name);
    } else {
      setTopic('');
    }
  };

  const handleCreateChapter = async () => {
    if (!newChapterInput.trim() || !currentSubject) return;
    await addChapterToSubject(currentSubject.id, newChapterInput.trim());
    setChapter(newChapterInput.trim());
    setNewChapterInput('');
    setIsAddingChapter(false);
  };

  const handleCreateTopic = async () => {
    if (!newTopicInput.trim() || !currentSubject || !currentChapter) return;
    await addTopicToChapter(currentSubject.id, currentChapter.id, newTopicInput.trim());
    setTopic(newTopicInput.trim());
    setNewTopicInput('');
    setIsAddingTopic(false);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setQuestionImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Paste image support
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            setQuestionImage(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleRunGeminiDiagnosis = async () => {
    setIsAnalyzing(true);
    try {
      const payload: Partial<Mistake> = {
        subjectName: currentSubject?.name || 'Subject',
        chapter,
        topic,
        source,
        questionNumber,
        questionText,
        whatWentWrong,
        correctApproach,
        whyMadeMistake,
        takeaway,
        mistakeType,
      };

      const result = await analyzeMistakeWithGemini(payload);
      if (result) {
        if (result.diagnostic) setGeminiDiagnostic(result.diagnostic);
        if (result.preventativeRule) setPreventativeRule(result.preventativeRule);
        if (result.suggestedTakeaway && !takeaway.trim()) {
          setTakeaway(result.suggestedTakeaway);
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !chapter.trim()) {
      alert('Please select a Subject and Chapter.');
      return;
    }

    setIsSaving(true);
    try {
      const mistakeData = {
        subjectId,
        subjectName: currentSubject?.name || 'General',
        chapter,
        topic: topic || 'General Topic',
        source,
        sourceDetails,
        questionNumber,
        questionText,
        questionImage,
        annotations,
        whatWentWrong,
        correctApproach,
        whyMadeMistake,
        takeaway,
        mistakeType,
        severity,
        status,
        occurrencesCount: Number(occurrencesCount) || 1,
        voiceMemo,
        geminiDiagnostic,
        preventativeRule,
      };

      if (activeMistake) {
        await updateMistake(activeMistake.id, mistakeData);
      } else {
        await addMistake(mistakeData);
      }
      onClose();
    } catch (err) {
      console.error('Error saving mistake:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeMistake) return;
    const title = activeMistake.topic || activeMistake.chapter || 'this mistake';
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteMistake(activeMistake.id);
      onClose();
    }
  };

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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onPaste={handlePaste}
    >
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-mono font-black text-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
                  {activeMistake ? 'Edit Mistake Record' : 'Record New Academic Mistake'}
                </h2>
                {occurrencesCount >= 3 && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-mono font-black uppercase">
                    🔴 REPEATED 3× ALERT
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {currentSubject?.name} → {chapter || 'Select Chapter'} → {topic || 'Select Topic'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch for smaller screens */}
            <div className="flex lg:hidden bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('workspace')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'workspace'
                    ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Question & Canvas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'analysis'
                    ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Analysis & Notes
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Top Taxonomy & Academic Classification Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {/* Subject */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Chapter *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingChapter(!isAddingChapter)}
                  className="text-[10px] text-zinc-900 dark:text-zinc-200 hover:text-black dark:hover:text-white font-mono font-bold flex items-center gap-0.5 uppercase"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>New</span>
                </button>
              </div>
              {isAddingChapter ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newChapterInput}
                    onChange={(e) => setNewChapterInput(e.target.value)}
                    placeholder="New chapter..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-950 dark:border-zinc-400 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-sans font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleCreateChapter}
                    className="px-2.5 py-1 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={chapter}
                  onChange={(e) => handleChapterChange(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans"
                >
                  {currentSubject?.chapters.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Topic */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Topic *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(!isAddingTopic)}
                  className="text-[10px] text-zinc-900 dark:text-zinc-200 hover:text-black dark:hover:text-white font-mono font-bold flex items-center gap-0.5 uppercase"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>New</span>
                </button>
              </div>
              {isAddingTopic ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    placeholder="New topic name..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-950 dark:border-zinc-400 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-sans font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTopic}
                    className="px-2.5 py-1 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans"
                >
                  {currentChapter?.topics.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  )) || <option value="">No topics listed</option>}
                </select>
              )}
            </div>

            {/* Source & Q# */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as AcademicSource)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans"
                >
                  {sourcesList.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Q # / Detail
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q5 / DPP-03"
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Main 2-Column Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT / CENTER: Question + Annotation Workspace */}
            <div
              className={`lg:col-span-7 flex flex-col gap-4 ${
                activeTab === 'workspace' ? 'block' : 'hidden lg:flex'
              }`}
            >
              {/* Question Text / Input */}
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <FileImage className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                    <span>Question Statement / Screenshot</span>
                  </label>

                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 transition-colors shadow-2xs">
                    <Upload className="w-3 h-3 stroke-[2.5]" />
                    <span>UPLOAD / PASTE IMAGE</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Type or paste the problem statement here (or paste screenshot directly into window)..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans font-medium"
                />
              </div>

              {/* Annotation Canvas */}
              <div className="flex-1 flex flex-col min-h-[420px]">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                    <span>Visual Annotation Workspace</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono font-semibold">
                    Draw arrows, encircle flawed lines, highlight traps
                  </span>
                </div>
                <div className="flex-1">
                  <AnnotationCanvas
                    backgroundImage={questionImage}
                    annotations={annotations}
                    onChange={setAnnotations}
                  />
                </div>
              </div>

              {/* Voice Memo Recording */}
              <VoiceRecorder voiceMemo={voiceMemo} onChange={setVoiceMemo} />
            </div>

            {/* RIGHT: Written Analysis & Personal Academic Notes */}
            <div
              className={`lg:col-span-5 flex flex-col gap-4 ${
                activeTab === 'analysis' ? 'block' : 'hidden lg:flex'
              }`}
            >
              {/* Classification metadata: Type, Severity, Status, Occurrences */}
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-3">
                {/* Mistake Type */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Mistake Type
                  </label>
                  <select
                    value={mistakeType}
                    onChange={(e) => setMistakeType(e.target.value as MistakeType)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                  >
                    {mistakeTypesList.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Revision Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MistakeStatus)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
                  >
                    <option value="Unresolved">Unresolved</option>
                    <option value="Needs Revision">Needs Revision</option>
                    <option value="Still Weak">Still Weak</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                {/* Occurrences Counter */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Occurrences (Alert @ 3)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={occurrencesCount}
                      onChange={(e) => setOccurrencesCount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-mono font-bold"
                    />
                    {occurrencesCount >= 3 && (
                      <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 font-mono shrink-0 uppercase">
                        3× Alert
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Written Academic Analysis Fields */}
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3.5 flex-1">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Personal Academic Analysis
                  </span>
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleRunGeminiDiagnosis}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-2xs font-mono"
                    title="Generate instant Gemini diagnostic & takeaway suggestion"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>AI DIAGNOSIS</span>
                  </button>
                </div>

                {/* What did I do wrong? */}
                <div>
                  <label className="block text-xs font-bold text-rose-800 dark:text-rose-400 font-mono uppercase tracking-wide mb-1">
                    What did I do wrong?
                  </label>
                  <textarea
                    rows={2}
                    value={whatWentWrong}
                    onChange={(e) => setWhatWentWrong(e.target.value)}
                    placeholder="e.g. Forgot that l must be strictly less than n..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-600 font-sans font-medium"
                  />
                </div>

                {/* What is the correct approach? */}
                <div>
                  <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 font-mono uppercase tracking-wide mb-1">
                    What is the correct approach?
                  </label>
                  <textarea
                    rows={2}
                    value={correctApproach}
                    onChange={(e) => setCorrectApproach(e.target.value)}
                    placeholder="e.g. Apply the chain inequality: |m| <= l <= n - 1..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 font-sans font-medium"
                  />
                </div>

                {/* Why did I make this mistake? */}
                <div>
                  <label className="block text-xs font-bold text-amber-800 dark:text-amber-400 font-mono uppercase tracking-wide mb-1">
                    Why did I make this mistake?
                  </label>
                  <textarea
                    rows={2}
                    value={whyMadeMistake}
                    onChange={(e) => setWhyMadeMistake(e.target.value)}
                    placeholder="e.g. Rushed because of time pressure / missed checking option B..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-600 font-sans font-medium"
                  />
                </div>

                {/* My Takeaway */}
                <div>
                  <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono uppercase tracking-wide mb-1">
                    My Takeaway (Golden Rule)
                  </label>
                  <textarea
                    rows={2}
                    value={takeaway}
                    onChange={(e) => setTakeaway(e.target.value)}
                    placeholder="e.g. Always check n > l first before evaluating magnetic quantum values..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans font-medium"
                  />
                </div>

                {/* Gemini AI Diagnostic Card if present */}
                {geminiDiagnostic && (
                  <div className="p-3 rounded-xl bg-zinc-950 dark:bg-zinc-900 text-white text-xs space-y-1.5 animate-in fade-in shadow-2xs border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-white font-mono text-xs font-bold uppercase">
                      <Sparkles className="w-3.5 h-3.5 stroke-[2.5] text-emerald-400" />
                      <span>Gemini Root Cause Diagnostic:</span>
                    </div>
                    <p className="leading-relaxed text-zinc-300 text-xs font-medium">{geminiDiagnostic}</p>
                    {preventativeRule && (
                      <div className="pt-1 border-t border-zinc-800 text-xs text-zinc-400 font-mono font-bold">
                        Rule: {preventativeRule}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
            {activeMistake ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold transition-colors font-mono"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>DELETE MISTAKE</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors border border-zinc-300 dark:border-zinc-700 font-mono"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 font-mono"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>SAVING...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>SAVE MISTAKE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
