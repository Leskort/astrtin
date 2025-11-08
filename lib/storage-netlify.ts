// Локальное хранилище через Netlify Blobs
// Фотографии сохраняются на сайте Netlify, а не в внешнем облаке

import { getStore } from '@netlify/blobs';

export interface StorageResult {
  url: string;
  id: string;
  provider: 'netlify';
}

export async function uploadToNetlify(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult> {
  try {
    console.log('Initializing Netlify Blobs store...');
    
    // Проверяем доступность getStore
    if (typeof getStore !== 'function') {
      throw new Error('getStore is not available. Make sure @netlify/blobs is installed and Netlify Blobs is enabled.');
    }
    
    const store = getStore({
      name: 'astrinn-photos',
      consistency: 'strong',
    });
    
    console.log('Store initialized, uploading file...');
    const timestamp = Date.now();
    const fileKey = `photo-${timestamp}-${fileName}`;

    // Netlify Blobs принимает Buffer, ArrayBuffer, Uint8Array, или строку
    // Используем buffer напрямую с приведением типа, так как Buffer совместим
    await store.set(fileKey, buffer as any, {
      metadata: {
        fileName,
        mimeType,
        size: buffer.length.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log('File saved to Netlify Blobs:', fileKey);

    // Возвращаем URL для доступа к файлу через API
    const url = `/api/photos/blob/${encodeURIComponent(fileKey)}`;

    return {
      url,
      id: fileKey,
      provider: 'netlify',
    };
  } catch (error: any) {
    console.error('Netlify Blobs upload error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Более детальное сообщение об ошибке
    let errorMessage = 'Ошибка сохранения в Netlify Blobs';
    if (error?.message) {
      errorMessage += `: ${error.message}`;
    }
    if (error?.code) {
      errorMessage += ` (код: ${error.code})`;
    }
    
    throw new Error(errorMessage);
  }
}

export async function getFromNetlify(key: string): Promise<{ data: Buffer; metadata: any } | null> {
  try {
    const store = getStore({
      name: 'astrinn-photos',
      consistency: 'strong',
    });
    const blob = await store.get(key, { type: 'blob' });
    
    if (!blob) {
      return null;
    }

    const metadata = await store.getMetadata(key);
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return {
      data: buffer,
      metadata: metadata || {},
    };
  } catch (error: any) {
    console.error('Netlify Blobs get error:', error);
    return null;
  }
}

export async function deleteFromNetlify(key: string): Promise<void> {
  try {
    const store = getStore({
      name: 'astrinn-photos',
      consistency: 'strong',
    });
    await store.delete(key);
    console.log('File deleted from Netlify Blobs:', key);
  } catch (error: any) {
    console.error('Netlify Blobs delete error:', error);
    throw new Error(`Ошибка удаления из Netlify: ${error.message}`);
  }
}

export async function listNetlifyPhotos(): Promise<Array<{ key: string; metadata: any }>> {
  try {
    const store = getStore({
      name: 'astrinn-photos',
      consistency: 'strong',
    });
    const { blobs } = await store.list();
    
    const photos = await Promise.all(
      blobs.map(async (blob) => {
        const metadata = await store.getMetadata(blob.key);
        return {
          key: blob.key,
          metadata: metadata || {},
        };
      })
    );

    return photos;
  } catch (error: any) {
    console.error('Netlify Blobs list error:', error);
    return [];
  }
}

export function isNetlifyConfigured(): boolean {
  // Netlify Blobs доступен автоматически в Netlify Functions
  // Проверяем, что мы находимся в среде Netlify
  try {
    const hasNetlifyEnv = !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
    
    // Проверяем, что getStore доступен
    if (typeof getStore !== 'function') {
      console.log('Netlify Blobs: getStore is not a function');
      return false;
    }
    
    // Если есть переменные окружения Netlify и getStore доступен, считаем что настроено
    if (hasNetlifyEnv) {
      console.log('Netlify Blobs: Environment detected, getStore available');
      return true;
    }
    
    console.log('Netlify Blobs: Environment variables not found');
    return false;
  } catch (error: any) {
    console.error('Error checking Netlify Blobs availability:', error);
    return false;
  }
}

