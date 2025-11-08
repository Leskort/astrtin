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
    setFound(true);
    
    try {
      router.push('/login');
      setTimeout(() => {
        if (window.location.pathname === '/') {
          window.location.href = '/login';
        }
      }, 500);
    } catch (error) {
      window.location.href = '/login';
    }
  };

  const handleError = (error: string) => {
    // Ошибка обрабатывается в компоненте
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--matrix-black)] p-4 md:p-6">
      <div className="text-center fade-in max-w-md w-full">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-mono text-[var(--matrix-green-bright)] text-glow-strong mb-6 md:mb-8">
          astrinn
        </h1>
        
        {/* Индикатор успешного распознавания */}
        {found && (
          <div className="mb-4 md:mb-6 animate-pulse">
            <p className="text-[var(--matrix-green-bright)] font-mono text-base md:text-lg text-glow-strong mb-2">
              ✓ РАСПОЗНАНО
            </p>
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs">
              Переход...
            </p>
          </div>
        )}
        
        {/* Индикатор прослушивания */}
        {isListening && !error && !found && (
          <div className="mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-6 md:h-6 bg-[var(--matrix-green-bright)] rounded-full pulse mx-auto mb-2"></div>
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs">
              Слушаю...
            </p>
          </div>
        )}

        {/* Отображение распознанного текста (для отладки) */}
        {transcript && isListening && !found && (
          <div className="mb-3 md:mb-4 max-w-sm mx-auto px-2">
            <p className="text-[var(--matrix-green-dark)] font-mono text-xs mb-2 break-words">
              Распознано: <span className="text-[var(--matrix-green-soft)]">{transcript}</span>
            </p>
            <p className="text-[var(--matrix-green-dark)] font-mono text-xs opacity-50 mb-2 hidden md:block">
              Ищем: {process.env.NEXT_PUBLIC_VOICE_CODE || 'tron'}
            </p>
            <p className="text-[var(--matrix-cyan-neon)] font-mono text-xs">
              Произнесите: "tron" или "трон"
            </p>
          </div>
        )}

        {/* Кнопка для перехода (временно для тестирования) */}
        {!found && (
          <div className="mt-4 md:mt-6">
            <Button
              onClick={() => {
                handleSuccess();
              }}
              size="md"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              ПЕРЕЙТИ ВРУЧНУЮ
            </Button>
          </div>
        )}
        
        {/* Ошибки или необходимость ручного запуска */}
        {(error || needsManualStart) && (
          <div className="mb-4 md:mb-6">
            {error && (
              <div className="p-3 md:p-4 border-2 border-[var(--matrix-red-neon)] bg-[var(--matrix-black)] bg-opacity-50 mb-3 md:mb-4">
                <p className="text-[var(--matrix-red-neon)] font-mono text-xs md:text-sm text-glow-red">
                  {error}
                </p>
              </div>
            )}
            
            {/* Кнопка для запуска/повтора */}
            {needsManualStart && (
              <Button
                onClick={() => {
                  setFound(false);
                  startListening();
                }}
                size="md"
                className="mt-3 md:mt-4 w-full sm:w-auto"
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
                className="mt-3 md:mt-4 w-full sm:w-auto"
              >
                ПОВТОРИТЬ
              </Button>
            )}
          </div>
        )}

        {/* Упрощенный режим для iPhone - кнопка для перехода */}
        {isIOS() && (isSupported === false || needsManualStart) && !isListening && !found && (
          <div className="mt-4 md:mt-6">
            <p className="text-[var(--matrix-green-soft)] font-mono text-xs mb-3 md:mb-4">
              Нажмите для продолжения
            </p>
            <Button
              onClick={handleSuccess}
              size="lg"
              className="w-full sm:w-auto"
            >
              ПРОДОЛЖИТЬ
            </Button>
          </div>
        )}

        {/* Информация о поддержке браузера */}
        {isSupported === false && !isIOS() && (
          <p className="text-[var(--matrix-yellow-neon)] font-mono text-xs mt-3 md:mt-4 px-2">
            Используйте Chrome или Edge для лучшей поддержки
          </p>
        )}
      </div>
    </div>
  );
}
