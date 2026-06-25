'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, totalAmount, cartCount } = useApp();

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  return (
    <>
      <Header />
      
      <main className="main-content container">
        <h3 className="section-title">Ваша корзина</h3>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛒</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ваша корзина пуста</h4>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
              Самое время добавить в неё что-нибудь вкусное и свежее!
            </p>
            <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '0.75rem 2rem' }}>
              Вернуться в каталог
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{cartCount} товаров в корзине</span>
                <button
                  onClick={clearCart}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Очистить всё
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-img-wrapper">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="cart-item-img" onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop';
                      }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', backgroundColor: 'var(--muted-light)' }}>
                        🥑
                      </div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{item.product.name}</h4>
                    <div className="cart-item-meta">
                      Цена: {formatPrice(item.product.price)} / {item.product.unit}
                    </div>
                  </div>

                  <div className="quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="quantity-val">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-price">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId)}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--muted)', marginLeft: '0.5rem' }}
                    title="Удалить"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Детали заказа</h4>
              
              <div className="summary-row">
                <span style={{ color: 'var(--muted)' }}>Товары ({cartCount})</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: 'var(--muted)' }}>Доставка</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Бесплатно</span>
              </div>
              
              <div className="summary-row total">
                <span>Итого:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>

              <Link href="/checkout" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                Оформить заказ
              </Link>

              <Link href="/" className="btn btn-secondary" style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center' }}>
                Продолжить покупки
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
