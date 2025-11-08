'use client';

import { useState, useRef, useEffect } from 'react';
import { Photo } from '@/types';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

interface ImageEditorProps {
  photo: Photo;
  onSave: (editedFile: File) => Promise<void>;
  onCancel: () => void;
}

type Tool = 'arrow' | 'text' | 'marker' | 'select';

interface Drawing {
  type: 'arrow' | 'text' | 'marker';
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[]; // Для маркера - массив точек
}

export default function ImageEditor({ photo, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>('arrow');
  const [color, setColor] = useState('#00ff00'); // Matrix green
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [history, setHistory] = useState<Drawing[][]>([]);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка изображения на canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Устанавливаем размер canvas
      const maxWidth = 1200;
      const maxHeight = 800;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Рисуем изображение
      ctx.drawImage(img, 0, 0, width, height);
      redrawCanvas();
    };
    img.onerror = () => {
      setError('Не удалось загрузить изображение');
    };
    img.src = photo.url;
  }, [photo.url]);

  // Перерисовка canvas с учетом всех рисунков
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем изображение
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Рисуем все элементы
    drawings.forEach((drawing) => {
      ctx.strokeStyle = drawing.color;
      ctx.fillStyle = drawing.color;
      ctx.lineWidth = drawing.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawing.type === 'arrow') {
        drawArrow(ctx, drawing.x1, drawing.y1, drawing.x2 || drawing.x1, drawing.y2 || drawing.y1);
      } else if (drawing.type === 'marker' && drawing.points && drawing.points.length > 0) {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
        for (let i = 1; i < drawing.points.length; i++) {
          ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
        }
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.lineWidth * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (drawing.type === 'text' && drawing.text) {
        ctx.font = `${drawing.lineWidth * 5}px monospace`;
        ctx.fillText(drawing.text, drawing.x1, drawing.y1);
      }
    });
  };

  // Рисование стрелки
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headlen = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  useEffect(() => {
    redrawCanvas();
    
    // Рисуем текущий путь маркера поверх
    if (isDrawing && tool === 'marker' && currentPath.length > 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [drawings, currentPath, isDrawing, tool, color, lineWidth]);

  // Получение координат мыши относительно canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Получение координат touch относительно canvas
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const handleStart = (pos: { x: number; y: number }) => {
    if (tool === 'text') {
      setTextPosition(pos);
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);

    if (tool === 'marker') {
      // Начинаем новый путь для маркера
      setCurrentPath([pos]);
    }
  };

  const handleMove = (pos: { x: number; y: number }) => {
    if (!isDrawing || tool === 'text') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'arrow') {
      // Временная отрисовка стрелки
      redrawCanvas();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y);
    } else if (tool === 'marker') {
      // Добавляем точку в текущий путь (отрисовка произойдет в useEffect)
      setCurrentPath([...currentPath, pos]);
    }
  };

  const handleEnd = (pos: { x: number; y: number }) => {
    if (!isDrawing || tool === 'text') {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    if (tool === 'arrow') {
      const newDrawing: Drawing = {
        type: 'arrow',
        x1: startPos.x,
        y1: startPos.y,
        x2: pos.x,
        y2: pos.y,
        color,
        lineWidth,
      };
      setDrawings([...drawings, newDrawing]);
      setHistory([...history, drawings]);
    } else if (tool === 'marker' && currentPath.length > 0) {
      // Сохраняем путь маркера
      const newDrawing: Drawing = {
        type: 'marker',
        x1: currentPath[0].x,
        y1: currentPath[0].y,
        points: [...currentPath],
        color,
        lineWidth,
      };
      setDrawings([...drawings, newDrawing]);
      setHistory([...history, drawings]);
      setCurrentPath([]);
    }

    setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getMousePos(e);
    handleStart(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getMousePos(e);
    handleMove(pos);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getMousePos(e);
    handleEnd(pos);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    handleStart(pos);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    handleMove(pos);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    handleEnd(pos);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setDrawings(previousState);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    setError(null);

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Не удалось создать изображение');
          setSaving(false);
          return;
        }

        const file = new File([blob], photo.fileName, { type: 'image/png' });
        await onSave(file);
      }, 'image/png');
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении');
      setSaving(false);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPosition) return;

    const newDrawing: Drawing = {
      type: 'text',
      x1: textPosition.x,
      y1: textPosition.y,
      text: textInput,
      color,
      lineWidth,
    };
    setDrawings([...drawings, newDrawing]);
    setHistory([...history, drawings]);
    setTextInput('');
    setTextPosition(null);
  };

  return (
    <div className="fixed inset-0 bg-[var(--matrix-black)] bg-opacity-95 z-50 flex flex-col p-4">
      <div className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full">
        {/* Панель инструментов */}
        <div className="w-full mb-4 p-2 md:p-4 bg-[var(--matrix-gray-dark)] border-2 border-[var(--matrix-green-dark)] rounded overflow-x-auto">
          <div className="flex flex-wrap gap-2 items-center justify-center min-w-max">
            {/* Инструменты */}
            <div className="flex gap-2">
              <button
                onClick={() => setTool('arrow')}
                className={`px-2 md:px-4 py-2 border-2 font-mono text-xs md:text-sm transition-all min-h-[44px] ${
                  tool === 'arrow'
                    ? 'border-[var(--matrix-green-bright)] bg-[var(--matrix-green-dark)] text-[var(--matrix-green-bright)]'
                    : 'border-[var(--matrix-green-dark)] text-[var(--matrix-green-dark)] hover:border-[var(--matrix-green-soft)] active:border-[var(--matrix-green-bright)]'
                }`}
              >
                → СТРЕЛКА
              </button>
              <button
                onClick={() => setTool('text')}
                className={`px-2 md:px-4 py-2 border-2 font-mono text-xs md:text-sm transition-all min-h-[44px] ${
                  tool === 'text'
                    ? 'border-[var(--matrix-green-bright)] bg-[var(--matrix-green-dark)] text-[var(--matrix-green-bright)]'
                    : 'border-[var(--matrix-green-dark)] text-[var(--matrix-green-dark)] hover:border-[var(--matrix-green-soft)] active:border-[var(--matrix-green-bright)]'
                }`}
              >
                T ТЕКСТ
              </button>
              <button
                onClick={() => setTool('marker')}
                className={`px-2 md:px-4 py-2 border-2 font-mono text-xs md:text-sm transition-all min-h-[44px] ${
                  tool === 'marker'
                    ? 'border-[var(--matrix-green-bright)] bg-[var(--matrix-green-dark)] text-[var(--matrix-green-bright)]'
                    : 'border-[var(--matrix-green-dark)] text-[var(--matrix-green-dark)] hover:border-[var(--matrix-green-soft)] active:border-[var(--matrix-green-bright)]'
                }`}
              >
                ● МАРКЕР
              </button>
            </div>

            {/* Цвета */}
            <div className="flex gap-2 items-center">
              <span className="text-[var(--matrix-green-dark)] font-mono text-xs">ЦВЕТ:</span>
              {['#00ff00', '#00ffff', '#ffff00', '#ff00ff', '#ff0000', '#ffffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 border-2 ${
                    color === c ? 'border-[var(--matrix-green-bright)] scale-110' : 'border-[var(--matrix-green-dark)]'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Толщина */}
            <div className="flex gap-2 items-center">
              <span className="text-[var(--matrix-green-dark)] font-mono text-xs">ТОЛЩИНА:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-[var(--matrix-green-dark)] font-mono text-xs w-8">{lineWidth}</span>
            </div>

            {/* Отмена */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`px-2 md:px-4 py-2 border-2 font-mono text-xs md:text-sm transition-all min-h-[44px] ${
                history.length === 0
                  ? 'border-[var(--matrix-gray-dark)] text-[var(--matrix-gray-dark)] cursor-not-allowed'
                  : 'border-[var(--matrix-yellow-neon)] text-[var(--matrix-yellow-neon)] hover:bg-[var(--matrix-yellow-neon)] hover:text-[var(--matrix-black)] active:bg-[var(--matrix-yellow-neon)] active:text-[var(--matrix-black)]'
              }`}
            >
              ↶ ОТМЕНА
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center w-full overflow-auto">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="border-2 border-[var(--matrix-green-bright)] max-w-full max-h-full cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Ввод текста */}
        {textPosition && (
          <div
            className="absolute p-4 bg-[var(--matrix-black)] border-2 border-[var(--matrix-green-bright)]"
            style={{ left: textPosition.x + 20, top: textPosition.y + 20 }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit();
                } else if (e.key === 'Escape') {
                  setTextPosition(null);
                  setTextInput('');
                }
              }}
              placeholder="Введите текст..."
              className="bg-[var(--matrix-gray-dark)] border border-[var(--matrix-green-dark)] text-[var(--matrix-green-bright)] font-mono px-2 py-1 outline-none focus:border-[var(--matrix-green-bright)]"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleTextSubmit} size="sm">ДОБАВИТЬ</Button>
              <Button onClick={() => { setTextPosition(null); setTextInput(''); }} size="sm" variant="secondary">ОТМЕНА</Button>
            </div>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <p className="text-[var(--matrix-red-neon)] font-mono text-sm text-glow-red mt-2">
            {error}
          </p>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-4 mt-4">
          <Button
            onClick={handleSave}
            size="lg"
            disabled={saving}
          >
            {saving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
          </Button>
          <Button
            onClick={onCancel}
            size="lg"
            variant="danger"
            disabled={saving}
          >
            ОТМЕНА
          </Button>
        </div>

        {saving && (
          <div className="mt-2">
            <Loading text="СОХРАНЕНИЕ..." />
          </div>
        )}
      </div>
    </div>
  );
}

