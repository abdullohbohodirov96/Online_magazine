'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp, User } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, loadingUser } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'integration'>('orders');

  useEffect(() => {
    if (!loadingUser && (!user || user.role !== 'ADMIN')) {
      // Allow user to see Access Denied or redirect
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
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
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

  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setCategories(data.categories);
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
    setFormError('');
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
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      id: editingProduct?.id,
      name,
      barcode,
      nomenclatureCode,
      categoryId,
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      stock: parseFloat(stock),
      unit,
      image,
      description,
      isActive,
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

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <input type="number" step="any" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Старая цена (UZS)</label>
                <input type="number" step="any" className="form-input" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Остаток на складе *</label>
                <input type="number" step="any" className="form-input" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">URL фото товара</label>
                <input type="url" className="form-input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Описание</label>
                <textarea className="form-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2', marginBottom: 0 }}>
                <input type="checkbox" id="isActiveCheck" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <label htmlFor="isActiveCheck" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Товар активен (отображается на сайте)</label>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Сохранить</button>
              </div>
            </form>
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

// ==================== TAB 3: INTEGRATION ====================
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
      // Validate JSON structure first
      JSON.parse(jsonInput);
      
      const res = await fetch('/api/integration/products-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-integration-key': 'grocery-integration-key-xyz-123', // Match secret key in .env
        },
        body: jsonInput,
      });

      const data = await res.json();
      if (res.ok) {
        setSyncResult({ status: 'success', message: `Успешно: ${data.message}` });
        setJsonInput('');
      } else {
        setSyncResult({ status: 'error', message: `Ошибка: ${data.error || 'Неизвестная ошибка'}` });
      }
      fetchLogs(); // Reload logs
    } catch (err: any) {
      setSyncResult({ status: 'error', message: `Невалидный JSON: ${err.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const fillExampleJson = () => {
    const example = [
      {
        "barcode": "5449000000996",
        "nomenclatureCode": "COLA15",
        "name": "Coca-Cola 1.5L",
        "price": 14500,
        "stock": 45,
        "unit": "шт",
        "categoryName": "Напитки"
      },
      {
        "barcode": "40009",
        "nomenclatureCode": "BANANA_KG",
        "name": "Бананы свежие",
        "price": 19000,
        "stock": 60,
        "unit": "кг",
        "categoryName": "Овощи и Фрукты"
      }
    ];
    setJsonInput(JSON.stringify(example, null, 2));
  };

  return (
    <div>
      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Синхронизация продуктов</h4>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Загрузите JSON-массив товаров для автоматического обновления цен, остатков и создания новых товаров и категорий.
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

      <form onSubmit={handleSync}>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Ввод JSON данных</label>
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
          {syncing ? 'Синхронизация...' : 'Загрузить JSON'}
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
