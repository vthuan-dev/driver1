import React, { useState, useEffect } from 'react';
import { 
  X, Phone, Lock, User, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles
} from 'lucide-react';
import { useDriver } from '../context/DriverContext';

export default function AuthModal({ isOpen, onClose, defaultMode = 'login', title, message, onSuccess }) {
  const { login, registerUserAccount } = useDriver();
  const [mode, setMode] = useState(defaultMode); // 'login' or 'register'

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode || 'login');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, defaultMode]);
  
  // Login form
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(phone.trim(), password);
      setSuccessMsg(res.message || 'Đăng nhập thành công!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess(res.data);
      }, 700);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      setError('Vui lòng nhập đầy đủ Họ tên và Số điện thoại');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await registerUserAccount({
        full_name: regName.trim(),
        phone: regPhone.trim(),
        password: regPassword
      });
      setSuccessMsg('Tạo tài khoản thành công! Đang đăng nhập...');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess(res.data);
      }, 800);
    } catch (err) {
      setError(err.message || 'Đăng ký tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '380px',
        width: '100%',
        padding: 'clamp(18px, 4.5vw, 24px) clamp(14px, 4vw, 20px)',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        maxHeight: '90dvh',
        overflowY: 'auto'
      }}>
        {/* Nút đóng X */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            touchAction: 'manipulation'
          }}
        >
          <X size={18} />
        </button>

        {/* Tiêu đề Modal */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FFEBEE',
            color: '#D32F2F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto'
          }}>
            <ShieldCheck size={26} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
            {title || (mode === 'login' ? 'ĐĂNG NHẬP LAIXEHO24H' : 'TẠO TÀI KHOẢN MỚI')}
          </h3>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: '1.4' }}>
            {message || (mode === 'login' ? 'Đăng nhập tài khoản để nhận cuốc hoặc nộp hồ sơ tài xế' : 'Tạo tài khoản trước khi nộp hồ sơ đối tác tài xế')}
          </p>
        </div>

        {/* Chuyển đổi Tab Login / Register */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F3F4F6',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'login' ? '#FFFFFF' : 'transparent',
              color: mode === 'login' ? '#D32F2F' : '#6B7280',
              fontWeight: mode === 'login' ? '700' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: mode === 'register' ? '#FFFFFF' : 'transparent',
              color: mode === 'register' ? '#D32F2F' : '#6B7280',
              fontWeight: mode === 'register' ? '700' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Tạo tài khoản
          </button>
        </div>

        {/* Thông báo lỗi / thành công */}
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            padding: '10px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            padding: '10px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM ĐĂNG NHẬP */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Số điện thoại
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '10px 12px',
                gap: '8px'
              }}>
                <Phone size={16} color="#9CA3AF" />
                <input
                  type="text"
                  placeholder="Ví dụ: 0987 654 321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Mật khẩu
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '10px 12px',
                gap: '8px'
              }}>
                <Lock size={16} color="#9CA3AF" />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(211,47,47,0.3)',
                marginBottom: '10px'
              }}
            >
              <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* FORM TẠO TÀI KHOẢN MỚI */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Họ và tên <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '10px 12px',
                gap: '8px'
              }}>
                <User size={16} color="#9CA3AF" />
                <input
                  type="text"
                  placeholder="Ví dụ: Lê Hoàng Minh"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Số điện thoại <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '10px 12px',
                gap: '8px'
              }}>
                <Phone size={16} color="#9CA3AF" />
                <input
                  type="text"
                  placeholder="Ví dụ: 0912 345 678"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Mật khẩu
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '10px 12px',
                gap: '8px'
              }}>
                <Lock size={16} color="#9CA3AF" />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(22,101,52,0.3)'
              }}
            >
              <span>{loading ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN & TIẾP TỤC'}</span>
              <CheckCircle2 size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
