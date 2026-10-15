import { registerSW } from 'virtual:pwa-register';

export function initPWA(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('[MESURV PWA] New version detected; auto-updating service worker cache.');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[MESURV PWA] 100% Offline Field Mode ready: core knowledge, calculation engines & tiles cached.');
      },
      onRegisterError(error: unknown) {
        console.warn('[MESURV PWA] Service Worker registration failed:', error);
      },
    });
  }
}
