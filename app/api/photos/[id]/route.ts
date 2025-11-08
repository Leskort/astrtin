import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Проверяем сессию
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (!sessionToken?.value) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // TODO: Получить фотографию из БД/хранилища
    return NextResponse.json(
      { error: 'Не реализовано' },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const photoId = params.id;
    
    // Проверяем сессию
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (!sessionToken?.value) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // В development удаляем из файловой системы
    if (process.env.NODE_ENV === 'development') {
      try {
        // Извлекаем timestamp из ID (photo-timestamp)
        const match = photoId.match(/photo-(\d+)/);
        if (!match) {
          return NextResponse.json(
            { error: 'Неверный ID фотографии' },
            { status: 400 }
          );
        }

        const timestamp = match[1];
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        const { readdir } = await import('fs/promises');
        const files = await readdir(uploadsDir);
        
        // Ищем файл с этим timestamp
        const fileToDelete = files.find(file => file.startsWith(`${timestamp}-`));
        
        if (fileToDelete) {
          const filePath = join(uploadsDir, fileToDelete);
          await unlink(filePath);
        }

        // TODO: Удалить из БД
        return NextResponse.json({
          success: true,
          message: 'Фотография удалена',
        });
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          // Файл уже не существует
          return NextResponse.json({
            success: true,
            message: 'Фотография удалена',
          });
        }
        throw err;
      }
    }

    // В production нужно удалять из облачного хранилища и БД
    return NextResponse.json(
      { error: 'Удаление из облачного хранилища не настроено' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

