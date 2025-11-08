import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Временное хранилище в файловой системе (в продакшене использовать облачное хранилище)
// TODO: Интегрировать с Cloudinary/Supabase/Firebase

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

    // Временное сохранение в файловой системе
    // В продакшене загружать в облачное хранилище
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Создаем уникальное имя файла
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    
    // В development сохраняем локально, в production нужно использовать облачное хранилище
    if (process.env.NODE_ENV === 'development') {
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      const filePath = join(uploadsDir, fileName);
      
      try {
        await writeFile(filePath, buffer);
      } catch (err) {
        // Если директория не существует, создаем её
        const fs = require('fs');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
          await writeFile(filePath, buffer);
        }
      }

      // Возвращаем URL для доступа к файлу
      const fileUrl = `/uploads/${fileName}`;

      // TODO: Сохранить метаданные в БД
      // const photo = await savePhotoToDB({
      //   userId: sessionToken.value,
      //   url: fileUrl,
      //   fileName: file.name,
      //   size: file.size,
      //   mimeType: file.type,
      // });

      return NextResponse.json({
        success: true,
        photo: {
          id: `temp-${timestamp}`,
          url: fileUrl,
          fileName: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        },
      });
    } else {
      // В production нужно использовать облачное хранилище
      return NextResponse.json(
        { error: 'Загрузка в облачное хранилище не настроена. Настройте Cloudinary/Supabase/Firebase.' },
        { status: 501 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке файла' },
      { status: 500 }
    );
  }
}

