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
      console.error('Error loading photos:', err);
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
      console.error('Error deleting photo:', err);
      alert('Ошибка при удалении фотографии');
    }
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}/download`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Не удалось скачать');
      
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
      console.error('Error downloading photo:', err);
      alert('Ошибка при скачивании фотографии');
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
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, обновите страницу и войдите заново.');
        }
        throw new Error(errorData.error || errorData.hint || 'Ошибка при сохранении');
      }

      // Обновляем список фотографий
      await loadPhotos();
    } catch (err: any) {
      console.error('Error editing photo:', err);
      alert(err.message || 'Ошибка при сохранении изменений');
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
    <div className="min-h-screen bg-[var(--matrix-black)] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl md:text-5xl font-mono text-[var(--matrix-green-bright)] text-glow-strong">
            ГАЛЕРЕЯ
          </h1>
          
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/upload')}
              size="md"
            >
              ЗАГРУЗИТЬ
            </Button>
            <Button
              onClick={() => router.push('/camera')}
              size="md"
              variant="secondary"
            >
              КАМЕРА
            </Button>
            <Button
              onClick={handleLogout}
              size="md"
              variant="danger"
            >
              ВЫХОД
            </Button>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-4 p-4 border-2 border-[var(--matrix-red-neon)]">
            <p className="text-[var(--matrix-red-neon)] font-mono text-sm text-glow-red">
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
