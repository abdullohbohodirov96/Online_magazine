'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp, Product, Category } from '@/context/AppContext';
import { useLanguageTheme } from '@/context/LanguageThemeContext';

function HomePageContent() {
  const { cart, addToCart, updateCartQuantity, storeFetch, store } = useApp();
  const { t, language } = useLanguageTheme();
  const { storeSlug } = useParams();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch data scoped to the store
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = `/api/products?search=${encodeURIComponent(searchQuery)}`;
        if (selectedCategoryId) {
          url += `&categoryId=${selectedCategoryId}`;
        }
        const res = await storeFetch(url);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchQuery, selectedCategoryId, storeSlug]);

  const handleCategoryClick = (id: string) => {
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(id);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: t('outOfStock'), class: 'out-of-stock' };
    if (stock <= 10) return { label: t('lowStock'), class: 'low-stock' };
    return { label: t('inStock'), class: 'in-stock' };
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
          <section 
            className="promo-banner" 
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              marginBottom: '2.5rem',
              overflow: 'hidden',
              backgroundColor: `${store?.primaryColor || '#10b981'}15`,
              border: `1px solid ${store?.primaryColor || '#10b981'}30`,
            }}
          >
            <div className="promo-content" style={{ maxWidth: '32rem', position: 'relative', zIndex: 1 }}>
              <h2 className="promo-title" style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--foreground)' }}>
                {store?.bannerTitle || t('freshFoodDelivery')}
              </h2>
              <p className="promo-desc" style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {store?.bannerSubtitle || store?.description || t('bannerDesc')}
              </p>
              <button 
                className="promo-btn" 
                onClick={() => {
                  const element = document.getElementById('catalog');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: store?.primaryColor || 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {t('goToCatalog')}
              </button>
            </div>
            <div style={{ position: 'absolute', right: '2rem', bottom: '-1rem', fontSize: '10rem', opacity: 0.15, transform: 'rotate(15deg)', userSelect: 'none' }}>
              🍉
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section id="catalog" style={{ marginBottom: '2.5rem' }}>
          <h3 className="section-title">{t('categories')}</h3>
          <div className="categories-container" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '100px',
                    textAlign: 'center',
                    borderColor: isSelected ? (store?.primaryColor || 'var(--primary-color)') : 'var(--border)',
                    backgroundColor: isSelected ? `${store?.primaryColor || '#10b981'}15` : 'var(--card-bg)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="category-image-wrapper" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {cat.image || '📦'}
                  </div>
                  <span className="category-name" style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? (store?.primaryColor || 'var(--primary-hover)') : 'var(--foreground)' }}>
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Products Catalog */}
        <section style={{ minHeight: '30vh' }}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {searchQuery ? `${t('searchResult')}: "${searchQuery}"` : t('catalog')}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '10rem' }}>
              <div style={{ border: '3px solid var(--border)', borderTop: `3px solid ${store?.primaryColor || '#10b981'}`, borderRadius: '50%', width: '2.5rem', height: '2.5rem', animation: 'spin 1s linear infinite' }}></div>
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
              <h4>{t('noProductsFound')}</h4>
              <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>{t('changeFilters')}</p>
            </div>
          ) : (
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {products.map((product) => {
                const stockInfo = getStockStatus(product.stock);
                const hasDiscount = product.oldPrice && product.oldPrice > product.price;
                const cartItem = cart.find((i) => i.productId === product.id);

                return (
                  <div 
                    key={product.id} 
                    className="product-card"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative',
                    }}
                  >
                    {hasDiscount && (
                      <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'var(--danger)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', zIndex: 1 }}>
                        SALE
                      </span>
                    )}

                    <div 
                      onClick={() => setSelectedProduct(product)}
                      style={{ cursor: 'pointer', position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: 'var(--muted-light)', overflow: 'hidden' }}
                    >
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop'}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                        {product.category?.name || 'Category'}
                      </span>
                      <h4 
                        style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', cursor: 'pointer', height: '2.4em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.name}
                      </h4>
                      
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: stockInfo.class === 'in-stock' ? 'var(--primary-color)' : 'var(--danger)', marginBottom: '1rem' }}>
                        ● {stockInfo.label} {product.stock > 0 && `(${product.stock} ${product.unit})`}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{formatPrice(product.price)}</span>
                          {hasDiscount && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textDecoration: 'line-through' }}>{formatPrice(product.oldPrice!)}</span>
                          )}
                        </div>

                        {product.stock <= 0 ? (
                          <button disabled style={{ backgroundColor: 'var(--border)', color: 'var(--muted)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'not-allowed' }}>
                            ❌
                          </button>
                        ) : cartItem ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
                              style={{ border: 'none', backgroundColor: 'var(--muted-light)', borderRadius: 'var(--radius-sm)', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cartItem.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}
                              style={{ border: 'none', backgroundColor: store?.primaryColor || 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-sm)', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product, 1)}
                            style={{ border: 'none', backgroundColor: store?.primaryColor || 'var(--primary-color)', color: 'white', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold' }}
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

        {/* Branches / Filiallar */}
        {store?.branches && store.branches.length > 0 && (
          <section style={{ marginTop: '3rem', marginBottom: '2rem' }}>
            <h3 className="section-title">📍 Filiallarimiz</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {store.branches.map((branch: any) => (
                <div key={branch.id} style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'box-shadow 0.2s',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--foreground)' }}>
                    🏢 {branch.name}
                  </h4>
                  {branch.address && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
                      📍 {branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <a href={`tel:${branch.phone}`} style={{ fontSize: '0.85rem', color: store?.primaryColor || 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
                      📞 {branch.phone}
                    </a>
                  )}
                  {branch.latitude && branch.longitude && (
                    <a
                      href={`https://yandex.com/maps/?ll=${branch.longitude},${branch.latitude}&z=16&pt=${branch.longitude},${branch.latitude},pm2rdm`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: store?.primaryColor || 'var(--primary-color)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      🗺️ Xaritada ko'rish
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '40rem', backgroundColor: 'var(--card-bg)', color: 'var(--foreground)', padding: '2rem', borderRadius: 'var(--radius-lg)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            
            <div className="product-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
              <div className="product-detail-gallery" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <img
                  src={selectedProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop'}
                  alt={selectedProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              
              <div className="product-detail-info" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {selectedProduct.category?.name || 'Category'}
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
                    {selectedProduct.name}
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--muted)', margin: '0.5rem 0' }}>
                    {selectedProduct.barcode && <span>{t('barcode')}: <strong>{selectedProduct.barcode}</strong></span>}
                    {selectedProduct.nomenclatureCode && <span>{t('nomenclatureCode')}: <strong>{selectedProduct.nomenclatureCode}</strong></span>}
                    <span>{t('unit')}: <strong>{selectedProduct.unit}</strong></span>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: getStockStatus(selectedProduct.stock).class === 'in-stock' ? 'var(--primary-color)' : 'var(--danger)', margin: '0.5rem 0' }}>
                    ● {getStockStatus(selectedProduct.stock).label} {selectedProduct.stock > 0 && `(${selectedProduct.stock} ${selectedProduct.unit})`}
                  </div>

                  <div style={{ margin: '1rem 0' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatPrice(selectedProduct.price)}</span>
                    {selectedProduct.oldPrice && selectedProduct.oldPrice > selectedProduct.price && (
                      <span style={{ fontSize: '1rem', color: 'var(--muted)', textDecoration: 'line-through', marginLeft: '0.75rem' }}>{formatPrice(selectedProduct.oldPrice)}</span>
                    )}
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <h5 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{t('description')}</h5>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  {selectedProduct.stock <= 0 ? (
                    <button className="btn btn-secondary" disabled style={{ cursor: 'not-allowed', width: '100%' }}>
                      {t('outOfStock')}
                    </button>
                  ) : (() => {
                    const cartItem = cart.find(i => i.productId === selectedProduct.id);
                    return cartItem ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('alreadyInCart')}</span>
                        <div className="quantity-control">
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
                        style={{ width: '100%', backgroundColor: store?.primaryColor }}
                      >
                        {t('addToCart')}
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
