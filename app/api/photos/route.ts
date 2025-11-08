import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    // TODO: Загрузить фотографии из БД/хранилища
    // Пока возвращаем пустой массив
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

