'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Photo } from '@/types';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import PhotoViewer from '@/components/gallery/PhotoViewer';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Проверка авторизации
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Загрузка фотографий
  useEffect(() => {
    if (user) {
      loadPhotos();
    }
  }, [user]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/photos', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить фотографии');
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handlePhotoDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Не удалось удалить фотографию');
      }

      // Удаляем из списка
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      
      // Если удалили выбранную фотографию, закрываем просмотр
      if (selectedPhoto?.id === id) {
        setSelectedPhoto(null);
      }
    } catch (err: any) {
      alert('Ошибка при удалении фотографии');
    }
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}/download`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Не удалось скачать');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Ошибка при скачивании фотографии');
    }
  };

  const handleEdit = async (photo: Photo, editedFile: File) => {
    try {
      // Проверяем сессию перед сохранением
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
      formData.append('file', editedFile);
      formData.append('photoId', photo.id);

      const response = await fetch(`/api/photos/${photo.id}/edit`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Ошибка при сохранении';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.hint || errorData.message || errorMessage;
          
          if (response.status === 401) {
            errorMessage = 'Сессия истекла. Пожалуйста, обновите страницу и войдите заново.';
          } else if (response.status === 413) {
            errorMessage = 'Файл слишком большой. Попробуйте уменьшить размер изображения.';
          } else if (response.status >= 500) {
            errorMessage = 'Ошибка сервера. Попробуйте еще раз или обратитесь к администратору.';
          }
        } catch (parseError) {
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // Обновляем список фотографий
      await loadPhotos();
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при сохранении изменений. Попробуйте еще раз или обратитесь к администратору.';
      alert(errorMessage);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      router.push('/');
    } catch (err) {
      router.push('/');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--matrix-black)]">
        <Loading text={authLoading ? "ПРОВЕРКА ДОСТУПА..." : "ЗАГРУЗКА ГАЛЕРЕИ..."} />
      </div>
    );
  }

  if (!user) {
    return null; // Редирект на логин
  }

  return (
    <div className="min-h-screen bg-[var(--matrix-black)] p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mono text-[var(--matrix-green-bright)] text-glow-strong">
            ГАЛЕРЕЯ
          </h1>
          
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Button
              onClick={() => router.push('/upload')}
              size="md"
              className="flex-1 sm:flex-none min-w-[100px]"
            >
              ЗАГРУЗИТЬ
            </Button>
            <Button
              onClick={() => router.push('/camera')}
              size="md"
              variant="secondary"
              className="flex-1 sm:flex-none min-w-[100px]"
            >
              КАМЕРА
            </Button>
            <Button
              onClick={handleLogout}
              size="md"
              variant="danger"
              className="flex-1 sm:flex-none min-w-[100px]"
            >
              ВЫХОД
            </Button>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-3 md:mb-4 p-3 md:p-4 border-2 border-[var(--matrix-red-neon)] bg-[var(--matrix-black)] bg-opacity-50">
            <p className="text-[var(--matrix-red-neon)] font-mono text-xs md:text-sm text-glow-red">
              {error}
            </p>
          </div>
        )}

        {/* Сетка фотографий */}
        <PhotoGrid
          photos={photos}
          onPhotoSelect={handlePhotoSelect}
          onPhotoDelete={handlePhotoDelete}
        />

        {/* Модальное окно просмотра */}
        {selectedPhoto && (
          <PhotoViewer
            photo={selectedPhoto}
            photos={photos}
            onClose={() => setSelectedPhoto(null)}
            onDelete={handlePhotoDelete}
            onDownload={handleDownload}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
}
