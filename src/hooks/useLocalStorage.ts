import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T, expiryHours?: number): [T, (value: T) => void] {
  const readValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      if (expiryHours) {
        const timeItem = window.localStorage.getItem(`${key}_time`);
        if (timeItem) {
          const savedTime = new Date(timeItem);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
          if (hoursDiff >= expiryHours) {
            window.localStorage.removeItem(key);
            window.localStorage.removeItem(`${key}_time`);
            return initialValue;
          }
        }
      }

      return JSON.parse(item) as T;
    } catch {
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback((value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      if (expiryHours) {
        window.localStorage.setItem(`${key}_time`, new Date().toISOString());
      }
      setStoredValue(value);
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [key, expiryHours]);

  return [storedValue, setValue];
}
