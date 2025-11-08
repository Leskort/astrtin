'use client';

import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import Button from '@/components/ui/Button';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = () => {
    // Переход в галерею после успешной загрузки
    setTimeout(() => {
      router.push('/gallery');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--matrix-black)] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-3xl md:text-5xl font-mono text-[var(--matrix-green-bright)] text-glow-strong">
            ЗАГРУЗКА
          </h1>
          
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/gallery')}
              size="md"
              variant="secondary"
            >
              ГАЛЕРЕЯ
            </Button>
            <Button
              onClick={() => router.push('/camera')}
              size="md"
              variant="secondary"
            >
              КАМЕРА
            </Button>
          </div>
        </div>

        {/* Компонент загрузки */}
        <FileUpload onUploadComplete={handleUploadComplete} />
      </div>
    </div>
  );
}

