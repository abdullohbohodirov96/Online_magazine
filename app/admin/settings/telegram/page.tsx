'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function AdminTelegramSettingsPage() {
  const { user, loadingUser } = useApp();

  const isAuthorized = !!user && (
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'STORE_OWNER' ||
    user.role === 'STORE_ADMIN'
  );

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Telegram settings fields
  const [botToken, setBotToken] = useState('');
  const [adminChatId, setAdminChatId] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [botUsername, setBotUsername] = useState('');
  const [miniAppUrl, setMiniAppUrl] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/telegram/settings');
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        if (s) {
          setBotToken(s.botToken || '');
          setAdminChatId(s.adminChatId || '');
          setNotificationsEnabled(s.notificationsEnabled);
          setBotUsername(s.botUsername || '');
          setMiniAppUrl(s.miniAppUrl || '');
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
    if (!loadingUser && (!user || !isAuthorized)) {
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
      botToken,
      adminChatId,
      notificationsEnabled,
      botUsername,
      miniAppUrl,
    };

    try {
      const res = await fetch('/api/admin/telegram/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage('Настройки Telegram успешно сохранены.');
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

  const handleTestMessage = async () => {
    setTesting(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/telegram/test-message', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Тестовое сообщение успешно отправлено в Telegram!');
      } else {
        setError(data.error || 'Не удалось отправить тестовое сообщение');
      }
    } catch (err: any) {
      setError('Ошибка сети при отправке сообщения');
    } finally {
      setTesting(false);
    }
  };

  const handleSetWebhook = async () => {
    setSettingWebhook(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/telegram/set-webhook', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Вебхук бота успешно настроен в Telegram!');
      } else {
        setError(data.error || 'Не удалось настроить вебхук');
      }
    } catch (err: any) {
      setError('Ошибка сети при установке вебхука');
    } finally {
      setSettingWebhook(false);
    }
  };

  if (loadingUser) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>;

  if (!user || !isAuthorized) {
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
            <button className="admin-sidebar-link" onClick={() => router.push('/admin/settings/integration')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              ⚙️ Настройки интеграции
            </button>
            <button className="admin-sidebar-link active" onClick={() => router.push('/admin/settings/telegram')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              🤖 Настройки Telegram
            </button>
          </aside>

          <section className="admin-main">
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Настройки интеграции с Telegram-ботом</h4>

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
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                  <label htmlFor="notificationsEnabled" style={{ fontWeight: 700, cursor: 'pointer' }}>
                    Включить уведомления о заказах в Telegram
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Токен Telegram-бота (Bot Token)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ID чата администратора (Chat ID / Group ID)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={adminChatId}
                    onChange={(e) => setAdminChatId(e.target.value)}
                    placeholder="987654321 или -100123456789"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Юзернейм бота (без @)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    placeholder="bozor_market_bot"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Mini App (NEXT_PUBLIC_APP_URL)</label>
                  <input
                    type="url"
                    className="form-input"
                    value={miniAppUrl}
                    onChange={(e) => setMiniAppUrl(e.target.value)}
                    placeholder="https://online-magazine-phi.vercel.app"
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить настройки'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleTestMessage} style={{ width: 'auto', padding: '0.6rem 2.5rem' }} disabled={testing || !adminChatId}>
                    {testing ? 'Отправка...' : 'Проверить бота'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleSetWebhook} style={{ width: 'auto', padding: '0.6rem 2.5rem' }} disabled={settingWebhook || !botToken}>
                    {settingWebhook ? 'Настройка...' : 'Установить вебхук'}
                  </button>
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
