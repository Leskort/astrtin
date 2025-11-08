'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

// Добавляем типы для Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

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

  const { isListening, error } = useVoiceRecognition({
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
      <div className="text-center fade-in">
        <h1 className="text-6xl md:text-8xl font-mono text-[var(--matrix-green-bright)] text-glow-strong">
          astrinn
        </h1>
        
        {error && (
          <p className="text-[var(--matrix-red-neon)] font-mono text-sm mt-4 text-glow-red">
            {error}
          </p>
        )}
        
        {isListening && !error && (
          <div className="mt-8">
            <div className="w-4 h-4 bg-[var(--matrix-green-bright)] rounded-full pulse mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}
