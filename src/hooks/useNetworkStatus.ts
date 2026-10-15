import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isDismissed: boolean;
  dismissBanner: () => void;
  resetDismissed: () => void;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setIsDismissed(false);
      // Auto-clear wasOffline notification after 4 seconds
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const resetDismissed = useCallback(() => {
    setIsDismissed(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    isDismissed,
    dismissBanner,
    resetDismissed,
  };
}
