// Хранилище через Netlify Blobs
// Фотографии сохраняются на сайте Netlify

import { uploadToNetlify, isNetlifyConfigured } from './storage-netlify';

export interface StorageResult {
  url: string;
  id: string;
  provider: 'netlify';
}

export async function uploadPhoto(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult> {
  try {
    const result = await uploadToNetlify(buffer, fileName, mimeType);
    return result;
  } catch (error: any) {
    // Логируем только критические ошибки
    if (process.env.NODE_ENV === 'development') {
      console.error('Netlify Blobs upload failed:', error);
    }
    throw error;
  }
}

export function isStorageConfigured(): boolean {
  return isNetlifyConfigured();
}

