'use client';

import { Photo } from '@/types';
import PhotoCard from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoSelect: (photo: Photo) => void;
  onPhotoDelete: (id: string) => void;
}

export default function PhotoGrid({ photos, onPhotoSelect, onPhotoDelete }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--matrix-green-dark)] font-mono text-lg mb-4">
          ГАЛЕРЕЯ ПУСТА
        </p>
        <p className="text-[var(--matrix-green-dark)] font-mono text-sm opacity-50">
          Загрузите фотографии для просмотра
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onSelect={onPhotoSelect}
          onDelete={onPhotoDelete}
        />
      ))}
    </div>
  );
}

