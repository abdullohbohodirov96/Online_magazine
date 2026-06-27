'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function StoreDesignPage() {
  const { user } = useApp();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Branding states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [textColor, setTextColor] = useState('#0f172a');

  // Social Links states
  const [telegramUsername, setTelegramUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Branches states
  const [branches, setBranches] = useState<any[]>([]);
  const [branchName, setBranchName] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchLat, setBranchLat] = useState('');
  const [branchLng, setBranchLng] = useState('');
  const [addingBranch, setAddingBranch] = useState(false);

  // Loading settings
  useEffect(() => {
    async function loadBranding() {
      try {
        const res = await fetch('/api/store');
        if (res.ok) {
          const data = await res.json();
          if (data.store) {
            setName(data.store.name || '');
            setDescription(data.store.description || '');
            setLogoUrl(data.store.logoUrl || '');
            setBannerUrl(data.store.bannerUrl || '');
            setPrimaryColor(data.store.primaryColor || '#10b981');
            setBackgroundColor(data.store.backgroundColor || '#f8fafc');
            setTextColor(data.store.textColor || '#0f172a');

            // Social media
            setTelegramUsername(data.store.telegramUsername || '');
            setInstagramUsername(data.store.instagramUsername || '');
            setFacebookUrl(data.store.facebookUrl || '');
            setYoutubeUrl(data.store.youtubeUrl || '');

            // Branches
            setBranches(data.store.branches || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadBranding();
    }
  }, [user]);

  // Unauthorized redirection
  const isAuthorized = user && (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'STORE_OWNER' ||
    user.role === 'STORE_ADMIN' ||
    user.role === 'ADMIN'
  );

  if (!user && !loading) {
    router.push('/');
    return null;
  }

  if (user && !isAuthorized) {
    return (
      <>
        <Header />
        <main className="main-content container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Доступ ограничен</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
            Эта страница доступна только для администраторов магазина.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/')}>
            На главную
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (type === 'logo') setLogoUrl(data.url);
        else setBannerUrl(data.url);
      } else {
        setError(data.error || 'Ошибка при загрузке изображения');
      }
    } catch (err) {
      setError('Ошибка сети при загрузке');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          logoUrl,
          bannerUrl,
          primaryColor,
          backgroundColor,
          textColor,
          telegramUsername,
          instagramUsername,
          facebookUrl,
          youtubeUrl,
        }),
      });

      if (res.ok) {
        setSuccess('Настройки брендинга успешно сохранены!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      setError('Ошибка сети при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    setAddingBranch(true);
    setError('');

    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: branchName,
          phone: branchPhone,
          address: branchAddress,
          latitude: branchLat ? parseFloat(branchLat) : null,
          longitude: branchLng ? parseFloat(branchLng) : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBranches([...branches, data.branch]);
        setBranchName('');
        setBranchPhone('');
        setBranchAddress('');
        setBranchLat('');
        setBranchLng('');
        setSuccess('Филиал успешно добавлен!');
      } else {
        setError(data.error || 'Не удалось добавить филиал');
      }
    } catch (err) {
      setError('Ошибка сети при добавлении филиала');
    } finally {
      setAddingBranch(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот филиал?')) return;
    setError('');

    try {
      const res = await fetch(`/api/admin/branches?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setBranches(branches.filter((b) => b.id !== id));
        setSuccess('Филиал успешно удален!');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Не удалось удалить филиал');
      }
    } catch (err) {
      setError('Ошибка сети при удалении филиала');
    }
  };

  return (
    <>
      <Header />
      <main className="main-content container">
        <h3 className="section-title">Настройки брендинга и филиалов</h3>

        <div className="admin-layout">
          <aside className="admin-sidebar">
            <button className="admin-sidebar-link" onClick={() => router.push('/admin')}>
              ⬅️ Вернуться в панель
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
              Разделы
            </div>
            <button className="admin-sidebar-link active">
              🎨 Дизайн и Цвета
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin/settings/telegram')}>
              🤖 Настройки Telegram
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin/settings/integration')}>
              ⚙️ Интеграция API
            </button>
          </aside>

          <section className="admin-main" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* Form Fields Column */}
            <div>
              {error && (
                <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontWeight: 600 }}>
                  {success}
                </div>
              )}

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h4 style={{ fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
                  🎨 Настройки стилей и логотипа
                </h4>

                <div className="form-group">
                  <label className="form-label">Название магазина</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Например: Bozor Market" />
                </div>

                <div className="form-group">
                  <label className="form-label">Описание магазина</label>
                  <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Например: Доставка свежих овощей и фруктов по Ташкенту" rows={3} style={{ resize: 'vertical' }} />
                </div>

                {/* Logo Upload */}
                <div className="form-group">
                  <label className="form-label">Логотип магазина</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', border: '1px solid var(--border)', backgroundColor: '#f8fafc' }} />
                    )}
                    <input type="text" className="form-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                    <label style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--muted-light)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      Загрузить
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="form-group">
                  <label className="form-label">Баннер на главной</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {bannerUrl && (
                      <img src={bannerUrl} alt="Banner" style={{ width: '80px', height: '48px', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    )}
                    <input type="text" className="form-input" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                    <label style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--muted-light)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      Загрузить
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Social Networks Links */}
                <h4 style={{ fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: '1rem', margin: 0 }}>
                  🌐 Социальные сети do'koni
                </h4>

                <div className="form-group">
                  <label className="form-label">Telegram Username / Havola</label>
                  <input type="text" className="form-input" value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} placeholder="Например: t.me/username yoki @username" />
                </div>

                <div className="form-group">
                  <label className="form-label">Instagram Username / Havola</label>
                  <input type="text" className="form-input" value={instagramUsername} onChange={(e) => setInstagramUsername(e.target.value)} placeholder="Например: instagram.com/username yoki @username" />
                </div>

                <div className="form-group">
                  <label className="form-label">Facebook Havolasi (URL)</label>
                  <input type="text" className="form-input" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/page-name" />
                </div>

                <div className="form-group">
                  <label className="form-label">YouTube Havolasi (URL)</label>
                  <input type="text" className="form-input" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/c/channel-name" />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

                {/* Colors */}
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>Цветовая гамма сайта</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Главный цвет (акцент)</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '0.25rem' }} />
                        <input type="text" className="form-input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ fontSize: '0.85rem' }} />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Цвет фона сайта</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '0.25rem' }} />
                        <input type="text" className="form-input" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ fontSize: '0.85rem' }} />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Цвет текста сайта</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '0.25rem' }} />
                        <input type="text" className="form-input" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: '1rem' }}>
                  {saving ? 'Сохранение...' : 'Сохранить настройки'}
                </button>
              </form>

              {/* BRANCHES SECTION */}
              <div style={{ marginTop: '2.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h4 style={{ fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', margin: 0 }}>
                  🏢 Филиалы магазина (Branches)
                </h4>

                <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--muted-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                  <h5 style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Добавить новый филиал</h5>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Название филиала *</label>
                    <input type="text" className="form-input" value={branchName} onChange={(e) => setBranchName(e.target.value)} required placeholder="Например: Чиланзарский филиал" />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Телефон филиала</label>
                    <input type="text" className="form-input" value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} placeholder="+998 90 123-45-67" />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Адрес филиала</label>
                    <input type="text" className="form-input" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="Например: Чиланзар, кв-л 1, д 2" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Широта (Latitude)</label>
                      <input type="number" step="any" className="form-input" value={branchLat} onChange={(e) => setBranchLat(e.target.value)} placeholder="41.12345" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Долгота (Longitude)</label>
                      <input type="number" step="any" className="form-input" value={branchLng} onChange={(e) => setBranchLng(e.target.value)} placeholder="69.12345" />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', alignSelf: 'flex-start', padding: '0.5rem 1.5rem', fontSize: '0.85rem' }} disabled={addingBranch}>
                    {addingBranch ? 'Добавление...' : 'Добавить филиал'}
                  </button>
                </form>

                {/* Branches List */}
                <h5 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Существующие филиалы ({branches.length})</h5>
                {branches.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Филиалы не зарегистрированы.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {branches.map((b) => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: '#fff' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.name}</div>
                          {b.phone && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📞 {b.phone}</div>}
                          {b.address && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📍 {b.address}</div>}
                          {(b.latitude || b.longitude) && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>🧭 Coords: {b.latitude}, {b.longitude}</div>}
                        </div>
                        <button type="button" className="btn btn-danger" onClick={() => handleDeleteBranch(b.id)} style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Column */}
            <div style={{ position: 'sticky', top: '2rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--muted)' }}>Предпросмотр магазина</h4>
              
              <div 
                style={{ 
                  borderRadius: '1rem', 
                  border: '1px solid #cbd5e1', 
                  backgroundColor: backgroundColor, 
                  color: textColor, 
                  overflow: 'hidden',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  transition: 'all 0.3s'
                }}
              >
                {/* Header Mockup */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#ffffff' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#000' }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" style={{ height: '20px', borderRadius: '4px' }} />
                    ) : '🍎'}
                    {name || 'Название магазина'}
                  </span>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
                    <span style={{ color: primaryColor, fontWeight: 700 }}>🔍</span>
                    <span>🛒 (0)</span>
                  </div>
                </div>

                {/* Banner Mockup */}
                <div 
                  style={{ 
                    height: '100px', 
                    backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none',
                    backgroundColor: bannerUrl ? 'transparent' : `${primaryColor}20`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 1.25rem',
                    color: bannerUrl ? '#ffffff' : textColor,
                    textShadow: bannerUrl ? '1px 1px 4px rgba(0,0,0,0.6)' : 'none'
                  }}
                >
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Добро пожаловать!</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }} className="line-clamp-2">
                    {description || 'Ваш лучший магазин свежих продуктов.'}
                  </p>
                </div>

                {/* Products Grid Mockup */}
                <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[1, 2].map((i) => (
                    <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ height: '60px', borderRadius: '0.35rem', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {i === 1 ? '🥦' : '🥛'}
                      </div>
                      <h5 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '0.75rem', color: '#0f172a', fontWeight: 600 }}>
                        {i === 1 ? 'Свежие Овощи' : 'Молоко 3.2%'}
                      </h5>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: primaryColor }}>12 000 сум</span>
                        <button style={{ border: 'none', backgroundColor: primaryColor, color: '#fff', borderRadius: '0.25rem', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
