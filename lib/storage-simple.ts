// Простое хранилище для небольшого количества фотографий (до 200 штук)
// Использует различные варианты в зависимости от доступности

import { uploadToSupabase, isSupabaseConfigured } from './supabase';
import { uploadToCloudinary, isCloudinaryConfigured } from './cloudinary';

export interface StorageResult {
  url: string;
  id: string;
  provider: 'supabase' | 'cloudinary' | 'local';
}

export async function uploadPhoto(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult> {
  const timestamp = Date.now();
  
  // Приоритет: Supabase > Cloudinary > локальное хранилище
  if (isSupabaseConfigured()) {
    try {
      const url = await uploadToSupabase(buffer, fileName, mimeType);
      return {
        url,
        id: `supabase-${timestamp}`,
        provider: 'supabase',
      };
    } catch (error: any) {
      console.error('Supabase upload failed:', error);
      // Пробуем следующий вариант
    }
  }

  if (isCloudinaryConfigured()) {
    try {
      const url = await uploadToCloudinary(buffer, fileName, mimeType);
      return {
        url,
        id: `cloudinary-${timestamp}`,
        provider: 'cloudinary',
      };
    } catch (error: any) {
      console.error('Cloudinary upload failed:', error);
      // Пробуем следующий вариант
    }
  }

  // Если ничего не настроено, используем локальное хранилище (только development)
  if (process.env.NODE_ENV === 'development') {
    const { writeFile } = await import('fs/promises');
    const { join } = await import('path');
    const fs = await import('fs');
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = join(uploadsDir, `${timestamp}-${fileName}`);
    await writeFile(filePath, buffer);
    
    return {
      url: `/uploads/${timestamp}-${fileName}`,
      id: `local-${timestamp}`,
      provider: 'local',
    };
  }

  throw new Error('Нет настроенного хранилища. Настройте Supabase или Cloudinary.');
}

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured() || isCloudinaryConfigured() || process.env.NODE_ENV === 'development';
}

