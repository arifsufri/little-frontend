'use client';

import { useEffect, ReactNode } from 'react';
import keepAliveService from '../../src/utils/keepAlive';

interface KeepAliveProviderProps {
  children: ReactNode;
}

export default function KeepAliveProvider({ children }: KeepAliveProviderProps) {
  useEffect(() => {
    keepAliveService.start();

    return () => {
      keepAliveService.stop();
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🔍 Tab hidden - keep-alive service continues running');
      } else {
        console.log('👁️ Tab visible - keep-alive service active');
        
        if (!keepAliveService.isRunning()) {
          keepAliveService.start();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      keepAliveService.stop();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
}
