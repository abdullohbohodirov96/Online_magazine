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

  // Format telegram link helper
  const getTelegramLink = (val: string) => {
    if (!val) return '';
    return val.startsWith('http') ? val : `https://t.me/${val.replace('@', '')}`;
  };

  // Format instagram link helper
  const getInstagramLink = (val: string) => {
    if (!val) return '';
    return val.startsWith('http') ? val : `https://instagram.com/${val.replace('@', '')}`;
  };

  // Parse custom socials list
  let socials: Array<{ provider: string; url: string }> = [];
  if (store?.socialsJson) {
    try {
      socials = JSON.parse(store.socialsJson);
    } catch (e) {
      socials = [];
    }
  }

  // Fallback to legacy columns if socials list is empty
  if (socials.length === 0) {
    if (store?.telegramUsername) socials.push({ provider: 'telegram', url: store.telegramUsername });
    if (store?.instagramUsername) socials.push({ provider: 'instagram', url: store.instagramUsername });
    if (store?.facebookUrl) socials.push({ provider: 'facebook', url: store.facebookUrl });
    if (store?.youtubeUrl) socials.push({ provider: 'youtube', url: store.youtubeUrl });
  }

  // Parse phone numbers
  let phoneNumbers: string[] = [];
  if (store?.phones) {
    try {
      phoneNumbers = JSON.parse(store.phones);
    } catch (e) {
      phoneNumbers = [];
    }
  }
  if (phoneNumbers.length === 0 && store?.phone) {
    phoneNumbers.push(store.phone);
  }

  return (
    <footer className='footer'>
      <div className='container footer-inner'>
        <div className='footer-section'>
          <h4 style={{ color: 'var(--primary-color)', margin: '0 0 1rem 0' }}>
            {store ? store.name : 'BozorMarket'}
          </h4>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
            {store?.description || t('bannerDesc')}
          </p>

          {/* Social Links Row */}
          {socials.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              {socials.map((soc, idx) => {
                const link = soc.provider === 'telegram' ? getTelegramLink(soc.url) :
                             soc.provider === 'instagram' ? getInstagramLink(soc.url) :
                             soc.url;
                const emoji = soc.provider === 'telegram' ? '✈️' :
                              soc.provider === 'instagram' ? '📸' :
                              soc.provider === 'facebook' ? '👥' : '📺';
                return (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--muted-light)',
                      color: 'var(--primary-color)',
                      fontSize: '1.1rem',
                      transition: 'all 0.2s',
                      border: '1px solid var(--border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--muted-light)';
                      e.currentTarget.style.color = 'var(--primary-color)';
                    }}
                  >
                    {emoji}
                  </a>
                );
              })}
            </div>
          )}
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
            <li>📍 {store?.address || 'Toshkent, O\'zbekiston'}</li>
            {phoneNumbers.map((ph, idx) => (
              <li key={idx}>📞 {ph}</li>
            ))}
            {store?.supportPhone && (
              <li>📞 {store.supportPhone} (Support)</li>
            )}
            {store?.email && (
              <li>✉️ {store.email}</li>
            )}
          </ul>
        </div>
      </div>
      <div className='container footer-bottom'>
        <p>&copy; {new Date().getFullYear()} {store ? store.name : 'BozorMarket'}. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
}
