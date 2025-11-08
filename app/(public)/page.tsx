'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { isIOS } from '@/lib/device';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [found, setFound] = useState(false);
  const router = useRouter();

  const handleSuccess = async () => {
    console.log('handleSuccess вызван');
    setFound(true);
    
    // Небольшая задержка для визуальной обратной связи
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Проверяем наличие активной сессии
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      console.log('Session:', session);
      
      if (session?.user) {
        // Если сессия активна - переходим в галерею
        console.log('Переход в галерею');
        router.push('/gallery');
      } else {
        // Если сессии нет - переходим на логин
        console.log('Переход на логин');
        router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка при проверке сессии:', error);
      // В случае ошибки переходим на логин
      router.push('/login');
    }
  };

  const handleError = (error: string) => {
    console.error('Voice recognition error:', error);
  };

  const { isListening, error, transcript, isSupported, needsManualStart, startListening, stopListening } = useVoiceRecognition({
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
        
        {/* Индикатор успешного распознавания */}
        {found && (
          <div className="mb-6 animate-pulse">
            <p className="text-[var(--matrix-green-bright)] font-mono text-lg text-glow-strong mb-2">
              ✓ РАСПОЗНАНО
            </p>
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs">
              Переход...
            </p>
          </div>
        )}
        
        {/* Индикатор прослушивания */}
        {isListening && !error && !found && (
          <div className="mb-6">
            <div className="w-6 h-6 bg-[var(--matrix-green-bright)] rounded-full pulse mx-auto mb-2"></div>
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs">
              Слушаю...
            </p>
          </div>
        )}

        {/* Отображение распознанного текста (для отладки) */}
        {transcript && isListening && !found && (
          <div className="mb-4 max-w-sm mx-auto">
            <p className="text-[var(--matrix-green-dark)] font-mono text-xs mb-2 break-words">
              Распознано: <span className="text-[var(--matrix-green-soft)]">{transcript}</span>
            </p>
            <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-50 mb-2">
              Ищем: {process.env.NEXT_PUBLIC_VOICE_CODE || 'tron'}
            </p>
            <p className="text-[var(--matrix-cyan-neon)] font-mono text-xs">
              Произнесите: "tron" или "трон"
            </p>
          </div>
        )}

        {/* Тестовая кнопка для проверки перехода (только в dev режиме) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4">
            <Button
              onClick={handleSuccess}
              size="sm"
              variant="secondary"
            >
              ТЕСТ ПЕРЕХОДА
            </Button>
          </div>
        )}
        
        {/* Ошибки или необходимость ручного запуска */}
        {(error || needsManualStart) && (
          <div className="mb-6">
            {error && (
              <p className="text-[var(--matrix-red-neon)] font-mono text-sm mb-4 text-glow-red">
                {error}
              </p>
            )}
            
            {/* Кнопка для запуска/повтора */}
            {needsManualStart && (
              <Button
                onClick={() => {
                  setFound(false);
                  startListening();
                }}
                size="md"
                className="mt-4"
              >
                НАЧАТЬ СЛУШАТЬ
              </Button>
            )}
            
            {error && !needsManualStart && (
              <Button
                onClick={() => {
                  window.location.reload();
                }}
                size="md"
                className="mt-4"
              >
                ПОВТОРИТЬ
              </Button>
            )}
          </div>
        )}

        {/* Упрощенный режим для iPhone - кнопка для перехода */}
        {isIOS() && (isSupported === false || needsManualStart) && !isListening && !found && (
          <div className="mt-6">
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs mb-4">
              Нажмите для продолжения
            </p>
            <Button
              onClick={handleSuccess}
              size="lg"
            >
              ПРОДОЛЖИТЬ
            </Button>
          </div>
        )}

        {/* Информация о поддержке браузера */}
        {isSupported === false && !isIOS() && (
          <p className="text-[var(--matrix-yellow-neon)] font-mono text-xs mt-4">
            Используйте Chrome или Edge для лучшей поддержки
          </p>
        )}
      </div>
    </div>
  );
}
