import { NextResponse } from 'next/server';
import { getFromNetlify } from '@/lib/storage-netlify';

export async function GET(
  request: Request,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const params = await context.params;
    const key = decodeURIComponent(params.key);

    const result = await getFromNetlify(key);

    if (!result) {
      return NextResponse.json(
        { error: 'Фотография не найдена' },
        { status: 404 }
      );
    }

    // Возвращаем файл с правильными заголовками
    // Buffer может быть напрямую использован в Response
    return new NextResponse(result.data as any, {
      headers: {
        'Content-Type': result.metadata.mimeType || 'image/jpeg',
        'Content-Disposition': `inline; filename="${result.metadata.fileName || key}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching blob:', error);
    }
    return NextResponse.json(
      { error: 'Ошибка при получении фотографии' },
      { status: 500 }
    );
  }
}

