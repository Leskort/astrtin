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
    console.log('Environment check:', {
      NETLIFY: process.env.NETLIFY,
      NETLIFY_DEV: process.env.NETLIFY_DEV,
      NETLIFY_CONTEXT: process.env.NETLIFY_CONTEXT,
      CONTEXT: process.env.CONTEXT,
      NODE_ENV: process.env.NODE_ENV,
    });
    
    // Проверяем доступность getStore
    if (typeof getStore !== 'function') {
      console.error('getStore is not a function. Type:', typeof getStore);
      throw new Error('getStore is not available. Make sure @netlify/blobs is installed and Netlify Blobs is enabled.');
    }
    
    console.log('Creating store with name: astrinn-photos');
    let store;
    try {
      store = getStore({
        name: 'astrinn-photos',
        consistency: 'strong',
      });
      console.log('Store created successfully');
    } catch (storeError: any) {
      console.error('Error creating store:', storeError);
      throw new Error(`Не удалось создать store Netlify Blobs: ${storeError.message}`);
    }
    
    console.log('Store initialized, uploading file...');
    const timestamp = Date.now();
    const fileKey = `photo-${timestamp}-${fileName}`;
    console.log('File key:', fileKey);
    console.log('File size:', buffer.length, 'bytes');

    // Netlify Blobs принимает Buffer, ArrayBuffer, Uint8Array, или строку
    // Используем buffer напрямую с приведением типа, так как Buffer совместим
    try {
      await store.set(fileKey, buffer as any, {
        metadata: {
          fileName,
          mimeType,
          size: buffer.length.toString(),
          uploadedAt: new Date().toISOString(),
        },
      });
      console.log('File saved to Netlify Blobs successfully:', fileKey);
    } catch (setError: any) {
      console.error('Error setting file in store:', setError);
      throw new Error(`Не удалось сохранить файл в Netlify Blobs: ${setError.message}`);
    }

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
    console.error('Error code:', error?.code);
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
    console.error('Netlify Blobs list error:', error);
    return [];
  }
}

export function isNetlifyConfigured(): boolean {
  // Всегда возвращаем true, чтобы код пытался использовать Netlify Blobs
  // Если он не доступен, ошибка будет поймана при попытке использования
  // Проверяем только, что getStore доступен
  try {
    if (typeof getStore !== 'function') {
      console.log('Netlify Blobs: getStore is not a function');
      return false;
    }
    
    // Если getStore доступен, считаем что Netlify Blobs может работать
    // На Netlify он должен работать автоматически
    return true;
  } catch (error: any) {
    console.error('Error checking Netlify Blobs availability:', error);
    return false;
  }
}

