'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useLanguageTheme } from '@/context/LanguageThemeContext';

export default function ProfilePage() {
  const { user, logout, fetchUser, setShowLoginModal, storeFetch } = useApp();
  const { t } = useLanguageTheme();
  const { storeSlug } = useParams();
  const storePath = `/store/${storeSlug}`;
  
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Profile editing states
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await storeFetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const payload: any = {};
      if (editName.trim() !== (user?.name || '')) payload.name = editName.trim();
      if (editPhone.trim() !== (user?.phone || '')) payload.phone = editPhone.trim();
      if (editPassword.trim()) payload.password = editPassword.trim();

      if (Object.keys(payload).length === 0) {
        setProfileError('O\'zgarish kiritilmadi');
        setUpdating(false);
        return;
      }

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setProfileSuccess('Ma\'lumotlar muvaffaqiyatli yangilandi!');
        setEditPassword('');
        setEditMode(false);
        fetchUser();
      } else {
        setProfileError(data.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setProfileError('Server bilan bog\'lanishda xatolik');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  const translateStatus = (status: string) => {
    const statusNames: Record<string, string> = {
      NEW: 'Yangi 🆕',
      ACCEPTED: 'Qabul qilindi ✅',
      ASSEMBLING: 'Yig\'ilmoqda 📦',
      DELIVERING: 'Yetkazilmoqda 🚚',
      COMPLETED: 'Bajarildi 🎉',
      CANCELLED: 'Bekor qilindi ❌',
    };
    
    let badgeClass = 'new';
    if (status === 'COMPLETED') badgeClass = 'completed';
    else if (status === 'CANCELLED') badgeClass = 'cancelled';
    else if (status === 'ACCEPTED') badgeClass = 'accepted';
    else if (status === 'ASSEMBLING') badgeClass = 'assembling';
    else if (status === 'DELIVERING') badgeClass = 'delivering';

    return {
      label: statusNames[status] || status,
      class: badgeClass
    };
  };

  return (
    <>
      <Header />
      
      <main className="main-content container">
        <h3 className="section-title">{t('profile')}</h3>

        {!user ? (
          <div className="card" style={{ maxWidth: '28rem', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👤</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Shaxsiy kabinetga kirish
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Buyurtmalar tarixini ko'rish va profilni tahrirlash uchun tizimga kiring
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowLoginModal(true)}
              style={{ width: '100%' }}
            >
              Kirish / Ro'yxatdan o'tish
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
            {/* User Profile Card */}
            <div>
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'sticky', top: '6rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    👤
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.15rem' }}>{user.name || 'Foydalanuvchi'}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.phone}</span>
                </div>

                {profileError && (
                  <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✅ {profileSuccess}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editMode ? (
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Ism</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Ismingiz"
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Telefon (Login)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+998901234567"
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Yangi parol (bo'sh qoldirsa o'zgarmaydi)</label>
                        <input
                          type="password"
                          className="form-input"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Yangi parol..."
                          minLength={6}
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(false); setProfileError(''); }} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>Bekor</button>
                        <button type="submit" className="btn btn-primary" disabled={updating} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                          {updating ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => { setEditMode(true); setProfileSuccess(''); }} style={{ fontSize: '0.9rem' }}>
                      ✏️ Profilni tahrirlash
                    </button>
                  )}

                  <button className="btn btn-danger" onClick={logout} style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    🚪 Chiqish
                  </button>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Buyurtmalar tarixi</h3>

              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Yuklanmoqda...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ color: 'var(--muted)' }}>Sizda hali buyurtmalar yo'q.</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => {
                    const statusInfo = translateStatus(order.status);
                    return (
                      <div key={order.id} className="order-group">
                        <div className="order-header">
                          <div>
                            <span className="order-id">Buyurtma #{order.id.slice(-6).toUpperCase()}</span>
                            <span className="order-date" style={{ marginLeft: '1rem' }}>
                              {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                            </span>
                          </div>
                          <span className={`status-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="order-body">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="order-item-row">
                              <span>{item.productName} ({item.quantity} dona)</span>
                              <span style={{ color: 'var(--muted)' }}>{formatPrice(item.total)}</span>
                            </div>
                          ))}

                          <div className="order-total-row">
                            <span>Jami</span>
                            <span style={{ color: 'var(--primary-color)' }}>{formatPrice(order.totalAmount)}</span>
                          </div>

                          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted)', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                            <strong>Yetkazish manzili:</strong> {order.address}
                            {order.comment && (
                              <div style={{ marginTop: '0.25rem' }}>
                                <strong>Izoh:</strong> {order.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
