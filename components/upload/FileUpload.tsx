'use client';

import { useState, useRef, DragEvent } from 'react';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(files);
      setError(null);
    } else {
      setError('Выберите изображения');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file =>
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Выберите файлы для загрузки');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Проверяем сессию перед загрузкой
      const sessionCheck = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (!sessionCheck.ok) {
        throw new Error('Сессия истекла. Пожалуйста, войдите в систему заново.');
      }
      
      const sessionData = await sessionCheck.json();
      if (!sessionData.user) {
        throw new Error('Вы не авторизованы. Пожалуйста, войдите в систему.');
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Проверка размера (макс 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Файл ${file.name} слишком большой (макс 10MB)`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          credentials: 'include', // Важно: отправляем cookie с запросом
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            throw new Error('Сессия истекла. Пожалуйста, обновите страницу и войдите заново.');
          }
          throw new Error(errorData.error || errorData.hint || 'Ошибка загрузки');
        }

        setProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // Успешная загрузка
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete?.();
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop область */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed
          ${isDragging 
            ? 'border-[var(--matrix-green-bright)] button-glow bg-[var(--matrix-green-dark)] bg-opacity-20' 
            : 'border-[var(--matrix-green-dark)]'
          }
          p-6 md:p-8 lg:p-12 text-center transition-all duration-300
          cursor-pointer touch-manipulation
          min-h-[200px] md:min-h-[250px]
          flex items-center justify-center
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-3 md:space-y-4 w-full">
          <svg
            className="w-12 h-12 md:w-16 md:h-16 mx-auto text-[var(--matrix-green-dark)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-[var(--matrix-green-bright)] font-mono text-base md:text-lg text-glow">
            {isDragging ? 'ОТПУСТИТЕ ДЛЯ ЗАГРУЗКИ' : 'ПЕРЕТАЩИТЕ ФАЙЛЫ СЮДА'}
          </p>
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs md:text-sm">
            или нажмите для выбора файлов
          </p>
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-50 px-2">
            Поддерживаются: JPG, PNG, GIF, WEBP (макс 10MB)
          </p>
        </div>
      </div>

      {/* Выбранные файлы */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[var(--matrix-green-soft)] font-mono text-xs md:text-sm">
            Выбрано файлов: {selectedFiles.length}
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 md:p-3 border-2 border-[var(--matrix-green-dark)] bg-[var(--matrix-gray-dark)] gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--matrix-green-bright)] font-mono text-xs md:text-sm truncate">
                    {file.name}
                  </p>
                  <p className="text-[var(--matrix-green-dark)] font-mono text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="ml-2 md:ml-4 w-10 h-10 md:w-8 md:h-8 border-2 border-[var(--matrix-red-neon)] flex items-center justify-center hover:bg-[var(--matrix-red-neon)] active:bg-[var(--matrix-red-neon)] transition-all touch-manipulation flex-shrink-0"
                >
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Прогресс загрузки */}
      {uploading && (
        <div className="space-y-2">
          <Loading text="ЗАГРУЗКА..." />
          <div className="w-full bg-[var(--matrix-gray-dark)] border-2 border-[var(--matrix-green-dark)] h-3 md:h-4">
            <div
              className="h-full bg-[var(--matrix-green-bright)] transition-all duration-300 button-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[var(--matrix-green-soft)] font-mono text-xs text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="p-3 md:p-4 border-2 border-[var(--matrix-red-neon)] bg-[var(--matrix-black)] bg-opacity-50">
          <p className="text-[var(--matrix-red-neon)] font-mono text-xs md:text-sm text-glow-red">
            {error}
          </p>
        </div>
      )}

      {/* Кнопка загрузки */}
      {selectedFiles.length > 0 && !uploading && (
        <Button
          onClick={handleUpload}
          size="lg"
          className="w-full"
        >
          ЗАГРУЗИТЬ {selectedFiles.length} {selectedFiles.length === 1 ? 'ФАЙЛ' : 'ФАЙЛОВ'}
        </Button>
      )}
    </div>
  );
}

