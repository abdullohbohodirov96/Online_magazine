'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from './LoginModal';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';

function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className='search-bar'>
      <input
        type='text'
        className='search-input'
        placeholder='Поиск свежих продуктов...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <span className='search-icon'>🔍</span>
    </form>
  );
}

export default function Header() {
  const { user, cartCount, setShowLoginModal } = useApp();
  const { isTelegram } = useTelegramWebApp();

  if (isTelegram) {
    return (
      <>
        <header className='header' style={{ padding: '0.5rem 0', boxShadow: 'none', borderBottom: '1px solid var(--border)' }}>
          <div className='container header-inner' style={{ gap: '0.5rem', justifyContent: 'space-between' }}>
            <Link href='/' className='logo' style={{ fontSize: '1.1rem' }}>
              🍎 <span>Bozor<span>Market</span></span>
            </Link>

            <Link href='/cart' className='action-btn cart-badge-wrapper' style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              🛒
              {cartCount > 0 && <span className='cart-badge' style={{ top: '-4px', right: '-4px' }}>{cartCount}</span>}
            </Link>
          </div>
        </header>
        <LoginModal />
      </>
    );
  }

  return (
    <>
      <header className='header'>
        <div className='container header-inner'>
          <Link href='/' className='logo'>
            🍎 <span>Bozor<span>Market</span></span>
          </Link>

          <Suspense fallback={
            <div className='search-bar'>
              <input type='text' className='search-input' placeholder='Загрузка поиска...' disabled />
            </div>
          }>
            <SearchInput />
          </Suspense>

          <div className='header-actions'>
            {user?.role === 'ADMIN' && (
              <Link href='/admin' className='action-btn' style={{ color: 'var(--primary-color)' }}>
                ⚙️ Админка
              </Link>
            )}

            <Link href='/cart' className='action-btn cart-badge-wrapper'>
              🛒 Корзина
              {cartCount > 0 && <span className='cart-badge'>{cartCount}</span>}
            </Link>

            {user ? (
              <Link href='/profile' className='action-btn primary'>
                👤 {user.name || user.phone}
              </Link>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className='action-btn primary'>
                🚪 Войти
              </button>
            )}
          </div>
        </div>
      </header>
      <LoginModal />
    </>
  );
}
