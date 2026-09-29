import React, { useState, useEffect } from 'react';
import { 
  Car, User, UserPlus, Shield, Bell, ArrowLeft, Settings, 
  ChevronRight, CheckCircle2, AlertCircle 
} from 'lucide-react';
import RegisterScreen from '../pages/driver/RegisterScreen';
import ProfileScreen from '../pages/driver/ProfileScreen';
import JobFeedScreen from '../pages/driver/JobFeedScreen';
import { useDriver } from '../context/DriverContext';

export default function MobileAppLayout({ onSwitchToAdmin }) {
  const { driverId, setDriverId, tripCounts, isLoggedIn, openAuthModal } = useDriver();

  const getScreenFromUrl = () => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/register')) return 'register';
    if (pathname.includes('/jobs')) return 'jobs';

    // Hash fallback
    const hash = window.location.hash.replace('#/', '').toLowerCase();
    if (['register', 'profile', 'jobs'].includes(hash)) return hash;
    return 'jobs'; // Mặc định mở Màn 3 Nhận cuốc xe
  };

  const [currentScreen, setCurrentScreen] = useState(getScreenFromUrl);

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    const targetPath = screen === 'jobs' ? '/jobs' : `/${screen}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentScreen(getScreenFromUrl());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#E5E7EB', // Nền desktop xám nhẹ làm nổi bật app mobile ở giữa
      display: 'flex',
      justifyContent: 'center',
      position: 'relative',
      fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif"
    }}>
      {/* 📱 KHUNG ỨNG DỤNG MOBILE FIRST CHUẨN (Max-width 440px trên Desktop, 100% trên Điện thoại) */}
      <div 
        className="mobile-app-frame"
        style={{
          width: '100%',
          maxWidth: '440px',
          minHeight: '100dvh',
          backgroundColor: '#F5F6F8',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.12)',
          overflowX: 'hidden',
          paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))' // Chừa chỗ cho thanh Bottom Navigation + Safe Area
        }}
      >

        {/* NỘI DUNG MÀN HÌNH CHÍNH (ĐƠN MÀN CHUYỂN ĐỔI THEO LUỒNG) */}
        <div style={{ flex: 1, width: '100%' }}>
          {currentScreen === 'register' && (
            <RegisterScreen 
              onNavigate={navigateTo}
              onRegistrationSuccess={(newDriver) => {
                if (newDriver?.id) setDriverId(newDriver.id);
                navigateTo('profile');
              }}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen 
              driverId={driverId}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'jobs' && (
            <JobFeedScreen 
              driverId={driverId}
              onNavigate={navigateTo}
            />
          )}
        </div>

        {/* 🧭 THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHUẨN APP NATIVE (BOTTOM NAVIGATION BAR) */}
        <nav 
          className="mobile-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '440px',
            height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 999,
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Tab 1: Nhận cuốc (Màn 3) */}
          <button
            onClick={() => navigateTo('jobs')}
            style={{
              flex: 1,
              height: '100%',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: currentScreen === 'jobs' ? '#D32F2F' : '#6B7280',
              position: 'relative',
              touchAction: 'manipulation'
            }}
          >
            <div style={{ position: 'relative' }}>
              <Car size={22} strokeWidth={currentScreen === 'jobs' ? 2.5 : 2} />
              {tripCounts.new_count > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  backgroundColor: '#D32F2F',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: '800',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  lineHeight: 1.2
                }}>
                  {tripCounts.new_count}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'jobs' ? '800' : '600' }}>
              Nhận cuốc
            </span>
          </button>

          {/* Tab 2: Hồ sơ tài xế (Màn 2) */}
          <button
            onClick={() => {
              navigateTo('profile');
              if (!isLoggedIn) {
                openAuthModal({
                  mode: 'register',
                  title: 'ĐĂNG KÝ TÀI KHOẢN',
                  message: 'Vui lòng đăng ký tài khoản hoặc đăng nhập để quản lý thông tin tài xế của bạn!'
                });
              }
            }}
            style={{
              flex: 1,
              height: '100%',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: currentScreen === 'profile' ? '#D32F2F' : '#6B7280',
              touchAction: 'manipulation'
            }}
          >
            <User size={22} strokeWidth={currentScreen === 'profile' ? 2.5 : 2} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'profile' ? '800' : '600' }}>
              Thông tin
            </span>
          </button>

          {/* Tab 3: Đăng ký thành viên (Màn 1) */}
          <button
            onClick={() => navigateTo('register')}
            style={{
              flex: 1,
              height: '100%',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: currentScreen === 'register' ? '#D32F2F' : '#6B7280',
              touchAction: 'manipulation'
            }}
          >
            <UserPlus size={22} strokeWidth={currentScreen === 'register' ? 2.5 : 2} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'register' ? '800' : '600' }}>
              Đăng ký
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
