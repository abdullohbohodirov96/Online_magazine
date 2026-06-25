'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, fetchUser } = useApp();
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!showLoginModal) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setMessage('Код отправлен. Проверьте консоль сервера!');
      } else {
        setError(data.error || 'Не удалось отправить код');
      }
    } catch (err) {
      setError('Ошибка при отправке запроса');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowLoginModal(false);
        fetchUser();
        setStep(1);
        setPhone('+998');
        setCode('');
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setError('Ошибка при верификации кода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Вход или Регистрация
        </h3>
        
        {error && (
          <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ color: 'var(--primary-hover)', backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Номер телефона</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+998_________"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
              Мы отправим вам 4-значный SMS-код для входа.
            </p>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Код из SMS</label>
              <input
                type="text"
                className="form-input"
                placeholder="____"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
              Введите код, который отобразился в логах терминала.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Назад
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Проверка...' : 'Войти'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
