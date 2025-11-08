'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

interface CameraCaptureProps {
  onCaptureComplete?: () => void;
}

export default function CameraCapture({ onCaptureComplete }: CameraCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setError('Выберите изображение');
      return;
    }

    // Создаем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Автоматически загружаем после выбора
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки');
      }

      // Успешная загрузка
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onCaptureComplete?.();
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке');
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Скрытый input для системной камеры */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Превью фотографии */}
      {preview && (
        <div className="relative w-full aspect-[4/3] bg-[var(--matrix-gray-dark)] border-2 border-[var(--matrix-green-bright)] overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Плейсхолдер когда нет превью */}
      {!preview && !uploading && (
        <div className="relative w-full aspect-[4/3] bg-[var(--matrix-gray-dark)] border-2 border-[var(--matrix-green-dark)] flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-20 h-20 mx-auto text-[var(--matrix-green-dark)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-[var(--matrix-green-dark)] font-mono text-sm mb-2">
              Нажмите кнопку для съемки
            </p>
            <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-50">
              Откроется системная камера
            </p>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <p className="text-[var(--matrix-red-neon)] font-mono text-sm text-glow-red">
          {error}
        </p>
      )}

      {/* Индикатор загрузки */}
      {uploading && (
        <div className="text-center">
          <Loading text="СОХРАНЕНИЕ..." />
        </div>
      )}

      {/* Кнопки управления */}
      <div className="flex flex-wrap gap-4 justify-center">
        {!preview ? (
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            disabled={uploading}
            className="min-w-[200px]"
          >
            ОТКРЫТЬ КАМЕРУ
          </Button>
        ) : (
          <>
            <Button
              onClick={() => {
                if (fileInputRef.current?.files?.[0]) {
                  uploadPhoto(fileInputRef.current.files[0]);
                }
              }}
              size="lg"
              disabled={uploading}
            >
              {uploading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
            </Button>
            <Button
              onClick={handleRetake}
              size="md"
              variant="secondary"
              disabled={uploading}
            >
              ПЕРЕСНЯТЬ
            </Button>
          </>
        )}
      </div>

      {/* Подсказка */}
      {!preview && !uploading && (
        <div className="text-center space-y-2">
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-50">
            На iPhone откроется системная камера
          </p>
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-30">
            После съемки фотография автоматически загрузится
          </p>
        </div>
      )}
    </div>
  );
}
