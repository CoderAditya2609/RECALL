import React, { useState, useRef, useEffect } from 'react';
import { useQuestionBank } from '../../context/QuestionBankContext';
import { useAcademic } from '../../context/AcademicContext';
import { QuestionBankDocument, DoodleStroke, DocumentMark, DocumentHighlight } from '../../types';
import {
  ArrowLeft,
  PenTool,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Star,
  Flag,
  HelpCircle,
  CheckCircle2,
  Save,
  FileText,
  PlusCircle,
  Tag,
  Share2,
} from 'lucide-react';

interface Props {
  document: QuestionBankDocument;
  onClose: () => void;
  onBridgeToMistake: (doc: QuestionBankDocument) => void;
}

const COLOR_PALETTE = [
  { name: 'Amber', color: '#fbbf24' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Sky', color: '#38bdf8' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Violet', color: '#a855f7' },
  { name: 'White', color: '#ffffff' },
];

export const DocumentAnnotationStudio: React.FC<Props> = ({ document: docItem, onClose, onBridgeToMistake }) => {
  const { activeAnnotation, saveAnnotation, isSavingAnnotation } = useQuestionBank();
  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'eraser' | 'mark'>('pen');
  const [selectedColor, setSelectedColor] = useState('#fbbf24');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedMarkType, setSelectedMarkType] = useState<'star' | 'flag' | 'question' | 'check'>('star');
  
  // Annotation state
  const [strokes, setStrokes] = useState<DoodleStroke[]>([]);
  const [marks, setMarks] = useState<DocumentMark[]>([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [history, setHistory] = useState<DoodleStroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Zoom & Viewport
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Sync loaded annotation
  useEffect(() => {
    if (activeAnnotation) {
      setStrokes(activeAnnotation.strokes || []);
      setMarks(activeAnnotation.marks || []);
      setPersonalNotes(activeAnnotation.personalNotes || '');
      setHistory([activeAnnotation.strokes || []]);
      setHistoryIndex(0);
    }
  }, [activeAnnotation]);

  // Redraw canvas whenever strokes change or zoom changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.tool === 'highlighter' ? stroke.width * 3 : stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : stroke.opacity || 1;

      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    ctx.globalAlpha = 1.0;
  }, [strokes]);

  // Auto-resize canvas overlay to match image dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (canvasRef.current) {
      canvasRef.current.width = img.naturalWidth || img.clientWidth;
      canvasRef.current.height = img.naturalHeight || img.clientHeight;
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'mark') {
      // Place a mark pin at percentage coordinates
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pctX = ((e.clientX - rect.left) / rect.width) * 100;
      const pctY = ((e.clientY - rect.top) / rect.height) * 100;

      const newMark: DocumentMark = {
        id: `mark-${Date.now()}`,
        type: selectedMarkType,
        x: Math.round(pctX * 10) / 10,
        y: Math.round(pctY * 10) / 10,
        note: `Marked as ${selectedMarkType}`,
      };
      setMarks((prev) => [...prev, newMark]);
      return;
    }

    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    currentPointsRef.current = [coords];
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'mark') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCanvasCoords(e);
    currentPointsRef.current.push(coords);

    // Live preview stroke
    const pts = currentPointsRef.current;
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'eraser' ? '#09090b' : selectedColor;
      ctx.lineWidth = activeTool === 'highlighter' ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1.0;

      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 1) {
      const newStroke: DoodleStroke = {
        id: `stroke-${Date.now()}`,
        tool: activeTool === 'eraser' ? 'eraser' : activeTool === 'highlighter' ? 'highlighter' : 'pen',
        color: selectedColor,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.35 : 1.0,
        points: [...currentPointsRef.current],
      };

      const updated = [...strokes, newStroke];
      setStrokes(updated);

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updated);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setStrokes(history[newIdx]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setStrokes([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setStrokes(history[newIdx]);
    }
  };

  const handleClearCanvas = () => {
    if (window.confirm('Clear all your freehand doodle annotations on this document?')) {
      setStrokes([]);
      setMarks([]);
      const newHistory = [...history, []];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleManualSave = async () => {
    await saveAnnotation(docItem.id, {
      strokes,
      highlights: [],
      marks,
      personalNotes,
    });
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const renderMarkIcon = (type: DocumentMark['type']) => {
    switch (type) {
      case 'star':
        return <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />;
      case 'flag':
        return <Flag className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />;
      case 'question':
        return <HelpCircle className="w-3.5 h-3.5 fill-sky-400 text-sky-400" />;
      case 'check':
        return <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden text-zinc-100 animate-in fade-in duration-150">
      {/* TOP BAR: Document Title, Tools, Actions */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 flex items-center justify-between gap-2">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Back to Question Bank"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zinc-100 truncate">{docItem.title}</h2>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="text-indigo-400 font-medium">{docItem.subject}</span>
              <span>•</span>
              <span>{docItem.chapter || 'All Chapters'}</span>
              <span>•</span>
              <span className="text-zinc-500">Uploaded by @{docItem.uploaderUsername}</span>
            </div>
          </div>
        </div>

        {/* Center: Doodling & Annotation Tools */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {/* Pen */}
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
              activeTool === 'pen' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Pen Tool (Ink)"
          >
            <PenTool className="w-4 h-4" />
            <span>Pen</span>
          </button>

          {/* Highlighter */}
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
              activeTool === 'highlighter' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
            <span>Highlighter</span>
          </button>

          {/* Eraser */}
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
              activeTool === 'eraser' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
            <span>Eraser</span>
          </button>

          {/* Marks */}
          <button
            onClick={() => setActiveTool('mark')}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
              activeTool === 'mark' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Drop Problem Pin / Mark"
          >
            <Star className="w-4 h-4" />
            <span>Pin Mark</span>
          </button>

          <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

          {/* Color Selectors */}
          {activeTool !== 'eraser' && (
            <div className="flex items-center gap-1 px-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.color}
                  onClick={() => setSelectedColor(c.color)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    selectedColor === c.color ? 'scale-125 border-white shadow-sm ring-2 ring-indigo-500/50' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Stroke Width */}
          <div className="flex items-center gap-1 px-2">
            <span className="text-[10px] text-zinc-500">Size</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-14 accent-indigo-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
            />
          </div>

          <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex < 0}
            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearCanvas}
            className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/30"
            title="Clear all doodles"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions: Notes, Bridge to Mistake, Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBridgeToMistake(docItem)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
            title="Log a question from this document into your Mistake Notebook"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Track as Mistake</span>
          </button>

          <button
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`p-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showNotesDrawer
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title="Open Personal Notes Drawer"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <button
            onClick={handleManualSave}
            disabled={isSavingAnnotation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccessNotice ? 'Saved!' : isSavingAnnotation ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* SUB-TOOLBAR FOR MOBILE & PIN MARKS SELECTION */}
      {activeTool === 'mark' && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-3 text-xs justify-center">
          <span className="text-zinc-400 font-medium">Select Pin Mark:</span>
          <div className="flex items-center gap-2">
            {(['star', 'flag', 'question', 'check'] as const).map((mType) => (
              <button
                key={mType}
                onClick={() => setSelectedMarkType(mType)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs capitalize ${
                  selectedMarkType === mType
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {renderMarkIcon(mType)}
                <span>{mType}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-zinc-500 ml-2 hidden sm:inline">(Click anywhere on document to place pin)</span>
        </div>
      )}

      {/* MAIN DOCUMENT VIEWPORT & CANVAS STAGE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Document Scroll Canvas Container */}
        <div className="flex-1 overflow-auto bg-zinc-950 flex items-center justify-center p-4 sm:p-8">
          <div
            className="relative shadow-2xl rounded-lg border border-zinc-800 bg-zinc-900 select-none"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Base Question Paper Image */}
            <img
              src={docItem.fileUrl}
              alt={docItem.title}
              onLoad={handleImageLoad}
              className="max-w-[90vw] md:max-w-[800px] h-auto object-contain block pointer-events-none rounded-lg"
            />

            {/* Freehand Doodle Annotation Canvas Overlay */}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className={`absolute inset-0 w-full h-full ${
                activeTool === 'mark' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />

            {/* Render Problem Marks Pins on Top */}
            {marks.map((mark) => (
              <div
                key={mark.id}
                style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-950/90 border border-zinc-600 shadow-md flex items-center justify-center transition-transform hover:scale-125">
                  {renderMarkIcon(mark.type)}
                </div>
                {mark.note && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-zinc-700 pointer-events-none shadow-lg">
                    {mark.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FLOATING ZOOM CONTROLS */}
        <div className="absolute bottom-6 left-6 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-1 flex items-center gap-1 shadow-lg z-20">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-zinc-300 px-2">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RIGHT SIDEBAR: PERSONAL STUDY NOTES DRAWER */}
        {showNotesDrawer && (
          <div className="w-80 lg:w-96 border-l border-zinc-800 bg-zinc-900 flex flex-col h-full shadow-2xl z-30 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Personal Study Notes</h3>
              </div>
              <button
                onClick={() => setShowNotesDrawer(false)}
                className="text-zinc-500 hover:text-zinc-200 text-xs"
              >
                Close
              </button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Document Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {docItem.tags?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  My Private Solution Notes & Observations
                </label>
                <textarea
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder="Record your steps, derivation shortcuts, or why a question in this paper was difficult..."
                  className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {marks.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Marked Items ({marks.length})
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {marks.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {renderMarkIcon(m.type)}
                          <span className="text-zinc-300 font-medium capitalize">{m.type} Pin</span>
                        </div>
                        <button
                          onClick={() => setMarks((prev) => prev.filter((p) => p.id !== m.id))}
                          className="text-rose-400 hover:text-rose-300 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
              <button
                onClick={handleManualSave}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Save Notes & Annotations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
