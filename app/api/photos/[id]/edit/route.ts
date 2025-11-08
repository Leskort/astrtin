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
    
    console.log('Edit request received for photo:', photoId);
    
    // Проверяем сессию
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (!sessionToken?.value) {
      console.error('Edit rejected - no session token');
      return NextResponse.json(
        { error: 'Не авторизован. Пожалуйста, войдите в систему.' },
        { status: 401 }
      );
    }

    console.log('Session check passed, processing file...');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file in form data');
      return NextResponse.json(
        { error: 'Файл не найден в запросе' },
        { status: 400 }
      );
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: 'Файл слишком большой (максимум 10MB)' },
        { status: 400 }
      );
    }

    // Проверка минимального размера
    if (file.size === 0) {
      console.error('File is empty');
      return NextResponse.json(
        { error: 'Файл пустой' },
        { status: 400 }
      );
    }

    console.log('Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('Buffer created, size:', buffer.length);

    // Загружаем отредактированную фотографию
    console.log('Uploading to storage...');
    let storageResult;
    try {
      storageResult = await uploadPhoto(buffer, file.name, file.type);
      console.log('Storage upload successful:', storageResult);
    } catch (storageError: any) {
      console.error('Storage upload failed:', storageError);
      console.error('Storage error details:', {
        message: storageError.message,
        stack: storageError.stack,
      });
      
      // Возвращаем более подробное сообщение об ошибке
      return NextResponse.json(
        { 
          error: 'Ошибка сохранения фотографии. Попробуйте еще раз или обратитесь к администратору.',
          hint: storageError.message || 'Не удалось загрузить файл в хранилище',
          details: process.env.NODE_ENV === 'development' ? storageError.message : undefined,
        },
        { status: 500 }
      );
    }

    // TODO: Обновить метаданные в БД (заменить старый URL на новый)
    // Пока просто возвращаем новую фотографию
    const result = {
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
    };
    
    console.log('Edit completed successfully:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Edit error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return NextResponse.json(
      { 
        error: 'Ошибка при сохранении изменений. Попробуйте еще раз или обратитесь к администратору.',
        hint: error.message || 'Неизвестная ошибка',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

