import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import AuthModal from '../components/AuthModal';

const DriverContext = createContext(null);

export function DriverProvider({ children }) {
  // Tự động gỡ bỏ session cũ từ phiên demo trước đó để người dùng bắt đầu từ trạng thái Khách vãng lai
  if (!localStorage.getItem('laixeho24h_session_purged_v1')) {
    localStorage.removeItem('laixeho24h_driver_id');
    localStorage.removeItem('laixeho24h_user');
    sessionStorage.clear();
    localStorage.setItem('laixeho24h_session_purged_v1', 'true');
  }

  const [driverId, setDriverIdState] = useState(() => {
    const saved = localStorage.getItem('laixeho24h_driver_id');
    return saved ? Number(saved) : null; // Mặc định là NULL (Khách vãng lai, chưa đăng nhập!)
  });

  const [driver, setDriver] = useState(null);
  const [loadingDriver, setLoadingDriver] = useState(() => {
    return Boolean(localStorage.getItem('laixeho24h_driver_id'));
  });
  const [tripCounts, setTripCounts] = useState({ new_count: 0, in_progress_count: 0, history_count: 0 });
  const [systemConfig, setSystemConfig] = useState(null);

  // Global Auth Modal State
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    defaultMode: 'login',
    title: '',
    message: '',
    onSuccess: null
  });

  const openAuthModal = ({ mode = 'login', title = '', message = '', onSuccess = null } = {}) => {
    setAuthModal({
      isOpen: true,
      defaultMode: mode,
      title,
      message,
      onSuccess
    });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  const setDriverId = (id) => {
    setDriverIdState(id);
    if (id) {
      localStorage.setItem('laixeho24h_driver_id', id);
    } else {
      localStorage.removeItem('laixeho24h_driver_id');
      localStorage.removeItem('laixeho24h_user');
    }
  };

  const refreshDriver = useCallback(async (id = driverId) => {
    if (!id) {
      setDriver(null);
      setLoadingDriver(false);
      return;
    }
    try {
      setLoadingDriver(true);
      const res = await api.getDriverProfile(id);
      setDriver(res.data);
    } catch (err) {
      console.error('Lỗi nạp thông tin tài xế từ MySQL:', err);
      // Nếu không tìm thấy, xóa session
      setDriver(null);
    } finally {
      setLoadingDriver(false);
    }
  }, [driverId]);

  const updateDriverState = useCallback((partial) => {
    setDriver(prev => prev ? ({ ...prev, ...partial }) : prev);
  }, []);

  const refreshTripCounts = useCallback(async (id = driverId) => {
    try {
      const res = await api.getTripCounts(id);
      setTripCounts(res.data || { new_count: 0, in_progress_count: 0, history_count: 0 });
    } catch (err) {
      console.error('Lỗi nạp số lượng cuốc xe:', err);
    }
  }, [driverId]);

  const loadSystemConfig = useCallback(async () => {
    try {
      const res = await api.getSystemConfig();
      setSystemConfig(res.data);
    } catch (err) {
      console.error('Lỗi nạp cấu hình hệ thống:', err);
    }
  }, []);

  // Đăng nhập
  const login = async (phone, password) => {
    const res = await api.login({ phone, password });
    if (res.data?.id) {
      setDriverId(res.data.id);
      setDriver(res.data);
      await Promise.all([
        refreshDriver(res.data.id),
        refreshTripCounts(res.data.id)
      ]);
    }
    return res;
  };

  // Đăng ký tài khoản người dùng
  const registerUserAccount = async (userData) => {
    const res = await api.registerUser(userData);
    if (res.data?.id) {
      setDriverId(res.data.id);
      setDriver(res.data);
      await Promise.all([
        refreshDriver(res.data.id),
        refreshTripCounts(res.data.id)
      ]);
    }
    return res;
  };

  // Đăng xuất
  const logout = () => {
    setDriverId(null);
    setDriver(null);
    localStorage.removeItem('laixeho24h_driver_id');
    localStorage.removeItem('laixeho24h_user');
    sessionStorage.clear();
  };

  useEffect(() => {
    if (driverId) {
      refreshDriver(driverId);
      refreshTripCounts(driverId);
    } else {
      setDriver(null);
      setLoadingDriver(false);
      refreshTripCounts(null);
    }
    loadSystemConfig();
  }, [driverId, refreshDriver, refreshTripCounts, loadSystemConfig]);

  // Phân quyền & trạng thái session
  const isLoggedIn = Boolean(driver && driver.id);
  const isDriver = Boolean(driver && driver.role === 'driver');
  const isUser = Boolean(driver && driver.role === 'user');
  const isPending = Boolean(driver && driver.role === 'driver' && driver.status === 'pending');
  const isActive = Boolean(driver && driver.role === 'driver' && driver.status === 'active');
  const isBlocked = Boolean(driver && driver.status === 'blocked');
  const canAcceptTrips = Boolean(isLoggedIn && isDriver && isActive && driver.is_online);

  return (
    <DriverContext.Provider value={{
      driverId,
      setDriverId,
      driver,
      loadingDriver,
      refreshDriver,
      updateDriverState,
      tripCounts,
      refreshTripCounts,
      systemConfig,
      // Authentication & Session
      isLoggedIn,
      isDriver,
      isPending,
      isActive,
      isBlocked,
      canAcceptTrips,
      login,
      logout,
      registerUserAccount,
      // Auth Modal triggers
      openAuthModal,
      closeAuthModal
    }}>
      {children}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        defaultMode={authModal.defaultMode}
        title={authModal.title}
        message={authModal.message}
        onSuccess={authModal.onSuccess}
      />
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within DriverProvider');
  }
  return context;
}
