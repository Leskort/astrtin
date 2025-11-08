import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;

    let fileUrl: string;
    let photoId: string;

    // Пробуем загрузить в Cloudinary если настроен
    if (isCloudinaryConfigured()) {
      try {
        fileUrl = await uploadToCloudinary(buffer, fileName, file.type);
        photoId = `cloudinary-${timestamp}`;
      } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        // Fallback на файловую систему если Cloudinary не работает
        if (process.env.NODE_ENV === 'development') {
          const uploadsDir = join(process.cwd(), 'public', 'uploads');
          const filePath = join(uploadsDir, fileName);
          
          const fs = require('fs');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          await writeFile(filePath, buffer);
          fileUrl = `/uploads/${fileName}`;
          photoId = `temp-${timestamp}`;
        } else {
          throw new Error('Ошибка загрузки в Cloudinary');
        }
      }
    } else {
      // Используем файловую систему только в development
      if (process.env.NODE_ENV === 'development') {
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        const filePath = join(uploadsDir, fileName);
        
        const fs = require('fs');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        await writeFile(filePath, buffer);
        fileUrl = `/uploads/${fileName}`;
        photoId = `temp-${timestamp}`;
      } else {
        return NextResponse.json(
          { error: 'Настройте Cloudinary для загрузки фотографий. Добавьте CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET в переменные окружения.' },
          { status: 500 }
        );
      }
    }

    // TODO: Сохранить метаданные в БД
    return NextResponse.json({
      success: true,
      photo: {
        id: photoId,
        url: fileUrl,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
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
