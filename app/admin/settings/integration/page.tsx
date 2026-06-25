'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function AdminIntegrationSettingsPage() {
  const { user, loadingUser } = useApp();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Settings state
  const [integrationEnabled, setIntegrationEnabled] = useState(false);
  const [integrationMode, setIntegrationMode] = useState('disabled');
  const [integrationApiUrl, setIntegrationApiUrl] = useState('');
  const [integrationApiKey, setIntegrationApiKey] = useState('');
  const [autoUpdatePrices, setAutoUpdatePrices] = useState(true);
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(5);
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState('manual_json');
  const [authType, setAuthType] = useState('none');
  const [requestMethod, setRequestMethod] = useState('GET');
  const [productsEndpoint, setProductsEndpoint] = useState('');
  const [ordersEndpoint, setOrdersEndpoint] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Mappings
  const [mapBarcode, setMapBarcode] = useState('barcode');
  const [mapNomenclature, setMapNomenclature] = useState('nomenclatureCode');
  const [mapName, setMapName] = useState('name');
  const [mapPrice, setMapPrice] = useState('price');
  const [mapStock, setMapStock] = useState('stock');
  const [mapUnit, setMapUnit] = useState('unit');
  const [mapCategory, setMapCategory] = useState('categoryName');

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
          setProviderName(s.providerName || '');
          setProviderType(s.providerType || 'manual_json');
          setAuthType(s.authType || 'none');
          setRequestMethod(s.requestMethod || 'GET');
          setProductsEndpoint(s.productsEndpoint || '');
          setOrdersEndpoint(s.ordersEndpoint || '');
          setLastSyncAt(s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString('ru-RU') : null);

          // Map fieldMapping object if exists
          const map = s.fieldMapping || {};
          setMapBarcode(map.barcode || 'barcode');
          setMapNomenclature(map.nomenclatureCode || 'nomenclatureCode');
          setMapName(map.name || 'name');
          setMapPrice(map.price || 'price');
          setMapStock(map.stock || 'stock');
          setMapUnit(map.unit || 'unit');
          setMapCategory(map.categoryName || 'categoryName');
        }
      }
    } catch (e: any) {
      console.error(e);
      setError('Ошибка при загрузке настроек');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser && (!user || user.role !== 'ADMIN')) {
      // Access denied
    } else {
      fetchSettings();
    }
  }, [user, loadingUser]);

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
      providerName,
      providerType,
      authType,
      requestMethod,
      productsEndpoint,
      ordersEndpoint,
      fieldMapping: {
        barcode: mapBarcode.trim() || 'barcode',
        nomenclatureCode: mapNomenclature.trim() || 'nomenclatureCode',
        name: mapName.trim() || 'name',
        price: mapPrice.trim() || 'price',
        stock: mapStock.trim() || 'stock',
        unit: mapUnit.trim() || 'unit',
        categoryName: mapCategory.trim() || 'categoryName',
      }
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
    } catch (err: any) {
      setError('Ошибка сети при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/integration/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: integrationApiUrl,
          apiKey: integrationApiKey,
          authType,
          requestMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Соединение успешно установлено! ' + data.message);
      } else {
        setError(data.error || 'Не удалось установить соединение');
      }
    } catch (err: any) {
      setError('Ошибка сети при проверке соединения');
    } finally {
      setTesting(false);
    }
  };

  if (loadingUser) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>;

  if (!user || user.role !== 'ADMIN') {
    return (
      <>
        <Header />
        <main className="main-content container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Доступ ограничен</h3>
          <button className="btn btn-primary" onClick={() => router.push('/')} style={{ marginTop: '2rem' }}>На главную</button>
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
            <button className="admin-sidebar-link" onClick={() => router.push('/admin?tab=orders')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              📦 Заказы
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin?tab=products')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              🥦 Товары
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin/categories')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              📂 Категории
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin?tab=integration')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              🔄 Синхронизация
            </button>
            <button className="admin-sidebar-link active" onClick={() => router.push('/admin/settings/integration')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              ⚙️ Настройки интеграции
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin/settings/telegram')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              🤖 Настройки Telegram
            </button>
          </aside>

          <section className="admin-main">
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Настройки интеграции с внешними программами</h4>

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

            {loading ? (
              <p>Загрузка настроек...</p>
            ) : (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '40rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    id="integrationEnabled"
                    checked={integrationEnabled}
                    onChange={(e) => setIntegrationEnabled(e.target.checked)}
                  />
                  <label htmlFor="integrationEnabled" style={{ fontWeight: 700, cursor: 'pointer' }}>
                    Включить универсальную интеграцию
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Тип провайдера интеграции</label>
                  <select
                    className="form-input"
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value)}
                    disabled={!integrationEnabled}
                  >
                    <option value="manual_json">Manual JSON Upload</option>
                    <option value="csv_import">CSV/Excel Remote Fetch</option>
                    <option value="external_api">External API Integration</option>
                    <option value="webhook">Webhook Listen Mode</option>
                    <option value="custom_adapter">Custom Adapter (Webhook/Push)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Название программы (например, 1С, МойСклад, Jowi)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="МойСклад"
                    disabled={!integrationEnabled}
                  />
                </div>

                {providerType !== 'manual_json' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">API URL программы *</label>
                      <input
                        type="url"
                        className="form-input"
                        value={integrationApiUrl}
                        onChange={(e) => setIntegrationApiUrl(e.target.value)}
                        placeholder="https://api.moysklad.ru/api/remap/1.2"
                        required
                        disabled={!integrationEnabled}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Тип авторизации</label>
                      <select
                        className="form-input"
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value)}
                        disabled={!integrationEnabled}
                      >
                        <option value="none">Без авторизации (None)</option>
                        <option value="api_key">Ключ API (x-api-key Header)</option>
                        <option value="bearer_token">Токен Bearer (Authorization Header)</option>
                        <option value="basic_auth">Basic Auth (login:password)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ключ/Пароль авторизации (Secret Key / Base64 / Token)</label>
                      <input
                        type="password"
                        className="form-input"
                        value={integrationApiKey}
                        onChange={(e) => setIntegrationApiKey(e.target.value)}
                        placeholder="Ключ авторизации"
                        disabled={!integrationEnabled}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Метод запроса (HTTP Method)</label>
                      <select
                        className="form-input"
                        value={requestMethod}
                        onChange={(e) => setRequestMethod(e.target.value)}
                        disabled={!integrationEnabled}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Эндпоинт товаров (Products Endpoint)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={productsEndpoint}
                        onChange={(e) => setProductsEndpoint(e.target.value)}
                        placeholder="/entity/assortment"
                        disabled={!integrationEnabled}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Эндпоинт заказов (Orders Endpoint)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={ordersEndpoint}
                        onChange={(e) => setOrdersEndpoint(e.target.value)}
                        placeholder="/entity/customerorder"
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

                <div style={{ backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>Маппинг полей (Field Mapping)</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                    Введите названия ключей/полей, которые приходят из внешней программы, для сопоставления с базой сайта.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Штрихкод (Barcode)</label>
                      <input type="text" className="form-input" value={mapBarcode} onChange={(e) => setMapBarcode(e.target.value)} disabled={!integrationEnabled} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Код номенклатуры (nomenclatureCode)</label>
                      <input type="text" className="form-input" value={mapNomenclature} onChange={(e) => setMapNomenclature(e.target.value)} disabled={!integrationEnabled} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Название товара (Name)</label>
                      <input type="text" className="form-input" value={mapName} onChange={(e) => setMapName(e.target.value)} disabled={!integrationEnabled} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Цена товара (Price)</label>
                      <input type="text" className="form-input" value={mapPrice} onChange={(e) => setMapPrice(e.target.value)} disabled={!integrationEnabled} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Остаток (Stock)</label>
                      <input type="text" className="form-input" value={mapStock} onChange={(e) => setMapStock(e.target.value)} disabled={!integrationEnabled} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Единица изм. (Unit)</label>
                      <input type="text" className="form-input" value={mapUnit} onChange={(e) => setMapUnit(e.target.value)} disabled={!integrationEnabled} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Название категории (Category Name)</label>
                      <input type="text" className="form-input" value={mapCategory} onChange={(e) => setMapCategory(e.target.value)} disabled={!integrationEnabled} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--muted-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Правила автообновления</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="autoUpdatePrices" checked={autoUpdatePrices} onChange={(e) => setAutoUpdatePrices(e.target.checked)} disabled={!integrationEnabled} />
                    <label htmlFor="autoUpdatePrices" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Обновлять цены при синхронизации</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="autoUpdateStock" checked={autoUpdateStock} onChange={(e) => setAutoUpdateStock(e.target.checked)} disabled={!integrationEnabled} />
                    <label htmlFor="autoUpdateStock" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Обновлять остатки при синхронизации</label>
                  </div>
                </div>

                {lastSyncAt && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Последняя успешная автосинхронизация: <strong>{lastSyncAt}</strong>
                  </p>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить настройки'}
                  </button>
                  {providerType !== 'manual_json' && (
                    <button type="button" className="btn btn-secondary" onClick={handleTestConnection} style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={testing || !integrationApiUrl}>
                      {testing ? 'Проверка...' : 'Проверить соединение'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
