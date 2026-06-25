'use client';

import React from 'react';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';

export default function Footer() {
  const { isTelegram } = useTelegramWebApp();

  if (isTelegram) {
    return null;
  }

  return (
    <footer className='footer'>
      <div className='container footer-inner'>
        <div className='footer-section'>
          <h4 style={{ color: 'var(--primary-color)' }}>🍎 BozorMarket</h4>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Ваш любимый онлайн-магазин продуктов питания с доставкой на дом. Всегда свежие фрукты, овощи, бакалея и мясо по лучшим ценам.
          </p>
        </div>
        <div className='footer-section'>
          <h4>Категории</h4>
          <ul className='footer-links'>
            <li>Овощи и Фрукты</li>
            <li>Молочные продукты</li>
            <li>Напитки</li>
            <li>Мясные изделия</li>
          </ul>
        </div>
        <div className='footer-section'>
          <h4>Контакты</h4>
          <ul className='footer-links'>
            <li>📍 Ташкент, Узбекистан</li>
            <li>📞 +998 (91) 785-00-90</li>
            <li>✉️ support@bozormarket.uz</li>
          </ul>
        </div>
      </div>
      <div className='container footer-bottom'>
        <p>&copy; {new Date().getFullYear()} BozorMarket. Все права защищены.</p>
      </div>
    </footer>
  );
}
