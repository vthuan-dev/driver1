import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminLoginScreen({ onLoginSuccess, onBackToHome }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tài khoản hoặc số điện thoại admin');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu quản trị');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await api.login({
        phone: username.trim(),
        password: password
      });

      if (!res || !res.data) {
        throw new Error('Đăng nhập không thành công, vui lòng thử lại');
      }

      const userData = res.data;

      // Phân quyền: Chỉ cho phép tài khoản có role === 'admin'
      if (userData.role !== 'admin') {
        setErrorMsg('Từ chối truy cập: Tài khoản này không có quyền Quản trị viên (Admin)!');
        return;
      }

      // Lưu session admin vào localStorage
      localStorage.setItem('admin_user', JSON.stringify(userData));

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.message || 'Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: '#0F172A',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(220, 38, 38, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(220, 38, 38, 0.1) 0px, transparent 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 12px',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#1E293B',
        borderRadius: '20px',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        overflow: 'hidden'
      }}>
        {/* Header card */}
        <div style={{
          padding: 'clamp(24px, 6vw, 36px) clamp(16px, 5vw, 32px) clamp(18px, 4vw, 24px) clamp(16px, 5vw, 32px)',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            backgroundColor: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5)'
          }}>
            <ShieldCheck size={32} color="#FFFFFF" strokeWidth={2.2} />
          </div>

          <h2 style={{
            color: '#FFFFFF',
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: '800',
            letterSpacing: '-0.3px',
            marginBottom: '6px'
          }}>
            HỆ THỐNG QUẢN TRỊ
          </h2>
          <p style={{
            color: '#94A3B8',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            LAIXEHO24H ADMIN CONTROL CENTER
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: 'clamp(18px, 5vw, 32px)' }}>
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#FCA5A5',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Input Tài khoản */}
            <div>
              <label style={{
                display: 'block',
                color: '#CBD5E1',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Tài khoản hoặc Số điện thoại
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập 'admin' hoặc số điện thoại..."
                  autoComplete="username"
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '13px 14px 13px 44px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#DC2626'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            {/* Input Mật khẩu */}
            <div>
              <label style={{
                display: 'block',
                color: '#CBD5E1',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Mật khẩu quản trị
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị..."
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '13px 44px 13px 44px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#DC2626'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                </>
              )}
            </button>
          </form>

          {/* Quay lại */}
          {onBackToHome && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={onBackToHome}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Quay lại trang chủ ứng dụng</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
