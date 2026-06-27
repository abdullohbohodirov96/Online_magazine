'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import MiniAppLayout from '@/components/MiniAppLayout';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, totalAmount, clearCart } = useApp();
  const router = useRouter();

  return (
    <MiniAppLayout title="Корзина">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Выбранные товары</h3>
        {cart.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Очистить корзину?')) clearCart();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Очистить все
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Корзина пуста</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Добавьте свежие продукты из нашего каталога.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/miniapp')} style={{ width: 'auto', display: 'inline-flex' }}>
            В каталог
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cart.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: 'var(--card-bg)',
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Product Image */}
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--muted-light)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem' }}>🥦</span>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                    {item.product.price.toLocaleString('ru-RU')} сум / {item.product.unit}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-hover)', marginTop: '0.2rem' }}>
                    {(item.product.price * item.quantity).toLocaleString('ru-RU')} сум
                  </div>
                </div>

                {/* Quantity Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      backgroundColor: 'var(--muted-light)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '1rem', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      backgroundColor: 'var(--primary-color)',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      marginLeft: '0.25rem',
                      padding: '0.25rem',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal Box */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Товары ({cart.length}):</span>
              <span>{totalAmount.toLocaleString('ru-RU')} сум</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Доставка:</span>
              <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Бесплатно</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800 }}>
              <span>Итого:</span>
              <span style={{ color: 'var(--primary-hover)' }}>{totalAmount.toLocaleString('ru-RU')} UZS</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            className="btn btn-primary"
            onClick={() => router.push('/miniapp/checkout')}
            style={{ width: '100%', padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem' }}
          >
            💳 Перейти к оформлению
          </button>
        </div>
      )}
    </MiniAppLayout>
  );
}
