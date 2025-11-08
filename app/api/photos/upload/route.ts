import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadPhoto } from '@/lib/storage-simple';

export async function POST(request: Request) {
  try {
    // Проверяем сессию
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (!sessionToken?.value) {
      console.error('Upload rejected - no session token');
      const allCookies = cookieStore.getAll();
      console.log('Available cookies:', allCookies.map(c => c.name));
      return NextResponse.json(
        { 
          error: 'Не авторизован. Пожалуйста, войдите в систему.',
          hint: 'Проверьте, что вы вошли в систему и попробуйте обновить страницу.'
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Файл слишком большой (макс 10MB)' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();

    // Используем универсальную функцию загрузки
    const storageResult = await uploadPhoto(buffer, file.name, file.type);

    // TODO: Сохранить метаданные в БД
    return NextResponse.json({
      success: true,
      photo: {
        id: storageResult.id,
        url: storageResult.url,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        provider: storageResult.provider,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при загрузке файла' },
      { status: 500 }
    );
  }
}
