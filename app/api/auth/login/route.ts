import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// Временное хранилище пользователя (в продакшене использовать БД)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@astrinn.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверяем, что это единственный разрешенный пользователь
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Проверка пароля
    let isValid = false;
    
    if (ADMIN_PASSWORD_HASH) {
      // Проверяем хеш
      isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } else {
      // Временная проверка для разработки
      isValid = password === ADMIN_PASSWORD;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Создаем сессию через cookie
    const cookieStore = await cookies();
    const sessionValue = email.toLowerCase();
    
    // Устанавливаем cookie на 30 дней
    // На Netlify всегда HTTPS, поэтому secure должен быть true
    // В development используем false для локального тестирования
    const isProduction = process.env.NODE_ENV === 'production';
    const isNetlify = !!process.env.NETLIFY;
    const useSecure = isProduction || isNetlify;
    
    cookieStore.set('auth_session', sessionValue, {
      httpOnly: true,
      secure: useSecure,
      sameSite: 'lax', // lax позволяет отправлять cookie с GET запросами из других сайтов и POST запросами
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    });
    
    console.log('Session cookie set:', {
      hasValue: !!sessionValue,
      secure: useSecure,
      environment: process.env.NODE_ENV,
      isNetlify,
    });

    return NextResponse.json({
      success: true,
      message: 'Вход выполнен успешно',
      user: {
        email: email.toLowerCase(),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

