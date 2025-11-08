'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const handleSuccess = async () => {
    // Проверяем наличие активной сессии
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      if (session?.user) {
        // Если сессия активна - переходим в галерею
        router.push('/gallery');
      } else {
        // Если сессии нет - переходим на логин
        router.push('/login');
      }
    } catch (error) {
      // В случае ошибки переходим на логин
      router.push('/login');
    }
  };

  const handleError = (error: string) => {
    console.error('Voice recognition error:', error);
  };

  const { isListening, error, transcript, isSupported, startListening, stopListening } = useVoiceRecognition({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--matrix-black)] p-4">
      <div className="text-center fade-in max-w-md w-full">
        <h1 className="text-6xl md:text-8xl font-mono text-[var(--matrix-green-bright)] text-glow-strong mb-8">
          astrinn
        </h1>
        
        {/* Индикатор прослушивания */}
        {isListening && !error && (
          <div className="mb-6">
            <div className="w-6 h-6 bg-[var(--matrix-green-bright)] rounded-full pulse mx-auto mb-2"></div>
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs">
              Слушаю...
            </p>
          </div>
        )}

        {/* Отображение распознанного текста (для отладки) */}
        {transcript && isListening && (
          <p className="text-[var(--matrix-green-dark)] font-mono text-xs mb-4 break-words">
            {transcript}
          </p>
        )}
        
        {/* Ошибки */}
        {error && (
          <div className="mb-6">
            <p className="text-[var(--matrix-red-neon)] font-mono text-sm mb-4 text-glow-red">
              {error}
            </p>
            
            {/* Кнопка для повторной попытки */}
            {error.includes('микрофон') || error.includes('браузер') ? (
              <Button
                onClick={() => {
                  window.location.reload();
                }}
                size="md"
              >
                ПОВТОРИТЬ
              </Button>
            ) : (
              <Button
                onClick={startListening}
                size="md"
              >
                НАЧАТЬ СЛУШАТЬ
              </Button>
            )}
          </div>
        )}

        {/* Информация о поддержке браузера */}
        {isSupported === false && (
          <p className="text-[var(--matrix-yellow-neon)] font-mono text-xs mt-4">
            Используйте Chrome или Edge для лучшей поддержки
          </p>
        )}
      </div>
    </div>
  );
}
