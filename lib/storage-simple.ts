// Хранилище через Netlify Blobs
// Фотографии сохраняются на сайте Netlify

import { uploadToNetlify, isNetlifyConfigured } from './storage-netlify';

export interface StorageResult {
  url: string;
  id: string;
  provider: 'netlify';
}

export async function uploadPhoto(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult> {
  console.log('=== Storage: Netlify Blobs ===');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    NETLIFY: process.env.NETLIFY,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
  });
  console.log('Netlify Blobs configured:', isNetlifyConfigured());
  
  // Используем только Netlify Blobs
  if (!isNetlifyConfigured()) {
    const errorMsg = 'Netlify Blobs не настроен. Убедитесь, что приложение развернуто на Netlify и Netlify Blobs доступен.';
    console.error('=== Storage error ===');
    console.error(errorMsg);
    console.error('Environment variables:', {
      NETLIFY: process.env.NETLIFY,
      NETLIFY_DEV: process.env.NETLIFY_DEV,
    });
    throw new Error(errorMsg);
  }
  
  try {
    console.log('Uploading to Netlify Blobs...');
    const result = await uploadToNetlify(buffer, fileName, mimeType);
    console.log('Netlify Blobs upload successful:', result.url);
    return result;
  } catch (error: any) {
    console.error('Netlify Blobs upload failed:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    
    const errorMsg = error?.message || 'Ошибка сохранения в Netlify Blobs. Попробуйте еще раз или обратитесь к администратору.';
    throw new Error(errorMsg);
  }
}

export function isStorageConfigured(): boolean {
  return isNetlifyConfigured();
}

