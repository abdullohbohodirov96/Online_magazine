'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';

interface MiniAppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export default function MiniAppLayout({ children, title = 'BozorMarket', showBackButton = false }: MiniAppLayoutProps) {
  const { cartCount, fetchUser } = useApp();
  const { isTelegram, tgUser } = useTelegramWebApp();
  const router = useRouter();
  const pathname = usePathname();
  
  // Theme state from Telegram WebApp
  const [theme, setTheme] = useState<any>({
    bg: 'var(--background)',
    text: 'var(--foreground)',
    buttonBg: 'var(--primary-color)',
    buttonText: '#ffffff',
    secondaryBg: 'var(--card-bg)',
    hint: 'var(--muted)',
  });

  useEffect(() => {
    // When miniapp loads, we also want to refetch user to make sure auth cookie is picked up
    fetchUser();

    const handleViewport = () => {
      const tg = (window as any).Telegram?.WebApp;
      const height = tg?.viewportStableHeight || window.innerHeight;
      document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`);
    };

    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp as any;
      tg.ready();
      tg.expand();
      
      handleViewport();
      tg.onEvent('viewportChanged', handleViewport);
      
      const themeParams = tg.themeParams;
      if (themeParams) {
        setTheme({
          bg: themeParams.bg_color || 'var(--background)',
          text: themeParams.text_color || 'var(--foreground)',
          buttonBg: themeParams.button_color || 'var(--primary-color)',
          buttonText: themeParams.button_text_color || '#ffffff',
          secondaryBg: themeParams.secondary_bg_color || 'var(--card-bg)',
          hint: themeParams.hint_color || 'var(--muted)',
        });
      }

      return () => {
        tg.offEvent('viewportChanged', handleViewport);
      };
    }
  }, []);

  const navItems = [
    { label: 'Главная', path: '/miniapp', icon: '🏠' },
    { label: 'Категории', path: '/miniapp/categories', icon: '📂' },
    { label: 'Корзина', path: '/miniapp/cart', icon: '🛒', badge: cartCount },
    { label: 'Профиль', path: '/miniapp/profile', icon: '👤' },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '480px',
        minWidth: '0',
        margin: '0 auto',
        minHeight: 'var(--tg-viewport-height, 100dvh)',
        backgroundColor: theme.bg,
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        paddingBottom: '110px',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Mini App Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: theme.secondaryBg,
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          gap: '8px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          {showBackButton && (
            <button
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: theme.text,
                padding: '0.25rem',
              }}
            >
              ⬅️
            </button>
          )}
          <h1 style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{title}</h1>
        </div>
        
        {tgUser && (
          <div style={{ fontSize: '0.8rem', color: theme.hint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
            Привет, {tgUser.first_name}!
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1rem 12px 10px 12px', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* Fixed Bottom Bar Navigation */}
      <nav
        style={{
          position: 'fixed',
          bottom: 'env(safe-area-inset-bottom, 0)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(100%, 480px)',
          maxWidth: '480px',
          height: '64px',
          backgroundColor: theme.secondaryBg,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 50,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
          boxSizing: 'border-box',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0))',
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/miniapp' && pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                flex: 1,
                height: '100%',
                cursor: 'pointer',
                position: 'relative',
                color: isActive ? theme.buttonBg : theme.hint,
                transition: 'color 0.2s',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
              
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '24%',
                    backgroundColor: 'var(--danger)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    minWidth: '16px',
                    textAlign: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
