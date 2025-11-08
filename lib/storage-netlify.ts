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
    // Проверяем доступность getStore
    if (typeof getStore !== 'function') {
      throw new Error('getStore is not available. Make sure @netlify/blobs is installed and Netlify Blobs is enabled.');
    }
    
    const store = getStore({
      name: 'astrinn-photos',
      consistency: 'strong',
    });
    
    const timestamp = Date.now();
    const fileKey = `photo-${timestamp}-${fileName}`;

    await store.set(fileKey, buffer as any, {
      metadata: {
        fileName,
        mimeType,
        size: buffer.length.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    const url = `/api/photos/blob/${encodeURIComponent(fileKey)}`;

    return {
      url,
      id: fileKey,
      provider: 'netlify',
    };
  } catch (error: any) {
    // Логируем только в development
    if (process.env.NODE_ENV === 'development') {
      console.error('Netlify Blobs upload error:', error);
    }
    
    let errorMessage = 'Ошибка сохранения в Netlify Blobs';
    if (error?.message) {
      errorMessage += `: ${error.message}`;
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Netlify Blobs get error:', error);
    }
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
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Netlify Blobs delete error:', error);
    }
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
      blobs.map(async (blob: any) => {
        const metadata = await store.getMetadata(blob.key);
        return {
          key: blob.key,
          metadata: metadata || {},
        };
      })
    );

    return photos;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Netlify Blobs list error:', error);
    }
    return [];
  }
}

export function isNetlifyConfigured(): boolean {
  try {
    return typeof getStore === 'function';
  } catch (error: any) {
    return false;
  }
}

