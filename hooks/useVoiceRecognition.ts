'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

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
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSuccessRef = useRef(false);
  
  // Получаем кодовое слово из переменных окружения
  const getVoiceCode = useCallback(() => {
    if (typeof window !== 'undefined') {
      return (process.env.NEXT_PUBLIC_VOICE_CODE || 'tron').toLowerCase().trim();
    }
    return 'tron';
  }, []);

  const getLanguage = useCallback(() => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_VOICE_LANGUAGE || 'en-US';
    }
    return 'en-US';
  }, []);

  const voiceCode = getVoiceCode();
  const language = getLanguage();

  // Проверка поддержки браузера
  const checkBrowserSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  // Проверка разрешения микрофона
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return false;
      }
      return null; // Неизвестная ошибка
    }
  }, []);

  const startListening = useCallback(async () => {
    if (hasSuccessRef.current) return;
    
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      const errorMsg = 'Ваш браузер не поддерживает распознавание речи. Используйте Chrome или Edge.';
      setError(errorMsg);
      setIsSupported(false);
      onError?.(errorMsg);
      return;
    }

    setIsSupported(true);

    // Проверяем разрешение микрофона
    const hasPermission = await checkMicrophonePermission();
    if (hasPermission === false) {
      const errorMsg = 'Разрешите доступ к микрофону в настройках браузера';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Останавливаем предыдущее распознавание
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Игнорируем ошибки
      }
    }

    // Очищаем таймер перезапуска
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Создаем новый экземпляр распознавания
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true; // Включаем промежуточные результаты для лучшей работы
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Автоматически перезапускаем через небольшую задержку, если не было успеха
      if (!hasSuccessRef.current && !error) {
        restartTimeoutRef.current = setTimeout(() => {
          if (!hasSuccessRef.current) {
            startListening();
          }
        }, 500);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .toLowerCase()
        .trim();

      setTranscript(currentTranscript);

      // Проверяем наличие кодового слова в текущем транскрипте
      if (currentTranscript.includes(voiceCode)) {
        hasSuccessRef.current = true;
        recognition.stop();
        setIsListening(false);
        setError(null);
        onSuccess?.();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      let errorMsg = '';
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMsg = 'Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.';
          break;
        case 'no-speech':
          // Не показываем ошибку для no-speech, просто продолжаем
          return;
        case 'network':
          errorMsg = 'Ошибка сети. Проверьте подключение к интернету.';
          break;
        case 'aborted':
          // Игнорируем aborted
          return;
        case 'audio-capture':
          errorMsg = 'Не удалось получить доступ к микрофону. Проверьте настройки устройства.';
          break;
        case 'service-not-allowed':
          errorMsg = 'Служба распознавания речи недоступна.';
          break;
        default:
          errorMsg = `Ошибка распознавания: ${event.error}`;
      }
      
      if (errorMsg) {
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    recognitionRef.current = recognition;

    // Начинаем слушать
    try {
      recognition.start();
    } catch (err: any) {
      const errorMsg = `Не удалось начать распознавание: ${err.message || 'неизвестная ошибка'}`;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [voiceCode, language, onSuccess, onError, checkMicrophonePermission, error]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Игнорируем ошибки
      }
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    // Проверяем поддержку при монтировании
    setIsSupported(checkBrowserSupport());
    
    // Автоматически начинаем слушать
    startListening();

    return () => {
      stopListening();
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [startListening, stopListening, checkBrowserSupport]);

  return {
    isListening,
    error,
    transcript,
    isSupported,
    startListening,
    stopListening,
  };
}
