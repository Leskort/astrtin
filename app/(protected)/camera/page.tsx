'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/camera/CameraCapture';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';

export default function CameraPage() {
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

  const handleCaptureComplete = () => {
    // Переход в галерею после успешной съемки и редактирования
    setTimeout(() => {
      router.push('/gallery');
    }, 1000);
  };

  const handleEditComplete = async (file: File) => {
    // Загружаем отредактированную фотографию
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

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, обновите страницу и войдите заново.');
        }
        throw new Error(errorData.error || errorData.hint || 'Ошибка загрузки');
      }

      // Успешная загрузка - переходим в галерею
      handleCaptureComplete();
    } catch (err: any) {
      console.error('Error uploading edited photo:', err);
      alert(err.message || 'Ошибка при загрузке отредактированной фотографии');
    }
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
        <CameraCapture 
          onCaptureComplete={handleCaptureComplete}
          onEditComplete={handleEditComplete}
        />
      </div>
    </div>
  );
}

