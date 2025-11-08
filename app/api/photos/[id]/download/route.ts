import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    // TODO: Получить файл из хранилища и вернуть его
    return NextResponse.json(
      { error: 'Скачивание будет реализовано после настройки хранилища' },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

