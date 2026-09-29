import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Bell, Wallet, Car, Star, MapPin, Navigation, 
  Clock, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { api } from '../../services/api';
import { useDriver } from '../../context/DriverContext';

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
            <span>Cuốc mới ({tripCounts?.new_count ?? 0})</span>
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

        {/* 🚗 JOB FEED DANH SÁCH CUỐC XE */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#D32F2F' }} />
            <div>Đang cập nhật cuốc xe mới nhất...</div>
          </div>
        ) : trips.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <Car size={36} color="#D1D5DB" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#374151' }}>
              Hiện chưa có cuốc xe nào trong mục này
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              Vào trang Admin để tạo thêm cuốc xe hoặc kích hoạt chế độ tự động sinh cuốc ảo!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {trips.map((trip) => {
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
    </div>
  );
}
