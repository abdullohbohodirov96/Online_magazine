'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from './LoginModal';

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
    <form onSubmit={handleSearchSubmit} className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Поиск свежих продуктов..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <span className="search-icon">🔍</span>
    </form>
  );
}

export default function Header() {
  const { user, cartCount, setShowLoginModal } = useApp();

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            🍎 <span>Bozor<span>Market</span></span>
          </Link>

          <Suspense fallback={
            <div className="search-bar">
              <input type="text" className="search-input" placeholder="Загрузка поиска..." disabled />
            </div>
          }>
            <SearchInput />
          </Suspense>

          <div className="header-actions">
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="action-btn" style={{ color: 'var(--primary-color)' }}>
                ⚙️ Админка
              </Link>
            )}

            <Link href="/cart" className="action-btn cart-badge-wrapper">
              🛒 Корзина
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {user ? (
              <Link href="/profile" className="action-btn primary">
                👤 {user.name || user.phone}
              </Link>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="action-btn primary">
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
