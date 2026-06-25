'use client';
import { Suspense } from 'react';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp, Product, Category } from '@/context/AppContext';

function HomePageContent() {
  const { cart, addToCart, updateCartQuantity } = useApp();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Selected product for detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch data
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
          setProducts(data.products);
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchQuery, selectedCategoryId]);

  const handleCategoryClick = (id: string) => {
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null); // Clear filter
    } else {
      setSelectedCategoryId(id);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Нет в наличии', class: 'out-of-stock' };
    if (stock <= 10) return { label: 'Мало осталось', class: 'low-stock' };
    return { label: 'В наличии', class: 'in-stock' };
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  return (
    <>
      <Header />
      
      <main className="main-content container">
        {/* Banner */}
        {!searchQuery && !selectedCategoryId && (
          <section className="promo-banner">
            <div className="promo-content">
              <h2 className="promo-title">Свежие продукты с доставкой на дом!</h2>
              <p className="promo-desc">
                Заказывайте лучшие овощи, фрукты, молочные продукты и напитки прямо сейчас. Быстрая доставка в любую точку Ташкента.
              </p>
              <button className="promo-btn" onClick={() => {
                const element = document.getElementById('catalog');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Перейти к покупкам
              </button>
            </div>
            <div style={{ position: 'absolute', right: '2rem', bottom: '-1rem', fontSize: '10rem', opacity: 0.15, transform: 'rotate(15deg)', userSelect: 'none' }}>
              🍉
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section id="catalog" style={{ marginBottom: '2.5rem' }}>
          <h3 className="section-title">Категории товаров</h3>
          <div className="categories-container">
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    borderColor: isSelected ? 'var(--primary-color)' : 'var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--card-bg)',
                  }}
                >
                  <div className="category-image-wrapper">
                    {cat.image || '📦'}
                  </div>
                  <span className="category-name" style={{ color: isSelected ? 'var(--primary-hover)' : 'var(--foreground)' }}>
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Products Catalog */}
        <section style={{ minHeight: '30vh' }}>
          <div className="section-title">
            <span>
              {searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Каталог продуктов'}
              {selectedCategoryId && categories.find(c => c.id === selectedCategoryId) && (
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--muted)', marginLeft: '0.75rem' }}>
                  ({categories.find(c => c.id === selectedCategoryId)?.name})
                </span>
              )}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '10rem' }}>
              <div style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', width: '2.5rem', height: '2.5rem', animation: 'spin 1s linear infinite' }}></div>
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h4>Товары не найдены</h4>
              <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Попробуйте изменить запрос или категорию фильтрации.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => {
                const stockInfo = getStockStatus(product.stock);
                const cartItem = cart.find((item) => item.productId === product.id);
                
                // Check if product has discount
                const hasDiscount = product.oldPrice && product.oldPrice > product.price;

                return (
                  <div key={product.id} className="product-card">
                    {hasDiscount && (
                      <span className="product-badge sale">
                        Скидка -{Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)}%
                      </span>
                    )}

                    <div className="product-image-container" style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct(product)}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="product-img" onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop';
                        }} />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '4rem', backgroundColor: 'var(--muted-light)' }}>
                          🥑
                        </div>
                      )}
                    </div>

                    <div className="product-info">
                      <span className="product-category">
                        {product.category?.name || 'Другое'}
                      </span>
                      <h4 className="product-title" style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct(product)}>
                        {product.name}
                      </h4>
                      
                      <div className={`stock-status ${stockInfo.class}`}>
                        ● {stockInfo.label} {product.stock > 0 && `(${product.stock} ${product.unit})`}
                      </div>

                      <div className="product-footer">
                        <div className="price-container">
                          <span className="product-price">{formatPrice(product.price)}</span>
                          {hasDiscount && (
                            <span className="product-old-price">{formatPrice(product.oldPrice!)}</span>
                          )}
                        </div>

                        {product.stock <= 0 ? (
                          <button className="add-to-cart-btn" disabled style={{ backgroundColor: 'var(--border)', color: 'var(--muted)', cursor: 'not-allowed' }}>
                            ❌
                          </button>
                        ) : cartItem ? (
                          <div className="quantity-control">
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
                            >
                              -
                            </button>
                            <span className="quantity-val">{cartItem.quantity}</span>
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="add-to-cart-btn"
                            onClick={() => addToCart(product, 1)}
                            title="В корзину"
                          >
                            ➕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" style={{ maxWidth: '40rem' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>&times;</button>
            
            <div className="product-detail-layout">
              <div className="product-detail-gallery">
                <img
                  src={selectedProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop'}
                  alt={selectedProduct.name}
                  className="product-detail-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop';
                  }}
                />
              </div>
              
              <div className="product-detail-info">
                <div>
                  <span className="product-category" style={{ fontSize: '0.85rem' }}>
                    {selectedProduct.category?.name || 'Другое'}
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    {selectedProduct.name}
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    {selectedProduct.barcode && <span>Штрихкод: <strong>{selectedProduct.barcode}</strong></span>}
                    {selectedProduct.nomenclatureCode && <span>Код номенклатуры: <strong>{selectedProduct.nomenclatureCode}</strong></span>}
                    <span>Единица измерения: <strong>{selectedProduct.unit}</strong></span>
                  </div>

                  <div className={`stock-status ${getStockStatus(selectedProduct.stock).class}`} style={{ marginBottom: '1rem' }}>
                    ● {getStockStatus(selectedProduct.stock).label} {selectedProduct.stock > 0 && `(${selectedProduct.stock} ${selectedProduct.unit})`}
                  </div>

                  <div className="price-container" style={{ margin: '1rem 0' }}>
                    <span className="product-price" style={{ fontSize: '1.75rem' }}>
                      {formatPrice(selectedProduct.price)}
                    </span>
                    {selectedProduct.oldPrice && selectedProduct.oldPrice > selectedProduct.price && (
                      <span className="product-old-price" style={{ fontSize: '1.125rem' }}>
                        {formatPrice(selectedProduct.oldPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <h5 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Описание</h5>
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  {selectedProduct.stock <= 0 ? (
                    <button className="btn btn-secondary" disabled style={{ cursor: 'not-allowed', width: '100%' }}>
                      Нет в наличии
                    </button>
                  ) : (() => {
                    const cartItem = cart.find(i => i.productId === selectedProduct.id);
                    return cartItem ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Уже в корзине:</span>
                        <div className="quantity-control" style={{ scale: '1.2' }}>
                          <button
                            className="quantity-btn"
                            onClick={() => updateCartQuantity(selectedProduct.id, cartItem.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="quantity-val">{cartItem.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => updateCartQuantity(selectedProduct.id, cartItem.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => addToCart(selectedProduct, 1)}
                        style={{ width: '100%' }}
                      >
                        Добавить в корзину
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}


export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
