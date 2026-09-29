import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Camera, CheckCircle2, Star, Phone, 
  MapPin, Car, Calendar, Heart, ShieldCheck, Edit3, Power,
  Clock, User, RefreshCw, AlertCircle, LogOut, LogIn, Sparkles, Navigation
} from 'lucide-react';
import { api } from '../../services/api';
import { useDriver } from '../../context/DriverContext';
import GrabMapLocationModal from '../../components/GrabMapLocationModal';

export default function ProfileScreen({ onNavigate }) {
  const { 
    driver, 
    loadingDriver, 
    refreshDriver, 
    updateDriverState,
    logout, 
    isLoggedIn, 
    openAuthModal, 
    login 
  } = useDriver();

  useEffect(() => {
    if (refreshDriver) {
      refreshDriver();
    }
  }, [refreshDriver]);

  const [toggling, setToggling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editVehicle, setEditVehicle] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editCccd, setEditCccd] = useState('');
  const [editGplx, setEditGplx] = useState('');
  const [editGplxClass, setEditGplxClass] = useState('B2');
  const [editDangKiem, setEditDangKiem] = useState('');
  const [editBaoHiem, setEditBaoHiem] = useState('');
  const [saving, setSaving] = useState(false);

  const handleMapSelectLocation = async (loc) => {
    const chosenArea = loc.name || loc.address;
    setEditArea(chosenArea);
    if (driver && driver.id) {
      try {
        await api.updateDriverProfile(driver.id, { area: chosenArea });
        if (refreshDriver) await refreshDriver();
      } catch (err) {
        console.error('Error updating driver location:', err);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      logout();
    }
  };

  const handleToggleOnline = async () => {
    if (!driver || toggling) return;
    try {
      setToggling(true);
      const res = await api.toggleDriverOnline(driver.id);
      if (res && res.success && updateDriverState) {
        updateDriverState({ is_online: res.is_online });
      }
      await refreshDriver();
    } catch (err) {
      alert(err.message || 'Không thể thay đổi trạng thái nhận cuốc xe');
    } finally {
      setToggling(false);
    }
  };

  const handleOpenEdit = () => {
    setEditNote(driver?.note || '');
    setEditVehicle(driver?.vehicle_info || '');
    const currentArea = driver?.area && driver.area !== 'Chưa có' && !(driver.role === 'user' && driver.area === 'Thanh Hoá') ? driver.area : '';
    setEditArea(currentArea);
    const docDetails = driver?.document_details || {};
    setEditCccd(docDetails.cccd?.number || '');
    setEditGplx(docDetails.gplx?.number || '');
    setEditGplxClass(docDetails.gplx?.class || 'B2');
    setEditDangKiem(docDetails.dang_kiem?.number || '');
    setEditBaoHiem(docDetails.bao_hiem?.number || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!driver) return;
    try {
      setSaving(true);
      await api.updateDriverProfile(driver.id, {
        note: editNote,
        vehicle_info: editVehicle,
        area: editArea.trim() || 'Chưa có',
        document_details: {
          cccd: editCccd ? { number: editCccd, updated_at: new Date().toISOString() } : undefined,
          gplx: editGplx ? { number: editGplx, class: editGplxClass || 'B2', updated_at: new Date().toISOString() } : undefined,
          dang_kiem: editDangKiem ? { number: editDangKiem, updated_at: new Date().toISOString() } : undefined,
          bao_hiem: editBaoHiem ? { number: editBaoHiem, updated_at: new Date().toISOString() } : undefined
        }
      });
      await refreshDriver();
      setShowEditModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // MÀN HÌNH KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP)
  if (!isLoggedIn && !loadingDriver) {
    return (
      <div style={{ backgroundColor: '#F5F6F8', minHeight: '100%', paddingBottom: '30px' }}>
        {/* Header */}
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
            onClick={() => onNavigate && onNavigate('jobs')}
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

          <h1 style={{ fontSize: '18px', fontWeight: '700' }}>
            Tài khoản của bạn
          </h1>

          <div style={{ width: '22px' }} />
        </div>

        <div style={{ padding: '24px 16px', marginTop: '-12px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '30px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#F3F4F6',
              color: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <User size={36} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
              Bạn chưa đăng nhập
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', marginBottom: '24px' }}>
              Vui lòng đăng nhập hoặc tạo tài khoản để xem hồ sơ tài xế, quản lý chỉ số và nhận cuốc xe.
            </p>

            <button
              onClick={() => openAuthModal({ mode: 'login' })}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(211,47,47,0.3)'
              }}
            >
              <LogIn size={18} />
              <span>ĐĂNG NHẬP / TẠO TÀI KHOẢN</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingDriver && !driver) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#F5F6F8'
      }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#D32F2F' }} />
          <div>Đang tải thông tin tài xế từ máy chủ...</div>
        </div>
      </div>
    );
  }

  const d = driver || {};


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
          onClick={() => onNavigate && onNavigate('jobs')}
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
          Thông tin tài xế
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => refreshDriver()}
            title="Làm mới dữ liệu từ MySQL"
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
            <RefreshCw size={18} className={loadingDriver ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleLogout}
            title="Đăng xuất tài khoản"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <LogOut size={14} />
            <span>Thoát</span>
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 14px', marginTop: '-12px' }}>
        
        {/* BANNER DÀNH CHO USER CHƯA ĐĂNG KÝ TÀI XẾ */}
        {d.role === 'user' && (
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: '18px',
            padding: '16px',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(245,158,11,0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', fontWeight: '800', fontSize: '14px', marginBottom: '6px' }}>
              <AlertCircle size={18} />
              <span>Tài khoản Người Dùng (Chưa là Đối tác)</span>
            </div>
            <p style={{ fontSize: '12px', color: '#78350F', lineHeight: '1.5', marginBottom: '12px' }}>
              Bạn đã có tài khoản trên hệ thống. Để kích hoạt tính năng nhận cuốc và kiếm thu nhập hàng ngày, vui lòng đăng ký đối tác tài xế và đóng phí kích hoạt 300.000đ.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('register')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(211,47,47,0.25)'
              }}
            >
              <span>ĐĂNG KÝ ĐỐI TÁC TÀI XẾ NGAY (300K)</span>
              <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        )}
        
        {/* 👤 PROFILE CARD CHÍNH */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            
            {/* Avatar kèm nút camera */}
            <div style={{ position: 'relative' }}>
              <img 
                src={d.avatar_url || "/default-avatar.svg"}
                alt={d.full_name || 'Tài xế'}
                onError={(e) => { e.target.src = "/default-avatar.svg"; }}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  backgroundColor: '#F1F5F9'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                backgroundColor: '#374151',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF'
              }}>
                <Camera size={11} />
              </div>
            </div>

            {/* Tên & Rating & Badge Trạng Thái Động */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>
                  {d.full_name}
                </h2>
                {/* Tích đỏ xác minh */}
                <div style={{
                  backgroundColor: '#D32F2F',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  ✓
                </div>
              </div>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                  {Number(d.rating || 5.0).toFixed(1)}
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  ({d.rating_count || 0} đánh giá)
                </span>
              </div>

              {/* Status Pill Động từ MySQL */}
              <div style={{ marginTop: '6px' }}>
                {d.role === 'user' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#F3F4F6',
                    color: '#4B5563',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
                    Chưa đăng ký đối tác
                  </span>
                )}

                {d.role !== 'user' && d.status === 'active' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                    Đang hoạt động
                  </span>
                )}

                {d.role !== 'user' && d.status === 'pending' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    Chờ Admin duyệt phí 300k
                  </span>
                )}

                {d.status === 'blocked' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                    Tài khoản đang bị khóa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 🔴 BỘ 3 CHỈ SỐ QUAN TRỌNG (ĐƯỢC KHOANH ĐỎ Ở ẢNH 2 - 100% TỪ MYSQL) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '4px',
            borderTop: '1px solid #F3F4F6',
            paddingTop: '14px'
          }}>
            {/* Chỉ số 1: Tổng số cuốc */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              minWidth: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <User size={15} color="#D32F2F" />
                <span style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: '700', color: '#111827' }}>
                  {d.total_trips ?? 0}
                </span>
              </div>
              <span style={{ fontSize: 'clamp(9.5px, 2.6vw, 11px)', color: '#6B7280', fontWeight: '500', whiteSpace: 'nowrap' }}>
                Tổng số cuốc
              </span>
            </div>

            {/* Chỉ số 2: Tỷ lệ hoàn thành */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderLeft: '1px solid #F3F4F6',
              borderRight: '1px solid #F3F4F6',
              padding: '0 2px',
              minWidth: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Clock size={15} color="#D32F2F" />
                <span style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: '700', color: '#111827' }}>
                  {d.completion_rate ?? 100}%
                </span>
              </div>
              <span style={{ fontSize: 'clamp(9.5px, 2.6vw, 11px)', color: '#6B7280', fontWeight: '500', whiteSpace: 'nowrap' }}>
                Tỷ lệ xong
              </span>
            </div>

            {/* Chỉ số 3: Kinh nghiệm */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              minWidth: 0,
              padding: '0 2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', maxWidth: '100%' }}>
                <ShieldCheck size={15} color="#2563EB" style={{ flexShrink: 0 }} />
                <span style={{ 
                  fontSize: 'clamp(12px, 3.2vw, 14.5px)', 
                  fontWeight: '700', 
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {d.experience || 'Mới'}
                </span>
              </div>
              <span style={{ fontSize: 'clamp(9.5px, 2.6vw, 11px)', color: '#6B7280', fontWeight: '500', whiteSpace: 'nowrap' }}>
                Kinh nghiệm
              </span>
            </div>
          </div>
        </div>

        {/* 📋 CHI TIẾT DANH SÁCH THÔNG TIN */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          marginBottom: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Phone + Button Gọi ngay */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: '#D32F2F' }}><Phone size={18} /></div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                {d.phone || 'Chưa cập nhật'}
              </span>
            </div>
            {d.phone && (
              <a 
                href={`tel:${d.phone}`}
                style={{
                  backgroundColor: '#D32F2F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Gọi ngay
              </a>
            )}
          </div>

          {/* Địa bàn hoạt động (Bấm vào mở bản đồ định vị chuẩn Grab / Xanh SM) */}
          <div 
            onClick={() => setShowMapModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '10px',
              padding: '8px 10px',
              margin: '0 -10px',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              transition: 'all 0.15s ease'
            }}
            title="Bấm để mở bản đồ định vị như Grab / Xanh SM"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div style={{ color: '#D32F2F', flexShrink: 0 }}><MapPin size={18} /></div>
              <span style={{ fontSize: '13px', color: '#1F2937', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.area && d.area !== 'Chưa có' && !(d.role === 'user' && d.area === 'Thanh Hoá') ? d.area : 'Chưa có (Chạm để định vị)'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '700',
              flexShrink: 0
            }}>
              <Navigation size={11} fill="#059669" />
              <span>Định vị</span>
            </div>
          </div>

          {/* Thông tin xe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: '#D32F2F' }}><Car size={18} /></div>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
              {d.vehicle_info || 'Đang cập nhật phương tiện'}
            </span>
          </div>

          {/* Kinh nghiệm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: '#D32F2F' }}><Calendar size={18} /></div>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
              Kinh nghiệm: {d.experience || 'Mới tham gia'}
            </span>
          </div>

          {/* Tiêu chí phục vụ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: '#D32F2F' }}><Heart size={18} /></div>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
              {d.note || 'Tài xế chuyên nghiệp, thân thiện, đúng giờ'}
            </span>
          </div>
        </div>

        {/* 🛡️ GIẤY TỜ ĐÃ XÁC MINH (CHUẨN 100% THEO ẢNH MẪU CỦA BẠN) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          marginBottom: '14px'
        }}>
          {/* Header Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '900',
              flexShrink: 0
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
              Giấy tờ đã xác minh
            </h3>
          </div>

          {/* 4 Mục Giấy Tờ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'cccd', name: 'CCCD/CMND', matchKeys: ['CCCD/CMND', 'cccd', 'cmnd'] },
              { key: 'gplx', name: 'Giấy phép lái xe', matchKeys: ['Giấy phép lái xe', 'gplx', 'bang_lai'] },
              { key: 'dang_kiem', name: 'Đăng kiểm xe', matchKeys: ['Đăng kiểm xe', 'dang_kiem'] },
              { key: 'bao_hiem', name: 'Bảo hiểm xe', matchKeys: ['Bảo hiểm xe', 'bao_hiem'] }
            ].map(doc => {
              const verifiedList = Array.isArray(d.verified_docs) ? d.verified_docs : [];
              const isVerified = verifiedList.some(v => doc.matchKeys.some(mk => v.toLowerCase().includes(mk.toLowerCase())));
              const hasSubmitted = d.document_details?.[doc.key]?.number;

              return (
                <div 
                  key={doc.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: isVerified ? '#16A34A' : hasSubmitted ? '#F59E0B' : '#E5E7EB',
                      color: isVerified || hasSubmitted ? '#FFFFFF' : '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      ✓
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                        {doc.name}
                      </span>
                      {hasSubmitted && !isVerified && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#6B7280' }}>
                          Số: {d.document_details[doc.key].number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isVerified ? (
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A' }}>
                        Đã xác minh
                      </span>
                    ) : hasSubmitted ? (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#D97706' }}>
                        Chờ duyệt
                      </span>
                    ) : (
                      <button
                        onClick={handleOpenEdit}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        + Bổ sung
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ✏️ NÚT CHỈNH SỬA HỒ SƠ */}
        <button
          onClick={handleOpenEdit}
          style={{
            width: '100%',
            backgroundColor: '#FFEBEE',
            color: '#D32F2F',
            border: 'none',
            borderRadius: '14px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '14px'
          }}
        >
          <Edit3 size={16} />
          <span>Chỉnh sửa hồ sơ</span>
        </button>

        {/* ⭐ ĐÁNH GIÁ TỪ KHÁCH HÀNG (ĐỒNG BỘ TỪ ADMIN KHUNG 3) */}
        {Array.isArray(d.reviews) && d.reviews.length > 0 && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px 18px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Đánh giá từ khách hàng
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                {d.rating_count || d.reviews.length} nhận xét
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {d.reviews.map((rev, idx) => (
                <div 
                  key={rev.id || idx}
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    border: '1px solid #F3F4F6'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>
                      {rev.customer_name || 'Khách hàng'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {[...Array(Math.floor(rev.rating || 5))].map((_, i) => (
                        <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#4B5563', lineHeight: 1.4 }}>
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🔴 CÔNG TẮC BẬT NHẬN CUỐC XE CHUẨN MOCKUP */}
        <div 
          onClick={toggling ? undefined : handleToggleOnline}
          role="button"
          tabIndex={0}
          title={toggling ? "Đang xử lý..." : (d.is_online ? "Bấm để tạm dừng nhận cuốc" : "Bấm để bật nhận cuốc")}
          style={{
            background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)',
            borderRadius: '20px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 6px 18px rgba(211,47,47,0.35)',
            cursor: toggling ? 'wait' : 'pointer',
            userSelect: 'none',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease',
            opacity: toggling ? 0.9 : 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {/* Power Icon */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              color: '#D32F2F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Power size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>
                Bật nhận cuốc xe
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                {d.is_online ? 'Sẵn sàng nhận cuốc mới' : 'Đang tạm dừng nhận cuốc'}
              </div>
            </div>
          </div>

          {/* Toggle Switch: Duy nhất 1 chỗ xoay loading tại đây */}
          <div 
            style={{
              width: '56px',
              height: '32px',
              backgroundColor: d.is_online ? '#22C55E' : '#9CA3AF',
              borderRadius: '20px',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: d.is_online ? 'flex-end' : 'flex-start',
              transition: 'all 0.25s ease',
              flexShrink: 0,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              backgroundColor: '#FFFFFF',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}>
              {toggling && (
                <div className="animate-spin" style={{
                  width: '14px',
                  height: '14px',
                  border: `2.5px solid ${d.is_online ? '#22C55E' : '#D32F2F'}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%'
                }} />
              )}
            </div>
          </div>
        </div>

        {/* 🚪 NÚT ĐĂNG XUẤT TÀI KHOẢN (THEO YÊU CẦU USER) */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: '16px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            color: '#DC2626',
            border: '1.5px solid #FCA5A5',
            borderRadius: '16px',
            padding: '14px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(220,38,38,0.06)',
            transition: 'all 0.15s ease'
          }}
        >
          <LogOut size={18} />
          <span>ĐĂNG XUẤT TÀI KHOẢN</span>
        </button>
      </div>

      {/* MODAL CHỈNH SỬA HỒ SƠ */}
      {showEditModal && (
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
            borderRadius: '20px',
            padding: '20px',
            maxWidth: '360px',
            width: '100%',
            maxHeight: '90dvh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#111827' }}>
              Chỉnh sửa thông tin hồ sơ & Giấy tờ
            </h3>

            {/* Khu vực / Địa chỉ */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                  Khu vực / Địa chỉ hoạt động
                </label>
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00B14F',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <Navigation size={12} fill="#00B14F" />
                  <span>Chọn trên bản đồ</span>
                </button>
              </div>
              <input
                type="text"
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                placeholder="Ví dụ: Chưa có, hoặc điền Tỉnh/Thành phố..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Thông tin phương tiện */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Thông tin phương tiện (Dòng xe, Biển số)
              </label>
              <input
                type="text"
                value={editVehicle}
                onChange={(e) => setEditVehicle(e.target.value)}
                placeholder="Ví dụ: Toyota Vios - 30K 123.45"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Tiêu chí phục vụ */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Tiêu chí / Phong cách phục vụ
              </label>
              <textarea
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ví dụ: Tài xế chuyên nghiệp, thân thiện, đúng giờ"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '13px',
                  resize: 'none'
                }}
              />
            </div>

            {/* Khối Bổ sung 4 Giấy tờ */}
            <div style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#16A34A" />
                <span>Bổ sung giấy tờ lái xe (Admin xét duyệt)</span>
              </div>

              {/* 1. CCCD */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                  1. Số CCCD/CMND (12 số)
                </label>
                <input
                  type="text"
                  value={editCccd}
                  onChange={(e) => setEditCccd(e.target.value)}
                  placeholder="Nhập 12 số CCCD"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '12px',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              {/* 2. GPLX */}
              <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                    2. Số Giấy phép lái xe
                  </label>
                  <input
                    type="text"
                    value={editGplx}
                    onChange={(e) => setEditGplx(e.target.value)}
                    placeholder="Số GPLX"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '12px',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                    Hạng
                  </label>
                  <select
                    value={editGplxClass}
                    onChange={(e) => setEditGplxClass(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '12px',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              </div>

              {/* 3. Đăng kiểm xe */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                  3. Số Đăng kiểm xe
                </label>
                <input
                  type="text"
                  value={editDangKiem}
                  onChange={(e) => setEditDangKiem(e.target.value)}
                  placeholder="Ví dụ: DK-30K-123.45"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '12px',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              {/* 4. Bảo hiểm xe */}
              <div>
                <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                  4. Số Hợp đồng Bảo hiểm xe
                </label>
                <input
                  type="text"
                  value={editBaoHiem}
                  onChange={(e) => setEditBaoHiem(e.target.value)}
                  placeholder="Ví dụ: BH-88992211"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '12px',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: '#D32F2F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px',
                  fontWeight: '700',
                  cursor: saving ? 'wait' : 'pointer'
                }}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗺️ MODAL BẢN ĐỒ ĐỊNH VỊ CHUẨN XANH SM / GRAB */}
      <GrabMapLocationModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelectLocation={handleMapSelectLocation}
        initialAddress={d.area}
        driverAvatar={d.avatar}
      />
    </div>
  );
}
