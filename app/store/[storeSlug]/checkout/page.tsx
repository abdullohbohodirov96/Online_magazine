'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useTelegramWebApp } from '@/lib/telegram/useTelegramWebApp';
import { useLanguageTheme } from '@/context/LanguageThemeContext';
import YandexAddressPicker from '@/components/YandexAddressPicker';

export default function CheckoutPage() {
  const { user, cart, totalAmount, fetchCart, setShowLoginModal, storeFetch, loadingCart, loadingUser } = useApp();
  const { t } = useLanguageTheme();
  const { storeSlug } = useParams();
  const storePath = `/store/${storeSlug}`;
  
  const router = useRouter();
  const { isTelegram, tgUser } = useTelegramWebApp();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // New Yandex maps and entrance fields
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [yandexAddress, setYandexAddress] = useState('');
  const [deliveryEntrance, setDeliveryEntrance] = useState('');
  const [deliveryFloor, setDeliveryFloor] = useState('');
  const [deliveryApartment, setDeliveryApartment] = useState('');
  const [deliveryIntercom, setDeliveryIntercom] = useState('');
  const [addressComment, setAddressComment] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!loadingUser && !loadingCart && cart.length === 0 && !orderSuccess) {
      router.push(storePath);
    }
  }, [cart, loadingUser, loadingCart, orderSuccess, router, storePath]);

  const handleAddressChange = (data: { address: string; yandexAddress: string; latitude: number; longitude: number }) => {
    setAddress(data.address);
    setYandexAddress(data.address);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    setLoading(true);
    setError('');

    let finalLat = latitude;
    let finalLng = longitude;
    let finalYandexAddress = yandexAddress;

    if (address && (!finalLat || !finalLng)) {
      try {
        const ymaps = (window as any).ymaps;
        if (ymaps) {
          const searchQuery = address.toLowerCase().includes('toshkent') || address.toLowerCase().includes('ташкент') || address.toLowerCase().includes('tashkent')
            ? address
            : 'Toshkent, ' + address;
          const res = await ymaps.geocode(searchQuery, { results: 1 });
          const firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            const coords = firstGeoObject.geometry.getCoordinates();
            finalLat = coords[0];
            finalLng = coords[1];
            finalYandexAddress = firstGeoObject.getAddressLine();
            setLatitude(finalLat);
            setLongitude(finalLng);
            setYandexAddress(finalYandexAddress);
          }
        }
      } catch (err) {
        console.error('Submit geocoding error:', err);
      }
    }

    try {
      const res = await storeFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          phone,
          address,
          comment,
          telegramUserId: tgUser?.id ? String(tgUser.id) : undefined,
          telegramChatId: tgUser?.id ? String(tgUser.id) : undefined,
          source: isTelegram ? 'telegram' : 'web',
          addressComment,
          latitude: finalLat,
          longitude: finalLng,
          yandexAddress: finalYandexAddress,
          deliveryEntrance,
          deliveryFloor,
          deliveryApartment,
          deliveryIntercom,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(data.order);
        fetchCart(); // Clear cart state
      } else {
        setError(data.error || 'Ошибка при оформлении заказа');
      }
    } catch (err) {
      setError('Ошибка сети при отправке заказа');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  
  if (loadingUser || loadingCart) {
    return (
      <>
        <Header />
        <main className="main-content container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', width: '2.5rem', height: '2.5rem', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
          <h4>Yuklanmoqda...</h4>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
        </main>
        <Footer />
      </>
    );
  }

  if (orderSuccess) {
    return (
      <>
        <Header />
        <main className="main-content container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Заказ успешно оформлен!</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '2rem', maxWidth: '30rem', marginLeft: 'auto', marginRight: 'auto' }}>
            Номер вашего заказа: <strong>#{orderSuccess.id.slice(-6).toUpperCase()}</strong>.
            Мы свяжемся с вами в ближайшее время для подтверждения доставки.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href={storePath} className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
              Вернуться в магазин
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="main-content container">
        <h3 className="section-title">{t('checkout')}</h3>

        <div className="cart-layout">
          <div className="card" style={{ padding: '2rem' }}>
            {!user ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
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
                  <label className="form-label">{t('name')} *</label>
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
                  <label className="form-label">{t('phone')} *</label>
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

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">{t('address')} *</label>
                  <YandexAddressPicker
                    initialAddress={address}
                    initialLatitude={latitude || undefined}
                    initialLongitude={longitude || undefined}
                    onChange={handleAddressChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Подъезд</label>
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
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Этаж</label>
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
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Кв./Офис</label>
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
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Домофон</label>
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
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Уточнение адреса / Ориентир</label>
                  <input
                    type="text"
                    className="form-input"
                    value={addressComment}
                    onChange={(e) => setAddressComment(e.target.value)}
                    placeholder="Например: вход со двора, шлагбаум"
                  />
                </div>

                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">Комментарий к заказу (Пожелания)</label>
                  <textarea
                    className="form-input"
                    placeholder="Особые пожелания курьеру"
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
      </main>

      <Footer />
    </>
  );
}
