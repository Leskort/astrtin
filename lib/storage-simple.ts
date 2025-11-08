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
    NETLIFY_CONTEXT: process.env.NETLIFY_CONTEXT,
    CONTEXT: process.env.CONTEXT,
  });
  
  // Пробуем использовать Netlify Blobs в любом случае
  // Если он не доступен, получим ошибку при попытке использования
  try {
    console.log('Attempting to upload to Netlify Blobs...');
    const result = await uploadToNetlify(buffer, fileName, mimeType);
    console.log('Netlify Blobs upload successful:', result.url);
    return result;
  } catch (error: any) {
    console.error('Netlify Blobs upload failed:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
    });
    
    // Проверяем, может быть это ошибка конфигурации
    if (error?.message?.includes('getStore') || error?.message?.includes('not available')) {
      const errorMsg = 'Netlify Blobs не доступен. Убедитесь, что приложение развернуто на Netlify и пакет @netlify/blobs установлен.';
      console.error('=== Configuration error ===');
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const errorMsg = error?.message || 'Ошибка сохранения в Netlify Blobs. Попробуйте еще раз или обратитесь к администратору.';
    throw new Error(errorMsg);
  }
}

export function isStorageConfigured(): boolean {
  return isNetlifyConfigured();
}

