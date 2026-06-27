'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function AdminCategoriesPage() {
  const { user, loadingUser } = useApp();

  const isAuthorized = !!user && (
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'STORE_OWNER' ||
    user.role === 'STORE_ADMIN'
  );

  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form fields
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState('');

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e: any) {
      console.error(e);
      setError('Ошибка при загрузке категорий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser && (!user || !isAuthorized)) {
      // Access denied
    } else {
      fetchCategories();
    }
  }, [user, loadingUser]);

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
      setError('Размер файла превышает 5 МБ');
      return;
    }
    
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Разрешены только форматы JPG, PNG, WEBP');
      return;
    }

    setUploading(true);
    setError('');
    
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
        setError(data.error || 'Не удалось загрузить изображение');
      }
    } catch (err: any) {
      setError('Ошибка при отправке файла');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      name,
      slug: slug.trim() || null,
      parentId: parentId || null,
      isActive,
      image: image || null,
    };

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(editingId ? 'Категория успешно обновлена' : 'Категория успешно создана');
        setShowForm(false);
        resetForm();
        fetchCategories();
      } else {
        setError(data.error || 'Ошибка при сохранении категории');
      }
    } catch (err: any) {
      setError('Ошибка сети при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId || '');
    setIsActive(cat.isActive);
    setImage(cat.image || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (catId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Категория удалена');
        fetchCategories();
      } else {
        setError(data.error || 'Не удалось удалить категорию');
      }
    } catch (err: any) {
      setError('Ошибка сети при удалении');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setParentId('');
    setIsActive(true);
    setImage('');
    setError('');
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
            <button className="admin-sidebar-link active" onClick={() => router.push('/admin/categories')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              📂 Категории
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin?tab=integration')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              🔄 Синхронизация
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin/settings/integration')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              ⚙️ Настройки интеграции
            </button>
            <button className="admin-sidebar-link" onClick={() => router.push('/admin/settings/telegram')} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              🤖 Настройки Telegram
            </button>
          </aside>

          <section className="admin-main">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Управление категориями</h4>
              {!showForm && (
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} style={{ width: 'auto' }}>
                  + Добавить категорию
                </button>
              )}
            </div>

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

            {showForm ? (
              <div style={{ backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
                  {editingId ? 'Редактировать категорию' : 'Создать новую категорию'}
                </h5>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '35rem' }}>
                  <div className="form-group">
                    <label className="form-label">Название категории *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Овощи и Фрукты"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Slug (необязательно, сгенерируется из названия)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="vegetables"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Родительская категория (необязательно)</label>
                    <select
                      className="form-input"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                    >
                      <option value="">-- Без родителя (основная) --</option>
                      {categories
                        .filter((c) => c.id !== editingId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Drag and Drop Image Upload */}
                  <div className="form-group">
                    <label className="form-label">Изображение (эмодзи или картинка)</label>
                    
                    {image ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--muted-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div style={{ width: '4rem', height: '4rem', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                          {image.startsWith('http') || image.startsWith('/') ? (
                            <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            image
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{image}</span>
                          <button type="button" onClick={() => setImage('')} style={{ display: 'block', color: 'var(--danger)', border: 'none', background: 'none', padding: 0, marginTop: '0.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                            Удалить картинку
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
                          id="category-file-input"
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => document.getElementById('category-file-input')?.click()}
                          style={{ width: 'auto', marginTop: '1rem', padding: '0.4rem 1.5rem', fontSize: '0.85rem' }}
                          disabled={uploading}
                        >
                          {uploading ? 'Загрузка...' : 'Выбрать файл'}
                        </button>
                        
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Или введите символ/эмодзи:</span>
                          <input
                            type="text"
                            className="form-input"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="🍎"
                            style={{ maxWidth: '5rem', textAlign: 'center' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <label htmlFor="isActive" style={{ fontWeight: 600, cursor: 'pointer' }}>
                      Активная категория (отображать на сайте)
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }} disabled={saving}>
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }} style={{ width: 'auto', padding: '0.6rem 2rem' }}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {loading ? (
              <p>Загрузка категорий...</p>
            ) : categories.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Категории не найдены.</p>
            ) : (
              <div className="table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Фото</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Название</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Slug</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Родитель</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Статус</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.25rem', backgroundColor: 'var(--muted-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                            {cat.image ? (
                              cat.image.startsWith('http') || cat.image.startsWith('/') ? (
                                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                cat.image
                              )
                            ) : (
                              '📁'
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{cat.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>{cat.slug}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {cat.parent ? (
                            <span style={{ backgroundColor: 'var(--muted-light)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                              {cat.parent.name}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Нет</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`sync-status-indicator ${cat.isActive ? 'success' : 'error'}`}>
                            {cat.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => handleEdit(cat)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}>
                              ✏️
                            </button>
                            <button className="btn btn-secondary" onClick={() => handleDelete(cat.id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', width: 'auto' }}>
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
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
