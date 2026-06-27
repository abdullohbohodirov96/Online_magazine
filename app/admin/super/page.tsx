'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  primaryColor: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  telegramUsername: string | null;
  instagramUsername: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  createdAt: string;
  storeDomains?: Array<{ domain: string; isPrimary: boolean }>;
  storeUsers: Array<{
    role: string;
    user: {
      name: string | null;
      phone: string;
    };
  }>;
}

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [description, setDescription] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [domain, setDomain] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/super/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Do\'konlarni yuklashda xatolik yuz berdi');
      }
    } catch (e) {
      setError('Server bilan bog\'lanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
      } else {
        alert(data.error || 'Rasm yuklashda xatolik');
      }
    } catch (err) {
      alert('Rasm yuklashda tarmoq xatoligi');
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/super/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          primaryColor,
          description,
          ownerPhone: ownerPhone.trim() || undefined,
          logoUrl: logoUrl || undefined,
          phone: phone || undefined,
          telegramUsername: telegramUsername || undefined,
          instagramUsername: instagramUsername || undefined,
          facebookUrl: facebookUrl || undefined,
          youtubeUrl: youtubeUrl || undefined,
          domain: domain || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        // Clear form
        setName('');
        setSlug('');
        setPrimaryColor('#10b981');
        setDescription('');
        setOwnerPhone('');
        setLogoUrl('');
        setPhone('');
        setTelegramUsername('');
        setInstagramUsername('');
        setFacebookUrl('');
        setYoutubeUrl('');
        setDomain('');
        fetchStores();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Do\'kon yaratishda xatolik yuz berdi');
      }
    } catch (err: any) {
      setError(err.message || 'Server bilan bog\'lanish xatosi');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStoreStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/super/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (res.ok) {
        fetchStores();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>👑 Super Admin paneli</h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem', margin: 0 }}>Marketplace platformasidagi barcha do'konlarni boshqarish</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#334155', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
              Bosh sahifaga qaytish
            </Link>
            <button 
              onClick={() => setShowModal(true)}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
            >
              + Yangi do'kon ochish
            </button>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stores list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ border: '4px solid #e2e8f0', borderTop: '4px solid #10b981', borderRadius: '50%', width: '3rem', height: '3rem', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
            <h3 style={{ color: '#64748b' }}>Do'konlar ro'yxati yuklanmoqda...</h3>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
          </div>
        ) : stores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#64748b', margin: 0 }}>Tizimda hozircha do'konlar mavjud emas</h3>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Boshlash uchun yangi do'kon qo'shing</p>
            <button onClick={() => setShowModal(true)} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
              Birinchi do'konni ochish
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
            {stores.map((store) => {
              const ownerRelation = store.storeUsers.find((su) => su.role === 'STORE_OWNER');
              const owner = ownerRelation?.user;
              const primaryDomain = store.storeDomains?.find((d) => d.isPrimary)?.domain;

              return (
                <div key={store.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {store.logoUrl ? (
                          <img src={store.logoUrl} alt={store.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: store.primaryColor || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
                            {store.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{store.name}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>slug: @{store.slug}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => toggleStoreStatus(store.id, store.isActive)}
                        style={{ 
                          border: 'none', 
                          padding: '0.35rem 0.75rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          backgroundColor: store.isActive ? '#dcfce7' : '#fee2e2',
                          color: store.isActive ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {store.isActive ? 'Faol' : 'Nofaol'}
                      </button>
                    </div>

                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }} className="line-clamp-2">
                      {store.description || 'Tavsif kiritilmagan'}
                    </p>

                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '1rem 0' }} />

                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Egasining ismi:</span>
                        <strong>{owner?.name || 'Tayinlanmagan'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Egasining telefoni:</span>
                        <strong>{owner?.phone || 'Kiritilmagan'}</strong>
                      </div>
                      {store.phone && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#64748b' }}>Do'kon telefoni:</span>
                          <strong>{store.phone}</strong>
                        </div>
                      )}
                      {primaryDomain && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#64748b' }}>Shaxsiy Domen:</span>
                          <strong>{primaryDomain}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Yaratilgan sana:</span>
                        <strong>{new Date(store.createdAt).toLocaleDateString('uz-UZ')}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/store/${store.slug}`} target="_blank" style={{ flex: 1, textAlign: 'center', padding: '0.6rem 0', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                      Do'konga kirish
                    </Link>
                    <button 
                      onClick={() => {
                        const newName = prompt('Yangi nom:', store.name);
                        if (newName) {
                          const newColor = prompt('Yangi rang (hex):', store.primaryColor);
                          if (newColor) {
                            fetch(`/api/admin/super/stores`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: store.id, name: newName, primaryColor: newColor }),
                            }).then(res => {
                              if (res.ok) fetchStores();
                            });
                          }
                        }
                      }}
                      style={{ flex: 1, padding: '0.6rem 0', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Tahrirlash
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '1.25rem', padding: '2rem', width: '95%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', position: 'relative' }}>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                🏢 Yangi do'kon ochish va sozlash
              </h3>
              
              <form onSubmit={handleCreateStore} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Logo Upload Form Group */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Do'kon logotipi</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Preview logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>No logo</div>
                    )}
                    <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="Rasm havolasi (URL)..." />
                    <label style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #cbd5e1' }}>
                      Yuklash
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Do'kon nomi *</label>
                    <input type="text" required value={name} onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                      }
                    }} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="Masalan: Bozor Market" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Do'kon slugi (URL) *</label>
                    <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="bozor-market" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Admin telefon raqami *</label>
                    <input type="text" required value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="+998901234567" />
                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>Yangi bo'lsa tizimda avtomatik profil yaratiladi (parol: admin123456)</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Brend rangi (HEX) *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '0.375rem' }} />
                      <input type="text" required value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Do'kon telefon raqami</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="+998712000000" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Shaxsiy Domen (URL)</label>
                    <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="bozor-market.uz" />
                  </div>
                </div>

                {/* Social links section */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>🌐 Ijtimoiy tarmoq havolalari</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Telegram Link / Username</label>
                      <input type="text" value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="@username yoki t.me/link" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Instagram Link / Username</label>
                      <input type="text" value={instagramUsername} onChange={(e) => setInstagramUsername(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="@username yoki instagram.com/link" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Facebook Havolasi (URL)</label>
                      <input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="https://facebook.com/..." />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>YouTube Havolasi (URL)</label>
                      <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} placeholder="https://youtube.com/..." />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Do'kon tavsifi</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }} placeholder="Do'kon faoliyati haqida qisqacha..." />
                </div>

                <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.75rem 0', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  {submitting ? 'Yaratilmoqda...' : '🚀 Do\'konni faollashtirish va yaratish'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
