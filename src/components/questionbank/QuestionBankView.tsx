import React, { useState } from 'react';
import { useQuestionBank } from '../../context/QuestionBankContext';
import { useAcademic } from '../../context/AcademicContext';
import { QuestionBankDocument } from '../../types';
import { DocumentAnnotationStudio } from './DocumentAnnotationStudio';
import {
  BookOpen,
  Search,
  Upload,
  FileText,
  Filter,
  Layers,
  Sparkles,
  Tag,
  ExternalLink,
  Plus,
  X,
  AlertCircle,
  FileUp,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  onOpenMistakeModalWithDocument?: (doc: QuestionBankDocument) => void;
}

export const QuestionBankView: React.FC<Props> = ({ onOpenMistakeModalWithDocument }) => {
  const { documents, loadingDocuments, uploadDocument, activeDoc, setActiveDoc } = useQuestionBank();
  const { subjects } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Physics');
  const [uploadChapter, setUploadChapter] = useState('');
  const [uploadTags, setUploadTags] = useState('JEE Advanced, High Yield');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter tags
  const allTags = Array.from(new Set(documents.flatMap((d) => d.tags || [])));

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.chapter?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'All' || doc.subject === selectedSubject;
    const matchesTag = selectedTag === 'All' || doc.tags?.includes(selectedTag);

    return matchesSearch && matchesSubject && matchesTag;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    // 50 MB limit validation (50 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`File is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed file size is 50 MB.`);
      return;
    }

    // Supported formats
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|pdf)$/i)) {
      setUploadError('Invalid format. Please select a PNG, JPEG, or PDF document.');
      return;
    }

    setSelectedFile(file);

    // Create local object URL for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }
    if (!selectedFile && !filePreviewUrl) {
      setUploadError('Please select a file to upload (PNG/JPEG/PDF up to 50MB).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const tagsArray = uploadTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await uploadDocument({
        title: uploadTitle.trim(),
        subject: uploadSubject,
        chapter: uploadChapter.trim() || undefined,
        fileType: selectedFile?.type === 'application/pdf' ? 'pdf' : 'image',
        fileSize: selectedFile?.size || 1000000,
        fileUrl: filePreviewUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
        tags: tagsArray,
        description: uploadDescription.trim() || undefined,
      });

      // Reset modal
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadChapter('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
                Question Bank & Collaborative Library
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Explore public question sets, test series papers, and formula trap archives. Open any paper to draw freehand doodles, drop problem pins, and create instant mistake records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document (≤ 50MB)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by chapter, topic, tag or title..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        </div>

        {/* Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['All', ...subjects.map((s) => s.name)].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSubject === subj
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Tag className="w-3.5 h-3.5 text-zinc-500 mr-1 flex-shrink-0" />
          <button
            onClick={() => setSelectedTag('All')}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
              selectedTag === 'All'
                ? 'bg-zinc-700 text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'
            }`}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* DOCUMENT GRID */}
      {loadingDocuments ? (
        <div className="p-12 text-center text-xs text-zinc-500">Loading public library...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col items-center">
          <BookOpen className="w-8 h-8 text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No documents found</p>
          <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or upload a question paper.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all flex flex-col shadow-lg hover:shadow-indigo-500/5"
            >
              {/* Document Image Thumbnail */}
              <div
                onClick={() => setActiveDoc(doc)}
                className="relative h-44 bg-zinc-950 overflow-hidden cursor-pointer flex items-center justify-center"
              >
                <img
                  src={doc.fileUrl}
                  alt={doc.title}
                  className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600/90 text-white uppercase tracking-wider shadow-sm">
                    {doc.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-black/60 backdrop-blur-md text-zinc-300 border border-zinc-700">
                    {formatFileSize(doc.fileSize)}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-300">
                  <span className="truncate">{doc.chapter || 'Comprehensive'}</span>
                  <span className="text-zinc-400 text-[10px]">@{doc.uploaderUsername}</span>
                </div>
              </div>

              {/* Document Body Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => setActiveDoc(doc)}
                    className="text-sm font-bold text-zinc-100 hover:text-indigo-400 cursor-pointer line-clamp-2 leading-snug mb-2"
                  >
                    {doc.title}
                  </h3>

                  {doc.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveDoc(doc)}
                    className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Open & Annotate</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenMistakeModalWithDocument) {
                        onOpenMistakeModalWithDocument(doc);
                      }
                    }}
                    className="py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    title="Track as a mistake"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL (MAX 50MB SUPPORT) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileUp className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-100">Upload Public Question Document</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-500 hover:text-zinc-200 text-xs p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., JEE Advanced 2024 Physics Paper 1 — Solutions & Traps"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Subject & Chapter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Subject *
                  </label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Chapter
                  </label>
                  <input
                    type="text"
                    value={uploadChapter}
                    onChange={(e) => setUploadChapter(e.target.value)}
                    placeholder="e.g. Electrodynamics"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g. PYQ, High Yield, AITS, Tricky"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Description / Topic Notes
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Optional brief description of key concepts tested in this paper..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                />
              </div>

              {/* File Upload Drop Area */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Document File (PNG, JPEG, PDF ≤ 50MB) *
                </label>
                <label className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-950/60">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold text-zinc-200">{selectedFile.name}</p>
                        <p className="text-[10px] text-zinc-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <FileUp className="w-6 h-6 text-indigo-400 mx-auto" />
                      <p className="text-zinc-300 font-medium">Click or drag & drop file</p>
                      <p className="text-[10px] text-zinc-500">PNG, JPEG, PDF up to 50 MB</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Publish to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN ANNOTATION STUDIO OVERLAY */}
      {activeDoc && (
        <DocumentAnnotationStudio
          document={activeDoc}
          onClose={() => setActiveDoc(null)}
          onBridgeToMistake={(doc) => {
            setActiveDoc(null);
            if (onOpenMistakeModalWithDocument) {
              onOpenMistakeModalWithDocument(doc);
            }
          }}
        />
      )}
    </div>
  );
};
