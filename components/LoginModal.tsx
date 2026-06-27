'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, fetchUser } = useApp();
  
  // Auth state flags
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Password Login state
  const [loginPhone, setLoginPhone] = useState('+998');
  const [loginPassword, setLoginPassword] = useState('');

  // Password Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+998');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('saved_login_phone');
    if (saved) {
      setLoginPhone(saved);
    }
  }, []);

  if (!showLoginModal) return null;

  const resetFields = () => {
    setError('');
    setMessage('');
    setLoginPassword('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('saved_login_phone', loginPhone);
        setShowLoginModal(false);
        fetchUser();
        resetFields();
      } else {
        setError(data.error || 'Telefon raqam yoki parol noto‘g‘ri');
      }
    } catch (err) {
      setError('Tizimga kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (regPassword.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      setLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Parollar mos kelmadi');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('saved_login_phone', regPhone);
        setShowLoginModal(false);
        fetchUser();
        resetFields();
        setRegName('');
      } else {
        setError(data.error || 'Registratsiyada xatolik yuz berdi');
      }
    } catch (err) {
      setError('Registratsiyada server xatoligi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '26rem' }}>
        <button className="modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
        
        {/* Tab navigation */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border, #e2e8f0)', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); resetFields(); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'login' ? '2px solid var(--primary-color)' : 'none',
              color: activeTab === 'login' ? 'var(--primary-color)' : 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); resetFields(); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'register' ? '2px solid var(--primary-color)' : 'none',
              color: activeTab === 'register' ? 'var(--primary-color)' : 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label className="form-label">Telefon raqam</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+998 50 999 97 33"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parol</label>
              <input
                type="password"
                className="form-input"
                placeholder="Parol"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordRegister}>
            <div className="form-group">
              <label className="form-label">Ism</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ismingizni kiriting"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon raqam</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+998 50 999 97 33"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parol</label>
              <input
                type="password"
                className="form-input"
                placeholder="Parol kiritish (kamida 6 ta belgi)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parolni takrorlash</label>
              <input
                type="password"
                className="form-input"
                placeholder="Parolni qayta kiritish"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Yaratilmoqda...' : 'Account ochish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
