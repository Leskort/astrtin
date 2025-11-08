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
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    NETLIFY: process.env.NETLIFY,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
    NETLIFY_CONTEXT: process.env.NETLIFY_CONTEXT,
    CONTEXT: process.env.CONTEXT,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
    VERCEL: process.env.VERCEL,
  });
  
  // Всегда пробуем использовать Netlify Blobs
  // На Netlify он должен работать автоматически, даже если переменные окружения не установлены
  try {
    console.log('Attempting to upload to Netlify Blobs (no pre-check)...');
    const result = await uploadToNetlify(buffer, fileName, mimeType);
    console.log('Netlify Blobs upload successful:', result.url);
    return result;
  } catch (error: any) {
    console.error('Netlify Blobs upload failed:', error);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      constructor: error?.constructor?.name,
      stack: error?.stack?.substring(0, 500),
    });
    
    // Передаем детальное сообщение об ошибке
    throw error;
  }
}

export function isStorageConfigured(): boolean {
  return isNetlifyConfigured();
}

