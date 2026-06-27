'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/context/AppContext';
import MiniAppLayout from '@/components/MiniAppLayout';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <MiniAppLayout title="Категории">
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Все категории товаров</h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          Загрузка категорий...
        </div>
      ) : categories.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: 'var(--muted)', textAlign: 'center' }}>Категорий пока нет.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                router.push(`/miniapp?categoryId=${cat.id}`);
              }}
              style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                padding: '1rem 0.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--muted-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.8rem' }}>🥦</span>
                )}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cat.name}</span>
            </div>
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
