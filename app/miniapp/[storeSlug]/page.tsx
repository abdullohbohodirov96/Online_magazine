'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp, Product, Category } from '@/context/AppContext';
import MiniAppLayout from '@/components/MiniAppLayout';

function MiniAppContent() {
  const { addToCart, cart, updateCartQuantity } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(searchParams.get('categoryId') || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Sync state if query param changes
  const categoryIdParam = searchParams.get('categoryId');
  useEffect(() => {
    if (categoryIdParam) {
      setSelectedCategoryId(categoryIdParam);
    }
  }, [categoryIdParam]);

  // Fetch products and categories
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = `/api/products?search=${encodeURIComponent(searchQuery)}`;
        if (selectedCategoryId) {
          url += `&categoryId=${selectedCategoryId}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching miniapp products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchQuery, selectedCategoryId]);

  const handleCategoryClick = (id: string) => {
    setSelectedCategoryId(selectedCategoryId === id ? null : id);
  };

  const getProductQuantityInCart = (productId: string) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  return (
    <MiniAppLayout title="BozorMarket">
      {/* Search Input */}
      <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
        <input
          type="text"
          placeholder="🔍 Поиск продуктов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card-bg)',
            outline: 'none',
            fontSize: '0.9rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Horizontal Scroll Categories */}
      <div style={{ marginBottom: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.8 }}>
          Категории
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            width: '100%',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            boxSizing: 'border-box',
          }}
          className="no-scrollbar"
        >
          <button
            onClick={() => setSelectedCategoryId(null)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              border: selectedCategoryId === null ? 'none' : '1px solid var(--border)',
              backgroundColor: selectedCategoryId === null ? 'var(--primary-color)' : 'var(--card-bg)',
              color: selectedCategoryId === null ? '#ffffff' : 'var(--foreground)',
              fontSize: '0.8rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}
          >
            Все 🥦
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? 'none' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: isSelected ? '#ffffff' : 'var(--foreground)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flex: '0 0 auto',
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Catalog - 2 Column Grid */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', opacity: 0.8 }}>
          Товары
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            Загрузка каталога...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            Товары не найдены
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '10px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {products.map((prod) => {
              const qty = getProductQuantityInCart(prod.id);
              return (
                <div
                  key={prod.id}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                  onClick={() => router.push(`/miniapp/product/${prod.id}`)}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      backgroundColor: 'var(--muted-light)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>🥦</span>
                    )}

                    {prod.oldPrice && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: 'var(--danger)',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.35rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Скидка
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div
                    style={{
                      padding: '0.5rem 0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      boxSizing: 'border-box',
                      minWidth: 0,
                    }}
                  >
                    {/* Name (Max 2 lines) */}
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        lineHeight: '1.25',
                        height: '2.5em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {prod.name}
                    </div>

                    {/* Stock status */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                      {prod.stock > 0 ? `Остаток: ${prod.stock} ${prod.unit}` : 'Нет в наличии'}
                    </div>

                    {/* Footer Row (Price + Add button) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                        gap: '4px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {prod.oldPrice && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--danger)', textDecoration: 'line-through', lineHeight: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.oldPrice.toLocaleString('ru-RU')} сум
                          </div>
                        )}
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-hover)', lineHeight: '1.1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.price.toLocaleString('ru-RU')} сум
                        </div>
                      </div>

                      {prod.stock > 0 ? (
                        qty > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                            <button
                              onClick={() => updateCartQuantity(prod.id, qty - 1)}
                              style={{
                                width: '22px',
                                height: '22px',
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
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>{qty}</span>
                            <button
                              onClick={() => updateCartQuantity(prod.id, qty + 1)}
                              style={{
                                width: '22px',
                                height: '22px',
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
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(prod, 1)}
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: 'var(--radius-md)',
                              border: 'none',
                              backgroundColor: 'var(--primary-color)',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            +
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 600, flexShrink: 0 }}>Нет</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MiniAppLayout>
  );
}

export default function MiniApp() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка BozorMarket...</div>}>
      <MiniAppContent />
    </Suspense>
  );
}
