import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFromNetlify } from '@/lib/storage-netlify';

export async function GET(
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

    // Получаем файл из Netlify Blobs
    const result = await getFromNetlify(photoId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Фотография не найдена' },
        { status: 404 }
      );
    }

    // Возвращаем файл для скачивания
    return new NextResponse(result.data as any, {
      headers: {
        'Content-Type': result.metadata.mimeType || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${result.metadata.fileName || photoId}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

