'use client';

import { useState } from 'react';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  onSelect: (photo: Photo) => void;
  onDelete: (id: string) => void;
}

export default function PhotoCard({ photo, onSelect, onDelete }: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="relative group cursor-pointer touch-manipulation"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 200)}
      onClick={() => onSelect(photo)}
    >
      <div
        className={`
          relative w-full aspect-square
          border-2 border-[var(--matrix-green-dark)]
          overflow-hidden
          transition-all duration-300
          active:scale-95
          ${isHovered ? 'border-[var(--matrix-green-bright)] button-glow scale-105 md:scale-105' : ''}
        `}
      >
        {!imageError ? (
          <img
            src={photo.url}
            alt={photo.fileName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--matrix-gray-dark)]">
            <p className="text-[var(--matrix-green-dark)] font-mono text-xs">
              Ошибка загрузки
            </p>
          </div>
        )}

        {/* Overlay при hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-[var(--matrix-black)] bg-opacity-50 flex items-center justify-center">
            <div className="text-[var(--matrix-green-bright)] font-mono text-sm text-glow">
              Просмотр
            </div>
          </div>
        )}

        {/* Кнопка удаления */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Удалить фотографию?')) {
                onDelete(photo.id);
              }
            }}
            className="absolute top-2 right-2 w-10 h-10 md:w-8 md:h-8 bg-[var(--matrix-red-neon)] bg-opacity-90 hover:bg-opacity-100 active:bg-opacity-100 border-2 border-[var(--matrix-red-neon)] flex items-center justify-center transition-all touch-manipulation z-10 shadow-lg"
          >
            <svg className="w-5 h-5 md:w-4 md:h-4 text-[var(--matrix-black)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

