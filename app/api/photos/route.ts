import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Временное хранилище фотографий (в продакшене использовать БД)
// TODO: Интегрировать с реальным хранилищем

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

    // В development читаем файлы из папки uploads
    // В production фотографии будут храниться в Cloudinary (метаданные в БД)
    // Пока возвращаем пустой массив - фотографии будут загружаться, но список нужно будет получать из БД
    // Для простоты пока используем файловую систему в development
    
    if (process.env.NODE_ENV === 'development') {
      try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        const files = await readdir(uploadsDir);
        
        const photos = await Promise.all(
          files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(async (fileName) => {
              const filePath = join(uploadsDir, fileName);
              const stats = await stat(filePath);
              
              // Извлекаем timestamp из имени файла
              const match = fileName.match(/^(\d+)-/);
              const timestamp = match ? parseInt(match[1]) : Date.now();
              
              return {
                id: `photo-${timestamp}`,
                userId: sessionToken.value,
                url: `/uploads/${fileName}`,
                fileName: fileName.replace(/^\d+-/, ''),
                size: stats.size,
                mimeType: `image/${fileName.split('.').pop()?.toLowerCase() || 'jpeg'}`,
                uploadedAt: new Date(timestamp).toISOString(),
              };
            })
        );

        // Сортируем по дате загрузки (новые первыми)
        photos.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );

        return NextResponse.json({
          photos,
        });
      } catch (err: any) {
        // Если папка не существует, возвращаем пустой массив
        if (err.code === 'ENOENT') {
          return NextResponse.json({
            photos: [],
          });
        }
        throw err;
      }
    }

    // В production возвращаем пустой массив
    // TODO: Загружать из БД когда будет настроена база данных
    return NextResponse.json({
      photos: [],
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
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

