'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';
import MiniAppLayout from '@/components/MiniAppLayout';
import YandexAddressPicker from '@/components/YandexAddressPicker';

export default function CheckoutPage() {
  const { cart, totalAmount, clearCart, user } = useApp();
  const { tgUser } = useTelegramWebApp();
  const router = useRouter();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<any>(null);

  // New Yandex maps and entrance fields
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [yandexAddress, setYandexAddress] = useState('');
  const [deliveryEntrance, setDeliveryEntrance] = useState('');
  const [deliveryFloor, setDeliveryFloor] = useState('');
  const [deliveryApartment, setDeliveryApartment] = useState('');
  const [deliveryIntercom, setDeliveryIntercom] = useState('');
  const [addressComment, setAddressComment] = useState('');

  // Prefill details from user context or localStorage
  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.phone && !user.phone.startsWith('tg_')) {
        setPhone(user.phone);
      }
    }

    if (typeof window !== 'undefined') {
      if (!phone) {
        const cachedPhone = localStorage.getItem('miniapp_phone');
        if (cachedPhone) setPhone(cachedPhone);
      }
      if (!customerName) {
        const cachedName = localStorage.getItem('miniapp_user_name');
        if (cachedName) setCustomerName(cachedName);
      }
    }
  }, [user]);

  // Prefill name from Telegram profile if not set
  useEffect(() => {
    if (tgUser && !customerName) {
      setCustomerName([tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '));
    }
  }, [tgUser]);

  const handleAddressChange = (data: { address: string; latitude: number; longitude: number }) => {
    setAddress(data.address);
    setYandexAddress(data.address);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError('Пожалуйста, заполните обязательные поля (Имя, Телефон, Адрес)');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      comment: comment.trim(),
      telegramUserId: tgUser?.id ? String(tgUser.id) : null,
      telegramChatId: tgUser?.id ? String(tgUser.id) : null,
      source: 'telegram',
      addressComment,
      latitude,
      longitude,
      yandexAddress,
      deliveryEntrance,
      deliveryFloor,
      deliveryApartment,
      deliveryIntercom
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessOrder(data.order);
        clearCart();
      } else {
        setError(data.error || 'Ошибка при оформлении заказа');
      }
    } catch (err) {
      setError('Ошибка сети при отправке заказа');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <MiniAppLayout title="Заказ оформлен" showBackButton={false}>
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Заказ успешно принят!</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
            Номер заказа: <strong>#${successOrder.id.slice(-6).toUpperCase()}</strong>
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Сумма заказа: <strong>{successOrder.totalAmount.toLocaleString('ru-RU')} сум</strong>
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '2rem' }}>
            Наш менеджер свяжется с вами по номеру {phone} для подтверждения.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/miniapp')} style={{ width: '100%', padding: '0.75rem' }}>
            Вернуться в каталог
          </button>
        </div>
      </MiniAppLayout>
    );
  }

  if (cart.length === 0) {
    return (
      <MiniAppLayout title="Оформление заказа" showBackButton>
        <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Ваша корзина пуста</h4>
          <button className="btn btn-primary" onClick={() => router.push('/miniapp')}>
            В каталог
          </button>
        </div>
      </MiniAppLayout>
    );
  }

  return (
    <MiniAppLayout title="Оформление заказа" showBackButton>
      <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          Детали доставки
        </h3>

        {error && (
          <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Ваше имя *</label>
            <input
              type="text"
              className="form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Номер телефона *</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Адрес доставки *</label>
            <YandexAddressPicker
              initialAddress={address}
              initialLatitude={latitude || undefined}
              initialLongitude={longitude || undefined}
              onChange={handleAddressChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px', marginTop: '10px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Подъезд</label>
              <input
                type="text"
                className="form-input"
                value={deliveryEntrance}
                onChange={(e) => setDeliveryEntrance(e.target.value)}
                placeholder="1"
                style={{ padding: '0.5rem' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Этаж</label>
              <input
                type="text"
                className="form-input"
                value={deliveryFloor}
                onChange={(e) => setDeliveryFloor(e.target.value)}
                placeholder="4"
                style={{ padding: '0.5rem' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Кв./Оф.</label>
              <input
                type="text"
                className="form-input"
                value={deliveryApartment}
                onChange={(e) => setDeliveryApartment(e.target.value)}
                placeholder="24"
                style={{ padding: '0.5rem' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Домофон</label>
              <input
                type="text"
                className="form-input"
                value={deliveryIntercom}
                onChange={(e) => setDeliveryIntercom(e.target.value)}
                placeholder="24К"
                style={{ padding: '0.5rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Уточнение адреса / Ориентир</label>
            <input
              type="text"
              className="form-input"
              value={addressComment}
              onChange={(e) => setAddressComment(e.target.value)}
              placeholder="Например: вход со двора, шлагбаум"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Комментарий к заказу</label>
            <input
              type="text"
              className="form-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: бесконтактная доставка"
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
            <span>К оплате:</span>
            <span style={{ color: 'var(--primary-hover)' }}>{totalAmount.toLocaleString('ru-RU')} сум</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Отправка...' : '🚀 Подтвердить заказ'}
          </button>
        </form>
      </div>
    </MiniAppLayout>
  );
}
