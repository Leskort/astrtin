import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteFromNetlify } from '@/lib/storage-netlify';

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

    // TODO: Получить фотографию из Netlify Blobs
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

    // Удаляем из Netlify Blobs
    try {
      await deleteFromNetlify(photoId);
      return NextResponse.json({
        success: true,
        message: 'Фотография удалена',
      });
    } catch (err: any) {
      console.error('Error deleting from Netlify Blobs:', err);
      return NextResponse.json(
        { error: `Не удалось удалить фотографию: ${err.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

