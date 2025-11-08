'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Проверка авторизации
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--matrix-black)]">
        <Loading text="ПРОВЕРКА ДОСТУПА..." />
      </div>
    );
  }

  if (!user) {
    return null; // Редирект на логин
  }

  const handleUploadComplete = () => {
    // Переход в галерею после успешной загрузки
    setTimeout(() => {
      router.push('/gallery');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--matrix-black)] p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-3 md:gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mono text-[var(--matrix-green-bright)] text-glow-strong">
            ЗАГРУЗКА
          </h1>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => router.push('/gallery')}
              size="md"
              variant="secondary"
              className="flex-1 sm:flex-none min-w-[100px]"
            >
              ГАЛЕРЕЯ
            </Button>
            <Button
              onClick={() => router.push('/camera')}
              size="md"
              variant="secondary"
              className="flex-1 sm:flex-none min-w-[100px]"
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

