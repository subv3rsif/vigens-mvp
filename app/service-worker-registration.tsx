'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './register-sw';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
