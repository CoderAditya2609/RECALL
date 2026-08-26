import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Highlighter,
  Type,
  MoveRight,
  Circle,
  Square,
  StickyNote,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { AnnotationItem, AnnotationPoint } from '../../types';

interface AnnotationCanvasProps {
  backgroundImage?: string;
  annotations: AnnotationItem[];
  onChange: (annotations: AnnotationItem[]) => void;
  readOnly?: boolean;
}

type ToolMode = 'pen' | 'highlighter' | 'text' | 'arrow' | 'circle' | 'rectangle' | 'sticky' | 'eraser';

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  backgroundImage,
  annotations,
  onChange,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState('#EF4444'); // Default red for marking mistakes
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<AnnotationPoint[]>([]);
  const [startPoint, setStartPoint] = useState<AnnotationPoint | null>(null);
  const [history, setHistory] = useState<AnnotationItem[][]>([annotations]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string; isSticky?: boolean } | null>(null);

  const colors = [
    '#EF4444', // Red
    '#F59E0B', // Amber/Yellow
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#FFFFFF', // White
  ];

  // Sync external annotations if needed
  useEffect(() => {
    redrawCanvas();
  }, [annotations, backgroundImage, zoom]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If background image exists
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        // Draw background fitted
        ctx.save();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        renderAllAnnotations(ctx);
      };
      if (img.complete) {
        ctx.save();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        renderAllAnnotations(ctx);
      }
    } else {
      // Draw grid / placeholder surface
      ctx.fillStyle = '#141720';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle grid
      ctx.strokeStyle = '#1D2230';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      renderAllAnnotations(ctx);
    }
  };

  const renderAllAnnotations = (ctx: CanvasRenderingContext2D) => {
    annotations.forEach((item) => {
      ctx.save();
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = item.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (item.type === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = item.strokeWidth * 3.5;
      } else {
        ctx.globalAlpha = item.opacity || 1.0;
      }

      if ((item.type === 'pen' || item.type === 'highlighter') && item.points && item.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length; i++) {
          ctx.lineTo(item.points[i].x, item.points[i].y);
        }
        ctx.stroke();
      } else if (item.type === 'arrow' && item.points && item.points.length >= 2) {
        const from = item.points[0];
        const to = item.points[item.points.length - 1];
        drawArrow(ctx, from.x, from.y, to.x, to.y, item.strokeWidth);
      } else if (item.type === 'rectangle' && item.x !== undefined && item.y !== undefined && item.width && item.height) {
        ctx.beginPath();
        ctx.strokeRect(item.x, item.y, item.width, item.height);
      } else if (item.type === 'circle' && item.x !== undefined && item.y !== undefined && item.width && item.height) {
        ctx.beginPath();
        const radiusX = Math.abs(item.width) / 2;
        const radiusY = Math.abs(item.height) / 2;
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        ctx.ellipse(centerX, centerY, Math.max(2, radiusX), Math.max(2, radiusY), 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (item.type === 'text' && item.text && item.x !== undefined && item.y !== undefined) {
        ctx.font = 'bold 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillText(item.text, item.x, item.y);
      } else if (item.type === 'sticky' && item.text && item.x !== undefined && item.y !== undefined) {
        // Draw sticky note background
        ctx.fillStyle = '#FEF08A'; // Yellow note
        ctx.globalAlpha = 0.95;
        const w = 180;
        const h = 80;
        ctx.fillRect(item.x, item.y, w, h);
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 1;
        ctx.strokeRect(item.x, item.y, w, h);

        // Header bar
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(item.x, item.y, w, 16);

        // Text
        ctx.fillStyle = '#1E293B';
        ctx.font = '12px sans-serif';
        ctx.fillText(item.text.slice(0, 70), item.x + 8, item.y + 36);
      }

      ctx.restore();
    });
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number
  ) => {
    const headlen = Math.max(10, width * 3.5);
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): AnnotationPoint => {
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const pt = getCanvasCoords(e);

    if (tool === 'eraser') {
      // Remove clicked annotation
      const threshold = 15;
      const filtered = annotations.filter((item) => {
        if (item.points) {
          return !item.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < threshold);
        }
        if (item.x !== undefined && item.y !== undefined) {
          const w = item.width || 80;
          const h = item.height || 30;
          return !(pt.x >= item.x && pt.x <= item.x + w && pt.y >= item.y && pt.y <= item.y + h);
        }
        return true;
      });
      commitAnnotations(filtered);
      return;
    }

    if (tool === 'text' || tool === 'sticky') {
      setTextInput({ x: pt.x, y: pt.y, text: '', isSticky: tool === 'sticky' });
      return;
    }

    setIsDrawing(true);
    setStartPoint(pt);
    setCurrentPoints([pt]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const pt = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'highlighter') {
      const newPoints = [...currentPoints, pt];
      setCurrentPoints(newPoints);

      redrawCanvas();

      // Draw live stroke
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = strokeWidth * 3.5;
      }
      ctx.beginPath();
      ctx.moveTo(newPoints[0].x, newPoints[0].y);
      for (let i = 1; i < newPoints.length; i++) {
        ctx.lineTo(newPoints[i].x, newPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
    } else if (startPoint && (tool === 'arrow' || tool === 'rectangle' || tool === 'circle')) {
      redrawCanvas();
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = strokeWidth;
      if (tool === 'arrow') {
        drawArrow(ctx, startPoint.x, startPoint.y, pt.x, pt.y, strokeWidth);
      } else if (tool === 'rectangle') {
        ctx.strokeRect(startPoint.x, startPoint.y, pt.x - startPoint.x, pt.y - startPoint.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(pt.x - startPoint.x) / 2;
        const ry = Math.abs(pt.y - startPoint.y) / 2;
        const cx = Math.min(startPoint.x, pt.x) + rx;
        const cy = Math.min(startPoint.y, pt.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    const endPoint = getCanvasCoords(e);

    let newItem: AnnotationItem | null = null;
    const id = `ann-${Date.now()}`;

    if (tool === 'pen' || tool === 'highlighter') {
      if (currentPoints.length > 0) {
        newItem = {
          id,
          type: tool,
          points: currentPoints,
          color,
          strokeWidth,
        };
      }
    } else if (startPoint && tool === 'arrow') {
      newItem = {
        id,
        type: 'arrow',
        points: [startPoint, endPoint],
        color,
        strokeWidth,
      };
    } else if (startPoint && tool === 'rectangle') {
      newItem = {
        id,
        type: 'rectangle',
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
        color,
        strokeWidth,
      };
    } else if (startPoint && tool === 'circle') {
      newItem = {
        id,
        type: 'circle',
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
        color,
        strokeWidth,
      };
    }

    if (newItem) {
      commitAnnotations([...annotations, newItem]);
    }
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const commitAnnotations = (newAnnotations: AnnotationItem[]) => {
    onChange(newAnnotations);
    const newHist = history.slice(0, historyIndex + 1);
    setHistory([...newHist, newAnnotations]);
    setHistoryIndex(newHist.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onChange(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onChange(next);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all annotations on this question?')) {
      commitAnnotations([]);
    }
  };

  const handleAddText = () => {
    if (!textInput || !textInput.text.trim()) {
      setTextInput(null);
      return;
    }
    const newItem: AnnotationItem = {
      id: `ann-${Date.now()}`,
      type: textInput.isSticky ? 'sticky' : 'text',
      x: textInput.x,
      y: textInput.y,
      text: textInput.text.trim(),
      color: textInput.isSticky ? '#1E293B' : color,
      strokeWidth,
    };
    commitAnnotations([...annotations, newItem]);
    setTextInput(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border-2 border-zinc-900 overflow-hidden shadow-2xs">
      {/* Floating Toolbar */}
      {!readOnly && (
        <div className="bg-zinc-950 border-b border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-white">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'pen' ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Pen (Draw error or highlight line)"
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('highlighter')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'highlighter' ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Highlighter"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('arrow')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'arrow' ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Arrow (Point to mistake step)"
            >
              <MoveRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('circle')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'circle' ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Circle / Encircle flawed step"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('rectangle')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'rectangle' ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('text')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'text' ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Text Annotation"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('sticky')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'sticky' ? 'bg-white text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Sticky Note Callout"
            >
              <StickyNote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded text-xs transition-colors ${
                tool === 'eraser' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Eraser (Click element to remove)"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  color === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Stroke:</span>
            <input
              type="range"
              min="1"
              max="8"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Undo / Redo / Zoom / Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-zinc-800 mx-0.5" />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
              className="p-1.5 rounded text-zinc-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
              className="p-1.5 rounded text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1.5 rounded text-zinc-400 hover:text-white"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 ml-1"
              title="Clear all annotations"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto flex items-center justify-center p-4 min-h-[360px] bg-zinc-950"
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="relative shadow-2xl transition-transform duration-75"
        >
          <canvas
            ref={canvasRef}
            width={720}
            height={480}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`border border-zinc-800 rounded-lg shadow-inner ${
              readOnly ? 'cursor-default' : tool === 'eraser' ? 'cursor-crosshair' : 'cursor-crosshair'
            }`}
          />

          {/* Text/Sticky Input Modal overlay on canvas */}
          {textInput && (
            <div
              className="absolute z-20 bg-zinc-900 p-2.5 rounded-lg border-2 border-white shadow-2xl"
              style={{
                left: `${(textInput.x / 720) * 100}%`,
                top: `${(textInput.y / 480) * 100}%`,
                transform: 'translate(-10%, -10%)',
                minWidth: '220px',
              }}
            >
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase mb-1">
                {textInput.isSticky ? 'Sticky Note Text:' : 'Add Annotation Text:'}
              </div>
              <textarea
                autoFocus
                rows={2}
                value={textInput.text}
                onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddText();
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-white font-sans font-medium"
                placeholder="Type note and press Enter..."
              />
              <div className="flex justify-end gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setTextInput(null)}
                  className="px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white font-mono font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleAddText}
                  className="px-2.5 py-0.5 rounded text-[10px] bg-white text-zinc-950 font-mono font-bold hover:bg-zinc-200"
                >
                  ADD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
