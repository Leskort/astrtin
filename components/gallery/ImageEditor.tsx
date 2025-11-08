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
  const [redoHistory, setRedoHistory] = useState<Drawing[][]>([]);
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

      // Устанавливаем размер canvas с учетом мобильных устройств
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const maxWidth = isMobile ? Math.min(window.innerWidth - 32, 800) : 1200; // 32px для отступов
      const maxHeight = isMobile ? Math.min(window.innerHeight * 0.4, 600) : 800; // 40% высоты экрана на мобильных
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

  // Получение координат мыши относительно canvas с учетом масштаба
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

  // Получение координат touch относительно canvas с учетом масштаба
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return { x: 0, y: 0 };
    
    // Используем реальные размеры canvas, а не стилизованные
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    return {
      x: Math.max(0, Math.min(x, canvas.width)),
      y: Math.max(0, Math.min(y, canvas.height)),
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
      // Добавляем точку в текущий путь только если она достаточно далеко от предыдущей
      if (currentPath.length === 0) {
        setCurrentPath([pos]);
      } else {
        const lastPoint = currentPath[currentPath.length - 1];
        const distance = Math.sqrt(Math.pow(pos.x - lastPoint.x, 2) + Math.pow(pos.y - lastPoint.y, 2));
        
        // Добавляем точку только если она на расстоянии больше 1 пикселя
        if (distance > 1) {
          setCurrentPath([...currentPath, pos]);
        }
      }
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
      setRedoHistory([]); // Очищаем redo при новом действии
    } else if (tool === 'marker' && currentPath.length > 0) {
      // Упрощаем путь маркера - убираем слишком близкие точки для плавности
      const simplifiedPath = simplifyPath(currentPath, 2);
      
      if (simplifiedPath.length > 1) {
        const newDrawing: Drawing = {
          type: 'marker',
          x1: simplifiedPath[0].x,
          y1: simplifiedPath[0].y,
          points: simplifiedPath,
          color,
          lineWidth,
        };
        setDrawings([...drawings, newDrawing]);
        setHistory([...history, drawings]);
        setRedoHistory([]); // Очищаем redo при новом действии
      }
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
    e.stopPropagation();
    const pos = getTouchPos(e);
    handleMove(pos);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    handleEnd(pos);
  };

  // Упрощение пути для плавности
  const simplifyPath = (points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] => {
    if (points.length <= 2) return points;
    
    const simplified: { x: number; y: number }[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const dist1 = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
      const dist2 = Math.sqrt(Math.pow(next.x - curr.x, 2) + Math.pow(next.y - curr.y, 2));
      
      // Добавляем точку только если она достаточно далеко от предыдущей
      if (dist1 > tolerance || dist2 > tolerance) {
        simplified.push(curr);
      }
    }
    
    simplified.push(points[points.length - 1]);
    return simplified;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setRedoHistory([...redoHistory, drawings]); // Сохраняем текущее состояние в redo
    setHistory(history.slice(0, -1));
    setDrawings(previousState);
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const nextState = redoHistory[redoHistory.length - 1];
    setHistory([...history, drawings]); // Сохраняем текущее состояние в undo
    setRedoHistory(redoHistory.slice(0, -1));
    setDrawings(nextState);
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
    setRedoHistory([]); // Очищаем redo при новом действии
    setTextInput('');
    setTextPosition(null);
  };

  return (
    <div className="fixed inset-0 bg-[var(--matrix-black)] bg-opacity-95 z-50 flex flex-col p-2 md:p-4 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full overflow-hidden">
        {/* Панель инструментов - адаптирована для мобильных */}
        <div className="w-full mb-2 md:mb-4 p-2 md:p-4 bg-[var(--matrix-gray-dark)] border-2 border-[var(--matrix-green-dark)] rounded overflow-x-auto">
          <div className="flex flex-wrap gap-2 items-center justify-center min-w-max">
            {/* Инструменты - увеличенные кнопки для мобильных */}
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setTool('arrow')}
                className={`px-4 md:px-4 py-3 md:py-2 border-2 font-mono text-sm md:text-sm transition-all min-h-[48px] min-w-[100px] touch-manipulation ${
                  tool === 'arrow'
                    ? 'border-[var(--matrix-green-bright)] bg-[var(--matrix-green-dark)] text-[var(--matrix-green-bright)]'
                    : 'border-[var(--matrix-green-dark)] text-[var(--matrix-green-dark)] active:border-[var(--matrix-green-bright)] active:bg-[var(--matrix-green-dark)]'
                }`}
              >
                → СТРЕЛКА
              </button>
              <button
                onClick={() => setTool('text')}
                className={`px-4 md:px-4 py-3 md:py-2 border-2 font-mono text-sm md:text-sm transition-all min-h-[48px] min-w-[100px] touch-manipulation ${
                  tool === 'text'
                    ? 'border-[var(--matrix-green-bright)] bg-[var(--matrix-green-dark)] text-[var(--matrix-green-bright)]'
                    : 'border-[var(--matrix-green-dark)] text-[var(--matrix-green-dark)] active:border-[var(--matrix-green-bright)] active:bg-[var(--matrix-green-dark)]'
                }`}
              >
                T ТЕКСТ
              </button>
              <button
                onClick={() => setTool('marker')}
                className={`px-4 md:px-4 py-3 md:py-2 border-2 font-mono text-sm md:text-sm transition-all min-h-[48px] min-w-[100px] touch-manipulation ${
                  tool === 'marker'
                    ? 'border-[var(--matrix-green-bright)] bg-[var(--matrix-green-dark)] text-[var(--matrix-green-bright)]'
                    : 'border-[var(--matrix-green-dark)] text-[var(--matrix-green-dark)] active:border-[var(--matrix-green-bright)] active:bg-[var(--matrix-green-dark)]'
                }`}
              >
                ● МАРКЕР
              </button>
            </div>

            {/* Цвета - увеличенные для мобильных */}
            <div className="flex gap-2 items-center flex-wrap justify-center">
              <span className="text-[var(--matrix-green-dark)] font-mono text-xs md:text-sm">ЦВЕТ:</span>
              {['#00ff00', '#00ffff', '#ffff00', '#ff00ff', '#ff0000', '#ffffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 md:w-8 md:h-8 rounded-full border-2 transition-all touch-manipulation ${
                    color === c ? 'scale-110 ring-2 ring-[var(--matrix-green-bright)]' : ''
                  }`}
                  style={{ backgroundColor: c, borderColor: c === '#ffffff' ? '#cccccc' : c }}
                />
              ))}
            </div>

            {/* Толщина линии - увеличенный слайдер для мобильных */}
            <div className="flex gap-2 items-center flex-wrap justify-center">
              <span className="text-[var(--matrix-green-dark)] font-mono text-xs md:text-sm">ТОЛЩИНА:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-32 md:w-24 h-8"
                style={{ minWidth: '128px' }}
              />
              <span className="text-[var(--matrix-green-dark)] font-mono text-sm w-10 text-center">{lineWidth}</span>
            </div>

            {/* История - увеличенные кнопки для мобильных */}
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`px-4 md:px-4 py-3 md:py-2 border-2 font-mono text-sm transition-all min-h-[48px] min-w-[100px] touch-manipulation ${
                  history.length === 0
                    ? 'border-[var(--matrix-gray-dark)] text-[var(--matrix-gray-dark)] cursor-not-allowed opacity-50'
                    : 'border-[var(--matrix-yellow-neon)] text-[var(--matrix-yellow-neon)] active:bg-[var(--matrix-yellow-neon)] active:text-[var(--matrix-black)]'
                }`}
                title="Назад (Undo)"
              >
                ↶ НАЗАД
              </button>
              <button
                onClick={handleRedo}
                disabled={redoHistory.length === 0}
                className={`px-4 md:px-4 py-3 md:py-2 border-2 font-mono text-sm transition-all min-h-[48px] min-w-[100px] touch-manipulation ${
                  redoHistory.length === 0
                    ? 'border-[var(--matrix-gray-dark)] text-[var(--matrix-gray-dark)] cursor-not-allowed opacity-50'
                    : 'border-[var(--matrix-cyan-neon)] text-[var(--matrix-cyan-neon)] active:bg-[var(--matrix-cyan-neon)] active:text-[var(--matrix-black)]'
                }`}
                title="Вперед (Redo)"
              >
                ↷ ВПЕРЕД
              </button>
            </div>
          </div>
        </div>

        {/* Canvas - адаптирован для мобильных */}
        <div className="flex-1 flex items-center justify-center w-full overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)} // Останавливаем рисование если мышь вышла
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => setIsDrawing(false)} // Останавливаем рисование при отмене touch
            className="border-2 border-[var(--matrix-green-bright)] max-w-full max-h-full cursor-crosshair"
            style={{ 
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              msUserSelect: 'none',
            }}
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

