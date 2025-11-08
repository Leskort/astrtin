import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listNetlifyPhotos } from '@/lib/storage-netlify';

export async function GET() {
  try {
    // Проверяем сессию
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (!sessionToken?.value) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Используем только Netlify Blobs
    try {
      const netlifyPhotos = await listNetlifyPhotos();
      
      const photos = netlifyPhotos.map((item) => {
        const match = item.key.match(/^photo-(\d+)-(.+)$/);
        const timestamp = match ? parseInt(match[1]) : Date.now();
        const fileName = match ? match[2] : item.key;
        
        return {
          id: item.key,
          userId: sessionToken.value,
          url: `/api/photos/blob/${encodeURIComponent(item.key)}`,
          fileName: item.metadata?.fileName || fileName,
          size: item.metadata?.size || 0,
          mimeType: item.metadata?.mimeType || `image/${fileName.split('.').pop()?.toLowerCase() || 'jpeg'}`,
          uploadedAt: item.metadata?.uploadedAt || new Date(timestamp).toISOString(),
        };
      });

      // Сортируем по дате загрузки (новые первыми)
      photos.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      return NextResponse.json({
        photos,
      });
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching from Netlify Blobs:', err);
      }
      return NextResponse.json({
        photos: [],
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching photos:', error);
    }
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Проверяем сессию
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (!sessionToken?.value) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // TODO: Реализовать загрузку фотографии
    return NextResponse.json(
      { error: 'Загрузка фотографий будет реализована после настройки хранилища' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

