import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, Phone, MapPin, Car, Check, ChevronRight, 
  ShieldCheck, QrCode, Upload, AlertCircle, CheckCircle2, X,
  LogOut, LogIn, UserPlus, Clock, Sparkles, RefreshCw, ChevronDown,
  Search
} from 'lucide-react';
import { api } from '../../services/api';
import { useDriver } from '../../context/DriverContext';

// Danh sách 34 Tỉnh thành sau sáp nhập chuẩn Open API v2 (https://provinces.open-api.vn/api/v2/redoc)
const PROVINCES_34 = [
  { code: 1, name: 'Thành phố Hà Nội', codename: 'ha_noi', division_type: 'thành phố trung ương' },
  { code: 4, name: 'Tỉnh Cao Bằng', codename: 'cao_bang', division_type: 'tỉnh' },
  { code: 8, name: 'Tỉnh Tuyên Quang', codename: 'tuyen_quang', division_type: 'tỉnh' },
  { code: 11, name: 'Tỉnh Điện Biên', codename: 'dien_bien', division_type: 'tỉnh' },
  { code: 12, name: 'Tỉnh Lai Châu', codename: 'lai_chau', division_type: 'tỉnh' },
  { code: 14, name: 'Tỉnh Sơn La', codename: 'son_la', division_type: 'tỉnh' },
  { code: 15, name: 'Tỉnh Lào Cai', codename: 'lao_cai', division_type: 'tỉnh' },
  { code: 19, name: 'Tỉnh Thái Nguyên', codename: 'thai_nguyen', division_type: 'tỉnh' },
  { code: 20, name: 'Tỉnh Lạng Sơn', codename: 'lang_son', division_type: 'tỉnh' },
  { code: 22, name: 'Thành phố Quảng Ninh', codename: 'quang_ninh', division_type: 'thành phố trung ương' },
  { code: 24, name: 'Thành phố Bắc Ninh', codename: 'bac_ninh', division_type: 'thành phố trung ương' },
  { code: 25, name: 'Tỉnh Phú Thọ', codename: 'phu_tho', division_type: 'tỉnh' },
  { code: 31, name: 'Thành phố Hải Phòng', codename: 'hai_phong', division_type: 'thành phố trung ương' },
  { code: 33, name: 'Tỉnh Hưng Yên', codename: 'hung_yen', division_type: 'tỉnh' },
  { code: 37, name: 'Tỉnh Ninh Bình', codename: 'ninh_binh', division_type: 'tỉnh' },
  { code: 38, name: 'Tỉnh Thanh Hóa', codename: 'thanh_hoa', division_type: 'tỉnh' },
  { code: 40, name: 'Tỉnh Nghệ An', codename: 'nghe_an', division_type: 'tỉnh' },
  { code: 42, name: 'Tỉnh Hà Tĩnh', codename: 'ha_tinh', division_type: 'tỉnh' },
  { code: 45, name: 'Tỉnh Quảng Trị', codename: 'quang_tri', division_type: 'tỉnh' },
  { code: 46, name: 'Thành phố Huế', codename: 'hue', division_type: 'thành phố trung ương' },
  { code: 48, name: 'Thành phố Đà Nẵng', codename: 'da_nang', division_type: 'thành phố trung ương' },
  { code: 51, name: 'Tỉnh Quảng Ngãi', codename: 'quang_ngai', division_type: 'tỉnh' },
  { code: 52, name: 'Tỉnh Gia Lai', codename: 'gia_lai', division_type: 'tỉnh' },
  { code: 56, name: 'Tỉnh Khánh Hòa', codename: 'khanh_hoa', division_type: 'tỉnh' },
  { code: 66, name: 'Tỉnh Đắk Lắk', codename: 'dak_lak', division_type: 'tỉnh' },
  { code: 68, name: 'Tỉnh Lâm Đồng', codename: 'lam_dong', division_type: 'tỉnh' },
  { code: 75, name: 'Thành phố Đồng Nai', codename: 'dong_nai', division_type: 'thành phố trung ương' },
  { code: 79, name: 'Thành phố Hồ Chí Minh', codename: 'ho_chi_minh', division_type: 'thành phố trung ương' },
  { code: 80, name: 'Tỉnh Tây Ninh', codename: 'tay_ninh', division_type: 'tỉnh' },
  { code: 87, name: 'Tỉnh Đồng Tháp', codename: 'dong_thap', division_type: 'tỉnh' },
  { code: 86, name: 'Tỉnh Vĩnh Long', codename: 'vinh_long', division_type: 'tỉnh' },
  { code: 89, name: 'Tỉnh An Giang', codename: 'an_giang', division_type: 'tỉnh' },
  { code: 92, name: 'Thành phố Cần Thơ', codename: 'can_tho', division_type: 'thành phố trung ương' },
  { code: 96, name: 'Tỉnh Cà Mau', codename: 'ca_mau', division_type: 'tỉnh' }
];

