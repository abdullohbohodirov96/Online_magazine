'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';

export default function CheckoutPage() {
  const { user, cart, totalAmount, fetchCart, setShowLoginModal } = useApp();
  const router = useRouter();
  const { isTelegram, tgUser } = useTelegramWebApp();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      router.push('/');
    }
  }, [cart, orderSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          phone,
          address,
          comment,
          telegramUserId: tgUser ? String(tgUser.id) : null,
          telegramChatId: tgUser ? String(tgUser.id) : null,
          source: isTelegram ? 'telegram' : 'web',
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(data.order);
        await fetchCart();
      } else {
        setError(data.error || 'Не удалось оформить заказ');
      }
    } catch (err) {
      setError('Ошибка при отправке заказа. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  return (
    <>
      <Header />
      
      <main className="main-content container">
        <h3 className="section-title">Оформление заказа</h3>

        {orderSuccess ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', maxWidth: '35rem', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>Заказ успешно принят!</h4>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
              Номер вашего заказа: <strong>#{orderSuccess.id.slice(-6).toUpperCase()}</strong>.<br/>
              Мы свяжемся с вами в ближайшее время для подтверждения.
            </p>
            
            <div style={{ textAlign: 'left', backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--border)' }}>
              <h5 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Детали заказа:</h5>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--muted)' }}>Получатель:</span>
                <span>{orderSuccess.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--muted)' }}>Телефон:</span>
                <span>{orderSuccess.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--muted)' }}>Адрес доставки:</span>
                <span>{orderSuccess.address}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px dashed var(--border)', fontWeight: 700 }}>
                <span>Сумма к оплате:</span>
                <span style={{ color: 'var(--primary-hover)' }}>{formatPrice(orderSuccess.totalAmount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/profile" className="btn btn-secondary" style={{ flex: 1 }}>
                История заказов
              </Link>
              <Link href="/" className="btn btn-primary" style={{ flex: 1 }}>
                На главную
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-layout">
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Данные доставки</h4>
              
              {!user ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                    Пожалуйста, войдите в систему, чтобы оформить заказ.
                  </p>
                  <button onClick={() => setShowLoginModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
                    Войти по номеру телефона
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Ваше имя *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Иван Иванов"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Номер телефона *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+998_________"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Адрес доставки *</label>
                    <textarea
                      className="form-input"
                      placeholder="Улица, дом, квартира, ориентир"
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      disabled={loading}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Комментарий к заказу</label>
                    <textarea
                      className="form-input"
                      placeholder="Особые пожелания курьеру (например, бесконтактная доставка)"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={loading}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }} disabled={loading}>
                    {loading ? 'Оформление...' : `Подтвердить заказ на ${formatPrice(totalAmount)}`}
                  </button>
                </form>
              )}
            </div>

            <div className="cart-summary">
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Состав заказа</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '15rem', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.25rem' }}>
                {cart.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '12rem' }}>
                      {item.product.name}
                    </span>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
                      {item.quantity} {item.product.unit} &times; {formatPrice(item.product.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <span style={{ color: 'var(--muted)' }}>Товары</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: 'var(--muted)' }}>Доставка</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Бесплатно</span>
              </div>
              <div className="summary-row total">
                <span>К оплате:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
