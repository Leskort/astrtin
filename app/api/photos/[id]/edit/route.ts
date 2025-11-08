import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadPhoto } from '@/lib/storage-simple';

export async function PUT(
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

    // Загружаем отредактированную фотографию
    const storageResult = await uploadPhoto(buffer, file.name, file.type);

    // TODO: Обновить метаданные в БД (заменить старый URL на новый)
    // Пока просто возвращаем новую фотографию
    return NextResponse.json({
      success: true,
      photo: {
        id: photoId,
        url: storageResult.url,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        provider: storageResult.provider,
      },
    });
  } catch (error: any) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при сохранении изменений' },
      { status: 500 }
    );
  }
}

