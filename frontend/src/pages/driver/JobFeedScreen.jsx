import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Bell, Wallet, Car, Star, MapPin, Navigation, 
  Clock, ChevronRight, ChevronDown, CheckCircle2, AlertCircle, RefreshCw, X, Search, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { useDriver } from '../../context/DriverContext';
import { VIETNAM_PROVINCES, POPULAR_PROVINCES, checkTripMatchesProvince } from '../../utils/provinceUtils';

export default function JobFeedScreen({ driverId: propDriverId, onNavigate }) {
  const { 
    driver, 
    refreshDriver, 
    tripCounts, 
    refreshTripCounts, 
    driverId: contextDriverId,
    isLoggedIn,
    isDriver,
    isPending,
    isActive,
    isBlocked,
    canAcceptTrips,
    openAuthModal 
  } = useDriver();

  const driverId = propDriverId || contextDriverId || null;
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'in_progress', 'history'
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  // 📍 Bộ lọc Tỉnh/Thành phố bạn đang ở (64 Tỉnh Thành)
  const [selectedProvince, setSelectedProvince] = useState(() => {
    try {
      return localStorage.getItem('selected_driver_province') || 'all';
    } catch {
      return 'all';
    }
  });
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');

  const handleSelectProvince = (prov) => {
    setSelectedProvince(prov);
    try {
      localStorage.setItem('selected_driver_province', prov);
    } catch (e) {
      console.warn(e);
    }
    setShowProvinceModal(false);
    setProvinceSearch('');
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (!selectedProvince || selectedProvince === 'all') return true;
      return checkTripMatchesProvince(t, selectedProvince);
    });
  }, [trips, selectedProvince]);

  const filteredProvincesList = useMemo(() => {
    if (!provinceSearch.trim()) return VIETNAM_PROVINCES;
    const q = provinceSearch.toLowerCase().trim();
    return VIETNAM_PROVINCES.filter(p => p.toLowerCase().includes(q));
  }, [provinceSearch]);

  const provinceTripCounts = useMemo(() => {
    const counts = {};
    for (const t of trips) {
      for (const p of VIETNAM_PROVINCES) {
        if (checkTripMatchesProvince(t, p)) {
          counts[p] = (counts[p] || 0) + 1;
        }
      }
    }
    return counts;
  }, [trips]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const tripsRes = await api.getTripsFeed(activeTab, driverId);
      setTrips(tripsRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchTrips(),
      driverId ? refreshDriver(driverId) : Promise.resolve(),
      refreshTripCounts(driverId)
    ]);
  };

  useEffect(() => {
    fetchTrips();
    if (driverId) {
      refreshDriver(driverId);
    }
  }, [activeTab, driverId]);

  const handleAcceptTrip = async (trip) => {
    // 1. Phải đăng nhập
    if (!isLoggedIn) {
      openAuthModal({
        mode: 'login',
        title: 'Đăng nhập để nhận cuốc',
        message: 'Bạn cần đăng nhập tài khoản Đối tác Tài xế trước khi nhận khách!'
      });
      return;
    }

    // 2. Kiểm tra vai trò
    if (driver?.role === 'user') {
      if (window.confirm('Tài khoản của bạn hiện là Người dùng thông thường. Bạn có muốn sang trang Đăng ký Đối tác Tài xế (phí kích hoạt 300.000đ) để bắt đầu nhận cuốc?')) {
        if (onNavigate) onNavigate('register');
      }
      return;
    }

    // 3. Kiểm tra trạng thái phê duyệt
    if (driver?.status === 'pending') {
      alert('Hồ sơ tài xế của bạn đang chờ Admin xác nhận khoản phí 300.000đ. Vui lòng chờ tài khoản được kích hoạt để nhận cuốc!');
      return;
    }

    if (driver?.status === 'blocked') {
      alert('Tài khoản tài xế của bạn đang bị khóa bởi Quản trị viên. Vui lòng liên hệ hotline hỗ trợ!');
      return;
    }

    // 4. Kiểm tra trạng thái Bật / Tắt nhận cuốc
    if (!driver?.is_online) {
      if (window.confirm('Bạn đang ở chế độ Tắt nhận cuốc. Bạn có muốn Bật nhận cuốc xe ngay bây giờ để tiếp nhận cuốc này?')) {
        try {
          await api.toggleDriverOnline(driver.id);
          await refreshDriver(driver.id);
        } catch (e) {
          alert(e.message);
          return;
        }
      } else {
        return;
      }
    }

    try {
      const res = await api.acceptTrip(trip.id, driver.id);
      setActionMsg(res.message);
      
      // Tự động làm mới danh sách và chỉ số tức thì từ MySQL
      await Promise.all([
        fetchTrips(),
        refreshDriver(driver.id),
        refreshTripCounts(driver.id)
      ]);

      setTimeout(() => {
        setActionMsg('');
      }, 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await api.completeTrip(tripId);
      setActionMsg('Đã hoàn thành chuyến xe!');
      
      await Promise.all([
        fetchTrips(),
        refreshDriver(driverId),
        refreshTripCounts(driverId)
      ]);

      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F6F8', minHeight: '100%', paddingBottom: '30px' }}>
      
      {/* 🔴 HEADER ĐỎ CHUẨN MOCKUP */}
      <div style={{
        background: 'linear-gradient(180deg, #990000 0%, #B71C1C 40%, #D32F2F 100%)',
        color: '#FFFFFF',
        padding: '16px 18px 24px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
      }}>
        <button
          onClick={() => onNavigate && onNavigate('profile')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ArrowLeft size={22} />
        </button>

        <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
          Nhận cuốc xe
        </h1>

        {/* Chuông Thông Báo */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={fetchData}>
          <Bell size={20} color="#FFFFFF" />
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: '#FFEBEE',
            border: '1.5px solid #D32F2F',
            borderRadius: '50%'
          }} />
        </div>
      </div>

      <div style={{ padding: '16px 14px', marginTop: '-12px' }}>
        
        {/* 📍 Ô CHỌN TỈNH/THÀNH BẠN ĐANG Ở (THEO MOCKUP SCREENSHOT) */}
        <div 
          onClick={() => setShowProvinceModal(true)}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '12px 14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            border: selectedProvince !== 'all' ? '1.5px solid #D32F2F' : '1px solid #E5E7EB',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            {/* Red Circle MapPin Icon */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={22} color="#D32F2F" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>
                Tỉnh/thành bạn đang ở
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: selectedProvince === 'all' ? '#4B5563' : '#D32F2F',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '1px'
              }}>
                {selectedProvince === 'all' ? (
                  <>
                    <Search size={14} color="#9CA3AF" />
                    <span>Chọn tỉnh/thành phố</span>
                  </>
                ) : (
                  <>
                    <span>{selectedProvince}</span>
                    <span style={{
                      backgroundColor: '#FEE2E2',
                      color: '#D32F2F',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '8px'
                    }}>
                      {filteredTrips.length} cuốc
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {selectedProvince !== 'all' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectProvince('all');
                }}
                title="Bỏ lọc tỉnh"
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            )}
            <ChevronDown size={20} color="#6B7280" />
          </div>
        </div>

        {/* 💼 KHỐI THU NHẬP & CHỈ SỐ HÔM NAY (HIỂN THỊ THEO QUYỀN HẠN) */}
        {!isLoggedIn ? (
          <div style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: '20px',
            padding: '16px 18px',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800' }}>Khách vãng lai</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                Đăng nhập tài xế để nhận cuốc và tích lũy thu nhập
              </div>
            </div>
            <button
              onClick={() => openAuthModal({ mode: 'login' })}
              style={{
                backgroundColor: '#D32F2F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Đăng nhập
            </button>
          </div>
        ) : driver?.role === 'user' ? (
          <div style={{
            background: 'linear-gradient(135deg, #0369A1 0%, #075985 100%)',
            borderRadius: '20px',
            padding: '16px 18px',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(7,89,133,0.3)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800' }}>Tài khoản: {driver.full_name}</div>
              <div style={{ fontSize: '12px', color: '#BAE6FD', marginTop: '2px' }}>
                Nâng cấp lên Đối tác Tài xế để bắt đầu nhận cuốc
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('register')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#0369A1',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              ĐK Tài xế (300k)
            </button>
          </div>
        ) : driver?.status === 'pending' ? (
          <div style={{
            background: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
            borderRadius: '20px',
            padding: '16px 18px',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(180,83,9,0.3)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800' }}>Hồ sơ đang chờ duyệt</div>
              <div style={{ fontSize: '12px', color: '#FDE68A', marginTop: '2px' }}>
                Admin đang xác nhận giao dịch 300.000đ của bạn
              </div>
            </div>
            <button
              onClick={() => refreshDriver(driver.id)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '10px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Làm mới
            </button>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #B71C1C 0%, #8E0000 100%)',
            borderRadius: '20px',
            padding: '16px 12px',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(142,0,0,0.3)',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 0.85fr) minmax(0, 0.85fr)',
              alignItems: 'center',
              gap: '6px'
            }}>
              {/* Cột 1: Thu nhập hôm nay */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Wallet size={18} color="#FFFFFF" />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: 'clamp(9.5px, 2.6vw, 11px)', color: 'rgba(255,255,255,0.85)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    Thu nhập hôm nay
                  </div>
                  <div style={{ 
                    fontSize: 'clamp(13.5px, 3.8vw, 16px)', 
                    fontWeight: '800', 
                    letterSpacing: '-0.3px', 
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {Number(driver?.daily_income || 0).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>

              {/* Cột 2: Cuốc xe hôm nay */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderLeft: '1px solid rgba(255,255,255,0.15)',
                borderRight: '1px solid rgba(255,255,255,0.15)',
                padding: '0 2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Car size={15} color="#FFFFFF" />
                  <span style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: '800' }}>
                    {driver?.daily_trips || 0}
                  </span>
                </div>
                <div style={{ fontSize: 'clamp(9.5px, 2.6vw, 11px)', color: 'rgba(255,255,255,0.85)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  Cuốc xe
                </div>
              </div>

              {/* Cột 3: Đánh giá */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0 2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={15} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: '800' }}>
                    {Number(driver?.rating || 5.0).toFixed(1)}
                  </span>
                </div>
                <div style={{ fontSize: 'clamp(9.5px, 2.6vw, 11px)', color: 'rgba(255,255,255,0.85)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  Đánh giá
                </div>
              </div>
            </div>
          </div>
        )}

        {/* THÔNG BÁO NHẬN CUỐC THÀNH CÔNG */}
        {actionMsg && (
          <div style={{
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            animation: 'fadeIn 0.2s ease',
            border: '1px solid #86EFAC'
          }}>
            <CheckCircle2 size={18} />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* 🗂️ THANH TABS ĐIỀU HƯỚNG */}
        <div style={{
          display: 'flex',
          backgroundColor: '#FFFFFF',
          padding: '4px',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '16px',
          gap: '2px'
        }}>
          {/* Tab 1: Cuốc xe mới */}
          <button
            onClick={() => setActiveTab('new')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'new' ? '#D32F2F' : 'transparent',
              color: activeTab === 'new' ? '#FFFFFF' : '#6B7280',
              border: 'none',
              borderRadius: '12px',
              padding: '9px 4px',
              fontSize: 'clamp(10.5px, 2.8vw, 12.5px)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
              touchAction: 'manipulation',
              whiteSpace: 'nowrap'
            }}
          >
            <Car size={14} />
            <span>Cuốc mới ({selectedProvince !== 'all' && activeTab === 'new' ? filteredTrips.length : (tripCounts?.new_count ?? 0)})</span>
          </button>

          {/* Tab 2: Đang thực hiện */}
          <button
            onClick={() => setActiveTab('in_progress')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'in_progress' ? '#D32F2F' : 'transparent',
              color: activeTab === 'in_progress' ? '#FFFFFF' : '#6B7280',
              border: 'none',
              borderRadius: '12px',
              padding: '9px 4px',
              fontSize: 'clamp(10.5px, 2.8vw, 12.5px)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
              touchAction: 'manipulation',
              whiteSpace: 'nowrap'
            }}
          >
            <Navigation size={14} />
            <span>Đang chạy ({tripCounts?.in_progress_count ?? 0})</span>
          </button>

          {/* Tab 3: Lịch sử */}
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'history' ? '#D32F2F' : 'transparent',
              color: activeTab === 'history' ? '#FFFFFF' : '#6B7280',
              border: 'none',
              borderRadius: '12px',
              padding: '9px 4px',
              fontSize: 'clamp(10.5px, 2.8vw, 12.5px)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
              touchAction: 'manipulation',
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={14} />
            <span>Lịch sử ({tripCounts?.history_count ?? 0})</span>
          </button>
        </div>

        {/* 🏷️ BANNER THÔNG BÁO TỈNH ĐANG CHỌN */}
        {selectedProvince !== 'all' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '8px 12px',
            marginBottom: '14px',
            fontSize: '12px',
            color: '#991B1B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <MapPin size={15} color="#DC2626" style={{ flexShrink: 0 }} />
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                Đang hiển thị cuốc tại: <strong>{selectedProvince}</strong> ({filteredTrips.length} cuốc)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectProvince('all')}
              style={{
                background: 'none',
                border: 'none',
                color: '#DC2626',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '11.5px',
                flexShrink: 0,
                textDecoration: 'underline'
              }}
            >
              Xem tất cả
            </button>
          </div>
        )}

        {/* 🚗 JOB FEED DANH SÁCH CUỐC XE */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#D32F2F' }} />
            <div>Đang cập nhật cuốc xe mới nhất...</div>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '36px 20px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <Car size={36} color="#D1D5DB" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#374151' }}>
              {selectedProvince !== 'all' 
                ? `Chưa có cuốc xe nào tại ${selectedProvince}` 
                : 'Hiện chưa có cuốc xe nào trong mục này'}
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px', maxWidth: '320px', margin: '6px auto 14px auto' }}>
              {selectedProvince !== 'all'
                ? `Bạn có thể bấm "Xem tất cả khu vực" (${trips.length} cuốc) hoặc sang trang Admin để tạo thêm cuốc xe ảo cho ${selectedProvince}!`
                : 'Vào trang Admin để tạo thêm cuốc xe hoặc kích hoạt chế độ tự động sinh cuốc ảo!'}
            </div>
            {selectedProvince !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectProvince('all')}
                style={{
                  backgroundColor: '#D32F2F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '9px 18px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(211,47,47,0.25)'
                }}
              >
                Xem tất cả khu vực ({trips.length} cuốc)
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredTrips.map((trip) => {
              const tags = Array.isArray(trip.service_tags) 
                ? trip.service_tags 
                : JSON.parse(trip.service_tags || '["Lái xe hộ"]');

              return (
                <div
                  key={trip.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    position: 'relative',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  {/* Top Bar: Badge Mới & Thời gian */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        backgroundColor: '#D32F2F',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {trip.badge || 'Mới'}
                      </span>
                      {trip.is_virtual && (
                        <span style={{
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Cuốc HOT
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500' }}>
                      {trip.time_posted || '2 phút trước'}
                    </span>
                  </div>

                  {/* Lộ Trình: Điểm đón -> Điểm trả */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    
                    {/* Cột Lộ trình */}
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      {/* Điểm đón */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ color: '#D32F2F', marginTop: '2px' }}>
                          <MapPin size={16} fill="#D32F2F" color="#FFFFFF" />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>Đón tại</div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                            {trip.pickup_location}
                          </div>
                        </div>
                      </div>

                      {/* Điểm trả */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ color: '#111827', marginTop: '2px' }}>
                          <MapPin size={16} fill="#111827" color="#FFFFFF" />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>Trả tại</div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                            {trip.dropoff_location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cột Giá Cước & Khoảng Cách */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>◆ {trip.distance_km} km</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                        ~ {trip.estimated_minutes} phút
                      </div>

                      {/* GIÁ TIỀN ĐỎ NỔI BẬT CHUẨN MOCKUP */}
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        color: '#D32F2F',
                        letterSpacing: '-0.3px',
                        marginTop: '8px'
                      }}>
                        {Number(trip.price).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  {/* Tags dịch vụ */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: '#FFF1F2',
                          color: '#E11D48',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Car size={11} /> {tag}
                      </span>
                    ))}
                  </div>

                  {/* Nút Hành Động */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setSelectedJob(trip)}
                      style={{
                        flex: 1,
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Xem chi tiết
                    </button>

                    {activeTab === 'new' && (
                      <button
                        onClick={() => handleAcceptTrip(trip)}
                        style={{
                          flex: 1.3,
                          background: !isLoggedIn
                            ? 'linear-gradient(135deg, #475569 0%, #334155 100%)'
                            : driver?.role === 'user'
                              ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                              : driver?.status === 'pending'
                                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                                : !driver?.is_online
                                  ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
                                  : 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px 8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        <span>
                          {!isLoggedIn 
                            ? 'Đăng nhập' 
                            : driver?.role === 'user'
                              ? 'ĐK Tài xế'
                              : driver?.status === 'pending'
                                ? 'Chờ duyệt'
                                : !driver?.is_online
                                  ? 'Bật online'
                                  : 'Nhận cuốc'}
                        </span>
                        <ChevronRight size={15} strokeWidth={3} />
                      </button>
                    )}

                    {activeTab === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteTrip(trip.id)}
                        style={{
                          flex: 1.2,
                          background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Hoàn thành</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT CUỐC XE */}
      {selectedJob && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '20px',
            maxWidth: '360px',
            width: '100%',
            maxHeight: '90dvh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <button
              onClick={() => setSelectedJob(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation'
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#111827', marginBottom: '14px' }}>
              Chi tiết cuốc xe
            </h3>

            <div style={{ backgroundColor: '#F9FAFB', padding: '14px', borderRadius: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Điểm đón khách:</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#D32F2F', marginBottom: '10px' }}>
                {selectedJob.pickup_location}
              </div>

              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Điểm trả khách:</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>
                {selectedJob.dropoff_location}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E5E7EB', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Cự ly: </span>
                  <strong style={{ fontSize: '13px' }}>{selectedJob.distance_km} km</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Cước phí: </span>
                  <strong style={{ fontSize: '15px', color: '#D32F2F' }}>
                    {Number(selectedJob.price).toLocaleString('vi-VN')}đ
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#4B5563', marginBottom: '16px' }}>
              📞 SĐT khách hàng: <strong>{selectedJob.customer_phone || '0988 888 888'}</strong>
            </div>

            {selectedJob.status === 'new' && (
              <button
                onClick={() => {
                  handleAcceptTrip(selectedJob);
                  setSelectedJob(null);
                }}
                style={{
                  width: '100%',
                  background: !isLoggedIn
                    ? 'linear-gradient(135deg, #475569 0%, #334155 100%)'
                    : driver?.role === 'user'
                      ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                      : driver?.status === 'pending'
                        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                        : !driver?.is_online
                          ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
                          : 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {!isLoggedIn 
                  ? 'Đăng nhập tài khoản để nhận cuốc' 
                  : driver?.role === 'user'
                    ? 'Đăng ký tài xế (300k) để nhận cuốc'
                    : driver?.status === 'pending'
                      ? 'Hồ sơ đang chờ duyệt phí 300k'
                      : !driver?.is_online
                        ? 'Bật nhận cuốc ngay để nhận'
                        : 'Nhận cuốc xe này'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🏙️ POPUP MODAL CHỌN 64 TỈNH / THÀNH PHỐ */}
      {showProvinceModal && (
        <div 
          onClick={() => setShowProvinceModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              width: '100%',
              maxWidth: '480px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              maxHeight: '84vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 25px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Thanh kéo nhỏ phía trên */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px' }}>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px' }} />
            </div>

            {/* Header Modal */}
            <div style={{
              padding: '12px 18px 14px 18px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={18} color="#D32F2F" />
                  <span>Chọn Tỉnh / Thành phố</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
                  Lọc các chuyến xe theo địa bàn bạn hoạt động
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowProvinceModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#4B5563'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Ô tìm kiếm nhanh */}
            <div style={{ padding: '12px 18px 8px 18px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                border: '1.5px solid #E5E7EB',
                borderRadius: '12px',
                padding: '8px 12px',
                gap: '8px'
              }}>
                <Search size={16} color="#9CA3AF" />
                <input
                  type="text"
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  placeholder="Tìm kiếm tỉnh thành... (VD: Đà Nẵng, Hà Nội...)"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    width: '100%',
                    color: '#111827'
                  }}
                  autoFocus
                />
                {provinceSearch && (
                  <button
                    type="button"
                    onClick={() => setProvinceSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Khu vực phổ biến (Pills) */}
            <div style={{ padding: '6px 18px 12px 18px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.3px' }}>
                Khu vực tiêu biểu
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {/* Tất cả */}
                <button
                  type="button"
                  onClick={() => handleSelectProvince('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: selectedProvince === 'all' ? '700' : '500',
                    border: selectedProvince === 'all' ? '1.5px solid #D32F2F' : '1px solid #E5E7EB',
                    backgroundColor: selectedProvince === 'all' ? '#FEE2E2' : '#FFFFFF',
                    color: selectedProvince === 'all' ? '#D32F2F' : '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🌟 Tất cả</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>({trips.length})</span>
                </button>

                {POPULAR_PROVINCES.map((p) => {
                  const count = provinceTripCounts[p] || 0;
                  const isSelected = selectedProvince === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelectProvince(p)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: isSelected ? '700' : '500',
                        border: isSelected ? '1.5px solid #D32F2F' : '1px solid #E5E7EB',
                        backgroundColor: isSelected ? '#FEE2E2' : '#FFFFFF',
                        color: isSelected ? '#D32F2F' : '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{p}</span>
                      {count > 0 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: isSelected ? '#D32F2F' : '#F3F4F6',
                          color: isSelected ? '#FFFFFF' : '#6B7280',
                          borderRadius: '8px',
                          padding: '1px 5px'
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danh sách cuộn toàn bộ 64 tỉnh thành */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 20px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', margin: '8px 6px', letterSpacing: '0.3px' }}>
                Danh sách 64 Tỉnh / Thành ({filteredProvincesList.length})
              </div>

              {filteredProvincesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#9CA3AF', fontSize: '13px' }}>
                  Không tìm thấy tỉnh thành nào phù hợp với "{provinceSearch}"
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredProvincesList.map((prov) => {
                    const isSelected = selectedProvince === prov;
                    const count = provinceTripCounts[prov] || 0;

                    return (
                      <div
                        key={prov}
                        onClick={() => handleSelectProvince(prov)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 14px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#FEF2F2' : 'transparent',
                          transition: 'background-color 0.12s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <MapPin size={16} color={isSelected ? '#D32F2F' : '#9CA3AF'} />
                          <span style={{
                            fontSize: '13.5px',
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? '#D32F2F' : '#1F2937'
                          }}>
                            {prov}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {count > 0 && (
                            <span style={{
                              backgroundColor: isSelected ? '#D32F2F' : '#F3F4F6',
                              color: isSelected ? '#FFFFFF' : '#4B5563',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}>
                              {count} cuốc
                            </span>
                          )}
                          {isSelected && <Check size={16} color="#D32F2F" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
