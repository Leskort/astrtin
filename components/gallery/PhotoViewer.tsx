'use client';

import { useEffect, useState } from 'react';
import { Photo } from '@/types';
import Button from '@/components/ui/Button';

interface PhotoViewerProps {
  photo: Photo;
  photos: Photo[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (photo: Photo) => void;
}

export default function PhotoViewer({
  photo,
  photos,
  onClose,
  onDelete,
  onDownload,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    photos.findIndex((p) => p.id === photo.id)
  );
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentPhoto = photos[currentIndex] || photo;

  // Навигация клавиатурой
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(1, Math.min(3, prev + delta)));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[var(--matrix-black)] bg-opacity-95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Изображение */}
        <div className="relative" style={{ transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)` }}>
          <img
            src={currentPhoto.url}
            alt={currentPhoto.fileName}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>

        {/* Информация о фотографии */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="bg-[var(--matrix-black)] bg-opacity-80 border-2 border-[var(--matrix-green-dark)] p-3">
            <p className="text-[var(--matrix-green-bright)] font-mono text-sm text-glow">
              {currentPhoto.fileName}
            </p>
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs mt-1">
              {(currentPhoto.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-[var(--matrix-green-dark)] font-mono text-xs mt-1">
              {new Date(currentPhoto.uploadedAt).toLocaleDateString('ru-RU')}
            </p>
          </div>

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-[var(--matrix-green-bright)] bg-[var(--matrix-black)] bg-opacity-80 flex items-center justify-center button-glow hover:bg-[var(--matrix-green-bright)] hover:text-[var(--matrix-black)] transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Навигация */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 border-2 border-[var(--matrix-green-bright)] bg-[var(--matrix-black)] bg-opacity-80 flex items-center justify-center button-glow hover:bg-[var(--matrix-green-bright)] hover:text-[var(--matrix-black)] transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 border-2 border-[var(--matrix-green-bright)] bg-[var(--matrix-black)] bg-opacity-80 flex items-center justify-center button-glow hover:bg-[var(--matrix-green-bright)] hover:text-[var(--matrix-black)] transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </>
        )}

        {/* Счетчик */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--matrix-black)] bg-opacity-80 border-2 border-[var(--matrix-green-dark)] px-4 py-2">
            <p className="text-[var(--matrix-green-bright)] font-mono text-sm text-glow">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            onClick={() => onDownload(currentPhoto)}
            size="sm"
            variant="secondary"
          >
            СКАЧАТЬ
          </Button>
          <Button
            onClick={() => {
              if (confirm('Удалить фотографию?')) {
                onDelete(currentPhoto.id);
                if (photos.length === 1) {
                  onClose();
                } else {
                  goToNext();
                }
              }
            }}
            size="sm"
            variant="danger"
          >
            УДАЛИТЬ
          </Button>
        </div>

        {/* Подсказка по зуму */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[var(--matrix-black)] bg-opacity-80 border-2 border-[var(--matrix-green-dark)] px-4 py-2">
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs">
            Колесико мыши + Ctrl для зума | Стрелки для навигации
          </p>
        </div>
      </div>
    </div>
  );
}

