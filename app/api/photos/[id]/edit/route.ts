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
          { error: 'Не авторизован. Пожалуйста, войдите в систему.' },
          { status: 401 }
        );
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'Файл не найден в запросе' },
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
          { error: 'Файл слишком большой (максимум 10MB)' },
          { status: 400 }
        );
      }

      // Проверка минимального размера
      if (file.size === 0) {
        return NextResponse.json(
          { error: 'Файл пустой' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Загружаем отредактированную фотографию
      let storageResult;
      try {
        storageResult = await uploadPhoto(buffer, file.name, file.type);
      } catch (storageError: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Storage upload failed:', storageError);
        }
        
        return NextResponse.json(
          { 
            error: 'Ошибка сохранения фотографии. Попробуйте еще раз или обратитесь к администратору.',
            hint: storageError.message || 'Не удалось загрузить файл в хранилище',
          },
          { status: 500 }
        );
      }

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
      
      return NextResponse.json(result);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Edit error:', error);
      }
      
      return NextResponse.json(
        { 
          error: 'Ошибка при сохранении изменений. Попробуйте еще раз или обратитесь к администратору.',
          hint: error.message || 'Неизвестная ошибка',
        },
        { status: 500 }
      );
    }
}

