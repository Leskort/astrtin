'use client';

import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/camera/CameraCapture';
import Button from '@/components/ui/Button';

export default function CameraPage() {
  const router = useRouter();

  const handleCaptureComplete = () => {
    // Переход в галерею после успешной съемки
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
            КАМЕРА
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
              onClick={() => router.push('/upload')}
              size="md"
              variant="secondary"
            >
              ЗАГРУЗИТЬ
            </Button>
          </div>
        </div>

        {/* Компонент камеры */}
        <CameraCapture onCaptureComplete={handleCaptureComplete} />
      </div>
    </div>
  );
}

