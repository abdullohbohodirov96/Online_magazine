'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Product } from '@/context/AppContext';
import MiniAppLayout from '@/components/MiniAppLayout';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const { addToCart, cart, updateCartQuantity } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getProductQuantityInCart = (productId: string) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products`);
        if (res.ok) {
          const data = await res.json();
          const found = (data.products || []).find((p: any) => p.id === id);
          setProduct(found || null);
        }
      } catch (e) {
        console.error('Error fetching product:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <MiniAppLayout title="Загрузка..." showBackButton>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Загрузка товара...
        </div>
      </MiniAppLayout>
    );
  }

  if (!product) {
    return (
      <MiniAppLayout title="Товар не найден" showBackButton>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}>
          <h3>Упс! Товар не найден.</h3>
          <button className="btn btn-secondary" onClick={() => router.push('/miniapp')} style={{ marginTop: '1.5rem', width: 'auto' }}>
            В каталог
          </button>
        </div>
      </MiniAppLayout>
    );
  }

  const qty = getProductQuantityInCart(product.id);

  return (
    <MiniAppLayout title={product.name} showBackButton>
      <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
        {/* Product Image */}
        <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--muted-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.25rem' }}>
          {product.image ? (
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '5rem' }}>🥦</span>
          )}
        </div>

        {/* Category & Stock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          {product.category ? (
            <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
              {product.category.name}
            </span>
          ) : (
            <span></span>
          )}
          <span style={{ fontSize: '0.8rem', color: product.stock > 0 ? 'var(--primary-color)' : 'var(--danger)', fontWeight: 700 }}>
            {product.stock > 0 ? `В наличии: ${product.stock} ${product.unit}` : 'Нет в наличии'}
          </span>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem' }}>{product.name}</h2>

        {/* Price Box */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-hover)' }}>
            {product.price.toLocaleString('ru-RU')} UZS
          </span>
          {product.oldPrice && (
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'line-through' }}>
              {product.oldPrice.toLocaleString('ru-RU')} сум
            </span>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>/ {product.unit}</span>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.8 }}>Описание</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--foreground)', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
            {product.description || 'Описание товара отсутствует.'}
          </p>
        </div>

        {/* Add to Cart Actions */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
          {product.stock > 0 ? (
            qty > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>В корзине:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => updateCartQuantity(product.id, qty - 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      backgroundColor: 'var(--muted-light)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{qty}</span>
                  <button
                    onClick={() => updateCartQuantity(product.id, qty + 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      backgroundColor: 'var(--primary-color)',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => addToCart(product, 1)}
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                🛒 Добавить в корзину
              </button>
            )
          ) : (
            <button
              className="btn btn-secondary"
              disabled
              style={{ width: '100%', padding: '0.75rem', fontWeight: 700, opacity: 0.6, cursor: 'not-allowed' }}
            >
              Товар отсутствует на складе
            </button>
          )}
        </div>
      </div>
    </MiniAppLayout>
  );
}
