'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useLanguageTheme } from '@/context/LanguageThemeContext';
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
  const { t } = useLanguageTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Click outside listener to hide suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with a simple debounce check
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/products/suggestions?query=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.suggestions || []);
        })
        .catch((err) => console.error('Error loading search suggestions:', err));
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const slug = getStoreSlug();
    const basePath = slug ? `/store/${slug}` : '';

    if (searchQuery.trim()) {
      router.push(`${basePath || '/'}?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(basePath || '/');
    }
  };

  const handleSuggestionClick = (name: string) => {
    setSearchQuery(name);
    setShowSuggestions(false);
    const slug = getStoreSlug();
    const basePath = slug ? `/store/${slug}` : '';
    router.push(`${basePath || '/'}?search=${encodeURIComponent(name)}`);
  };

  return (
    <div className='search-bar' ref={containerRef} style={{ position: 'relative' }}>
      <form onSubmit={handleSearchSubmit}>
        <input
          type='text'
          className='search-input'
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        <span className='search-icon'>🔍</span>
      </form>

      {/* Autocomplete Suggestions Box */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '320px',
            overflowY: 'auto',
            marginTop: '0.25rem',
          }}
        >
          {suggestions.map((s) => (
            <div
              key={s.id}
              onClick={() => handleSuggestionClick(s.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.65rem 1rem',
                gap: '0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.name}
                  style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'var(--muted-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  🥦
                </div>
              )}
              <div style={{ minWidth: 0, flexGrow: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 700, marginTop: '0.1rem' }}>
                  {s.price.toLocaleString('ru-RU')} UZS
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
  const { t, language, setLanguage, theme, setTheme } = useLanguageTheme();
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
        <span>{store ? store.name : 'BozorMarket'}</span>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Language Selector */}
              <button 
                onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')} 
                style={{ background: 'none', border: '1px solid var(--border)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                {language.toUpperCase()}
              </button>

              <Link href={cartLink} className='action-btn cart-badge-wrapper' style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                🛒
                {cartCount > 0 && <span className='cart-badge' style={{ top: '-4px', right: '-4px' }}>{cartCount}</span>}
              </Link>
            </div>
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

          <div className='header-actions' style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {store?.phone && (
              <a href={`tel:${store.phone}`} className='phone-link' style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>
                📞 {store.phone}
              </a>
            )}
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
              title={t('theme')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')} 
              style={{ background: 'none', border: '1px solid var(--border)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
              title={t('language')}
            >
              {language.toUpperCase()}
            </button>

            {user?.role === 'SUPER_ADMIN' && (
              <Link href='/admin/super' className='action-btn' style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                👑 Super Admin
              </Link>
            )}

            {isUserAdmin && (
              <Link href='/admin' className='action-btn' style={{ color: 'var(--primary-color)' }}>
                ⚙️ {t('adminPanel')}
              </Link>
            )}

            <Link href={cartLink} className='action-btn cart-badge-wrapper'>
              🛒 {t('cart')}
              {cartCount > 0 && <span className='cart-badge'>{cartCount}</span>}
            </Link>

            {user ? (
              <Link href={profileLink} className='action-btn primary'>
                👤 {user.name || user.phone}
              </Link>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className='action-btn primary'>
                🚪 {t('login')}
              </button>
            )}
          </div>
        </div>
      </header>
      <LoginModal />
    </>
  );
}
