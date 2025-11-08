'use client';

import { useState, useRef } from 'react';
import { Photo } from '@/types';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

interface PhotoEditorProps {
  photo: Photo;
  onSave: (editedFile: File) => Promise<void>;
  onCancel: () => void;
}

export default function PhotoEditor({ photo, onSave, onCancel }: PhotoEditorProps) {
  const [preview, setPreview] = useState<string>(photo.url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Создаем превью отредактированной фотографии
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Автоматически сохраняем после редактирования
    await handleSave(file);
  };

  const handleSave = async (file?: File) => {
    if (!file && !fileInputRef.current?.files?.[0]) {
      setError('Выберите отредактированную фотографию');
      return;
    }

    const fileToSave = file || fileInputRef.current!.files![0];
    setUploading(true);
    setError(null);

    try {
      await onSave(fileToSave);
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении');
    } finally {
      setUploading(false);
    }
  };

  const openEditor = () => {
    // На iPhone при клике на input type="file" откроется системный редактор
    // если фотография уже есть в галерее устройства
    // Пользователь может выбрать фотографию из галереи, отредактировать её,
    // и затем загрузить обратно
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-[var(--matrix-black)] bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Скрытый input для редактирования */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Превью фотографии */}
        <div className="relative w-full aspect-[4/3] bg-[var(--matrix-gray-dark)] border-2 border-[var(--matrix-green-bright)] overflow-hidden mb-6">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Ошибка */}
        {error && (
          <p className="text-[var(--matrix-red-neon)] font-mono text-sm text-glow-red mb-4 text-center">
            {error}
          </p>
        )}

        {/* Индикатор загрузки */}
        {uploading && (
          <div className="text-center mb-4">
            <Loading text="СОХРАНЕНИЕ..." />
          </div>
        )}

        {/* Кнопки */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={openEditor}
            size="lg"
            disabled={uploading}
          >
            РЕДАКТИРОВАТЬ
          </Button>
          {preview !== photo.url && (
            <Button
              onClick={() => handleSave()}
              size="lg"
              disabled={uploading}
              variant="secondary"
            >
              СОХРАНИТЬ ИЗМЕНЕНИЯ
            </Button>
          )}
          <Button
            onClick={onCancel}
            size="md"
            variant="danger"
            disabled={uploading}
          >
            ОТМЕНА
          </Button>
        </div>

        {/* Подсказка */}
        <div className="text-center mt-4 space-y-2">
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-50">
            На iPhone: выберите фотографию из галереи
          </p>
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-30">
            Системный редактор откроется автоматически при выборе
          </p>
        </div>
      </div>
    </div>
  );
}

