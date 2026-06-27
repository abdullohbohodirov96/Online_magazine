'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from './LoginModal';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';

function getStoreSlug() {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/');
  if (parts[1] === 'store' || parts[1] === 'miniapp') {
    return parts[2] || '';
  }
  return '';
}

function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = getStoreSlug();
    const basePath = slug ? `/store/${slug}` : '';

    if (searchQuery.trim()) {
      router.push(`${basePath || '/'}?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(basePath || '/');
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

function AdminStoreSwitcher() {
  const [stores, setStores] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');

  useEffect(() => {
    const match = document.cookie.match(/(^| )admin_store_slug=([^;]+)/);
    const cookieSlug = match ? match[2] : '';
    setSelectedSlug(cookieSlug);

    fetch('/api/admin/my-stores')
      .then((res) => {
        if (res.ok) return res.json();
        return { stores: [] };
      })
      .then((data) => {
        setStores(data.stores || []);
        
        const hasMatch = data.stores?.some((s: any) => s.slug === cookieSlug);
        if (!hasMatch && data.stores?.length > 0) {
          const firstSlug = data.stores[0].slug;
          document.cookie = `admin_store_slug=${firstSlug}; path=/; max-age=31536000`;
          setSelectedSlug(firstSlug);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    document.cookie = `admin_store_slug=${slug}; path=/; max-age=31536000`;
    setSelectedSlug(slug);
    window.location.reload();
  };

  if (stores.length === 0) {
    return <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Загрузка do'konlar...</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Do'kon:</label>
      <select
        value={selectedSlug}
        onChange={handleChange}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card-bg)',
          color: 'var(--foreground)',
          fontSize: '0.9rem',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {stores.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Header() {
  const { store, user, cartCount, setShowLoginModal } = useApp();
  const { isTelegram } = useTelegramWebApp();
  const [isAdminPage, setIsAdminPage] = useState(false);
  
  const slug = getStoreSlug();
  const homeLink = slug ? `/store/${slug}` : '/';
  const cartLink = slug ? `/store/${slug}/cart` : '/cart';
  const profileLink = slug ? `/store/${slug}/profile` : '/profile';

  useEffect(() => {
    setIsAdminPage(window.location.pathname.startsWith('/admin'));
  }, []);

  const isUserAdmin = user && (
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'STORE_OWNER' ||
    user.role === 'STORE_ADMIN'
  );

  const renderLogo = () => {
    if (store?.logoUrl) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={store.logoUrl} alt={store.name} style={{ height: '32px', borderRadius: '6px', objectFit: 'contain' }} />
          <span>{store.name}</span>
        </span>
      );
    }
    return (
      <>
        🍎 <span>{store ? store.name : 'Bozor'}{!store && <span>Market</span>}</span>
      </>
    );
  };

  if (isTelegram) {
    return (
      <>
        <header className='header' style={{ padding: '0.5rem 0', boxShadow: 'none', borderBottom: '1px solid var(--border)' }}>
          <div className='container header-inner' style={{ gap: '0.5rem', justifyContent: 'space-between' }}>
            <Link href={homeLink} className='logo' style={{ fontSize: '1.1rem' }}>
              {renderLogo()}
            </Link>

            <Link href={cartLink} className='action-btn cart-badge-wrapper' style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
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
          <Link href={homeLink} className='logo'>
            {renderLogo()}
          </Link>

          {isAdminPage ? (
            <AdminStoreSwitcher />
          ) : (
            <Suspense fallback={
              <div className='search-bar'>
                <input type='text' className='search-input' placeholder='Загрузка поиска...' disabled />
              </div>
            }>
              <SearchInput />
            </Suspense>
          )}

          <div className='header-actions'>
            {user?.role === 'SUPER_ADMIN' && (
              <Link href='/admin/super' className='action-btn' style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                👑 Super Admin
              </Link>
            )}

            {isUserAdmin && (
              <Link href='/admin' className='action-btn' style={{ color: 'var(--primary-color)' }}>
                ⚙️ Админка
              </Link>
            )}

            <Link href={cartLink} className='action-btn cart-badge-wrapper'>
              🛒 Корзина
              {cartCount > 0 && <span className='cart-badge'>{cartCount}</span>}
            </Link>

            {user ? (
              <Link href={profileLink} className='action-btn primary'>
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
