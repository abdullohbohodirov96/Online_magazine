'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import MiniAppLayout from '@/components/MiniAppLayout';

export default function ProfilePage() {
  const { user, logout, fetchUser } = useApp();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit Name
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [updatingName, setUpdatingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Linking Phone State (OTP)
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingName(true);
    setNameError('');
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
        setNameError(data.error || 'Ошибка при обновлении имени');
      }
    } catch (err) {
      setNameError('Ошибка сети');
    } finally {
      setUpdatingName(false);
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
        setStep(1);
        setPhone('');
        setCode('');
        setLoginMessage('Телефон успешно привязан!');
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
      case 'NEW': return { label: 'Новый', class: 'warning' };
      case 'ACCEPTED': return { label: 'Принят', class: 'success' };
      case 'ASSEMBLING': return { label: 'Сборка', class: 'warning' };
      case 'DELIVERING': return { label: 'Доставка', class: 'warning' };
      case 'COMPLETED': return { label: 'Выполнен', class: 'success' };
      case 'CANCELLED': return { label: 'Отменен', class: 'error' };
      default: return { label: status, class: '' };
    }
  };

  const isPlaceholderPhone = !user || user.phone.startsWith('tg_');

  return (
    <MiniAppLayout title="Профиль">
      {!user ? (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
          <h4 style={{ fontWeight: 800, marginBottom: '1rem' }}>Вы зашли как гость</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Войдите по номеру телефона, чтобы видеть историю заказов.
          </p>
          
          {/* OTP Login Form */}
          {loginError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>{loginError}</p>}
          {loginMessage && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>{loginMessage}</p>}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="tel"
                placeholder="Номер телефона (+998...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              />
              <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ padding: '0.6rem' }}>
                {loginLoading ? 'Отправка...' : 'Получить SMS-код'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Код подтверждения (4 цифры)"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center', fontWeight: 700 }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Назад</button>
                <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ flex: 2 }}>Подтвердить</button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Profile Card */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                👤
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{user.name || 'Покупатель Telegram'}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {isPlaceholderPhone ? 'Телефон не привязан' : user.phone}
                </span>
              </div>
            </div>

            {/* Editing Name */}
            {editingName ? (
              <form onSubmit={handleUpdateName} style={{ marginBottom: '1rem' }}>
                {nameError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{nameError}</p>}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={updatingName} style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Да</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingName(false)} style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Нет</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => setEditingName(true)} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>
                  ✏️ Изменить имя
                </button>
                <button className="btn btn-danger" onClick={logout} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>
                  🚪 Выйти
                </button>
              </div>
            )}

            {/* Linking phone code block for Telegram WebApp users */}
            {isPlaceholderPhone && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>🔗 Привязать номер телефона</p>
                {loginError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{loginError}</p>}
                {loginMessage && <p style={{ color: 'var(--success)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{loginMessage}</p>}

                {step === 1 ? (
                  <form onSubmit={handleSendOtp} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="tel"
                      placeholder="+998..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      Выслать код
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Код из SMS"
                      maxLength={4}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      style={{ flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem', textAlign: 'center' }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      Подтвердить
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ width: 'auto', padding: '0.4rem', fontSize: '0.85rem' }}>
                      Отмена
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Order History */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', opacity: 0.8 }}>
              История заказов
            </h3>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Загрузка истории...</div>
            ) : orders.length === 0 ? (
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Заказов пока нет.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.map((order) => {
                  const statusInfo = translateStatus(order.status);
                  const date = new Date(order.createdAt).toLocaleDateString('ru-RU');
                  return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        padding: '0.75rem',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Заказ #{order.id.slice(-6).toUpperCase()}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>{date}</span>
                        </div>
                        <span className={`sync-status-indicator ${statusInfo.class}`} style={{ fontSize: '0.7rem' }}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                        {order.items.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                              {item.productName}
                            </span>
                            <span style={{ color: 'var(--muted)' }}>
                              {item.quantity} шт × {item.price.toLocaleString('ru-RU')} сум
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>Итого:</span>
                        <span style={{ color: 'var(--primary-hover)' }}>{order.totalAmount.toLocaleString('ru-RU')} сум</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </MiniAppLayout>
  );
}
