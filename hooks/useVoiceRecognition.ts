'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { isIOS, isSafari } from '@/lib/device';

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
  const [needsManualStart, setNeedsManualStart] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSuccessRef = useRef(false);
  const retryCountRef = useRef(0);
  
  // Получаем кодовое слово из переменных окружения
  const getVoiceCode = useCallback(() => {
    if (typeof window !== 'undefined') {
      const code = process.env.NEXT_PUBLIC_VOICE_CODE || 'tron';
      return code.toLowerCase().trim();
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
    const hasSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    
    // На iOS Safari Web Speech API может работать, но с ограничениями
    if (isIOS() && isSafari()) {
      // Проверяем реальную поддержку
      return hasSupport;
    }
    
    return hasSupport;
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
      return null;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (hasSuccessRef.current) return;
    
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      // На iOS Safari может не поддерживаться
      if (isIOS()) {
        const errorMsg = 'На iPhone используйте Chrome или Edge для лучшей поддержки голосового распознавания';
        setError(errorMsg);
        setIsSupported(false);
        setNeedsManualStart(true);
        onError?.(errorMsg);
        return;
      }
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
      // На iOS автоматически запрашиваем разрешение при первом вызове
      if (isIOS() && retryCountRef.current === 0) {
        retryCountRef.current = 1;
        // Пробуем еще раз через небольшую задержку
        setTimeout(() => {
          startListening();
        }, 500);
        return;
      }
      const errorMsg = 'Разрешите доступ к микрофону. Нажмите на иконку микрофона в адресной строке.';
      setError(errorMsg);
      setNeedsManualStart(true);
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
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setNeedsManualStart(false);
      retryCountRef.current = 0;
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Автоматически перезапускаем через небольшую задержку, если не было успеха
      if (!hasSuccessRef.current && !error && retryCountRef.current < 3) {
        restartTimeoutRef.current = setTimeout(() => {
          if (!hasSuccessRef.current) {
            retryCountRef.current++;
            startListening();
          }
        }, 500);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';
      
      // Собираем все результаты (и промежуточные, и финальные)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0]) {
          fullTranscript += result[0].transcript + ' ';
        }
      }
      
      // Также проверяем все предыдущие результаты
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0] && !fullTranscript.includes(result[0].transcript)) {
          fullTranscript = result[0].transcript + ' ' + fullTranscript;
        }
      }
      
      const currentTranscript = fullTranscript.toLowerCase().trim();
      setTranscript(currentTranscript);

      console.log('=== РАСПОЗНАВАНИЕ ===');
      console.log('Полный текст:', currentTranscript);
      console.log('Ищем слово:', voiceCode);
      console.log('Длина текста:', currentTranscript.length);

      // Более гибкая проверка кодового слова
      // Убираем все знаки препинания и пробелы для сравнения
      const cleanTranscript = currentTranscript.replace(/[^a-zа-яё0-9]/gi, '').toLowerCase();
      const cleanCode = voiceCode.replace(/[^a-zа-яё0-9]/gi, '').toLowerCase();
      
      console.log('Очищенный текст:', cleanTranscript);
      console.log('Очищенный код:', cleanCode);
      
      // Проверяем разными способами:
      // 1. Точное совпадение
      // 2. Содержит код
      // 3. Код содержит распознанное слово (для коротких слов)
      // 4. Похожесть звучания (для английских слов на русском языке)
      const exactMatch = cleanTranscript === cleanCode;
      const containsCode = cleanTranscript.includes(cleanCode);
      const codeContainsTranscript = cleanCode.includes(cleanTranscript) && cleanTranscript.length >= 2;
      
      // Дополнительные варианты для "tron"
      const alternativeMatches = [
        'трон', 'тронн', 'троннн', 'тронннн', // русское произношение
        'tron', 'tronn', 'tronnn', // английское
        'тро', 'тронн', // сокращения
      ];
      const hasAlternative = alternativeMatches.some(alt => 
        cleanTranscript.includes(alt) || alt.includes(cleanTranscript)
      );
      
      const found = exactMatch || containsCode || codeContainsTranscript || hasAlternative;
      
      console.log('Точное совпадение:', exactMatch);
      console.log('Содержит код:', containsCode);
      console.log('Альтернативные варианты:', hasAlternative);
      console.log('НАЙДЕНО:', found);
      
      if (found) {
        console.log('✅ КОДОВОЕ СЛОВО НАЙДЕНО! Переход...');
        hasSuccessRef.current = true;
        recognition.stop();
        setIsListening(false);
        setError(null);
        setTimeout(() => {
          onSuccess?.();
        }, 200);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      let errorMsg = '';
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          if (isIOS()) {
            errorMsg = 'Разрешите доступ к микрофону в настройках Safari';
            setNeedsManualStart(true);
          } else {
            errorMsg = 'Разрешите доступ к микрофону в настройках браузера';
            setNeedsManualStart(true);
          }
          break;
        case 'no-speech':
          // Не показываем ошибку для no-speech
          return;
        case 'network':
          errorMsg = 'Ошибка сети. Проверьте подключение к интернету.';
          break;
        case 'aborted':
          return;
        case 'audio-capture':
          errorMsg = 'Не удалось получить доступ к микрофону.';
          break;
        case 'service-not-allowed':
          if (isIOS()) {
            errorMsg = 'На iPhone используйте Chrome для голосового распознавания';
            setNeedsManualStart(true);
          } else {
            errorMsg = 'Служба распознавания речи недоступна.';
          }
          break;
        default:
          // Для других ошибок не показываем сообщение, просто перезапускаем
          if (retryCountRef.current < 2) {
            setTimeout(() => {
              startListening();
            }, 1000);
            return;
          }
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
      // На iOS может быть ошибка при первом запуске
      if (isIOS() && retryCountRef.current === 0) {
        retryCountRef.current = 1;
        setTimeout(() => {
          startListening();
        }, 500);
        return;
      }
      const errorMsg = `Не удалось начать распознавание. ${isIOS() ? 'Попробуйте использовать Chrome.' : ''}`;
      setError(errorMsg);
      setNeedsManualStart(true);
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
    const supported = checkBrowserSupport();
    setIsSupported(supported);
    
    // Автоматически начинаем слушать
    if (supported) {
      // Небольшая задержка для iOS чтобы браузер успел инициализироваться
      const delay = isIOS() ? 1000 : 500;
      setTimeout(() => {
        startListening();
      }, delay);
    } else {
      if (isIOS()) {
        setNeedsManualStart(true);
        setError('На iPhone используйте Chrome для автоматического распознавания');
      }
    }

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
    needsManualStart,
    startListening,
    stopListening,
  };
}
