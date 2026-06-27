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
  createdAt: string;
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
  
  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [description, setDescription] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  
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
        fetchStores();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Do\'kon yaratishda xatolik yuz berdi');
      }
    } catch (err) {
      setError('Server bilan bog\'lanish xatosi');
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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Statusni o\'zgartirishda xatolik');
      }
    } catch (e) {
      alert('Bog\'lanish xatosi');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Super Admin Panel</h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem', marginBottom: 0 }}>Platformadagi barcha do'konlarni boshqarish</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/admin" style={{ padding: '0.75rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', color: '#334155', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', transition: 'all 0.2s' }}>
              Do'kon boshqaruviga o'tish
            </Link>
            <button onClick={() => setShowModal(true)} style={{ padding: '0.75rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgb(16 185 129 / 0.1)', transition: 'all 0.2s' }}>
              + Yangi do'kon yaratish
            </button>
          </div>
        </header>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* List Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}>Do'konlar yuklanmoqda...</div>
        ) : stores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px dashed #e2e8f0', color: '#64748b' }}>
            <h3>Hozircha hech qanday do'kon qo'shilmagan</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Do'kon yaratish uchun yuqoridagi tugmani bosing.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {stores.map((store) => {
              const owner = store.storeUsers.find(u => u.role === 'STORE_OWNER')?.user;
              return (
                <div key={store.id} style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  
                  {/* Color strip */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem', backgroundColor: store.primaryColor }} />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.5rem', marginBottom: '1rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{store.name}</h2>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>slug: {store.slug}</span>
                      </div>
                      <button 
                        onClick={() => toggleStoreStatus(store.id, store.isActive)}
                        style={{ 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '9999px', 
                          border: 'none', 
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

                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {store.description || 'Tavsif kiritilmagan'}
                    </p>

                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '1rem 0' }} />

                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Egasining ismi:</span>
                        <strong>{owner?.name || 'Tayinlanmagan'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Telefon raqami:</span>
                        <strong>{owner?.phone || 'Kiritilmagan'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Yaratilgan sana:</span>
                        <strong>{new Date(store.createdAt).toLocaleDateString('uz-UZ')}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/store/${store.slug}`} target="_blank" style={{ flex: 1, textAlign: 'center', padding: '0.6rem 0', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                      Ko'rish
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', position: 'relative' }}>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '1.5rem' }}>Yangi do'kon qo'shish</h3>
              
              <form onSubmit={handleCreateStore}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Do'kon nomi *</label>
                  <input type="text" required value={name} onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                    }
                  }} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} placeholder="Masalan: Bozor Market" />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Do'kon slugi (URL uchun) *</label>
                  <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} placeholder="bozor-market" />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Asosiy brend rangi (HEX) *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }} />
                    <input type="text" required value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Egasining telefon raqami (agar ro'yxatdan o'tgan bo'lsa)</label>
                  <input type="text" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} placeholder="+998901234567" />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>Tizimda bu telefon raqam bilan foydalanuvchi mavjud bo'lishi lozim</span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Do'kon tavsifi</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} placeholder="Do'kon faoliyati haqida qisqacha..." />
                </div>

                <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.75rem 0', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
                  {submitting ? 'Yaratilmoqda...' : 'Yaratish'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
