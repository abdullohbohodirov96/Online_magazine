'use client';

import React from 'react';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';
import { useLanguageTheme } from '@/context/LanguageThemeContext';
import { useApp } from '@/context/AppContext';

export default function Footer() {
  const { isTelegram } = useTelegramWebApp();
  const { t } = useLanguageTheme();
  const { store } = useApp();

  if (isTelegram) {
    return null;
  }

  return (
    <footer className='footer'>
      <div className='container footer-inner'>
        <div className='footer-section'>
          <h4 style={{ color: 'var(--primary-color)' }}>
            🍎 {store ? store.name : 'BozorMarket'}
          </h4>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {store?.description || t('bannerDesc')}
          </p>
        </div>
        <div className='footer-section'>
          <h4>{t('categories')}</h4>
          <ul className='footer-links'>
            <li>{t('categories')} 1</li>
            <li>{t('categories')} 2</li>
            <li>{t('categories')} 3</li>
          </ul>
        </div>
        <div className='footer-section'>
          <h4>{t('contacts')}</h4>
          <ul className='footer-links'>
            <li>📍 Toshkent, O'zbekiston</li>
            <li>📞 +998 (91) 785-00-90</li>
            <li>✉️ support@bozormarket.uz</li>
          </ul>
        </div>
      </div>
      <div className='container footer-bottom'>
        <p>&copy; {new Date().getFullYear()} {store ? store.name : 'BozorMarket'}. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
}
