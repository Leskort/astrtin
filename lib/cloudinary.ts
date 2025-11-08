import { v2 as cloudinary } from 'cloudinary';

// Конфигурация Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToCloudinary(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary не настроен');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'astrinn-photos',
        resource_type: 'auto',
        public_id: `photo-${Date.now()}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Неизвестная ошибка загрузки'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary не настроен');
  }

  await cloudinary.uploader.destroy(publicId);
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

