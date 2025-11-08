'use client';

// Определение типа устройства
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function isChrome(): boolean {
  if (typeof window === 'undefined') return false;
  return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
}

export function getBrowserInfo() {
  if (typeof window === 'undefined') return { isIOS: false, isSafari: false, isChrome: false };
  return {
    isIOS: isIOS(),
    isSafari: isSafari(),
    isChrome: isChrome(),
    userAgent: navigator.userAgent,
  };
}

