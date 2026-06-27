'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, fetchUser } = useApp();
  
  // Auth state flags
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [useOtp, setUseOtp] = useState(false);
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

  // Legacy OTP state
  const [otpPhone, setOtpPhone] = useState('+998');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(1);

  if (!showLoginModal) return null;

  const resetFields = () => {
    setError('');
    setMessage('');
    setLoginPassword('');
    setRegPassword('');
    setRegConfirmPassword('');
    setOtpCode('');
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep(2);
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
        body: JSON.stringify({ phone: otpPhone, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowLoginModal(false);
        fetchUser();
        setOtpStep(1);
        setOtpPhone('+998');
        setOtpCode('');
        resetFields();
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '26rem' }}>
        <button className="modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
        
        {/* Toggle between OTP and Password Tab views */}
        {!useOtp ? (
          <>
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
                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => { setUseOtp(true); resetFields(); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    SMS orqali kirish
                  </button>
                </div>
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
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              SMS OTP kirish
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

            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label">Номер телефона</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+998_________"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                  Мы отправим вам 4-значный SMS-код для входа.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Отправка...' : 'Получить код'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUseOtp(false); resetFields(); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem' }}
                  >
                    Parol orqali kirish
                  </button>
                </div>
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
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
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
                    onClick={() => setOtpStep(1)}
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
          </>
        )}
      </div>
    </div>
  );
}
