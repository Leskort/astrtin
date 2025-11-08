'use client';

import { useEffect, useState, useRef } from 'react';

// Типы для Web Speech API
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

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface UseVoiceRecognitionOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition({ onSuccess, onError }: UseVoiceRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Получаем кодовое слово из переменных окружения
  const getVoiceCode = () => {
    if (typeof window !== 'undefined') {
      // На клиенте используем переменную из next.config
      return (process.env.NEXT_PUBLIC_VOICE_CODE || 'tron').toLowerCase().trim();
    }
    return 'tron';
  };

  const getLanguage = () => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_VOICE_LANGUAGE || 'en-US';
    }
    return 'en-US';
  };

  const voiceCode = getVoiceCode();
  const language = getLanguage();

  useEffect(() => {
    // Проверяем поддержку браузера
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      const errorMsg = 'Ваш браузер не поддерживает распознавание речи';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Создаем экземпляр распознавания
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Автоматически перезапускаем, если не было успеха
      if (!error) {
        try {
          recognition.start();
        } catch (e) {
          // Игнорируем ошибки перезапуска
        }
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .toLowerCase()
        .trim();

      // Проверяем наличие кодового слова
      if (transcript.includes(voiceCode)) {
        recognition.stop();
        setIsListening(false);
        onSuccess?.();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      let errorMsg = 'Ошибка распознавания речи';
      
      if (event.error === 'not-allowed') {
        errorMsg = 'Доступ к микрофону запрещен';
      } else if (event.error === 'no-speech') {
        // Не показываем ошибку для no-speech, просто продолжаем слушать
        return;
      } else if (event.error === 'network') {
        errorMsg = 'Ошибка сети';
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    };

    recognitionRef.current = recognition;

    // Автоматически начинаем слушать
    try {
      recognition.start();
    } catch (err) {
      const errorMsg = 'Не удалось начать распознавание';
      setError(errorMsg);
      onError?.(errorMsg);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Игнорируем ошибки при остановке
        }
      }
    };
  }, [voiceCode, language, onSuccess, onError, error]);

  return {
    isListening,
    error,
  };
}
