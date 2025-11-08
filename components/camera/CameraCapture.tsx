'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

interface CameraCaptureProps {
  onCaptureComplete?: () => void;
}

export default function CameraCapture({ onCaptureComplete }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      // Останавливаем поток при размонтировании
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Разрешите доступ к камере в настройках браузера');
      } else if (err.name === 'NotFoundError') {
        setError('Камера не найдена');
      } else {
        setError('Не удалось запустить камеру');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    // Небольшая задержка перед перезапуском
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Устанавливаем размеры canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Рисуем кадр на canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Конвертируем в blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setError('Не удалось создать изображение');
            setIsCapturing(false);
            return;
          }

          // Создаем файл из blob
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });

          // Загружаем на сервер
          await uploadPhoto(file);
        }, 'image/jpeg', 0.9);
      }
    } catch (err: any) {
      setError('Ошибка при съемке: ' + err.message);
      setIsCapturing(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки');
      }

      // Успешная загрузка
      onCaptureComplete?.();
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке');
    } finally {
      setUploading(false);
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Видео элемент */}
      <div className="relative w-full aspect-[4/3] bg-[var(--matrix-gray-dark)] border-2 border-[var(--matrix-green-dark)] overflow-hidden">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-[var(--matrix-green-dark)] mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-[var(--matrix-green-dark)] font-mono text-sm">
                Камера не запущена
              </p>
            </div>
          </div>
        )}

        {/* Скрытый canvas для захвата кадра */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Ошибка */}
      {error && (
        <p className="text-[var(--matrix-red-neon)] font-mono text-sm text-glow-red">
          {error}
        </p>
      )}

      {/* Индикатор загрузки */}
      {uploading && (
        <div className="text-center">
          <Loading text="СОХРАНЕНИЕ..." />
        </div>
      )}

      {/* Кнопки управления */}
      <div className="flex flex-wrap gap-4 justify-center">
        {!stream ? (
          <Button
            onClick={startCamera}
            size="lg"
            disabled={uploading}
          >
            ЗАПУСТИТЬ КАМЕРУ
          </Button>
        ) : (
          <>
            <Button
              onClick={capturePhoto}
              size="lg"
              disabled={isCapturing || uploading}
            >
              {isCapturing ? 'СЪЕМКА...' : 'СДЕЛАТЬ ФОТО'}
            </Button>
            <Button
              onClick={switchCamera}
              size="md"
              variant="secondary"
              disabled={uploading}
            >
              ПЕРЕКЛЮЧИТЬ КАМЕРУ
            </Button>
            <Button
              onClick={stopCamera}
              size="md"
              variant="danger"
              disabled={uploading}
            >
              ОСТАНОВИТЬ
            </Button>
          </>
        )}
      </div>

      {/* Подсказка */}
      {stream && (
        <p className="text-[var(--matrix-green-dark)] font-mono text-xs text-center opacity-50">
          Нажмите "СДЕЛАТЬ ФОТО" для съемки
        </p>
      )}
    </div>
  );
}

