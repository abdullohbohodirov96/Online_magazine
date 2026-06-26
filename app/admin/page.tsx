'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminPageContent() {
  const { user, loadingUser } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle active tab from query parameter, default to 'orders'
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'orders';
    if (['orders', 'products', 'integration'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
              onClick={() => { setActiveTab('orders'); router.push('/admin?tab=orders'); }}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              📦 Заказы
            </button>
            <button
              className={`admin-sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); router.push('/admin?tab=products'); }}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              🥦 Товары
            </button>
            <button
              className="admin-sidebar-link"
              onClick={() => router.push('/admin/categories')}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              📂 Категории
            </button>
            <button
              className={`admin-sidebar-link ${activeTab === 'integration' ? 'active' : ''}`}
              onClick={() => { setActiveTab('integration'); router.push('/admin?tab=integration'); }}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              🔄 Синхронизация
            </button>
            <button
              className="admin-sidebar-link"
              onClick={() => router.push('/admin/settings/integration')}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              ⚙️ Настройки интеграции
            </button>
            <button
              className="admin-sidebar-link"
              onClick={() => router.push('/admin/settings/telegram')}
              style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              🤖 Настройки Telegram
            </button>
          </aside>

          <section className="admin-main">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'integration' && <IntegrationTab />}
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
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e: any) {
      console.error(e);
      setError('Ошибка при получении заказов');
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
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      if (res.ok) {
        setMessage('Статус заказа успешно обновлен.');
        fetchOrders();
      } else {
        const data = await res.json();
        setError(data.error || 'Не удалось обновить статус');
      }
    } catch (err: any) {
      setError('Ошибка сети при обновлении статуса');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' UZS';
  };

  if (loading) return <div>Загрузка заказов...</div>;

  return (
    <div>
      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Управление заказами</h4>

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

      {orders.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Заказов пока нет.</p>
      ) : (
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Дата</th>
                <th style={{ padding: '0.75rem 1rem' }}>Клиент</th>
                <th style={{ padding: '0.75rem 1rem' }}>Сумма</th>
                <th style={{ padding: '0.75rem 1rem' }}>Источник</th>
                <th style={{ padding: '0.75rem 1rem' }}>Статус</th>
                <th style={{ padding: '0.75rem 1rem' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const date = new Date(order.createdAt).toLocaleDateString('ru-RU');
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{date}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong>{order.customerName}</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{order.phone}</span><br/>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{order.address}</span>
                      {order.latitude && order.longitude && (
                        <>
                          <br/>
                          <a
                            href={`https://yandex.com/maps/?ll=${order.longitude},${order.latitude}&z=17&pt=dots ${order.longitude},${order.latitude},pm2rdm`.replace('\\dots ', '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}
                          >
                            🗺️ Карта Яндекса ({order.latitude.toFixed(6)}, {order.longitude.toFixed(6)})
                          </a>
                        </>
                      )}
                      {(order.deliveryEntrance || order.deliveryFloor || order.deliveryApartment || order.deliveryIntercom) && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '3px' }}>
                          {order.deliveryEntrance && `Подъезд: ${order.deliveryEntrance} `}
                          {order.deliveryFloor && `Этаж: ${order.deliveryFloor} `}
                          {order.deliveryApartment && `Кв: ${order.deliveryApartment} `}
                          {order.deliveryIntercom && `Домофон: ${order.deliveryIntercom}`}
                        </div>
                      )}
                      {order.addressComment && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '2px' }}>
                          💬 {order.addressComment}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{formatPrice(order.totalAmount)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: 'var(--muted-light)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                        {order.source === 'telegram' ? '🤖 Telegram' : '🌐 Web'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`sync-status-indicator ${
                        order.status === 'COMPLETED' ? 'success' : order.status === 'CANCELLED' ? 'error' : 'warning'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <select
                        className="form-input"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
                      >
                        <option value="NEW">Новый</option>
                        <option value="ACCEPTED">Принят</option>
                        <option value="ASSEMBLING">Сборка</option>
                        <option value="DELIVERING">В доставке</option>
                        <option value="COMPLETED">Завершен</option>
                        <option value="CANCELLED">Отменен</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
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
  const [editingProduct, setEditingProduct] = useState<any>(null);

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

  // Integration fields
  const [source, setSource] = useState('manual');
  const [externalProductId, setExternalProductId] = useState('');
  const [syncPrice, setSyncPrice] = useState(true);
  const [syncStock, setSyncStock] = useState(true);

  // Image Upload states
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Quick Add Category Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // External product search flow
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
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData.products || []);
        setCategories(pData.categories || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setIntegrationSettings(sData.settings);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Размер файла превышает 5 МБ');
      return;
    }
    
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFormError('Разрешены только форматы JPG, PNG, WEBP');
      return;
    }

    setUploading(true);
    setFormError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setImage(data.url);
      } else {
        setFormError(data.error || 'Не удалось загрузить изображение');
      }
    } catch (err: any) {
      setFormError('Ошибка при отправке файла');
    } finally {
      setUploading(false);
    }
  };

  const openAddForm = () => {
    resetFormFields();
    setEditingProduct(null);
    setShowManualForm(true);
    setShowForm(true);
  };

  const openEditForm = (prod: any) => {
    setEditingProduct(prod);
    setName(prod.name);
    setBarcode(prod.barcode || '');
    setNomenclatureCode(prod.nomenclatureCode || '');
    setCategoryId(prod.categoryId || '');
    setPrice(String(prod.price));
    setOldPrice(prod.oldPrice ? String(prod.oldPrice) : '');
    setStock(String(prod.stock));
    setUnit(prod.unit);
    setImage(prod.image || '');
    setDescription(prod.description || '');
    setIsActive(prod.isActive);

    setSource(prod.source);
    setExternalProductId(prod.externalProductId || '');
    setSyncPrice(prod.syncPrice);
    setSyncStock(prod.syncStock);

    setShowManualForm(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFormFields = () => {
    setName('');
    setBarcode('');
    setNomenclatureCode('');
    setCategoryId('');
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
    setIntegrationSearchQuery('');
    setIntegrationSearchResult([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      id: editingProduct?.id,
      name,
      barcode: barcode.trim() || null,
      nomenclatureCode: nomenclatureCode.trim() || null,
      categoryId: categoryId || null,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      stock: Number(stock),
      unit,
      image: image || null,
      description: description.trim() || null,
      isActive,
      source,
      externalProductId: externalProductId || null,
      syncPrice,
      syncStock,
    };

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        resetFormFields();
        fetchData();
      } else {
        setFormError(data.error || 'Ошибка при сохранении товара');
      }
    } catch (err: any) {
      setFormError('Ошибка соединения с сервером');
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
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSearchIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!integrationSearchQuery.trim()) return;

    setIntegrationSearchLoading(true);
    setIntegrationSearchError('');
    setIntegrationSearchResult([]);

    try {
      const res = await fetch(`/api/admin/integration/search-product?query=${encodeURIComponent(integrationSearchQuery.trim())}`);
      const data = await res.json();
      
      if (res.ok) {
        setIntegrationSearchResult(data.products || []);
        if (data.products.length === 0) {
          setIntegrationSearchError('Товары не найдены во внешней программе');
        }
      } else {
        setIntegrationSearchError(data.error || 'Ошибка при поиске');
      }
    } catch (err: any) {
      setIntegrationSearchError('Ошибка сети');
    } finally {
      setIntegrationSearchLoading(false);
    }
  };

  const handleUseExternalProduct = async (extProd: any) => {
    // Fill fields
    setName(extProd.name);
    setBarcode(extProd.barcode || '');
    setNomenclatureCode(extProd.nomenclatureCode || '');
    setPrice(String(extProd.price));
    setStock(String(extProd.stock));
    setUnit(extProd.unit || 'шт');
    setSource('integration');
    setExternalProductId(extProd.id);

    // Dynamic Category Resolution Flow
    if (extProd.categoryName) {
      const foundCat = categories.find(c => c.name.toLowerCase() === extProd.categoryName.toLowerCase());
      if (foundCat) {
        setCategoryId(foundCat.id);
      } else {
        if (confirm(`Категория \`${extProd.categoryName}\` не найдена в базе. Создать её автоматически?`)) {
          try {
            const catRes = await fetch('/api/admin/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: extProd.categoryName }),
            });
            const catData = await catRes.json();
            if (catRes.ok && catData.category) {
              // Reload categories list to include new category
              const pRes = await fetch('/api/admin/products');
              if (pRes.ok) {
                const pData = await pRes.json();
                setCategories(pData.categories || []);
              }
              setCategoryId(catData.category.id);
            } else {
              alert('Не удалось создать категорию: ' + (catData.error || 'Ошибка'));
            }
          } catch (err: any) {
            console.error(err);
            alert('Ошибка сети при автоматическом создании категории');
          }
        }
      }
    }

    setShowManualForm(true);
  };

  const handleCreateCategoryQuickly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setModalSaving(true);
    setModalError('');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.category) {
        // Refresh categories
        const pRes = await fetch('/api/admin/products');
        if (pRes.ok) {
          const pData = await pRes.json();
          setCategories(pData.categories || []);
        }
        setCategoryId(data.category.id);
        setShowCategoryModal(false);
        setNewCategoryName('');
      } else {
        setModalError(data.error || 'Не удалось создать категорию');
      }
    } catch (err: any) {
      setModalError('Ошибка сети');
    } finally {
      setModalSaving(false);
    }
  };

  const formatPrice = (p: number) => p.toLocaleString('ru-RU') + ' UZS';

  if (loading) return <div>Загрузка товаров...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Управление товарами</h4>
        {!showForm && (
          <button className="btn btn-primary" onClick={openAddForm} style={{ width: 'auto' }}>
            + Добавить товар
          </button>
        )}
      </div>

      {showForm ? (
        <div style={{ backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
            {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
          </h5>

          {integrationSettings?.integrationEnabled && !editingProduct && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Добавить товар из внешней учетной программы</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn ${showManualForm ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setShowManualForm(false)}
                  style={{ width: 'auto', fontSize: '0.85rem', padding: '0.4rem 1.25rem' }}
                >
                  🔍 Найти во внешней базе
                </button>
                <button
                  type="button"
                  className={`btn ${showManualForm ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowManualForm(true)}
                  style={{ width: 'auto', fontSize: '0.85rem', padding: '0.4rem 1.25rem' }}
                >
                  📝 Вручную
                </button>
              </div>

              {!showManualForm && (
                <div>
                  <form onSubmit={handleSearchIntegration} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Штрихкод, код или название во внешней программе"
                      value={integrationSearchQuery}
                      onChange={(e) => setIntegrationSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={integrationSearchLoading}>
                      Поиск
                    </button>
                  </form>

                  {integrationSearchLoading && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Поиск во внешней программе...</p>}
                  {integrationSearchError && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--danger)' }}>{integrationSearchError}</p>}
                  
                  {integrationSearchResult.length > 0 && (
                    <div style={{ marginTop: '0.75rem', maxHeight: '12rem', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      {integrationSearchResult.map((p) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
                          <div>
                            <strong>{p.name}</strong><br/>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              ШК: {p.barcode || '-'}, Код: {p.nomenclatureCode || '-'}, Цена: {formatPrice(p.price)}, Ост: {p.stock}
                            </span>
                          </div>
                          <button type="button" className="btn btn-secondary" onClick={() => handleUseExternalProduct(p)} style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                            Выбрать
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showManualForm && (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {formError && (
                <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Название товара *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="form-input"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">-- Без категории --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCategoryModal(true)}
                      style={{ width: 'auto', fontSize: '1.1rem', padding: '0 1rem' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Штрихкод (Barcode)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    disabled={source === 'integration'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Код номенклатуры (nomenclatureCode)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nomenclatureCode}
                    onChange={(e) => setNomenclatureCode(e.target.value)}
                    disabled={source === 'integration'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Цена (сум) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    disabled={source === 'integration' && syncPrice}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Старая цена (для скидки)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Доступно на складе (остаток) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    disabled={source === 'integration' && syncStock}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Единица измерения *</label>
                  <select
                    className="form-input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  >
                    <option value="шт">шт (штука)</option>
                    <option value="кг">кг (килограмм)</option>
                    <option value="л">л (литр)</option>
                    <option value="упаковка">упаковка</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop Image Upload */}
              <div className="form-group">
                <label className="form-label">Изображение товара</label>
                
                {image ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--muted-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', maxWidth: '35rem' }}>
                    <div style={{ width: '4rem', height: '4rem', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{image}</span>
                      <button type="button" onClick={() => setImage('')} style={{ display: 'block', color: 'var(--danger)', border: 'none', background: 'none', padding: 0, marginTop: '0.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        Удалить изображение
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    style={{
                      border: dragActive ? '2px dashed var(--primary-color)' : '2px dashed var(--border)',
                      backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--muted-light)',
                      padding: '2rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      maxWidth: '35rem'
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      Перетащите картинку сюда или нажмите для выбора
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Поддерживаются JPG, PNG, WEBP (до 5МБ)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="product-file-input"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => document.getElementById('product-file-input')?.click()}
                      style={{ width: 'auto', marginTop: '1rem', padding: '0.4rem 1.5rem', fontSize: '0.85rem' }}
                      disabled={uploading}
                    >
                      {uploading ? 'Загрузка...' : 'Выбрать файл'}
                    </button>
                    
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Или введите URL картинки:</span>
                      <input
                        type="text"
                        className="form-input"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Описание товара</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isActiveProduct"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActiveProduct" style={{ fontWeight: 600, cursor: 'pointer' }}>
                  Активный товар (показывать на сайте)
                </label>
              </div>

              {source === 'integration' && (
                <div style={{ backgroundColor: 'var(--muted-light)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Связь с интеграционной системой</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="syncPrice" checked={syncPrice} onChange={(e) => setSyncPrice(e.target.checked)} />
                    <label htmlFor="syncPrice" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Синхронизировать цену</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="syncStock" checked={syncStock} onChange={(e) => setSyncStock(e.target.checked)} />
                    <label htmlFor="syncStock" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Синхронизировать остатки</label>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }}>
                  Сохранить
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetFormFields(); }} style={{ width: 'auto', padding: '0.6rem 2rem' }}>
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {/* Quick Add Category Modal Dialog */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '22rem', boxShadow: 'var(--shadow-lg)' }}>
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>Быстрое добавление категории</h5>
            <form onSubmit={handleCreateCategoryQuickly}>
              {modalError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{modalError}</p>}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Название категории *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Бакалея"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.4rem 1.25rem', fontSize: '0.85rem' }} disabled={modalSaving}>
                  {modalSaving ? 'Создание...' : 'Создать'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCategoryModal(false); setNewCategoryName(''); setModalError(''); }} style={{ width: 'auto', padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Товаров пока нет.</p>
      ) : (
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Фото</th>
                <th style={{ padding: '0.75rem 1rem' }}>Название</th>
                <th style={{ padding: '0.75rem 1rem' }}>Штрихкод / Код</th>
                <th style={{ padding: '0.75rem 1rem' }}>Категория</th>
                <th style={{ padding: '0.75rem 1rem' }}>Цена</th>
                <th style={{ padding: '0.75rem 1rem' }}>Склад</th>
                <th style={{ padding: '0.75rem 1rem' }}>Источник</th>
                <th style={{ padding: '0.75rem 1rem' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--muted-light)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        '🥦'
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <strong>{prod.name}</strong><br/>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{prod.unit}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    ШК: {prod.barcode || '-'}<br/>
                    Код: {prod.nomenclatureCode || '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {prod.category ? (
                      <span style={{ backgroundColor: 'var(--muted-light)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                        {prod.category.name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Нет</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{formatPrice(prod.price)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {prod.stock} {prod.unit}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ backgroundColor: 'var(--muted-light)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                      {prod.source === 'integration' ? '🔄 Внешний' : '📝 Ручной'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => openEditForm(prod)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}>
                        ✏️
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDelete(prod.id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', width: 'auto' }}>
                        🗑️
                      </button>
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

// ==================== TAB 3: INTEGRATION (SYNC) ====================
function IntegrationTab() {
  const [jsonInput, setJsonInput] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/integration-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e: any) {
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
        setSyncResult({ status: 'success', message: 'Успешно: ' + data.message });
        setJsonInput('');
      } else {
        setSyncResult({ status: 'error', message: 'Ошибка: ' + (data.error || 'Неизвестная ошибка') });
      }
      fetchLogs();
    } catch (err: any) {
      setSyncResult({ status: 'error', message: 'Невалидный JSON: ' + err.message });
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
          authType: settings.authType,
          requestMethod: settings.requestMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSyncResult({ status: 'success', message: 'Соединение установлено! ' + data.message });
      } else {
        setSyncResult({ status: 'error', message: 'Ошибка соединения: ' + (data.error || 'Не удалось установить соединение') });
      }
    } catch (err: any) {
      setSyncResult({ status: 'error', message: 'Ошибка при проверке соединения: ' + err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromApi = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/integration/sync-products', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ status: 'success', message: 'Синхронизация успешна! ' + data.result.message });
        fetchLogs();
      } else {
        setSyncResult({ status: 'error', message: 'Ошибка при синхронизации: ' + (data.error || 'Неизвестная ошибка') });
      }
    } catch (err: any) {
      setSyncResult({ status: 'error', message: 'Ошибка сети при автосинхронизации: ' + err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Интеграция с магазинной системой</h4>
      
      {syncResult && (
        <div style={{
          color: syncResult.status === 'success' ? 'var(--primary-hover)' : 'var(--danger)',
          backgroundColor: syncResult.status === 'success' ? 'var(--primary-light)' : 'var(--danger-light)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.25rem',
          fontWeight: 600
        }}>
          {syncResult.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={handleTestConnection} style={{ width: 'auto' }} disabled={syncing}>
          Проверить API соединение
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSyncFromApi} style={{ width: 'auto' }} disabled={syncing}>
          Запустить автосинхронизацию из API
        </button>
      </div>

      <form onSubmit={handleSync}>
        <div className="form-group">
          <label className="form-label">Вставить JSON-данные для ручной синхронизации товаров</label>
          <textarea
            className="form-input"
            rows={6}
            placeholder='[ { "barcode": "12345", "name": "Товар", "price": 100, "stock": 10, "unit": "шт" } ]'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            required
            disabled={syncing}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={syncing}>
          {syncing ? 'Синхронизация...' : 'Синхронизировать товары из JSON'}
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

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка страницы...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}
