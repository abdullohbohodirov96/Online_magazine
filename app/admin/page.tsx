'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp, Product, Category } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, loadingUser } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'integration' | 'settings'>('orders');

  useEffect(() => {
    if (!loadingUser && (!user || user.role !== 'ADMIN')) {
      // Access denied handled in render
    }
  }, [user, loadingUser]);

  if (loadingUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Загрузка...
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <>
        <Header />
        <main className="main-content container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Доступ ограничен</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
            Эта страница доступна только для пользователей с ролью администратора.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/')} style={{ display: 'inline-flex', width: 'auto' }}>
            На главную
          </button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="main-content container">
        <h3 className="section-title">Панель управления администратора</h3>

        <div className="admin-layout">
          <aside className="admin-sidebar">
            <button
              className={`admin-sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              📦 Заказы
            </button>
            <button
              className={`admin-sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              🥦 Товары
            </button>
            <button
              className={`admin-sidebar-link ${activeTab === 'integration' ? 'active' : ''}`}
              onClick={() => setActiveTab('integration')}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              🔄 Синхронизация
            </button>
            <button
              className={`admin-sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              ⚙️ Настройки интеграции
            </button>
          </aside>

          <section className="admin-main">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'integration' && <IntegrationTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ==================== TAB 1: ORDERS ====================
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setMessage('Статус заказа успешно обновлен');
        fetchOrders();
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert('Не удалось обновить статус заказа');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  if (loading) return <div>Загрузка заказов...</div>;

  return (
    <div>
      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Управление заказами</h4>
      {message && (
        <div style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {orders.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Заказы отсутствуют.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Дата</th>
                <th>Клиент</th>
                <th>Адрес</th>
                <th>Товары</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700 }}>#{order.id.slice(-6).toUpperCase()}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <strong>{order.customerName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{order.phone}</div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '12rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.address}>
                      {order.address}
                    </div>
                    {order.comment && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-hover)', fontStyle: 'italic' }}>
                        Кмнт: {order.comment}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {order.items.map((item: any) => (
                        <div key={item.id}>
                          • {item.productName} ({item.quantity} шт)
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatPrice(order.totalAmount)}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <option value="NEW">Новый</option>
                      <option value="ACCEPTED">Принят</option>
                      <option value="ASSEMBLING">Собирается</option>
                      <option value="DELIVERING">В доставке</option>
                      <option value="COMPLETED">Завершен</option>
                      <option value="CANCELLED">Отменен</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================== TAB 2: PRODUCTS ====================
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [integrationSettings, setIntegrationSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Product fields
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [nomenclatureCode, setNomenclatureCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('шт');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Integration specific product fields
  const [source, setSource] = useState('manual');
  const [externalProductId, setExternalProductId] = useState('');
  const [syncPrice, setSyncPrice] = useState(true);
  const [syncStock, setSyncStock] = useState(true);

  // Autocomplete state
  const [integrationSearchQuery, setIntegrationSearchQuery] = useState('');
  const [integrationSearchLoading, setIntegrationSearchLoading] = useState(false);
  const [integrationSearchResult, setIntegrationSearchResult] = useState<any[]>([]);
  const [integrationSearchError, setIntegrationSearchError] = useState('');
  const [showManualForm, setShowManualForm] = useState(true);

  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await fetch('/api/admin/products');
      const sRes = await fetch('/api/admin/integration/settings');

      if (pRes.ok && sRes.ok) {
        const pData = await pRes.json();
        const sData = await sRes.json();

        setProducts(pData.products);
        setCategories(pData.categories);
        setIntegrationSettings(sData.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddForm = () => {
    setEditingProduct(null);
    setName('');
    setBarcode('');
    setNomenclatureCode('');
    setCategoryId(categories[0]?.id || '');
    setPrice('');
    setOldPrice('');
    setStock('');
    setUnit('шт');
    setImage('');
    setDescription('');
    setIsActive(true);
    setSource('manual');
    setExternalProductId('');
    setSyncPrice(true);
    setSyncStock(true);
    setFormError('');

    // Autocomplete resetting
    setIntegrationSearchQuery('');
    setIntegrationSearchResult([]);
    setIntegrationSearchError('');
    
    // If integration is enabled, show the lookup first and hide form. Else show form.
    if (integrationSettings?.integrationEnabled) {
      setShowManualForm(false);
    } else {
      setShowManualForm(true);
    }

    setShowForm(true);
  };

  const openEditForm = (prod: any) => {
    setEditingProduct(prod);
    setName(prod.name);
    setBarcode(prod.barcode || '');
    setNomenclatureCode(prod.nomenclatureCode || '');
    setCategoryId(prod.categoryId || '');
    setPrice(prod.price.toString());
    setOldPrice(prod.oldPrice ? prod.oldPrice.toString() : '');
    setStock(prod.stock.toString());
    setUnit(prod.unit);
    setImage(prod.image || '');
    setDescription(prod.description || '');
    setIsActive(prod.isActive);
    setSource(prod.source || 'manual');
    setExternalProductId(prod.externalProductId || '');
    setSyncPrice(prod.syncPrice ?? true);
    setSyncStock(prod.syncStock ?? true);
    setFormError('');
    setShowManualForm(true);
    setShowForm(true);
  };

  const handleIntegrationSearch = async () => {
    if (!integrationSearchQuery.trim()) return;
    setIntegrationSearchLoading(true);
    setIntegrationSearchError('');
    setIntegrationSearchResult([]);

    try {
      const res = await fetch(`/api/admin/integration/search-product?query=${encodeURIComponent(integrationSearchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setIntegrationSearchResult(data.products);
        } else {
          setIntegrationSearchError(data.message || 'Товар не найден в программе. Вы можете добавить его вручную.');
        }
      } else {
        const data = await res.json();
        setIntegrationSearchError(data.error || 'Ошибка при поиске');
      }
    } catch (e) {
      setIntegrationSearchError('Ошибка сети при поиске');
    } finally {
      setIntegrationSearchLoading(false);
    }
  };

  const selectIntegrationProduct = async (extProd: any) => {
    setName(extProd.name);
    setBarcode(extProd.barcode || '');
    setNomenclatureCode(extProd.nomenclatureCode || '');
    setPrice(extProd.price.toString());
    setStock(extProd.stock.toString());
    setUnit(extProd.unit || 'шт');
    setSource('integration');
    setExternalProductId(extProd.id);
    setSyncPrice(true);
    setSyncStock(true);

    // Try to auto-resolve category
    if (extProd.categoryName) {
      const match = categories.find(c => c.name.toLowerCase() === extProd.categoryName.toLowerCase());
      if (match) {
        setCategoryId(match.id);
      } else {
        setCategoryId(categories[0]?.id || '');
      }
    }

    setShowManualForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      id: editingProduct?.id,
      name,
      barcode,
      nomenclatureCode,
      categoryId: categoryId || null,
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      stock: parseFloat(stock),
      unit,
      image,
      description,
      isActive,
      source,
      externalProductId: externalProductId || null,
      syncPrice,
      syncStock,
    };

    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        setFormError(data.error || 'Ошибка при сохранении товара');
      }
    } catch (err) {
      setFormError('Ошибка сети');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Не удалось удалить товар');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  if (loading) return <div>Загрузка товаров...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Управление товарами</h4>
        <button className="btn btn-primary" onClick={openAddForm} style={{ width: 'auto', padding: '0.5rem 1.25rem' }}>
          ➕ Добавить товар
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: '35rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
            </h4>

            {formError && (
              <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            {/* AUTOCOMPLETE SECTION (only for new products and if integration is enabled) */}
            {!editingProduct && integrationSettings?.integrationEnabled && !showManualForm && (
              <div style={{ backgroundColor: 'var(--background)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Найти товар из программы</h5>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Штрихкод, код или название"
                    value={integrationSearchQuery}
                    onChange={(e) => setIntegrationSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIntegrationSearch()}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleIntegrationSearch}
                    style={{ width: 'auto', padding: '0 1.25rem' }}
                    disabled={integrationSearchLoading}
                  >
                    {integrationSearchLoading ? 'Поиск...' : 'Найти'}
                  </button>
                </div>

                {integrationSearchError && (
                  <div>
                    <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{integrationSearchError}</p>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowManualForm(true)} style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                      Добавить вручную
                    </button>
                  </div>
                )}

                {integrationSearchResult.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Результаты поиска во внешней базе:</p>
                    {integrationSearchResult.map((ext) => (
                      <div key={ext.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{ext.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            Штрихкод: {ext.barcode || '-'} | Код: {ext.nomenclatureCode || '-'} | Кат: {ext.categoryName || '-'}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--primary-hover)' }}>
                            Цена: {formatPrice(ext.price)} | Остаток: {ext.stock} {ext.unit}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => selectIntegrationProduct(ext)}
                          style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Использовать товар
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showManualForm && (
              <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Integration Details display */}
                {source === 'integration' && (
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--primary-hover)', fontWeight: 600 }}>
                    <span>🔄 Товар интегрирован из программы</span>
                    {editingProduct && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Последний синк: {editingProduct.updatedAt ? new Date(editingProduct.updatedAt).toLocaleString('ru-RU') : '-'}
                      </span>
                    )}
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Название товара *</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Штрихкод</label>
                  <input type="text" className="form-input" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Код номенклатуры</label>
                  <input type="text" className="form-input" value={nomenclatureCode} onChange={(e) => setNomenclatureCode(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Без категории</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Единица измерения *</label>
                  <select className="form-input" value={unit} onChange={(e) => setUnit(e.target.value)} required>
                    <option value="шт">шт (штука)</option>
                    <option value="кг">кг (килограмм)</option>
                    <option value="л">л (литр)</option>
                    <option value="упаковка">упаковка</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Цена (UZS) *</label>
                  <input type="number" step="any" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} required disabled={source === 'integration' && syncPrice} />
                </div>

                <div className="form-group">
                  <label className="form-label">Старая цена (UZS)</label>
                  <input type="number" step="any" className="form-input" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Остаток на складе *</label>
                  <input type="number" step="any" className="form-input" value={stock} onChange={(e) => setStock(e.target.value)} required disabled={source === 'integration' && syncStock} />
                </div>

                <div className="form-group">
                  <label className="form-label">URL фото товара</label>
                  <input type="url" className="form-input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Описание</label>
                  <textarea className="form-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                {source === 'integration' && (
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--muted-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Правила автообновления</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="syncPriceCheck" checked={syncPrice} onChange={(e) => setSyncPrice(e.target.checked)} />
                      <label htmlFor="syncPriceCheck" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Автоматически обновлять цену</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="syncStockCheck" checked={syncStock} onChange={(e) => setSyncStock(e.target.checked)} />
                      <label htmlFor="syncStockCheck" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Автоматически обновлять остаток</label>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2', marginBottom: 0 }}>
                  <input type="checkbox" id="isActiveCheck" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <label htmlFor="isActiveCheck" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Товар активен (отображается на сайте)</label>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Отмена</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Сохранить</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Товары отсутствуют.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Фото</th>
                <th>Источник</th>
                <th>Штрихкод</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Остаток</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} style={{ opacity: prod.isActive ? 1 : 0.6 }}>
                  <td>
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--muted-light)' }}>
                      <img src={prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&auto=format&fit=crop'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: prod.source === 'integration' ? 'var(--primary-light)' : 'var(--accent-light)',
                      color: prod.source === 'integration' ? 'var(--primary-hover)' : 'var(--accent-hover)'
                    }}>
                      {prod.source === 'integration' ? 'Integration' : 'Manual'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{prod.barcode || '-'}</td>
                  <td>
                    <strong>{prod.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Код: {prod.nomenclatureCode || '-'}</div>
                  </td>
                  <td>{prod.category?.name || <span style={{ color: 'var(--muted)' }}>Без категории</span>}</td>
                  <td>
                    {formatPrice(prod.price)}
                    {prod.oldPrice && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'line-through' }}>{formatPrice(prod.oldPrice)}</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{prod.stock} {prod.unit}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: prod.isActive ? 'var(--primary-light)' : 'var(--danger-light)', color: prod.isActive ? 'var(--primary-hover)' : 'var(--danger)' }}>
                      {prod.isActive ? 'Активен' : 'Скрыт'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => openEditForm(prod)} style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>✏️</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(prod.id)} style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================== TAB 3: INTEGRATION (SYNC PAGE) ====================
function IntegrationTab() {
  const [jsonInput, setJsonInput] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ status: string; message: string } | null>(null);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/integration-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      JSON.parse(jsonInput);
      
      const res = await fetch('/api/admin/integration/sync-external-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonInput,
      });

      const data = await res.json();
      if (res.ok) {
        setSyncResult({ status: 'success', message: `Успешно: ${data.message}` });
        setJsonInput('');
      } else {
        setSyncResult({ status: 'error', message: `Ошибка: ${data.error || 'Неизвестная ошибка'}` });
      }
      fetchLogs();
    } catch (err: any) {
      setSyncResult({ status: 'error', message: `Невалидный JSON: ${err.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const sRes = await fetch('/api/admin/integration/settings');
      if (!sRes.ok) throw new Error('Не удалось получить настройки');
      const sData = await sRes.json();
      const settings = sData.settings;

      if (!settings.integrationApiUrl) {
        setSyncResult({ status: 'error', message: 'API URL не настроен' });
        setSyncing(false);
        return;
      }

      const res = await fetch('/api/admin/integration/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: settings.integrationApiUrl,
          apiKey: settings.integrationApiKey,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSyncResult({ status: 'success', message: `Соединение успешно: ${data.message}` });
      } else {
        setSyncResult({ status: 'error', message: `Ошибка соединения: ${data.error}` });
      }
      fetchLogs();
    } catch (err: any) {
      setSyncResult({ status: 'error', message: `Ошибка: ${err.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleClearExternal = async () => {
    if (!confirm('Вы уверены, что хотите полностью очистить внешние товары (ExternalProduct)? Решения на сайте останутся, но поиск из программы будет пуст.')) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/integration/clear-external', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ status: 'success', message: data.message });
      } else {
        setSyncResult({ status: 'error', message: data.error });
      }
      fetchLogs();
    } catch (err: any) {
      setSyncResult({ status: 'error', message: `Ошибка: ${err.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const fillExampleJson = () => {
    const example = [
      {
        "barcode": "5449000000996",
        "nomenclatureCode": "COLA15",
        "name": "Coca-Cola 1.5L Premium",
        "price": 15000,
        "stock": 35,
        "unit": "шт",
        "categoryName": "Напитки"
      },
      {
        "barcode": "4780012345678",
        "nomenclatureCode": "MILK1",
        "name": "Молоко 1L Мусаффо",
        "price": 12000,
        "stock": 50,
        "unit": "шт",
        "categoryName": "Молочные продукты"
      },
      {
        "barcode": "4780098765432",
        "nomenclatureCode": "BREAD01",
        "name": "Хлеб Буханка",
        "price": 4500,
        "stock": 70,
        "unit": "шт",
        "categoryName": "Хлеб"
      }
    ];
    setJsonInput(JSON.stringify(example, null, 2));
  };

  return (
    <div>
      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Синхронизация продуктов</h4>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Синхронизируйте товары из магазинной программы вручную через JSON или управляйте внешними соединениями.
      </p>

      {syncResult && (
        <div style={{
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          backgroundColor: syncResult.status === 'success' ? 'var(--primary-light)' : 'var(--danger-light)',
          color: syncResult.status === 'success' ? 'var(--primary-hover)' : 'var(--danger)',
        }}>
          {syncResult.message}
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={handleTestConnection} style={{ width: 'auto', fontSize: '0.85rem' }} disabled={syncing}>
          🔌 Проверить подключение
        </button>
        <button type="button" className="btn btn-danger" onClick={handleClearExternal} style={{ width: 'auto', fontSize: '0.85rem' }} disabled={syncing}>
          🗑️ Очистить ExternalProduct
        </button>
        <button type="button" className="btn btn-secondary" onClick={fetchLogs} style={{ width: 'auto', fontSize: '0.85rem' }} disabled={syncing}>
          🔄 Обновить логи
        </button>
      </div>

      <form onSubmit={handleSync}>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Ввод JSON данных товаров из программы</label>
            <button type="button" onClick={fillExampleJson} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              📝 Вставить пример
            </button>
          </div>
          <textarea
            className="form-input"
            rows={8}
            placeholder='[ { "barcode": "...", "name": "...", ... } ]'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            required
            disabled={syncing}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={syncing}>
          {syncing ? 'Синхронизация...' : 'Синхронизировать товары из программы'}
        </button>
      </form>

      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2.5rem', marginBottom: '0.75rem' }}>Логи интеграции (последние 50)</h4>
      {loadingLogs ? (
        <p>Загрузка логов...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Логи отсутствуют.</p>
      ) : (
        <div className="log-box">
          {logs.map((log) => (
            <div key={log.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                <span>📅 {new Date(log.createdAt).toLocaleString('ru-RU')}</span>
                <span className={`sync-status-indicator ${log.status === 'SUCCESS' ? 'success' : 'error'}`}>
                  {log.status}
                </span>
              </div>
              <div style={{ color: log.status === 'ERROR' ? '#f87171' : '#34d399', fontWeight: 600, fontSize: '0.85rem' }}>
                Тип: {log.type}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                {log.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== TAB 4: SETTINGS ====================
function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Settings values
  const [integrationEnabled, setIntegrationEnabled] = useState(false);
  const [integrationMode, setIntegrationMode] = useState('disabled');
  const [integrationApiUrl, setIntegrationApiUrl] = useState('');
  const [integrationApiKey, setIntegrationApiKey] = useState('');
  const [autoUpdatePrices, setAutoUpdatePrices] = useState(true);
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(5);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integration/settings');
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        if (s) {
          setIntegrationEnabled(s.integrationEnabled);
          setIntegrationMode(s.integrationMode);
          setIntegrationApiUrl(s.integrationApiUrl || '');
          setIntegrationApiKey(s.integrationApiKey || '');
          setAutoUpdatePrices(s.autoUpdatePrices);
          setAutoUpdateStock(s.autoUpdateStock);
          setSyncIntervalMinutes(s.syncIntervalMinutes);
          setLastSyncAt(s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString('ru-RU') : null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      integrationEnabled,
      integrationMode,
      integrationApiUrl,
      integrationApiKey,
      autoUpdatePrices,
      autoUpdateStock,
      syncIntervalMinutes: Number(syncIntervalMinutes),
    };

    try {
      const res = await fetch('/api/admin/integration/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage('Настройки интеграции успешно сохранены.');
        fetchSettings();
      } else {
        const data = await res.json();
        setError(data.error || 'Не удалось сохранить настройки');
      }
    } catch (err) {
      setError('Ошибка сети при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Загрузка настроек...</div>;

  return (
    <div>
      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Настройки интеграции с магазинной программой</h4>

      {message && (
        <div style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 600 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '30rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <input
            type="checkbox"
            id="integrationEnabled"
            checked={integrationEnabled}
            onChange={(e) => setIntegrationEnabled(e.target.checked)}
            style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer' }}
          />
          <label htmlFor="integrationEnabled" style={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
            Включить интеграцию
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">Режим интеграции</label>
          <select
            className="form-input"
            value={integrationMode}
            onChange={(e) => setIntegrationMode(e.target.value)}
            disabled={!integrationEnabled}
          >
            <option value="disabled">Отключено</option>
            <option value="csv_import">Загрузка JSON/CSV вручную</option>
            <option value="external_api">Внешний API (External API)</option>
          </select>
        </div>

        {integrationMode === 'external_api' && (
          <>
            <div className="form-group">
              <label className="form-label">URL внешнего API *</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://your-shop-system.com/api/products"
                value={integrationApiUrl}
                onChange={(e) => setIntegrationApiUrl(e.target.value)}
                required
                disabled={!integrationEnabled}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ключ авторизации API (Secret/Token)</label>
              <input
                type="password"
                className="form-input"
                placeholder="Вставьте секретный ключ"
                value={integrationApiKey}
                onChange={(e) => setIntegrationApiKey(e.target.value)}
                disabled={!integrationEnabled}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Интервал автосинхронизации (минут)</label>
          <input
            type="number"
            className="form-input"
            value={syncIntervalMinutes}
            onChange={(e) => setSyncIntervalMinutes(Number(e.target.value))}
            min={1}
            disabled={!integrationEnabled}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--muted-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Правила обновления цен и остатков</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="autoUpdatePrices"
              checked={autoUpdatePrices}
              onChange={(e) => setAutoUpdatePrices(e.target.checked)}
              disabled={!integrationEnabled}
            />
            <label htmlFor="autoUpdatePrices" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              Автоматически обновлять цены на сайте при синхронизации
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="autoUpdateStock"
              checked={autoUpdateStock}
              onChange={(e) => setAutoUpdateStock(e.target.checked)}
              disabled={!integrationEnabled}
            />
            <label htmlFor="autoUpdateStock" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              Автоматически обновлять остатки на сайте при синхронизации
            </label>
          </div>
        </div>

        {lastSyncAt && (
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Последняя успешная синхронизация: <strong>{lastSyncAt}</strong>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </form>
    </div>
  );
}
