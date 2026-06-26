'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        viewportStableHeight: number;
        themeParams: any;
      };
    };
  }
}

export function useTelegramWebApp() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [initData, setInitData] = useState<string>('');
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const { fetchUser } = useApp();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();

      const user = webApp.initDataUnsafe?.user;
      const data = webApp.initData || '';

      if (data) {
        setIsTelegram(true);
        setTgUser(user || null);
        setInitData(data);

        // Background authentication with backend
        fetch('/api/telegram/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: data }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.user) {
              localStorage.setItem('miniapp_phone', data.user.phone);
              localStorage.setItem('miniapp_user_name', data.user.name || '');
              localStorage.setItem('miniapp_auth_checked', 'true');
              console.log('Telegram backend authentication successful');
              fetchUser(); // Sync the global context state immediately
            } else {
              console.error('Telegram backend authentication failed:', data.error);
            }
          })
          .catch((err) => {
            console.error('Error during Telegram auth:', err);
          });
      }
    }
  }, []);

  return {
    isTelegram,
    tgUser,
    initData,
  };
}