export default function RegisterScreen({ onNavigate, onRegistrationSuccess }) {
  const {  
    driver, 
    isLoggedIn, 
    isDriver, 
    isPending, 
    isActive, 
    logout, 
    openAuthModal, 
    systemConfig, 
    setDriverId, 
    refreshDriver 
  } = useDriver();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: driver?.full_name || '',
    phone: driver?.phone || '',
    area: driver?.area && driver.area !== 'Chưa có' && !(driver.role === 'user' && driver.area === 'Thanh Hoá') ? driver.area : '',
    vehicleInfo: driver?.vehicle_info && driver.vehicle_info !== 'Chưa đăng ký' ? driver.vehicle_info : '',
    serviceTypes: driver?.service_types || ['lai_xe_ho']
  });

  // Tự động đồng bộ thông tin từ tài khoản đã đăng nhập
  useEffect(() => {
    if (driver) {
      setFormData(prev => ({
        ...prev,
        fullName: driver.full_name || prev.fullName,
        phone: driver.phone || prev.phone,
        area: driver.area && driver.area !== 'Chưa có' && !(driver.role === 'user' && driver.area === 'Thanh Hoá') ? driver.area : prev.area,
        vehicleInfo: driver.vehicle_info && driver.vehicle_info !== 'Chưa đăng ký' ? driver.vehicle_info : prev.vehicleInfo
      }));
    }
  }, [driver]);

  const [showQrModal, setShowQrModal] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [provinces, setProvinces] = useState(PROVINCES_34);
  const [areaSearch, setAreaSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tải danh sách 34 tỉnh thành thời gian thực từ Open API v2
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProvinces(data);
        }
      })
      .catch((err) => {
        console.warn('Using offline 34 provinces list:', err);
      });
  }, []);

  const normalizeArea = (str) => (str || '')
    .toLowerCase()
    .replace(/^(thành phố|tỉnh|tp\.)\s*/i, '')
    .replace(/hoá/g, 'hóa')
    .trim();

  const filteredProvinces = provinces.filter(p => {
    if (!areaSearch.trim()) return true;
    const term = areaSearch.toLowerCase().trim();
    const cleanTerm = term.replace(/^(thành phố|tỉnh|tp\.)\s*/i, '');
    const cleanName = p.name.replace(/^(thành phố|tỉnh)\s*/i, '').toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      cleanName.includes(cleanTerm) ||
      (p.codename && p.codename.includes(term))
    );
  });

  const services = [
    {
      id: 'lai_xe_ho',
      title: 'Lái xe hộ',
      subtitle: 'Lái xe thay khi khách hàng cần'
    },
    {
      id: 'xe_ghep',
      title: 'Xe ghép / Tiện chuyến',
      subtitle: 'Đi cùng tuyến - chia sẻ chi phí'
    },
    {
      id: 'bao_xe',
      title: 'Bao xe',
      subtitle: 'Thuê xe theo thời gian / theo ngày'
    }
  ];

  const selectService = (id) => {
    setFormData(prev => ({ ...prev, serviceTypes: [id] }));
  };

  const handleOpenPayment = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.area) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Khu vực');
      return;
    }
    setErrorMsg('');
    setShowQrModal(true);
  };

  const bank = systemConfig?.bank || {};
  const bankName = bank.bank_name || systemConfig?.bank_name || 'VIB';
  const accountName = bank.account_name || systemConfig?.account_name || 'ĐINH THẾ DUY';
  const accountNumber = bank.account_number || systemConfig?.account_number || '095241233';
  const feeAmount = systemConfig?.registration_fee || systemConfig?.amount || 300000;
  const transferNote = bank.transfer_note || systemConfig?.transfer_content || `Dang ky tai xe ${formData.phone || ''}`;
  const qrImageUrl = bank.qr_image_url || systemConfig?.qr_code_url || `https://img.vietqr.io/image/vib-095241233-compact2.png?amount=300000&addInfo=Dang%20ky%20tai%20xe%20${formData.phone || ''}&accountName=DINH%20THE%20DUY`;

  const handleConfirmPayment = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // Gửi đăng ký / nâng cấp lên Backend MySQL
      const res = await api.registerDriver({
        full_name: formData.fullName.trim(),
        phone: formData.phone.replace(/\s+/g, ''),
        area: formData.area,
        service_types: formData.serviceTypes,
        vehicle_info: formData.vehicleInfo.trim() || 'Chưa đăng ký xe riêng',
        payment_receipt: qrImageUrl
      });

      setSubmitSuccess(true);
      if (res.data?.id) {
        setDriverId(res.data.id);
        await refreshDriver(res.data.id);
      }
      if (onRegistrationSuccess) {
        onRegistrationSuccess(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi gửi đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      logout();
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F6F8', minHeight: '100%', position: 'relative', overflowX: 'hidden' }}>
      
      {/* 🔴 HEADER BANNER TÀI XẾ CHUẨN MOCKUP VỚI CHỮ MỜ VÀ ẢNH THẬT */}
      <div style={{
        position: 'relative',
        minHeight: '235px',
        padding: '16px 20px 36px 20px',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}>
        {/* 1. Ảnh nền tài xế thực tế trong xe - Tải tức thì 0 delay với WebP 63KB, eager sync render & nền đỏ dự phòng */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#8B0000',
          zIndex: 1,
          overflow: 'hidden'
        }}>
          <img 
            src="/driver_register_banner.webp" 
            alt="Đăng ký tài xế 24h"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'right center',
              display: 'block',
              filter: 'contrast(1.03) brightness(1.02)'
            }}
          />
        </div>

        {/* 2. Lớp gradient chuyển màu đỏ đậm sang trong suốt hoàn toàn để bên phải cực kỳ sáng rõ, tự nhiên */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #A80606 0%, #BA0E0E 28%, rgba(186, 14, 14, 0.88) 36%, rgba(186, 14, 14, 0.2) 48%, rgba(0, 0, 0, 0) 54%, rgba(0, 0, 0, 0) 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }} />

        {/* 3. Chữ mờ watermark nghệ thuật phía sau */}
        <div style={{
          position: 'absolute',
          left: '-4px',
          top: '22px',
          fontSize: '68px',
          fontWeight: '900',
          color: 'rgba(255, 255, 255, 0.08)',
          letterSpacing: '1px',
          lineHeight: '0.9',
          zIndex: 2,
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: "'Roboto', sans-serif"
        }}>
          DRIVER<br />24H
        </div>

        {/* 4. Nút Back */}
        <button 
          onClick={() => onNavigate && onNavigate('profile')}
          style={{
            position: 'relative',
            zIndex: 3,
            background: 'rgba(0, 0, 0, 0.28)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            marginBottom: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>

        {/* 5. Nội dung Tiêu đề & Thông điệp chuẩn Mockup */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '230px' }}>
          <h1 style={{
            fontFamily: "'Roboto', 'Segoe UI', Arial, sans-serif",
            fontSize: '28px',
            fontWeight: '900',
            lineHeight: '1.15',
            letterSpacing: '-0.5px',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '10px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)'
          }}>
            ĐĂNG KÝ<br />TÀI XẾ
          </h1>
          <div style={{
            fontSize: '13.5px',
            fontWeight: '600',
            color: '#FFFFFF',
            lineHeight: '1.6',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)'
          }}>
            <div>Bạn uống tôi lái ,</div>
            <div>bạn bận tôi lái giúp</div>
          </div>
        </div>
      </div>

      {/* ⚪ BODY CARD CHÍNH */}
      <div style={{
        marginTop: '-16px',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        padding: '20px 18px 40px 18px',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 3
      }}>

        {/* 👤 THANH THÔNG TIN SESSION & NÚT ĐĂNG XUẤT */}
        {isLoggedIn && (
          <div style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#FFEBEE',
                color: '#D32F2F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '15px',
                flexShrink: 0
              }}>
                {driver?.full_name ? driver.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {driver?.full_name}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{driver?.phone}</span>
                  <span>•</span>
                  <span style={{
                    fontWeight: '700',
                    color: driver?.role === 'driver' && driver?.status === 'active'
                      ? '#16A34A'
                      : driver?.role === 'driver' && driver?.status === 'pending'
                        ? '#D97706'
                        : '#2563EB'
                  }}>
                    {driver?.role === 'driver' && driver?.status === 'active'
                      ? 'Tài xế Active'
                      : driver?.role === 'driver' && driver?.status === 'pending'
                        ? 'Chờ duyệt 300k'
                        : 'Người dùng'}
                  </span>
                </div>
              </div>
            </div>

            {/* 🔴 NÚT ĐĂNG XUẤT KHI ĐĂNG KÝ TK */}
            <button
              onClick={handleLogout}
              title="Đăng xuất tài khoản"
              style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: 'none',
                borderRadius: '10px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.15s'
              }}
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        {!isLoggedIn ? (
          /* 🛑 TRƯỜNG HỢP 1: CHƯA ĐĂNG NHẬP -> KHÔNG CHO ĐĂNG KÝ TÀI XẾ ẨN DANH */
          <div style={{ textAlign: 'center', padding: '10px 4px 20px 4px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#FFEBEE',
              color: '#D32F2F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 14px rgba(211,47,47,0.15)'
            }}>
              <LogIn size={34} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
              YÊU CẦU ĐĂNG NHẬP
            </h2>
            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.6', marginBottom: '22px' }}>
              Bạn cần <strong>Đăng nhập tài khoản</strong> trước khi đăng ký làm Đối tác Tài xế để hệ thống ghi nhận danh tính và liên kết hồ sơ của bạn.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <button
                onClick={() => openAuthModal({ mode: 'login', title: 'Đăng nhập để đăng ký tài xế' })}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(211,47,47,0.3)'
                }}
              >
                <LogIn size={18} />
                <span>ĐĂNG NHẬP TÀI KHOẢN</span>
              </button>

              <button
                onClick={() => openAuthModal({ mode: 'register', title: 'Tạo tài khoản người dùng' })}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#D32F2F',
                  border: '1.5px solid #D32F2F',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <UserPlus size={18} />
                <span>CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY</span>
              </button>
            </div>
          </div>
        ) : driver?.role === 'driver' && driver?.status === 'active' ? (
          /* ✅ TRƯỜNG HỢP 2: ĐÃ LÀ TÀI XẾ HOẠT ĐỘNG CHÍNH THỨC */
          <div style={{ textAlign: 'center', padding: '16px 8px 24px 8px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 14px rgba(22,163,74,0.2)'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
              BẠN ĐÃ LÀ ĐỐI TÁC TÀI XẾ!
            </h2>
            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.6', marginBottom: '20px' }}>
              Tài khoản <strong>{driver.full_name}</strong> ({driver.phone}) hiện đang là Đối tác Tài xế chính thức đang hoạt động. Bạn không cần đăng ký lại.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <button
                onClick={() => onNavigate && onNavigate('jobs')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(211,47,47,0.3)'
                }}
              >
                <span>VÀO MÀN NHẬN CUỐC XE</span>
                <ChevronRight size={18} strokeWidth={3} />
              </button>

              <button
                onClick={() => onNavigate && onNavigate('profile')}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '14px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Xem Hồ sơ tài xế
              </button>
            </div>
          </div>
        ) : (driver?.role === 'driver' && driver?.status === 'pending') ? (
          /* ⏳ TRƯỜNG HỢP 3: HỒ SƠ TÀI XẾ ĐANG CHỜ ADMIN DUYỆT PHÍ 300K */
          <div style={{ textAlign: 'center', padding: '16px 8px 24px 8px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 14px rgba(217,119,6,0.2)'
            }}>
              <Clock size={36} />
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
              HỒ SƠ ĐANG CHỜ DUYỆT!
            </h2>
            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.6', marginBottom: '18px' }}>
              Hồ sơ đăng ký tài xế và khoản phí kích hoạt <strong>300.000đ</strong> của bạn đang được Ban Quản Trị đối chiếu và phê duyệt.
            </p>

            <div style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'left',
              fontSize: '12px',
              color: '#92400E',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              <div>• <strong>Họ tên:</strong> {driver.full_name}</div>
              <div>• <strong>SĐT:</strong> {driver.phone}</div>
              <div>• <strong>Khu vực:</strong> {driver.area && driver.area !== 'Chưa có' && !(driver.role === 'user' && driver.area === 'Thanh Hoá') ? driver.area : 'Chưa có'}</div>
              <div>• <strong>Trạng thái:</strong> <span style={{ color: '#B45309', fontWeight: '700' }}>Chờ Admin kích hoạt</span></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => refreshDriver(driver.id)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(217,119,6,0.25)'
                }}
              >
                <RefreshCw size={18} />
                <span>KIỂM TRA LẠI TRẠNG THÁI</span>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('profile')}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '14px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Xem Hồ sơ của bạn
              </button>
            </div>
          </div>
        ) : (
          /* 📝 TRƯỜNG HỢP 4: USER ĐÃ ĐĂNG NHẬP -> ĐIỀN FORM NÂNG CẤP LÀM TÀI XẾ */
          <>
            {/* 🔢 PROGRESS STEPPER (RESPONSIVE CHO MỌI LOẠI MÀN HÌNH ĐT) */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '24px',
              padding: '0 4px',
              position: 'relative'
            }}>
              {/* Đường line kết nối giữa các bước */}
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '14%',
                right: '14%',
                height: '2px',
                backgroundColor: '#E5E7EB',
                zIndex: 1
              }} />

              {/* Bước 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, minWidth: '60px', maxWidth: '100px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#D32F2F',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(211,47,47,0.35)',
                  marginBottom: '6px'
                }}>
                  1
                </div>
                <span style={{ fontSize: 'clamp(9.5px, 2.7vw, 11px)', fontWeight: '700', color: '#D32F2F', textAlign: 'center', lineHeight: '1.25' }}>
                  Thông tin<br />tài xế
                </span>
              </div>

              {/* Bước 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, minWidth: '60px', maxWidth: '100px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: '1px solid #E5E7EB',
                  marginBottom: '6px'
                }}>
                  2
                </div>
                <span style={{ fontSize: 'clamp(9.5px, 2.7vw, 11px)', fontWeight: '500', color: '#6B7280', textAlign: 'center', lineHeight: '1.25' }}>
                  Phương tiện<br />& dịch vụ
                </span>
              </div>

              {/* Bước 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, minWidth: '60px', maxWidth: '100px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: '1px solid #E5E7EB',
                  marginBottom: '6px'
                }}>
                  3
                </div>
                <span style={{ fontSize: 'clamp(9.5px, 2.7vw, 11px)', fontWeight: '500', color: '#6B7280', textAlign: 'center', lineHeight: '1.25' }}>
                  Kích hoạt<br />(300k VietQR)
                </span>
              </div>
            </div>

            {/* THÔNG BÁO LỖI NẾU CÓ */}
            {errorMsg && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 📝 KHỐI THÔNG TIN CÁ NHÂN */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#FFEBEE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D32F2F'
                }}>
                  <User size={16} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Thông tin cá nhân</h3>
              </div>

              {/* Field: Họ và tên */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  transition: 'border 0.2s',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '85px', maxWidth: '110px', flexShrink: 0 }}>
                    <User size={15} color="#9CA3AF" />
                    <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)', color: '#4B5563', fontWeight: '500' }}>
                      Họ và tên <span style={{ color: '#DC2626' }}>*</span>
                    </span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Nguyễn Văn Nam"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      minWidth: 0,
                      fontSize: 'clamp(13px, 3.4vw, 14px)',
                      fontWeight: '600',
                      color: '#111827',
                      textAlign: 'right'
                    }}
                  />
                </div>
              </div>

              {/* Field: Số điện thoại */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '85px', maxWidth: '110px', flexShrink: 0 }}>
                    <Phone size={15} color="#9CA3AF" />
                    <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)', color: '#4B5563', fontWeight: '500' }}>
                      Số điện thoại <span style={{ color: '#DC2626' }}>*</span>
                    </span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: 0987654321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      minWidth: 0,
                      fontSize: 'clamp(13px, 3.4vw, 14px)',
                      fontWeight: '600',
                      color: '#111827',
                      textAlign: 'right'
                    }}
                  />
                </div>
              </div>

              {/* Field: Khu vực hoạt động */}
              <div style={{ marginBottom: '12px', position: 'relative' }}>
                <div 
                  onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#F9FAFB',
                    border: showAreaDropdown ? '1.5px solid #D32F2F' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    userSelect: 'none',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '85px', maxWidth: '110px', flexShrink: 0 }}>
                    <MapPin size={15} color="#9CA3AF" />
                    <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)', color: '#4B5563', fontWeight: '500' }}>
                      Khu vực <span style={{ color: '#DC2626' }}>*</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, justifyContent: 'flex-end', flex: 1 }}>
                    <span style={{ 
                      fontSize: 'clamp(12.5px, 3.2vw, 14px)', 
                      fontWeight: '700', 
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'right'
                    }}>
                      {formData.area || 'Chọn khu vực'}
                    </span>
                    <ChevronDown 
                      size={16} 
                      color={showAreaDropdown ? '#D32F2F' : '#6B7280'}
                      style={{ 
                        transform: showAreaDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease, color 0.2s ease',
                        flexShrink: 0
                      }} 
                    />
                  </div>
                </div>

                {/* Custom Dropdown Menu */}
                {showAreaDropdown && (
                  <>
                    {/* Backdrop vô hình để đóng khi click ra ngoài */}
                    <div 
                      onClick={() => {
                        setShowAreaDropdown(false);
                        setAreaSearch('');
                      }}
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99
                      }}
                    />

                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid #E5E7EB',
                      zIndex: 100,
                      overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease'
                    }}>
                      {/* Search box & Header 34 tỉnh thành */}
                      <div style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: '#FAFAFA'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '7px 10px'
                        }}>
                          <Search size={15} color="#9CA3AF" />
                          <input
                            type="text"
                            value={areaSearch}
                            onChange={(e) => setAreaSearch(e.target.value)}
                            placeholder="Tìm trong 34 tỉnh thành..."
                            autoFocus
                            style={{
                              border: 'none',
                              outline: 'none',
                              width: '100%',
                              fontSize: '13px',
                              color: '#111827',
                              backgroundColor: 'transparent'
                            }}
                          />
                          {areaSearch && (
                            <button
                              type="button"
                              onClick={() => setAreaSearch('')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={14} color="#9CA3AF" />
                            </button>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          padding: '0 2px'
                        }}>
                          <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                            34 Tỉnh thành
                          </span>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {filteredProvinces.length} kết quả
                          </span>
                        </div>
                      </div>

                      {/* Danh sách 34 tỉnh thành cuộn */}
                      <div style={{
                        maxHeight: '250px',
                        overflowY: 'auto',
                        padding: '6px'
                      }}>
                        {filteredProvinces.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF' }}>
                            Không tìm thấy tỉnh thành nào
                          </div>
                        ) : (
                          filteredProvinces.map((p) => {
                            const isSelected = 
                              formData.area === p.name ||
                              normalizeArea(formData.area) === normalizeArea(p.name);
                            const isCity = p.division_type === 'thành phố trung ương' || p.name.startsWith('Thành phố');

                            return (
                              <div
                                key={p.code || p.name}
                                onClick={() => {
                                  setFormData({ ...formData, area: p.name });
                                  setShowAreaDropdown(false);
                                  setAreaSearch('');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '9px 12px',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#FEF2F2' : 'transparent',
                                  color: isSelected ? '#D32F2F' : '#1F2937',
                                  fontWeight: isSelected ? '700' : '500',
                                  fontSize: '13px',
                                  transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{p.name}</span>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: isCity ? '#EFF6FF' : '#F3F4F6',
                                    color: isCity ? '#2563EB' : '#6B7280'
                                  }}>
                                    {isCity ? 'TP' : 'Tỉnh'}
                                  </span>
                                </div>
                                {isSelected && <Check size={16} color="#D32F2F" strokeWidth={2.5} />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Field: Thông tin phương tiện (Tùy chọn) */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '85px', maxWidth: '110px', flexShrink: 0 }}>
                    <Car size={15} color="#9CA3AF" />
                    <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)', color: '#4B5563', fontWeight: '500' }}>
                      Thông tin xe
                    </span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Vios 30K 123.45 (nếu có)"
                    value={formData.vehicleInfo}
                    onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      minWidth: 0,
                      fontSize: 'clamp(12.5px, 3.2vw, 13.5px)',
                      fontWeight: '600',
                      color: '#111827',
                      textAlign: 'right'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 🚗 KHỐI LOẠI DỊCH VỤ ĐĂNG KÝ */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
                Loại dịch vụ đăng ký <span style={{ color: '#DC2626' }}>*</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {services.map((srv) => {
                  const isSelected = formData.serviceTypes.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => selectService(srv.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: isSelected ? '1.5px solid #D32F2F' : '1px solid #E5E7EB',
                        backgroundColor: isSelected ? '#FFF8F8' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? '#FFEBEE' : '#F3F4F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? '#D32F2F' : '#6B7280'
                        }}>
                          <Car size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#D32F2F' : '#1F2937' }}>
                            {srv.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                            {srv.subtitle}
                          </div>
                        </div>
                      </div>

                      {/* Radio Checked Icon */}
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: isSelected ? 'none' : '1.5px solid #D1D5DB',
                        backgroundColor: isSelected ? '#D32F2F' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🚀 NÚT CTA ĐĂNG KÝ THÀNH VIÊN */}
            <button
              onClick={handleOpenPayment}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #E53935 0%, #D32F2F 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 20px',
                fontSize: '15px',
                fontWeight: '800',
                letterSpacing: '0.3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 18px rgba(211, 47, 47, 0.35)',
                marginBottom: '14px'
              }}
            >
              <span>XÁC NHẬN ĐÓNG PHÍ 300.000đ</span>
              <ChevronRight size={18} strokeWidth={3} />
            </button>

            {/* Điều khoản */}
            <div style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#9CA3AF',
              lineHeight: '1.5',
              padding: '0 10px'
            }}>
              Bằng việc đăng ký, bạn đồng ý với Điều khoản sử dụng và Phí thành viên đối tác 300.000đ/năm
            </div>
          </>
        )}
      </div>

      {/* 💳 MODAL VIETQR THANH TOÁN 300K CHUẨN THEO ẢNH USER */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '380px',
            width: '100%',
            maxHeight: '92dvh',
            overflowY: 'auto',
            padding: 'clamp(16px, 4.5vw, 22px) clamp(12px, 3.5vw, 18px)',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.25s ease'
          }}>
            {/* Nút Đóng */}
            <button
              onClick={() => { setShowQrModal(false); setSubmitSuccess(false); }}
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
                color: '#4B5563',
                touchAction: 'manipulation'
              }}
            >
              <X size={18} />
            </button>

            {!submitSuccess ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    backgroundColor: '#FFEBEE',
                    color: '#D32F2F',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    marginBottom: '8px'
                  }}>
                    <QrCode size={14} /> Phí kích hoạt tài khoản
                  </div>
                  <h3 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: '800', color: '#111827' }}>
                    QUÉT MÃ VIETQR
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Phí thường niên thành viên tài xế: <strong>{Number(systemConfig?.amount || 300000).toLocaleString('vi-VN')}đ</strong>
                  </p>
                </div>

                {/* Khung VietQR VIB Xanh Lá Chuẩn Mockup */}
                <div style={{
                  background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                  padding: '12px',
                  borderRadius: '18px',
                  marginBottom: '14px'
                }}>
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '14px 10px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {/* Header VietQR + VIB */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#DC2626', fontSize: '15px' }}>Viet<span style={{ color: '#2563EB' }}>QR</span></span>
                      <span style={{ fontWeight: '800', color: '#00529C', fontSize: '15px' }}>{bankName}</span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#111827', textTransform: 'uppercase' }}>
                      {accountName}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563EB', letterSpacing: '1px', marginTop: '2px' }}>
                      {accountNumber}
                    </div>

                    {/* Mã QR đỏ chuẩn */}
                    <div style={{
                      margin: '10px auto',
                      width: 'clamp(140px, 44vw, 175px)',
                      height: 'clamp(140px, 44vw, 175px)',
                      backgroundColor: '#FFFFFF',
                      padding: '6px',
                      borderRadius: '12px',
                      border: '1px solid #F3F4F6'
                    }}>
                      <img 
                        src={qrImageUrl} 
                        alt="Mã VietQR 300.000đ"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Số tiền 300.000đ */}
                    <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: '10px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#111827' }}>
                        {Number(feeAmount).toLocaleString('vi-VN')} <span style={{ textDecoration: 'underline' }}>đ</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                        {transferNote}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nút bấm Đã Chuyển Khoản Xong */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(22,101,52,0.3)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{isSubmitting ? 'Đang gửi hồ sơ...' : 'TÔI ĐÃ CHUYỂN KHOẢN 300K'}</span>
                </button>
              </>
            ) : (
              /* MÀN BÁO THÀNH CÔNG */
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                  GỬI HỒ SƠ THÀNH CÔNG!
                </h3>
                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.6', marginBottom: '20px' }}>
                  Hồ sơ và hóa đơn phí kích hoạt <strong>300.000đ</strong> của bạn đã được chuyển tới Admin hệ thống. Tài khoản sẽ được kích hoạt trong ít phút.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setShowQrModal(false);
                      if (onNavigate) onNavigate('profile');
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#D32F2F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Xem hồ sơ tài xế
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
