'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout, fetchUser, setShowLoginModal } = useApp();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Inline login states (for guest users viewing profile)
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditingName(false);
        fetchUser();
      } else {
        const data = await res.json();
        setError(data.error || 'Ошибка при обновлении имени');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setLoginMessage('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setLoginMessage('Код отправлен! Проверьте консоль терминала.');
      } else {
        setLoginError(data.error || 'Не удалось отправить код');
      }
    } catch (err) {
      setLoginError('Ошибка при отправке запроса');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      if (res.ok) {
        fetchUser();
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Неверный код');
      }
    } catch (err) {
      setLoginError('Ошибка при верификации кода');
    } finally {
      setLoginLoading(false);
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'NEW': return { label: 'Новый', class: 'new' };
      case 'ACCEPTED': return { label: 'Принят', class: 'accepted' };
      case 'ASSEMBLING': return { label: 'Собирается', class: 'assembling' };
      case 'DELIVERING': return { label: 'В доставке', class: 'delivering' };
      case 'COMPLETED': return { label: 'Завершен', class: 'completed' };
      case 'CANCELLED': return { label: 'Отменен', class: 'cancelled' };
      default: return { label: status, class: '' };
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  return (
    <>
      <Header />
      
      <main className="main-content container">
        {!user ? (
          <div style={{ maxWidth: '28rem', margin: '4rem auto', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
              Вход в личный кабинет
            </h3>

            {loginError && (
              <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {loginError}
              </div>
            )}

            {loginMessage && (
              <div style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {loginMessage}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label">Номер телефона</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loginLoading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loginLoading}>
                  {loginLoading ? 'Отправка...' : 'Получить SMS-код'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">Введите 4-значный код</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={loginLoading}
                    style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} disabled={loginLoading} style={{ flex: 1 }}>
                    Назад
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ flex: 2 }}>
                    {loginLoading ? 'Вход...' : 'Подтвердить'}
                  </button>
                </div>
              </form>
            )}
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
                  <h4 style={{ fontWeight: 700, fontSize: '1.15rem' }}>{user.name || 'Покупатель'}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.phone}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editingName ? (
                    <form onSubmit={handleUpdateName}>
                      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</p>}
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ваше имя"
                          required
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setEditingName(false)} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={updating} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>Сохранить</button>
                      </div>
                    </form>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => setEditingName(true)} style={{ fontSize: '0.9rem' }}>
                      ✏️ Изменить имя
                    </button>
                  )}

                  <button className="btn btn-danger" onClick={logout} style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                    🚪 Выйти
                  </button>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>История заказов</h3>

              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ color: 'var(--muted)' }}>У вас пока нет заказов.</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => {
                    const statusInfo = translateStatus(order.status);
                    return (
                      <div key={order.id} className="order-group">
                        <div className="order-header">
                          <div>
                            <span className="order-id">Заказ #{order.id.slice(-6).toUpperCase()}</span>
                            <span className="order-date" style={{ marginLeft: '1rem' }}>
                              от {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          <span className={`status-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="order-body">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="order-item-row">
                              <span>{item.productName} ({item.quantity} шт)</span>
                              <span style={{ color: 'var(--muted)' }}>{formatPrice(item.total)}</span>
                            </div>
                          ))}

                          <div className="order-total-row">
                            <span>Итого</span>
                            <span style={{ color: 'var(--primary-color)' }}>{formatPrice(order.totalAmount)}</span>
                          </div>

                          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted)', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                            <strong>Адрес доставки:</strong> {order.address}
                            {order.comment && (
                              <div style={{ marginTop: '0.25rem' }}>
                                <strong>Комментарий:</strong> {order.comment}
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
