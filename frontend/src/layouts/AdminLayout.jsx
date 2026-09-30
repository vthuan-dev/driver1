import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, Car, Sliders, Smartphone, CheckCircle2, 
  XCircle, Trash2, Plus, Sparkles, RefreshCw, Star, ShieldAlert, 
  DollarSign, TrendingUp, AlertTriangle, ShieldCheck, Power, Search, LogOut,
  Bell, Volume2, VolumeX, Clock, ChevronLeft, ChevronRight, Menu, X,
  Radio, MapPin, Phone, RotateCcw, Check, LayoutGrid, List, UserCheck,
  KeyRound, Lock, Eye, EyeOff
} from 'lucide-react';
import { api } from '../services/api';
import { useDriver } from '../context/DriverContext';
import AdminLoginScreen from '../pages/admin/AdminLoginScreen';

export default function AdminLayout({ onSwitchToDriverApp }) {
  const { refreshDriver, refreshTripCounts } = useDriver();

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 860);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 860;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Phiên đăng nhập Quản trị viên (Admin)
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_user');
    setAdminUser(null);
  };

  // Modal Đổi Mật Khẩu Admin
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!passwordForm.newPassword || passwordForm.newPassword.trim().length < 4) {
      setPassError('Mật khẩu mới phải có ít nhất 4 ký tự');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    try {
      setSavingPass(true);
      const res = await api.changeAdminPassword({
        admin_id: adminUser?.id,
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      setPassSuccess(res.message || 'Đổi mật khẩu Quản trị viên thành công!');
      if (adminUser) {
        const updated = { ...adminUser, password: passwordForm.newPassword };
        localStorage.setItem('admin_user', JSON.stringify(updated));
        setAdminUser(updated);
      }
      showNotification('Đổi mật khẩu Quản trị viên thành công!', 'success');

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPassSuccess('');
      }, 1500);
    } catch (err) {
      setPassError(err.message || 'Mật khẩu hiện tại không chính xác');
    } finally {
      setSavingPass(false);
    }
  };

  const getAdminTabFromUrl = () => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/admin/drivers')) return 'drivers';
    if (pathname.includes('/admin/active-trips') || pathname.includes('/admin/live-trips')) return 'active_trips';
    if (pathname.includes('/admin/trips')) return 'trips';
    if (pathname.includes('/admin/metrics')) return 'metrics';
    if (pathname.includes('/admin/overview')) return 'overview';

    // Hash fallback
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('drivers')) return 'drivers';
    if (hash.includes('active-trips') || hash.includes('live-trips')) return 'active_trips';
    if (hash.includes('trips')) return 'trips';
    if (hash.includes('metrics')) return 'metrics';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getAdminTabFromUrl);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (isMobile) setSidebarOpen(false);
    const targetPath = tab === 'overview' ? '/admin' : tab === 'active_trips' ? '/admin/active-trips' : `/admin/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      setActiveTab(getAdminTabFromUrl());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);
  const [overview, setOverview] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  // Selected driver for Buffing / Editing Metrics (Đồng bộ theo tài xế thực từ DB)
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const selectedDriver = drivers.find(d => d.id === Number(selectedDriverId)) || drivers[0] || {};

  // Form states - Hoàn toàn đồng bộ dữ liệu thật, không dùng giá trị ảo mặc định
  const [metricForm, setMetricForm] = useState({
    add_trips: '',
    completion_rate: '',
    experience: ''
  });

  const [incomeForm, setIncomeForm] = useState({
    add_income: '',
    add_daily_trips: ''
  });

  const [ratingForm, setRatingForm] = useState({
    rating: '',
    rating_count: '',
    customer_name: '',
    comment: ''
  });

  const [newTripForm, setNewTripForm] = useState({
    pickup_location: '',
    dropoff_location: '',
    distance_km: '',
    estimated_minutes: '',
    price: '',
    service_tags: ['Lái xe hộ'],
    customer_name: '',
    customer_phone: '',
    is_virtual: false
  });

  const [driverFilter, setDriverFilter] = useState('all'); // 'all', 'pending', 'active', 'blocked'

  // Phân trang & lọc cuốc xe (Tab 3: Trips)
  const [tripPage, setTripPage] = useState(1);
  const [tripPageSize, setTripPageSize] = useState(10);
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('all'); // 'all', 'new', 'accepted', 'completed', 'virtual'

  // Phân trang & lọc Tài xế đang nhận cuốc (Tab: Active Trips)
  const [activeTripSearch, setActiveTripSearch] = useState('');
  const [activeTripStatusFilter, setActiveTripStatusFilter] = useState('accepted'); // 'accepted', 'completed', 'all'
  const [activeTripTypeFilter, setActiveTripTypeFilter] = useState('all'); // 'all', 'real', 'virtual'
  const [activeTripViewMode, setActiveTripViewMode] = useState('card'); // 'card' | 'table'
  const [activeTripPage, setActiveTripPage] = useState(1);
  const [activeTripPageSize, setActiveTripPageSize] = useState(9);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPendingCountRef = useRef(null);

  // Quản lý phê duyệt hồ sơ giấy tờ tài xế (CCCD, GPLX, Đăng kiểm, Bảo hiểm)
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocDriver, setSelectedDocDriver] = useState(null);
  const [docChecklist, setDocChecklist] = useState([]);
  const [isSavingDocs, setIsSavingDocs] = useState(false);

  // Âm thanh chuông báo Web Audio API (Ting-ting chuẩn thanh lịch)
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // Note D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // Note A5
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('AudioContext notification:', e);
    }
  };

  const showNotification = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  };

  // Hàm đồng bộ form theo dữ liệu thật của tài xế đang chọn
  const syncDriverForms = (target) => {
    if (!target) return;
    setMetricForm({
      add_trips: '',
      completion_rate: target.completion_rate !== undefined && target.completion_rate !== null ? target.completion_rate : 100,
      experience: target.experience || ''
    });
    setIncomeForm({
      add_income: '',
      add_daily_trips: ''
    });
    setRatingForm({
      rating: target.rating !== undefined && target.rating !== null ? target.rating : 5.0,
      rating_count: target.rating_count !== undefined && target.rating_count !== null ? target.rating_count : 0,
      customer_name: '',
      comment: ''
    });
  };

  const handleSelectDriver = (id) => {
    setSelectedDriverId(id);
    const target = drivers.find(d => d.id === Number(id));
    if (target) {
      syncDriverForms(target);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [overRes, drivRes, tripRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAllDrivers(),
        api.getAllTrips()
      ]);
      setOverview(overRes.data);
      setDrivers(drivRes.data);
      setTrips(tripRes.data);

      const target = drivRes.data.find(d => d.id === Number(selectedDriverId)) || drivRes.data[0];
      if (target) {
        if (!selectedDriverId) {
          setSelectedDriverId(target.id);
        }
        syncDriverForms(target);
      }
      // Đồng bộ ngay lập tức sang Context của ứng dụng di động tài xế
      refreshDriver();
      refreshTripCounts();
    } catch (err) {
      console.error('Lỗi load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Tự động kiểm tra định kỳ (Polling 12s) khi có tài xế gửi yêu cầu đăng ký mới
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const drivRes = await api.getAllDrivers();
        if (drivRes.data && Array.isArray(drivRes.data)) {
          setDrivers(drivRes.data);
          const currentPending = drivRes.data.filter(d => d.status === 'pending').length;
          if (prevPendingCountRef.current !== null && currentPending > prevPendingCountRef.current) {
            if (soundEnabled) {
              playNotificationSound();
            }
            showNotification(`🔔 Có ${currentPending - prevPendingCountRef.current} tài xế vừa gửi yêu cầu đăng ký mới (300k)!`, 'success');
          }
          prevPendingCountRef.current = currentPending;
        }
      } catch {
        // im lặng khi lỗi mạng nền
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // YÊU CẦU 1 & 3: Thêm cuốc xe thật / ảo
  const handleCreateTrip = async (isVirtual = false) => {
    if (!newTripForm.pickup_location.trim() || !newTripForm.dropoff_location.trim() || !newTripForm.price) {
      showNotification('Vui lòng nhập Điểm đón, Điểm trả và Giá cước', 'error');
      return;
    }
    try {
      if (isVirtual) {
        await api.createVirtualTrip({
          ...newTripForm,
          is_virtual: true
        });
        showNotification('Đã tạo cuốc xe ảo thành công! Cuốc đã xuất hiện trên Feed Màn 3.');
      } else {
        await api.createTrip(newTripForm);
        showNotification('Đã thêm cuốc xe thật thành công!');
      }
      setNewTripForm({
        pickup_location: '',
        dropoff_location: '',
        distance_km: '',
        estimated_minutes: '',
        price: '',
        service_tags: ['Lái xe hộ'],
        customer_name: '',
        customer_phone: '',
        is_virtual: false
      });
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleAutoGenerateVirtual = async () => {
    try {
      const res = await api.autoGenerateVirtualTrips();
      showNotification(res.message);
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // YÊU CẦU 2: Duyệt tài xế 300k
  const handleApproveDriver = async (id) => {
    try {
      const res = await api.approveDriver(id);
      showNotification(res.message);
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // YÊU CẦU 5: Khóa / Xóa user
  const handleToggleBlock = async (id) => {
    try {
      const res = await api.toggleBlockDriver(id);
      showNotification(res.message);
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài xế này khỏi hệ thống?')) return;
    try {
      const res = await api.deleteDriver(id);
      showNotification(res.message);
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // QUẢN LÝ DUYỆT GIẤY TỜ TÀI XẾ (CCCD, GPLX, Đăng kiểm, Bảo hiểm)
  const ALL_DOC_NAMES = ['CCCD/CMND', 'Giấy phép lái xe', 'Đăng kiểm xe', 'Bảo hiểm xe'];

  const handleOpenDocModal = (driver) => {
    setSelectedDocDriver(driver);
    const verified = Array.isArray(driver.verified_docs) ? [...driver.verified_docs] : [];
    setDocChecklist(verified);
    setShowDocModal(true);
  };

  const handleToggleDoc = (docName) => {
    setDocChecklist(prev => 
      prev.includes(docName)
        ? prev.filter(item => item !== docName)
        : [...prev, docName]
    );
  };

  const handleSelectAllDocs = () => {
    setDocChecklist(ALL_DOC_NAMES);
  };

  const handleClearAllDocs = () => {
    setDocChecklist([]);
  };

  const handleSaveDriverDocs = async () => {
    if (!selectedDocDriver) return;
    try {
      setIsSavingDocs(true);
      const res = await api.updateDriverDocuments(selectedDocDriver.id, {
        verified_docs: docChecklist
      });
      showNotification(res.message || 'Cập nhật phê duyệt giấy tờ thành công!');
      setShowDocModal(false);
      await loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsSavingDocs(false);
    }
  };

  // YÊU CẦU 4: Can thiệp số cuốc ảo, tỷ lệ, kinh nghiệm (Màn 2)
  const handleUpdateMetrics = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateDriverMetrics(selectedDriverId, metricForm);
      showNotification(res.message);
      setMetricForm(prev => ({ ...prev, add_trips: '' }));
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // YÊU CẦU 6: Thêm thu nhập & cuốc xe ngày (Màn 3)
  const handleUpdateIncome = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateDriverIncome(selectedDriverId, incomeForm);
      showNotification(res.message);
      setIncomeForm(prev => ({ ...prev, add_income: '', add_daily_trips: '' }));
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // YÊU CẦU 7: Thêm đánh giá tài xế
  const handleUpdateRating = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateDriverRating(selectedDriverId, ratingForm);
      showNotification(res.message);
      setRatingForm(prev => ({ ...prev, comment: '', customer_name: '' }));
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await api.deleteTrip(id);
      showNotification('Đã xóa cuốc xe');
      loadAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const filteredDrivers = drivers.filter(d => {
    if (driverFilter === 'all') return true;
    return d.status === driverFilter;
  });

  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const pendingCount = pendingDrivers.length;

  // Lọc và Phân trang Danh sách cuốc xe
  const filteredTrips = trips.filter(t => {
    if (tripStatusFilter === 'virtual' && !t.is_virtual) return false;
    if (tripStatusFilter === 'real' && t.is_virtual) return false;
    if (['new', 'accepted', 'completed', 'cancelled'].includes(tripStatusFilter) && t.status !== tripStatusFilter) return false;

    if (tripSearch.trim()) {
      const q = tripSearch.trim().toLowerCase();
      const matchId = String(t.id).includes(q);
      const matchPickup = (t.pickup_location || '').toLowerCase().includes(q);
      const matchDropoff = (t.dropoff_location || '').toLowerCase().includes(q);
      const matchCustomer = (t.customer_name || '').toLowerCase().includes(q) || (t.customer_phone || '').toLowerCase().includes(q);
      if (!matchId && !matchPickup && !matchDropoff && !matchCustomer) return false;
    }
    return true;
  });

  const totalTripPages = Math.max(1, Math.ceil(filteredTrips.length / tripPageSize));
  const currentTripPage = Math.min(Math.max(1, tripPage), totalTripPages);
  const paginatedTrips = filteredTrips.slice((currentTripPage - 1) * tripPageSize, currentTripPage * tripPageSize);

  const getPaginationPages = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  };

  // Thao tác với cuốc xe đang nhận
  const handleUnassignTrip = async (id) => {
    if (!window.confirm('Bạn có chắc muốn thu hồi cuốc xe này và chuyển lại về trạng thái "Chờ tài xế nhận"?')) return;
    try {
      const res = await api.unassignTrip(id);
      showNotification(res.message);
      loadAllData();
      if (refreshTripCounts) refreshTripCounts();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCompleteTrip = async (id) => {
    if (!window.confirm('Xác nhận đánh dấu cuốc xe này đã hoàn thành?')) return;
    try {
      const res = await api.adminCompleteTrip(id);
      showNotification(res.message);
      loadAllData();
      if (refreshTripCounts) refreshTripCounts();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Lọc và Phân trang Tài xế đang nhận cuốc
  const assignedTrips = trips.filter(t => t.driver_id != null || t.driver != null);

  const filteredAssignedTrips = assignedTrips.filter(t => {
    if (activeTripStatusFilter === 'accepted' && t.status !== 'accepted') return false;
    if (activeTripStatusFilter === 'completed' && t.status !== 'completed') return false;

    if (activeTripTypeFilter === 'virtual' && !t.is_virtual) return false;
    if (activeTripTypeFilter === 'real' && t.is_virtual) return false;

    if (activeTripSearch.trim()) {
      const q = activeTripSearch.trim().toLowerCase();
      const driver = t.driver || drivers.find(d => d.id === t.driver_id) || {};
      const matchDriverName = (driver.full_name || '').toLowerCase().includes(q);
      const matchDriverPhone = (driver.phone || '').toLowerCase().includes(q);
      const matchVehicle = (driver.vehicle_info || '').toLowerCase().includes(q);
      const matchId = String(t.id).toLowerCase().includes(q);
      const matchPickup = (t.pickup_location || '').toLowerCase().includes(q);
      const matchDropoff = (t.dropoff_location || '').toLowerCase().includes(q);
      const matchCustomer = (t.customer_name || '').toLowerCase().includes(q) || (t.customer_phone || '').toLowerCase().includes(q);
      
      if (!matchDriverName && !matchDriverPhone && !matchVehicle && !matchId && !matchPickup && !matchDropoff && !matchCustomer) {
        return false;
      }
    }
    return true;
  });

  const totalActiveTripPages = Math.max(1, Math.ceil(filteredAssignedTrips.length / activeTripPageSize));
  const currentActiveTripPage = Math.min(Math.max(1, activeTripPage), totalActiveTripPages);
  const paginatedAssignedTrips = filteredAssignedTrips.slice((currentActiveTripPage - 1) * activeTripPageSize, currentActiveTripPage * activeTripPageSize);

  const liveAcceptedCount = assignedTrips.filter(t => t.status === 'accepted').length;
  const liveDriversCount = new Set(assignedTrips.filter(t => t.status === 'accepted').map(t => t.driver_id || t.driver?.id)).size;
  const liveRevenueSum = assignedTrips.filter(t => t.status === 'accepted').reduce((sum, t) => sum + Number(t.price || 0), 0);
  const completedAssignedCount = assignedTrips.filter(t => t.status === 'completed').length;

  // 🛡️ BẢO MẬT ADMIN: Chưa đăng nhập Quản trị viên -> Hiển thị Màn hình Đăng nhập Admin
  if (!adminUser) {
    return (
      <AdminLoginScreen 
        onLoginSuccess={(user) => {
          setAdminUser(user);
        }}
        onBackToHome={onSwitchToDriverApp}
      />
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', backgroundColor: '#F3F4F6', position: 'relative' }}>
      
      {/* ⬛ BACKDROP KHI MỞ MENU TRÊN MOBILE */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 998
          }}
        />
      )}

      {/* ⬛ SIDEBAR ADMIN SANG TRỌNG (CỐ ĐỊNH FIXED CHO CẢ DESKTOP & MOBILE DRAWER) */}
      <aside style={{
        width: '270px',
        backgroundColor: '#111827',
        color: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isMobile && sidebarOpen ? '4px 0 30px rgba(0,0,0,0.5)' : (isMobile ? 'none' : '1px 0 0 rgba(255,255,255,0.06)'),
        height: '100dvh',
        overflowY: 'auto'
      }}>
        {/* Brand */}
        <div style={{
          padding: '20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            backgroundColor: '#D32F2F',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '20px',
            color: '#FFFFFF',
            flexShrink: 0
          }}>
            L
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.3px', color: '#FFFFFF' }}>
              Laixeho24h
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600' }}>
              ADMIN CONTROL CENTER
            </div>
          </div>

          {/* Nút Đóng sidebar trên mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Menu Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => switchTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'overview' ? '#D32F2F' : 'transparent',
              color: activeTab === 'overview' ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <LayoutDashboard size={18} />
            <span>Tổng quan hệ thống</span>
          </button>

          <button
            onClick={() => switchTab('drivers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'drivers' ? '#D32F2F' : 'transparent',
              color: activeTab === 'drivers' ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={18} />
              <span>Duyệt & Quản lý Tài xế</span>
            </div>
            {overview?.pendingDrivers > 0 && (
              <span style={{
                backgroundColor: '#F59E0B',
                color: '#000000',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '10px'
              }}>
                {overview.pendingDrivers}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('trips')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'trips' ? '#D32F2F' : 'transparent',
              color: activeTab === 'trips' ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Car size={18} />
            <span>Quản lý & Tạo cuốc xe</span>
          </button>

          <button
            onClick={() => switchTab('active_trips')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'active_trips' ? '#D32F2F' : 'transparent',
              color: activeTab === 'active_trips' ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Radio size={18} />
              <span>Tài xế đang nhận cuốc</span>
            </div>
            {liveAcceptedCount > 0 && (
              <span style={{
                backgroundColor: '#22C55E',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                {liveAcceptedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('metrics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'metrics' ? '#D32F2F' : 'transparent',
              color: activeTab === 'metrics' ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Sliders size={18} />
            <span>Can thiệp chỉ số ảo (7 Tools)</span>
          </button>
        </nav>

        {/* Khu vực Thông tin Admin & Nút Đăng xuất */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '14px',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(220,38,38,0.4)',
              flexShrink: 0
            }}>
              AD
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {adminUser?.full_name || 'Quản trị viên'}
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                <span>Toàn quyền Admin</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPassError('');
              setPassSuccess('');
              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setShowPasswordModal(true);
            }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#FBBF24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '9px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)'}
          >
            <KeyRound size={15} />
            <span>ĐỔI MẬT KHẨU</span>
          </button>
          <button
            onClick={handleAdminLogout}
            style={{
              width: '100%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
          >
            <LogOut size={16} />
            <span>ĐĂNG XUẤT</span>
          </button>
        </div>
      </aside>

      {/* ⚪ MAIN WORKSPACE ADMIN */}
      <div style={{
        flex: 1,
        minWidth: 0,
        marginLeft: isMobile ? 0 : '270px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh'
      }}>
        
        {/* Top Header */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: isMobile ? '12px 14px' : '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {/* Hamburger button on Mobile */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Mở menu quản trị"
                style={{
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111827',
                  flexShrink: 0,
                  touchAction: 'manipulation'
                }}
              >
                <Menu size={20} />
              </button>
            )}

            <div style={{ minWidth: 0 }}>
              <h1 style={{ 
                fontSize: isMobile ? '16px' : '20px', 
                fontWeight: '800', 
                color: '#111827',
                lineHeight: '1.25',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activeTab === 'overview' && 'Bảng điều khiển tổng quan'}
                {activeTab === 'drivers' && 'Duyệt tài xế (300k) & User'}
                {activeTab === 'trips' && 'Quản lý cuốc xe (Thật & Ảo)'}
                {activeTab === 'active_trips' && 'Theo dõi Tài xế đang nhận cuốc (Live)'}
                {activeTab === 'metrics' && 'Can thiệp chỉ số tài xế'}
              </h1>
              {!isMobile && (
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  Hệ thống kết nối MySQL 9.4 trực tiếp - Dữ liệu cập nhật thời gian thực
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexShrink: 0 }}>
            
            {/* 🔔 CHUÔNG THÔNG BÁO TÀI XẾ YÊU CẦU ĐĂNG KÝ */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                title="Thông báo yêu cầu đăng ký tài xế mới"
                style={{
                  position: 'relative',
                  backgroundColor: showNotificationDropdown ? '#FEE2E2' : '#F9FAFB',
                  color: showNotificationDropdown ? '#DC2626' : '#374151',
                  border: showNotificationDropdown ? '1.5px solid #FCA5A5' : '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: isMobile ? '7px 10px' : '8px 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: showNotificationDropdown ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none',
                  touchAction: 'manipulation'
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Bell 
                    size={17} 
                    className={pendingCount > 0 ? 'bell-ring' : ''} 
                    color={pendingCount > 0 ? '#DC2626' : '#4B5563'} 
                  />
                  {pendingCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-7px',
                      right: '-8px',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '1px 5px',
                      fontSize: '10px',
                      fontWeight: '800',
                      lineHeight: '12px',
                      boxShadow: '0 2px 6px rgba(220,38,38,0.5)'
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </div>
                {!isMobile && <span>Thông báo</span>}
              </button>

              {/* DROPDOWN POPOVER DANH SÁCH THÔNG BÁO */}
              {showNotificationDropdown && (
                <>
                  <div 
                    onClick={() => setShowNotificationDropdown(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 45 }}
                  />

                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: isMobile ? '-75px' : 0,
                    width: isMobile ? 'calc(100vw - 28px)' : '380px',
                    maxWidth: '380px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06)',
                    border: '1px solid #E5E7EB',
                    zIndex: 50,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s ease'
                  }}>
                    {/* Header Popover */}
                    <div style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #F3F4F6',
                      backgroundColor: '#F9FAFB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Bell size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#111827' }}>
                            Yêu cầu Đăng ký Tài xế
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            {pendingCount > 0 ? `${pendingCount} hồ sơ đang chờ xét duyệt 300k` : 'Tất cả hồ sơ đã được xử lý'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? 'Tắt âm chuông thông báo' : 'Bật âm chuông thông báo'}
                        style={{
                          background: soundEnabled ? '#DCFCE7' : '#F3F4F6',
                          border: soundEnabled ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
                          color: soundEnabled ? '#15803D' : '#9CA3AF',
                          cursor: 'pointer',
                          padding: '5px 8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}
                      >
                        {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                        <span>{soundEnabled ? 'Chuông: Bật' : 'Chuông: Tắt'}</span>
                      </button>
                    </div>

                    {/* Danh sách yêu cầu */}
                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                      {pendingDrivers.length === 0 ? (
                        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#DCFCE7',
                            color: '#16A34A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 10px auto'
                          }}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>
                            Không có hồ sơ nào chờ duyệt
                          </div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                            Hệ thống đã cập nhật tất cả hồ sơ tài xế mới nhất.
                          </div>
                        </div>
                      ) : (
                        pendingDrivers.map((d) => (
                          <div
                            key={d.id}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #F3F4F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'background-color 0.15s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                              switchTab('drivers');
                              setDriverFilter('pending');
                              setShowNotificationDropdown(false);
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: '#FEF3C7',
                                color: '#D97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '15px',
                                flexShrink: 0
                              }}>
                                {d.full_name ? d.full_name.charAt(0).toUpperCase() : 'T'}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {d.full_name}
                                  </span>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    backgroundColor: '#DCFCE7',
                                    color: '#15803D',
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                    flexShrink: 0
                                  }}>
                                    300K
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {d.phone} • {d.area || 'Chưa cập nhật'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={11} />
                                  <span>{new Date(d.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(d.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Nút Duyệt Ngay trực tiếp */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveDriver(d.id);
                              }}
                              style={{
                                backgroundColor: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                                transition: 'opacity 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                              Duyệt ngay
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer Popover: Đi tới màn duyệt tài xế */}
                    {pendingDrivers.length > 0 && (
                      <div style={{
                        padding: '10px 16px',
                        backgroundColor: '#F9FAFB',
                        borderTop: '1px solid #F3F4F6',
                        textAlign: 'center'
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            switchTab('drivers');
                            setDriverFilter('pending');
                            setShowNotificationDropdown(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#D32F2F',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>Xem toàn bộ danh sách chờ duyệt ({pendingCount})</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={loadAllData}
              disabled={loading}
              title="Làm mới dữ liệu"
              style={{
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: isMobile ? '8px 10px' : '8px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              {!isMobile && <span>Làm mới</span>}
            </button>

            <button
              onClick={() => {
                setPassError('');
                setPassSuccess('');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordModal(true);
              }}
              title="Đổi mật khẩu quản trị viên"
              style={{
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                border: '1px solid #FDE68A',
                borderRadius: '10px',
                padding: isMobile ? '8px 10px' : '8px 14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <KeyRound size={15} />
              {!isMobile && <span>Đổi mật khẩu</span>}
            </button>

            <button
              onClick={handleAdminLogout}
              title="Đăng xuất khỏi hệ thống quản trị"
              style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: isMobile ? '8px 10px' : '8px 14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <LogOut size={15} />
              {!isMobile && <span>Đăng xuất</span>}
            </button>
          </div>
        </header>

        {/* Thông Báo Toast */}
        {msg.text && (
          <div style={{
            margin: isMobile ? '12px 14px 0 14px' : '16px 28px 0 28px',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: msg.type === 'error' ? '#FEE2E2' : '#DCFCE7',
            color: msg.type === 'error' ? '#B91C1C' : '#15803D',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: `1px solid ${msg.type === 'error' ? '#F87171' : '#86EFAC'}`,
            animation: 'fadeIn 0.2s ease'
          }}>
            {msg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Nội Dung Theo Tab */}
        <div style={{ padding: isMobile ? '14px 12px' : '24px 28px', flex: 1, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          
          {/* ========================================================= */}
          {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div>
              {/* Stat Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? '10px' : '18px',
                marginBottom: isMobile ? '18px' : '28px'
              }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '14px 12px' : '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', fontWeight: '600' }}>Tổng số tài xế</div>
                  <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                    {overview?.totalDrivers || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', fontWeight: '600' }}>
                    🟢 {overview?.onlineDrivers || 0} online
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '14px 12px' : '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', fontWeight: '600' }}>Hồ sơ chờ duyệt</div>
                  <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>
                    {overview?.pendingDrivers || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#B45309', marginTop: '4px', fontWeight: '600' }}>
                    Cần xác nhận 300k
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '14px 12px' : '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', fontWeight: '600' }}>Tổng cuốc hệ thống</div>
                  <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                    {overview?.totalTrips || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', fontWeight: '600' }}>
                    Gồm {overview?.virtualTrips || 0} cuốc ảo
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '14px 12px' : '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', fontWeight: '600' }}>Doanh thu phí 300k</div>
                  <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '800', color: '#D32F2F', marginTop: '4px' }}>
                    {(overview?.totalRegistrationRevenue || 0).toLocaleString('vi-VN')}đ
                  </div>
                  <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', fontWeight: '600' }}>
                    Qua VietQR VIB
                  </div>
                </div>
              </div>

              {/* Bảng xem nhanh tài xế */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '16px 14px' : '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Tài xế trong hệ thống
                  </h3>
                  <button
                    onClick={() => switchTab('drivers')}
                    style={{ background: 'none', border: 'none', color: '#D32F2F', fontWeight: '700', fontSize: '13px', cursor: 'pointer', padding: '4px 0' }}
                  >
                    Xem tất cả & Duyệt →
                  </button>
                </div>

                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ minWidth: '650px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontWeight: '700' }}>
                        <th style={{ padding: '10px' }}>Tài xế</th>
                        <th style={{ padding: '10px' }}>Số điện thoại</th>
                        <th style={{ padding: '10px' }}>Khu vực</th>
                        <th style={{ padding: '10px' }}>Tổng cuốc</th>
                        <th style={{ padding: '10px' }}>Tỷ lệ %</th>
                        <th style={{ padding: '10px' }}>Kinh nghiệm</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.slice(0, 5).map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px 10px', fontWeight: '700', color: '#111827' }}>{d.full_name}</td>
                          <td style={{ padding: '12px 10px' }}>{d.phone}</td>
                          <td style={{ padding: '12px 10px' }}>{d.area}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '700', color: '#D32F2F' }}>{d.total_trips}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '700' }}>{d.completion_rate}%</td>
                          <td style={{ padding: '12px 10px' }}>{d.experience}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              backgroundColor: d.status === 'active' ? '#DCFCE7' : d.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                              color: d.status === 'active' ? '#15803D' : d.status === 'pending' ? '#B45309' : '#B91C1C',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              {d.status === 'active' ? 'Đang hoạt động' : d.status === 'pending' ? 'Chờ duyệt 300k' : 'Đã khóa'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: QUẢN LÝ & DUYỆT TÀI XẾ (YÊU CẦU 2 & 5) */}
          {/* ========================================================= */}
          {activeTab === 'drivers' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '16px 12px' : '24px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                  <button
                    onClick={() => setDriverFilter('all')}
                    style={{
                      padding: isMobile ? '7px 12px' : '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: driverFilter === 'all' ? '#111827' : '#FFFFFF',
                      color: driverFilter === 'all' ? '#FFFFFF' : '#374151',
                      fontWeight: '700',
                      fontSize: isMobile ? '12px' : '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Tất cả ({drivers.length})
                  </button>
                  <button
                    onClick={() => setDriverFilter('pending')}
                    style={{
                      padding: isMobile ? '7px 12px' : '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: driverFilter === 'pending' ? '#D97706' : '#FFFFFF',
                      color: driverFilter === 'pending' ? '#FFFFFF' : '#374151',
                      fontWeight: '700',
                      fontSize: isMobile ? '12px' : '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Chờ duyệt 300k ({drivers.filter(d => d.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setDriverFilter('active')}
                    style={{
                      padding: isMobile ? '7px 12px' : '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: driverFilter === 'active' ? '#16A34A' : '#FFFFFF',
                      color: driverFilter === 'active' ? '#FFFFFF' : '#374151',
                      fontWeight: '700',
                      fontSize: isMobile ? '12px' : '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Đang hoạt động ({drivers.filter(d => d.status === 'active').length})
                  </button>
                  <button
                    onClick={() => setDriverFilter('blocked')}
                    style={{
                      padding: isMobile ? '7px 12px' : '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: driverFilter === 'blocked' ? '#DC2626' : '#FFFFFF',
                      color: driverFilter === 'blocked' ? '#FFFFFF' : '#374151',
                      fontWeight: '700',
                      fontSize: isMobile ? '12px' : '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Bị khóa ({drivers.filter(d => d.status === 'blocked').length})
                  </button>
                </div>
              </div>

              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ minWidth: '760px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#4B5563', fontWeight: '700' }}>
                      <th style={{ padding: '12px' }}>ID</th>
                      <th style={{ padding: '12px' }}>Họ và tên</th>
                      <th style={{ padding: '12px' }}>Số điện thoại</th>
                      <th style={{ padding: '12px' }}>Khu vực</th>
                      <th style={{ padding: '12px' }}>Phương tiện</th>
                      <th style={{ padding: '12px' }}>Giấy tờ xác minh</th>
                      <th style={{ padding: '12px' }}>Phí 300k</th>
                      <th style={{ padding: '12px' }}>Trạng thái</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '14px 12px', fontWeight: '700' }}>#{d.id}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: '700', color: '#111827' }}>{d.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>Rating: {d.rating}⭐ ({d.rating_count} đánh giá)</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>{d.phone}</td>
                        <td style={{ padding: '14px 12px' }}>{d.area}</td>
                        <td style={{ padding: '14px 12px' }}>{d.vehicle_info}</td>
                        <td style={{ padding: '14px 12px' }}>
                          {(() => {
                            const verified = Array.isArray(d.verified_docs) ? d.verified_docs : [];
                            const count = verified.length;
                            const hasDetails = d.document_details && Object.keys(d.document_details).length > 0;
                            return (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: count === 4 ? '#DCFCE7' : count > 0 ? '#FEF3C7' : '#F3F4F6',
                                    color: count === 4 ? '#15803D' : count > 0 ? '#B45309' : '#6B7280',
                                    padding: '3px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: '800'
                                  }}>
                                    <ShieldCheck size={13} />
                                    {count}/4 Đã duyệt
                                  </span>
                                  {hasDetails && count < 4 && (
                                    <span style={{ fontSize: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                      Có số mới
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleOpenDocModal(d)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#2563EB',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline',
                                    display: 'block'
                                  }}
                                >
                                  Xem & duyệt giấy tờ
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ color: '#16A34A', fontWeight: '700' }}>300.000đ</span>
                          <div style={{ fontSize: '10px', color: '#6B7280' }}>VietQR VIB</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            backgroundColor: d.status === 'active' ? '#DCFCE7' : d.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                            color: d.status === 'active' ? '#15803D' : d.status === 'pending' ? '#B45309' : '#B91C1C',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800'
                          }}>
                            {d.status === 'active' ? 'Đã kích hoạt' : d.status === 'pending' ? 'Chờ duyệt 300k' : 'Đã khóa'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleOpenDocModal(d)}
                              style={{
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #BFDBFE',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Duyệt 4 loại giấy tờ (CCCD, GPLX, Đăng kiểm, Bảo hiểm)"
                            >
                              <ShieldCheck size={13} />
                              Duyệt giấy tờ
                            </button>

                            {d.status === 'pending' && (
                              <button
                                onClick={() => handleApproveDriver(d.id)}
                                style={{
                                  backgroundColor: '#16A34A',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                Duyệt 300k
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleBlock(d.id)}
                              style={{
                                backgroundColor: d.status === 'blocked' ? '#16A34A' : '#F59E0B',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {d.status === 'blocked' ? 'Mở khóa' : 'Khóa'}
                            </button>

                            <button
                              onClick={() => handleDeleteDriver(d.id)}
                              style={{
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: QUẢN LÝ CUỐC XE (YÊU CẦU 1 & 3) */}
          {/* ========================================================= */}
          {activeTab === 'trips' && (
            <div>
              {/* Form Thêm cuốc xe thật & cuốc ảo */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '16px 14px' : '24px', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'stretch' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Thêm cuốc xe vào hệ thống (Job Feed)
                  </h3>
                  <button
                    onClick={handleAutoGenerateVirtual}
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Tự động sinh 3 cuốc ảo</span>
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                      Điểm đón khách *
                    </label>
                    <input
                      type="text"
                      value={newTripForm.pickup_location}
                      onChange={(e) => setNewTripForm({ ...newTripForm, pickup_location: e.target.value })}
                      placeholder="Ví dụ: 432 Lê Lai, TP. Thanh Hoá"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                      Điểm trả khách *
                    </label>
                    <input
                      type="text"
                      value={newTripForm.dropoff_location}
                      onChange={(e) => setNewTripForm({ ...newTripForm, dropoff_location: e.target.value })}
                      placeholder="Ví dụ: Sân bay Thọ Xuân"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                      Giá cước (VNĐ) *
                    </label>
                    <input
                      type="number"
                      value={newTripForm.price}
                      onChange={(e) => setNewTripForm({ ...newTripForm, price: e.target.value })}
                      placeholder="Ví dụ: 180000"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: '700', color: '#D32F2F' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                      Cự ly ước tính (km)
                    </label>
                    <input
                      type="number"
                      value={newTripForm.distance_km}
                      onChange={(e) => setNewTripForm({ ...newTripForm, distance_km: e.target.value })}
                      placeholder="Ví dụ: 28"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                      Thời gian ước tính (phút)
                    </label>
                    <input
                      type="number"
                      value={newTripForm.estimated_minutes}
                      onChange={(e) => setNewTripForm({ ...newTripForm, estimated_minutes: e.target.value })}
                      placeholder="Ví dụ: 35"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                      Số điện thoại khách hàng
                    </label>
                    <input
                      type="text"
                      value={newTripForm.customer_phone}
                      onChange={(e) => setNewTripForm({ ...newTripForm, customer_phone: e.target.value })}
                      placeholder="Ví dụ: 0988 888 888"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <button
                    onClick={() => handleCreateTrip(false)}
                    style={{
                      backgroundColor: '#D32F2F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <Plus size={16} />
                    <span>THÊM CUỐC XE THẬT</span>
                  </button>

                  <button
                    onClick={() => handleCreateTrip(true)}
                    style={{
                      backgroundColor: '#374151',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <Sparkles size={16} />
                    <span>TẠO THÀNH CUỐC XE ẢO</span>
                  </button>
                </div>
              </div>

              {/* Danh sách cuốc xe */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '16px 14px' : '24px', border: '1px solid #E5E7EB' }}>
                {/* Header & Bộ lọc phân trang */}
                <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        Danh sách cuốc xe
                      </h3>
                      <span style={{
                        backgroundColor: '#FEE2E2',
                        color: '#D32F2F',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {trips.length} cuốc
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Hiển thị:</span>
                      <select
                        value={tripPageSize}
                        onChange={(e) => {
                          setTripPageSize(Number(e.target.value));
                          setTripPage(1);
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#374151',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value={10}>10 cuốc / trang</option>
                        <option value={20}>20 cuốc / trang</option>
                        <option value={50}>50 cuốc / trang</option>
                        <option value={100}>100 cuốc / trang</option>
                      </select>
                    </div>
                  </div>

                  {/* Thanh tìm kiếm & Tabs lọc trạng thái */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', alignItems: isMobile ? 'stretch' : 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : '260px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="text"
                        value={tripSearch}
                        onChange={(e) => { setTripSearch(e.target.value); setTripPage(1); }}
                        placeholder="Tìm theo điểm đón, điểm trả, mã cuốc, SĐT..."
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '9px 34px 9px 36px',
                          borderRadius: '10px',
                          border: '1px solid #D1D5DB',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#FAFAFA'
                        }}
                      />
                      {tripSearch && (
                        <button
                          onClick={() => { setTripSearch(''); setTripPage(1); }}
                          title="Xóa tìm kiếm"
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9CA3AF',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            padding: '2px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: isMobile ? '4px' : '0' }}>
                      {[
                        { key: 'all', label: 'Tất cả', count: trips.length },
                        { key: 'new', label: 'Chờ nhận', count: trips.filter(t => t.status === 'new').length },
                        { key: 'accepted', label: 'Đang chạy', count: trips.filter(t => t.status === 'accepted').length },
                        { key: 'completed', label: 'Hoàn thành', count: trips.filter(t => t.status === 'completed').length },
                        { key: 'virtual', label: 'Cuốc ảo', count: trips.filter(t => t.is_virtual).length }
                      ].map(pill => {
                        const isSelected = tripStatusFilter === pill.key;
                        return (
                          <button
                            key={pill.key}
                            onClick={() => { setTripStatusFilter(pill.key); setTripPage(1); }}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #D32F2F' : '1px solid #E5E7EB',
                              backgroundColor: isSelected ? '#FEE2E2' : '#FFFFFF',
                              color: isSelected ? '#D32F2F' : '#4B5563',
                              fontSize: '12px',
                              fontWeight: isSelected ? '700' : '600',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{pill.label}</span>
                            <span style={{
                              backgroundColor: isSelected ? '#D32F2F' : '#F3F4F6',
                              color: isSelected ? '#FFFFFF' : '#6B7280',
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '1px 5px',
                              borderRadius: '10px'
                            }}>
                              {pill.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bảng danh sách cuốc xe */}
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ minWidth: '700px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#4B5563', fontWeight: '700' }}>
                        <th style={{ padding: '12px' }}>Mã cuốc</th>
                        <th style={{ padding: '12px' }}>Điểm đón</th>
                        <th style={{ padding: '12px' }}>Điểm trả</th>
                        <th style={{ padding: '12px' }}>Cước phí</th>
                        <th style={{ padding: '12px' }}>Loại cuốc</th>
                        <th style={{ padding: '12px' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTrips.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#6B7280' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Không tìm thấy cuốc xe phù hợp</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Thử đổi từ khóa tìm kiếm hoặc bấm tab "Tất cả"</div>
                          </td>
                        </tr>
                      ) : (
                        paginatedTrips.map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '12px', fontWeight: '700' }}>#{t.id}</td>
                            <td style={{ padding: '12px', color: '#D32F2F', fontWeight: '600' }}>{t.pickup_location}</td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{t.dropoff_location}</td>
                            <td style={{ padding: '12px', fontWeight: '800', color: '#D32F2F' }}>
                              {Number(t.price).toLocaleString('vi-VN')}đ
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: t.is_virtual ? '#FEF3C7' : '#EFF6FF',
                                color: t.is_virtual ? '#B45309' : '#1D4ED8',
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '3px 8px',
                                borderRadius: '6px'
                              }}>
                                {t.is_virtual ? 'CUỐC ẢO' : 'Cuốc thật'}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: t.status === 'new' ? '#DCFCE7' : t.status === 'accepted' ? '#DBEAFE' : '#F3F4F6',
                                color: t.status === 'new' ? '#15803D' : t.status === 'accepted' ? '#1E40AF' : '#4B5563',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '6px'
                              }}>
                                {t.status === 'new' ? 'Chờ tài xế nhận' : t.status === 'accepted' ? 'Đang chạy' : 'Hoàn thành'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteTrip(t.id)}
                                style={{
                                  backgroundColor: '#FEE2E2',
                                  color: '#DC2626',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  fontWeight: '700'
                                }}
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Thanh phân trang Trips */}
                {filteredTrips.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid #E5E7EB',
                    fontSize: '13px',
                    color: '#6B7280'
                  }}>
                    <div>
                      Hiển thị <span style={{ fontWeight: '700', color: '#111827' }}>{(currentTripPage - 1) * tripPageSize + 1}</span> - <span style={{ fontWeight: '700', color: '#111827' }}>{Math.min(currentTripPage * tripPageSize, filteredTrips.length)}</span> trên tổng số <span style={{ fontWeight: '700', color: '#D32F2F' }}>{filteredTrips.length}</span> cuốc
                      {filteredTrips.length !== trips.length && (
                        <span style={{ color: '#9CA3AF', marginLeft: '6px' }}>(lọc từ {trips.length} cuốc)</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                      <button
                        onClick={() => setTripPage(prev => Math.max(1, prev - 1))}
                        disabled={currentTripPage <= 1}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: currentTripPage <= 1 ? '#F9FAFB' : '#FFFFFF',
                          color: currentTripPage <= 1 ? '#9CA3AF' : '#374151',
                          cursor: currentTripPage <= 1 ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ChevronLeft size={15} />
                        <span>Trước</span>
                      </button>

                      {getPaginationPages(currentTripPage, totalTripPages).map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#9CA3AF' }}>...</span>
                          );
                        }
                        const isActive = p === currentTripPage;
                        return (
                          <button
                            key={p}
                            onClick={() => setTripPage(p)}
                            style={{
                              minWidth: '34px',
                              height: '34px',
                              padding: '0 8px',
                              borderRadius: '8px',
                              border: isActive ? '1px solid #D32F2F' : '1px solid #E5E7EB',
                              backgroundColor: isActive ? '#D32F2F' : '#FFFFFF',
                              color: isActive ? '#FFFFFF' : '#374151',
                              cursor: 'pointer',
                              fontWeight: isActive ? '700' : '600',
                              fontSize: '12px',
                              boxShadow: isActive ? '0 2px 4px rgba(211, 47, 47, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {p}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setTripPage(prev => Math.min(totalTripPages, prev + 1))}
                        disabled={currentTripPage >= totalTripPages}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: currentTripPage >= totalTripPages ? '#F9FAFB' : '#FFFFFF',
                          color: currentTripPage >= totalTripPages ? '#9CA3AF' : '#374151',
                          cursor: currentTripPage >= totalTripPages ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>Sau</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: THEO DÕI TÀI XẾ ĐANG NHẬN CUỐC (LIVE DISPATCH) */}
          {/* ========================================================= */}
          {activeTab === 'active_trips' && (
            <div>
              {/* 4 Thẻ KPI Thống Kê Nhanh */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {/* Cuốc đang chạy */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1px solid #BBF7D0',
                  boxShadow: '0 2px 8px rgba(34,197,94,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                        ĐANG CHẠY (LIVE)
                      </span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#111827' }}>
                      {liveAcceptedCount}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      Cuốc xe đang chở khách
                    </div>
                  </div>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A'
                  }}>
                    <Radio size={22} />
                  </div>
                </div>

                {/* Tài xế đang chạy */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '4px' }}>
                      TÀI XẾ ĐANG NHẬN CUỐC
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#111827' }}>
                      {liveDriversCount}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      Tài xế đang bận chuyến
                    </div>
                  </div>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB'
                  }}>
                    <UserCheck size={22} />
                  </div>
                </div>

                {/* Tổng cước đang chạy */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '4px' }}>
                      TỔNG GIÁ TRỊ ĐANG LƯU THÔNG
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#D32F2F' }}>
                      {liveRevenueSum.toLocaleString('vi-VN')}đ
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      Cước các chuyến đang chạy
                    </div>
                  </div>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#DC2626'
                  }}>
                    <DollarSign size={22} />
                  </div>
                </div>

                {/* Đã hoàn thành */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '4px' }}>
                      CUỐC ĐÃ HOÀN THÀNH
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#111827' }}>
                      {completedAssignedCount}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      Đã kết thúc an toàn
                    </div>
                  </div>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4B5563'
                  }}>
                    <CheckCircle2 size={22} />
                  </div>
                </div>
              </div>

              {/* Danh sách Tài xế & Cuốc nhận */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '16px 14px' : '24px', border: '1px solid #E5E7EB' }}>
                {/* Header & Bộ lọc */}
                <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        Chi tiết Tài xế đang nhận cuốc
                      </h3>
                      <span style={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {filteredAssignedTrips.length} chuyến
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Chuyển đổi View: Card / Table */}
                      <div style={{ display: 'flex', backgroundColor: '#F3F4F6', padding: '3px', borderRadius: '8px' }}>
                        <button
                          onClick={() => setActiveTripViewMode('card')}
                          title="Hiển thị dạng thẻ (Cards)"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: activeTripViewMode === 'card' ? '#FFFFFF' : 'transparent',
                            color: activeTripViewMode === 'card' ? '#111827' : '#6B7280',
                            fontWeight: activeTripViewMode === 'card' ? '700' : '500',
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: activeTripViewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <LayoutGrid size={14} />
                          <span>Thẻ</span>
                        </button>
                        <button
                          onClick={() => setActiveTripViewMode('table')}
                          title="Hiển thị dạng bảng (Table)"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: activeTripViewMode === 'table' ? '#FFFFFF' : 'transparent',
                            color: activeTripViewMode === 'table' ? '#111827' : '#6B7280',
                            fontWeight: activeTripViewMode === 'table' ? '700' : '500',
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: activeTripViewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <List size={14} />
                          <span>Bảng</span>
                        </button>
                      </div>

                      {/* Select page size */}
                      <select
                        value={activeTripPageSize}
                        onChange={(e) => {
                          setActiveTripPageSize(Number(e.target.value));
                          setActiveTripPage(1);
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#374151',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value={6}>6 cuốc / trang</option>
                        <option value={9}>9 cuốc / trang</option>
                        <option value={18}>18 cuốc / trang</option>
                        <option value={50}>50 cuốc / trang</option>
                      </select>

                      <button
                        onClick={loadAllData}
                        title="Tải lại dữ liệu"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FFFFFF',
                          color: '#374151',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Thanh tìm kiếm & Tabs lọc trạng thái */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', alignItems: isMobile ? 'stretch' : 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : '260px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="text"
                        value={activeTripSearch}
                        onChange={(e) => { setActiveTripSearch(e.target.value); setActiveTripPage(1); }}
                        placeholder="Tìm theo tên tài xế, SĐT, biển số xe, điểm đón, điểm trả..."
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '9px 34px 9px 36px',
                          borderRadius: '10px',
                          border: '1px solid #D1D5DB',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#FAFAFA'
                        }}
                      />
                      {activeTripSearch && (
                        <button
                          onClick={() => { setActiveTripSearch(''); setActiveTripPage(1); }}
                          title="Xóa tìm kiếm"
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9CA3AF',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            padding: '2px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: isMobile ? '4px' : '0' }}>
                      {[
                        { key: 'accepted', label: 'Đang chạy (Live)', count: liveAcceptedCount },
                        { key: 'completed', label: 'Đã hoàn thành', count: completedAssignedCount },
                        { key: 'all', label: 'Tất cả cuốc có tài', count: assignedTrips.length }
                      ].map(pill => {
                        const isSelected = activeTripStatusFilter === pill.key;
                        return (
                          <button
                            key={pill.key}
                            onClick={() => { setActiveTripStatusFilter(pill.key); setActiveTripPage(1); }}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #16A34A' : '1px solid #E5E7EB',
                              backgroundColor: isSelected ? '#DCFCE7' : '#FFFFFF',
                              color: isSelected ? '#15803D' : '#4B5563',
                              fontSize: '12px',
                              fontWeight: isSelected ? '700' : '600',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{pill.label}</span>
                            <span style={{
                              backgroundColor: isSelected ? '#16A34A' : '#F3F4F6',
                              color: isSelected ? '#FFFFFF' : '#6B7280',
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '1px 5px',
                              borderRadius: '10px'
                            }}>
                              {pill.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {paginatedAssignedTrips.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
                    <Radio size={36} style={{ color: '#9CA3AF', margin: '0 auto 12px auto' }} />
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151' }}>
                      Không có cuốc xe nào phù hợp
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                      Hiện tại chưa có tài xế nào nhận chuyến đi phù hợp với điều kiện tìm kiếm/lọc này.
                    </div>
                  </div>
                ) : activeTripViewMode === 'card' ? (
                  /* CARD VIEW */
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '16px'
                  }}>
                    {paginatedAssignedTrips.map(t => {
                      const driver = t.driver || drivers.find(d => d.id === t.driver_id) || {};
                      const isLive = t.status === 'accepted';
                      return (
                        <div
                          key={t.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '14px',
                            border: isLive ? '1.5px solid #86EFAC' : '1px solid #E5E7EB',
                            boxShadow: isLive ? '0 4px 14px rgba(34,197,94,0.1)' : '0 2px 4px rgba(0,0,0,0.03)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          {/* Card Header */}
                          <div style={{
                            padding: '12px 14px',
                            backgroundColor: isLive ? '#F0FDF4' : '#F9FAFB',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                backgroundColor: isLive ? '#DCFCE7' : '#F3F4F6',
                                color: isLive ? '#15803D' : '#4B5563',
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {isLive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />}
                                {isLive ? 'ĐANG CHẠY' : 'HOÀN THÀNH'}
                              </span>
                              <span style={{
                                backgroundColor: t.is_virtual ? '#FEF3C7' : '#EFF6FF',
                                color: t.is_virtual ? '#B45309' : '#1D4ED8',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {t.is_virtual ? 'ẢO' : 'THẬT'}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280' }}>
                              #{t.id}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Khối Tài xế */}
                            <div style={{
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #F3F4F6',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                backgroundColor: '#D32F2F',
                                color: '#FFFFFF',
                                fontWeight: '800',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {(driver.full_name || 'TX').charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {driver.full_name || `Tài xế #${t.driver_id}`}
                                  </div>
                                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Star size={12} fill="#F59E0B" color="#F59E0B" />
                                    <span>{driver.rating || 5.0}</span>
                                  </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <Phone size={12} color="#6B7280" />
                                  <a href={`tel:${driver.phone}`} style={{ color: '#2563EB', textDecoration: 'none', fontWeight: '600' }}>
                                    {driver.phone || 'Chưa cập nhật SĐT'}
                                  </a>
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Car size={12} />
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {driver.vehicle_info || driver.area || 'Xe đối tác'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Lộ trình & Giá cước */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', marginTop: '5px', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', display: 'block' }}>Điểm đón khách:</span>
                                  <span style={{ fontWeight: '700', color: '#111827' }}>{t.pickup_location}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626', marginTop: '5px', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', display: 'block' }}>Điểm đến:</span>
                                  <span style={{ fontWeight: '700', color: '#111827' }}>{t.dropoff_location}</span>
                                </div>
                              </div>
                            </div>

                            {/* Meta & Giá */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '8px',
                              borderTop: '1px dashed #E5E7EB'
                            }}>
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                <span>{t.distance_km || 0} km</span>
                                {t.estimated_minutes && <span> • ~{t.estimated_minutes}p</span>}
                                {t.customer_phone && <span style={{ display: 'block', fontSize: '11px', color: '#9CA3AF' }}>Khách: {t.customer_phone}</span>}
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>Cước phí:</span>
                                <span style={{ fontSize: '16px', fontWeight: '900', color: '#D32F2F' }}>
                                  {Number(t.price).toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Thao Tác */}
                          <div style={{
                            padding: '10px 14px',
                            backgroundColor: '#F9FAFB',
                            borderTop: '1px solid #E5E7EB',
                            display: 'flex',
                            gap: '8px'
                          }}>
                            {isLive && (
                              <>
                                <button
                                  onClick={() => handleUnassignTrip(t.id)}
                                  style={{
                                    flex: 1,
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #FCA5A5',
                                    backgroundColor: '#FEF2F2',
                                    color: '#DC2626',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}
                                  title="Hủy gán tài xế và chuyển cuốc về trạng thái mới"
                                >
                                  <RotateCcw size={13} />
                                  <span>Thu hồi cuốc</span>
                                </button>

                                <button
                                  onClick={() => handleCompleteTrip(t.id)}
                                  style={{
                                    flex: 1,
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #86EFAC',
                                    backgroundColor: '#F0FDF4',
                                    color: '#15803D',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}
                                  title="Đánh dấu hoàn thành chuyến đi"
                                >
                                  <Check size={13} />
                                  <span>Hoàn thành</span>
                                </button>
                              </>
                            )}

                            {driver.id && (
                              <button
                                onClick={() => {
                                  setSelectedDriverId(driver.id);
                                  switchTab('drivers');
                                }}
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  backgroundColor: '#FFFFFF',
                                  color: '#374151',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                                title="Xem hồ sơ tài xế này"
                              >
                                Hồ sơ TX
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* TABLE VIEW */
                  <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ minWidth: '820px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#4B5563', fontWeight: '700' }}>
                          <th style={{ padding: '12px' }}>Mã cuốc</th>
                          <th style={{ padding: '12px' }}>Tài xế đang nhận</th>
                          <th style={{ padding: '12px' }}>Điểm đón</th>
                          <th style={{ padding: '12px' }}>Điểm trả</th>
                          <th style={{ padding: '12px' }}>Cước phí</th>
                          <th style={{ padding: '12px' }}>Trạng thái</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAssignedTrips.map(t => {
                          const driver = t.driver || drivers.find(d => d.id === t.driver_id) || {};
                          const isLive = t.status === 'accepted';
                          return (
                            <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '12px', fontWeight: '700' }}>#{t.id}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: '700', color: '#111827' }}>
                                  {driver.full_name || `Tài xế #${t.driver_id}`}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                  {driver.phone || '---'} {driver.vehicle_info ? `• ${driver.vehicle_info}` : ''}
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: '#16A34A', fontWeight: '600' }}>{t.pickup_location}</td>
                              <td style={{ padding: '12px', color: '#DC2626', fontWeight: '600' }}>{t.dropoff_location}</td>
                              <td style={{ padding: '12px', fontWeight: '800', color: '#D32F2F' }}>
                                {Number(t.price).toLocaleString('vi-VN')}đ
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  backgroundColor: isLive ? '#DCFCE7' : '#F3F4F6',
                                  color: isLive ? '#15803D' : '#4B5563',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '3px 8px',
                                  borderRadius: '6px'
                                }}>
                                  {isLive ? 'Đang chạy' : 'Hoàn thành'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  {isLive && (
                                    <>
                                      <button
                                        onClick={() => handleUnassignTrip(t.id)}
                                        style={{
                                          backgroundColor: '#FEF2F2',
                                          color: '#DC2626',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 8px',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: '700'
                                        }}
                                      >
                                        Thu hồi
                                      </button>
                                      <button
                                        onClick={() => handleCompleteTrip(t.id)}
                                        style={{
                                          backgroundColor: '#F0FDF4',
                                          color: '#15803D',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 8px',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: '700'
                                        }}
                                      >
                                        Xong
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Phân trang */}
                {filteredAssignedTrips.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid #E5E7EB',
                    fontSize: '13px',
                    color: '#6B7280'
                  }}>
                    <div>
                      Hiển thị <span style={{ fontWeight: '700', color: '#111827' }}>{(currentActiveTripPage - 1) * activeTripPageSize + 1}</span> - <span style={{ fontWeight: '700', color: '#111827' }}>{Math.min(currentActiveTripPage * activeTripPageSize, filteredAssignedTrips.length)}</span> trên tổng số <span style={{ fontWeight: '700', color: '#16A34A' }}>{filteredAssignedTrips.length}</span> chuyến
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                      <button
                        onClick={() => setActiveTripPage(prev => Math.max(1, prev - 1))}
                        disabled={currentActiveTripPage <= 1}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: currentActiveTripPage <= 1 ? '#F9FAFB' : '#FFFFFF',
                          color: currentActiveTripPage <= 1 ? '#9CA3AF' : '#374151',
                          cursor: currentActiveTripPage <= 1 ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}
                      >
                        <ChevronLeft size={15} />
                        <span>Trước</span>
                      </button>

                      {getPaginationPages(currentActiveTripPage, totalActiveTripPages).map((p, idx) => {
                        if (p === '...') return <span key={`dots-act-${idx}`} style={{ padding: '0 4px', color: '#9CA3AF' }}>...</span>;
                        const isActive = p === currentActiveTripPage;
                        return (
                          <button
                            key={p}
                            onClick={() => setActiveTripPage(p)}
                            style={{
                              minWidth: '34px',
                              height: '34px',
                              padding: '0 8px',
                              borderRadius: '8px',
                              border: isActive ? '1px solid #16A34A' : '1px solid #E5E7EB',
                              backgroundColor: isActive ? '#16A34A' : '#FFFFFF',
                              color: isActive ? '#FFFFFF' : '#374151',
                              cursor: 'pointer',
                              fontWeight: isActive ? '700' : '600',
                              fontSize: '12px'
                            }}
                          >
                            {p}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setActiveTripPage(prev => Math.min(totalActiveTripPages, prev + 1))}
                        disabled={currentActiveTripPage >= totalActiveTripPages}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: currentActiveTripPage >= totalActiveTripPages ? '#F9FAFB' : '#FFFFFF',
                          color: currentActiveTripPage >= totalActiveTripPages ? '#9CA3AF' : '#374151',
                          cursor: currentActiveTripPage >= totalActiveTripPages ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}
                      >
                        <span>Sau</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CAN THIỆP CHỈ SỐ ẢO (YÊU CẦU 4, 6, 7) */}
          {/* ========================================================= */}
          {activeTab === 'metrics' && (
            <div>
              {/* Chọn tài xế */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: isMobile ? '16px 14px' : '18px 24px',
                border: '1px solid #E5E7EB',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Chọn tài xế cần can thiệp số liệu
                  </h3>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                    Đang chọn: <strong>{selectedDriver.full_name}</strong> (ID: #{selectedDriver.id})
                  </div>
                </div>

                <select
                  value={selectedDriverId || selectedDriver?.id || ''}
                  onChange={(e) => handleSelectDriver(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#111827',
                    cursor: 'pointer',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      #{d.id} - {d.full_name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3 Cards can thiệp */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: isMobile ? '16px' : '20px'
              }}>
                
                {/* TOOL 1: YÊU CẦU 4 - CAN THIỆP MÀN 2 (TỔNG CUỐC, TỶ LỆ, KINH NGHIỆM) */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '18px 14px' : '22px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        1. Can thiệp Màn 2 (Hồ sơ)
                      </h4>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Khoanh tròn đỏ ảnh 2</div>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateMetrics}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Cộng thêm số cuốc ảo:
                      </label>
                      <input
                        type="number"
                        value={metricForm.add_trips}
                        onChange={(e) => setMetricForm({ ...metricForm, add_trips: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      />
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
                        Hiện tại: <strong>{selectedDriver?.total_trips ?? 0}</strong> cuốc
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Tỷ lệ hoàn thành (%):
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={metricForm.completion_rate}
                        onChange={(e) => setMetricForm({ ...metricForm, completion_rate: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Kinh nghiệm hiển thị:
                      </label>
                      <input
                        type="text"
                        value={metricForm.experience}
                        onChange={(e) => setMetricForm({ ...metricForm, experience: e.target.value })}
                        placeholder="Ví dụ: 2 năm, 3 năm"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        backgroundColor: '#D32F2F',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      LƯU CHỈ SỐ MÀN 2
                    </button>
                  </form>
                </div>

                {/* TOOL 2: YÊU CẦU 6 - CAN THIỆP MÀN 3 (THU NHẬP HÔM NAY & CUỐC XE NGÀY) */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '18px 14px' : '22px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        2. Can thiệp Màn 3 (Thu nhập)
                      </h4>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Khoanh tròn đỏ ảnh 3</div>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateIncome}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Cộng thêm thu nhập hôm nay (VNĐ):
                      </label>
                      <input
                        type="number"
                        step="50000"
                        value={incomeForm.add_income}
                        onChange={(e) => setIncomeForm({ ...incomeForm, add_income: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: '700', color: '#16A34A' }}
                      />
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
                        Hiện tại: <strong>{Number(selectedDriver?.daily_income ?? 0).toLocaleString('vi-VN')}đ</strong>
                      </div>
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Cộng thêm số cuốc trong ngày:
                      </label>
                      <input
                        type="number"
                        value={incomeForm.add_daily_trips}
                        onChange={(e) => setIncomeForm({ ...incomeForm, add_daily_trips: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      />
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
                        Hiện tại: <strong>{selectedDriver?.daily_trips ?? 0}</strong> cuốc
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      LƯU THU NHẬP MÀN 3
                    </button>
                  </form>
                </div>

                {/* TOOL 3: YÊU CẦU 7 - CAN THIỆP ĐÁNH GIÁ (SAO, LƯỢT ĐÁNH GIÁ & REVIEW) */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: isMobile ? '18px 14px' : '22px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        3. Can thiệp Đánh giá (Rating)
                      </h4>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Hiển thị ở Màn 2 & Màn 3</div>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateRating}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Điểm sao trung bình (1.0 - 5.0 ⭐):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={ratingForm.rating}
                        onChange={(e) => setRatingForm({ ...ratingForm, rating: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: '700' }}
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Tổng số lượt đánh giá:
                      </label>
                      <input
                        type="number"
                        value={ratingForm.rating_count}
                        onChange={(e) => setRatingForm({ ...ratingForm, rating_count: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Tên khách hàng feedback:
                      </label>
                      <input
                        type="text"
                        value={ratingForm.customer_name}
                        onChange={(e) => setRatingForm({ ...ratingForm, customer_name: e.target.value })}
                        placeholder="Ví dụ: Anh Nam, Chị Hương..."
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                        Thêm feedback uy tín từ khách:
                      </label>
                      <input
                        type="text"
                        value={ratingForm.comment}
                        onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                        placeholder="Nội dung khen ngợi..."
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        backgroundColor: '#D97706',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      LƯU ĐÁNH GIÁ TÀI XẾ
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* ========================================================= */}
          {/* MODAL DUYỆT GIẤY TỜ TÀI XẾ (CCCD, GPLX, ĐĂNG KIỂM, BẢO HIỂM) */}
          {/* ========================================================= */}
          {showDocModal && selectedDocDriver && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F9FAFB'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#DCFCE7',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                        Duyệt giấy tờ hồ sơ tài xế
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                        Tài xế: <strong>{selectedDocDriver.full_name}</strong> (#{selectedDocDriver.id}) - {selectedDocDriver.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDocModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '8px'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                  {/* Quick action bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '10px 14px',
                    backgroundColor: '#F0FDF4',
                    borderRadius: '12px',
                    border: '1px solid #BBF7D0'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>
                      Đã duyệt: {docChecklist.length}/4 loại giấy tờ
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleSelectAllDocs}
                        style={{
                          backgroundColor: '#16A34A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Duyệt tất cả 4 mục
                      </button>
                      <button
                        onClick={handleClearAllDocs}
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: '#6B7280',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {/* 4 Danh mục giấy tờ */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      {
                        id: 'CCCD/CMND',
                        title: '1. Căn cước công dân / CMND',
                        detail: selectedDocDriver.document_details?.cccd?.number || selectedDocDriver.cccd_number || 'Chưa cung cấp số',
                        updated: selectedDocDriver.document_details?.cccd?.updated_at
                      },
                      {
                        id: 'Giấy phép lái xe',
                        title: '2. Giấy phép lái xe (GPLX)',
                        detail: selectedDocDriver.document_details?.gplx?.number 
                          ? `${selectedDocDriver.document_details.gplx.number} (Hạng ${selectedDocDriver.document_details.gplx.class || 'B2'})`
                          : 'Chưa cung cấp số',
                        updated: selectedDocDriver.document_details?.gplx?.updated_at
                      },
                      {
                        id: 'Đăng kiểm xe',
                        title: '3. Giấy chứng nhận đăng kiểm xe',
                        detail: selectedDocDriver.document_details?.dang_kiem?.number || 'Chưa cung cấp số',
                        updated: selectedDocDriver.document_details?.dang_kiem?.updated_at
                      },
                      {
                        id: 'Bảo hiểm xe',
                        title: '4. Bảo hiểm trách nhiệm dân sự xe',
                        detail: selectedDocDriver.document_details?.bao_hiem?.number || 'Chưa cung cấp số',
                        updated: selectedDocDriver.document_details?.bao_hiem?.updated_at
                      }
                    ].map(item => {
                      const isChecked = docChecklist.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleDoc(item.id)}
                          style={{
                            border: isChecked ? '2px solid #16A34A' : '1px solid #E5E7EB',
                            backgroundColor: isChecked ? '#F0FDF4' : '#FAFAFA',
                            borderRadius: '12px',
                            padding: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            marginTop: '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            backgroundColor: isChecked ? '#16A34A' : '#FFFFFF',
                            border: isChecked ? 'none' : '2px solid #D1D5DB',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isChecked && <Check size={14} strokeWidth={3} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '13px', fontWeight: '800', color: isChecked ? '#166534' : '#111827' }}>
                                {item.title}
                              </div>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                backgroundColor: isChecked ? '#DCFCE7' : '#F3F4F6',
                                color: isChecked ? '#15803D' : '#6B7280'
                              }}>
                                {isChecked ? 'ĐÃ DUYỆT' : 'CHƯA DUYỆT'}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>
                              Thông tin tài xế gửi: <strong style={{ color: '#111827' }}>{item.detail}</strong>
                            </div>
                            {item.updated && (
                              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                                Cập nhật: {new Date(item.updated).toLocaleString('vi-VN')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '11px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '10px 12px', borderRadius: '10px', lineHeight: 1.5 }}>
                    💡 <strong>Ghi chú:</strong> Khi Admin tích chọn và bấm <strong>LƯU PHÊ DUYỆT</strong>, các giấy tờ sẽ lập tức đổi sang trạng thái <em>Đã xác minh</em> có dấu tích xanh trên ứng dụng di động của tài xế.
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  padding: '14px 20px',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  backgroundColor: '#F9FAFB'
                }}>
                  <button
                    onClick={() => setShowDocModal(false)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#374151',
                      border: '1px solid #D1D5DB',
                      borderRadius: '10px',
                      padding: '9px 18px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSaveDriverDocs}
                    disabled={isSavingDocs}
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 20px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: isSavingDocs ? 'not-allowed' : 'pointer',
                      opacity: isSavingDocs ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShieldCheck size={16} />
                    {isSavingDocs ? 'Đang lưu...' : 'LƯU PHÊ DUYỆT'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🔐 MODAL ĐỔI MẬT KHẨU QUẢN TRỊ VIÊN (ADMIN) */}
          {showPasswordModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <div style={{
                backgroundColor: '#1E293B',
                borderRadius: '20px',
                border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                maxWidth: '440px',
                width: '100%',
                overflow: 'hidden',
                color: '#F8FAFC'
              }}>
                {/* Modal Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(15, 23, 42, 0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FBBF24'
                    }}>
                      <KeyRound size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>
                        Đổi mật khẩu Quản trị viên
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
                        Tài khoản: <strong style={{ color: '#E2E8F0' }}>{adminUser?.phone || 'admin'}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleChangePassword} style={{ padding: '24px' }}>
                  {passError && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#FCA5A5',
                      fontSize: '13px',
                      marginBottom: '16px'
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{passError}</span>
                    </div>
                  )}

                  {passSuccess && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#86EFAC',
                      fontSize: '13px',
                      marginBottom: '16px'
                    }}>
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      <span>{passSuccess}</span>
                    </div>
                  )}

                  {/* Mật khẩu hiện tại */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                      Mật khẩu hiện tại
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Nhập mật khẩu hiện tại..."
                        required
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          padding: '11px 42px 11px 14px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex'
                        }}
                      >
                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                      Mật khẩu mới (tối thiểu 4 ký tự)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Nhập mật khẩu mới..."
                        required
                        minLength={4}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          padding: '11px 42px 11px 14px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex'
                        }}
                      >
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div style={{ marginBottom: '22px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu mới..."
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '11px 14px',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Nút hành động */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      style={{
                        flex: 1,
                        backgroundColor: '#334155',
                        color: '#E2E8F0',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={savingPass}
                      style={{
                        flex: 1.5,
                        backgroundColor: '#D97706',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: '800',
                        cursor: savingPass ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)'
                      }}
                    >
                      {savingPass ? 'Đang lưu...' : 'LƯU MẬT KHẨU MỚI'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
