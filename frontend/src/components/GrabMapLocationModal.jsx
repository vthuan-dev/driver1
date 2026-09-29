import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, MapPin, Navigation, Search, Check, 
  RotateCw, Plus, Crosshair, X, Loader2, Camera, MoreVertical,
  ChevronUp
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tọa độ mặc định (Việt Nam) nếu chưa cho phép GPS
const DEFAULT_CENTER = {
  lat: 21.028511, // Hà Nội
  lng: 105.854444
};

export default function GrabMapLocationModal({ 
  isOpen, 
  onClose, 
  onSelectLocation, 
  initialAddress = '',
  driverAvatar = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [currentCoords, setCurrentCoords] = useState(DEFAULT_CENTER);
  const [placeName, setPlaceName] = useState(initialAddress || 'Đang xác định vị trí...');
  const [detailAddress, setDetailAddress] = useState('');
  const [distanceText, setDistanceText] = useState('Vị trí hiện tại');
  const [searchInput, setSearchInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [extraDetail, setExtraDetail] = useState('');
  const [showExtraInput, setShowExtraInput] = useState(false);

  // Reverse geocode dùng Nominatim OpenStreetMap (Miễn phí, chuẩn tiếng Việt)
  const reverseGeocode = async (lat, lng) => {
    try {
      setIsGeocoding(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
        }
      });
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || '';
        const district = addr.quarter || addr.suburb || addr.city_district || addr.district || '';
        const city = addr.city || addr.town || addr.county || addr.state || '';
        
        let primary = data.name || road || district || city || 'Vị trí đã ghim';
        let full = data.display_name;

        // Định dạng ngắn gọn chuẩn hiển thị
        if (road && district) {
          primary = `${road}, ${district}`;
        } else if (district && city) {
          primary = `${district}, ${city}`;
        }

        setPlaceName(primary);
        setDetailAddress(full);
      } else {
        setPlaceName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setDetailAddress('Vị trí chọn trên bản đồ');
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      setPlaceName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setDetailAddress('Tọa độ GPS đã chọn');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!isOpen) return;

    let timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [currentCoords.lat, currentCoords.lng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false
        });

        // Layer bản đồ Google Maps chuẩn tiếng Việt (sắc nét, KHÔNG watermark, KHÔNG cần API key)
        L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3']
        }).addTo(map);

        // Lắng nghe khi người dùng kéo / rê bản đồ
        map.on('moveend', () => {
          const center = map.getCenter();
          setCurrentCoords({ lat: center.lat, lng: center.lng });
          reverseGeocode(center.lat, center.lng);
        });

        mapInstanceRef.current = map;

        // Tự động định vị GPS thực tế của thiết bị
        handleGetGPS(map);
      } else {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Hàm lấy vị trí GPS hiện tại của thiết bị
  const handleGetGPS = (existingMap = null) => {
    const map = existingMap || mapInstanceRef.current;
    if (!navigator.geolocation) {
      reverseGeocode(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        if (map) {
          map.setView([latitude, longitude], 17, { animate: true });
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        reverseGeocode(currentCoords.lat, currentCoords.lng);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Tìm kiếm địa điểm
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim() || !mapInstanceRef.current) return;
    try {
      setIsGeocoding(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&countrycodes=vn&limit=1`, {
        headers: { 'Accept-Language': 'vi-VN,vi;q=0.9' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        mapInstanceRef.current.setView([lat, lon], 16, { animate: true });
        setCurrentCoords({ lat, lng: lon });
        setPlaceName(first.display_name.split(',')[0]);
        setDetailAddress(first.display_name);
      } else {
        alert('Không tìm thấy địa chỉ này, vui lòng thử lại!');
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    const finalAddress = extraDetail.trim() 
      ? `${extraDetail.trim()}, ${placeName}` 
      : placeName;
    
    if (onSelectLocation) {
      onSelectLocation({
        name: placeName,
        address: finalAddress,
        fullAddress: detailAddress,
        lat: currentCoords.lat,
        lng: currentCoords.lng
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      userSelect: 'none'
    }}>
      {/* 🔴 STYLE CHO RADAR XOAY QUANH VỊ TRÍ CHUẨN XANH SM / GRAB */}
      <style>{`
        @keyframes grabRadarSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes grabRadarWave {
          0% { transform: translate(-50%, -50%) scale(0.15); opacity: 0.95; }
          50% { opacity: 0.45; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes grabPulseCenter {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>

      {/* 1. TOP HEADER FLOATING (GIỐNG GRAB / XANH SM) */}
      <div style={{
        position: 'absolute',
        top: '14px',
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 12px',
        pointerEvents: 'none'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'auto'
        }}>
          {/* Nút Back */}
          <button
            onClick={onClose}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111827',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

        {/* Thanh tìm kiếm vị trí */}
        <form 
          onSubmit={handleSearchSubmit}
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 14px',
            height: '42px',
            gap: '8px'
          }}
        >
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#2563EB',
            flexShrink: 0
          }} />
          <input
            type="text"
            placeholder="Đón tại?"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#111827',
              backgroundColor: 'transparent'
            }}
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          ) : (
            <Camera size={19} color="#6B7280" style={{ cursor: 'pointer' }} />
          )}
          <button
            type="submit"
            style={{ background: 'none', border: 'none', color: '#00B14F', cursor: 'pointer', padding: '0 2px' }}
          >
            <Search size={18} strokeWidth={2.5} />
          </button>
        </form>
        </div>
      </div>

      {/* 2. KHU VỰC BẢN ĐỒ LEAFLET */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', backgroundColor: '#E5E7EB' }} 
        />

        {/* 🎯 TRUNG TÂM BẢN ĐỒ: GHIM VỊ TRÍ + VÒNG TRÒN QUAY QUAY RADAR (CHUẨN GRAB/XANH SM) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -100%)',
          zIndex: 999,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Card tên địa điểm nổi ngay trên đỉnh ghim */}
          <div style={{
            backgroundColor: '#FFFFFF',
            color: '#111827',
            padding: '5px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '700',
            whiteSpace: 'nowrap',
            maxWidth: '240px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid #E5E7EB'
          }}>
            {isGeocoding ? (
              <Loader2 size={13} className="animate-spin" color="#00B14F" />
            ) : (
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#004D40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={11} color="#FFFFFF" fill="#FFFFFF" />
              </div>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{placeName || 'Điểm đón của bạn'}</span>
          </div>

          {/* Biểu tượng Pin Hình tròn viền xanh chuẩn Ảnh 3 */}
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#0085FF',
            border: '3px solid #FFFFFF',
            boxShadow: '0 6px 16px rgba(0, 133, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {driverAvatar ? (
              <img src={driverAvatar} alt="Vị trí" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Navigation size={22} color="#FFFFFF" fill="#FFFFFF" />
              </div>
            )}
          </div>

          {/* Mũi kim cắm xuống đất */}
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '11px solid #0085FF',
            marginTop: '-2px'
          }} />

          {/* 🌀 ĐIỂM TIẾP ĐẤT & VÒNG TRÒN QUAY QUAY RADAR (SÓNG TỎA + RADAR QUÉT 360 ĐỘ) */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            width: 0,
            height: 0
          }}>
            {/* Chân ghim tiếp xúc mặt đất */}
            <div style={{
              position: 'absolute',
              width: '10px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              transform: 'translate(-50%, -50%)'
            }} />

            {/* Vòng radar sóng tỏa 1 */}
            <div style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '2px solid rgba(0, 133, 255, 0.75)',
              backgroundColor: 'rgba(0, 133, 255, 0.12)',
              animation: 'grabRadarWave 2.4s infinite cubic-bezier(0.1, 0.8, 0.3, 1)',
              transform: 'translate(-50%, -50%)'
            }} />

            {/* Vòng radar sóng tỏa 2 (so le để liên tục) */}
            <div style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '2px solid rgba(0, 133, 255, 0.5)',
              backgroundColor: 'rgba(0, 133, 255, 0.08)',
              animation: 'grabRadarWave 2.4s infinite cubic-bezier(0.1, 0.8, 0.3, 1) 1.2s',
              transform: 'translate(-50%, -50%)'
            }} />

            {/* Vạch quét Radar quay vòng 360 độ */}
            <div style={{
              position: 'absolute',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(0, 133, 255, 0.55) 0deg, rgba(0, 133, 255, 0.05) 85deg, transparent 360deg)',
              animation: 'grabRadarSpin 1.6s infinite linear',
              transform: 'translate(-50%, -50%)'
            }} />
          </div>
        </div>

        {/* Nút định vị GPS (Góc phải dưới bản đồ) */}
        <button
          onClick={() => handleGetGPS()}
          disabled={isLocating}
          title="Định vị vị trí của tôi"
          style={{
            position: 'absolute',
            right: '16px',
            bottom: '22px',
            zIndex: 998,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLocating ? '#00B14F' : '#1F2937',
            cursor: 'pointer'
          }}
        >
          {isLocating ? (
            <RotateCw size={22} className="animate-spin" color="#00B14F" />
          ) : (
            <Crosshair size={22} strokeWidth={2.3} color="#2563EB" />
          )}
        </button>
      </div>

      {/* 3. BOTTOM SHEET HIỂN THỊ CHI TIẾT (CHUẨN ẢNH 3 CỦA GRAB) */}
      <div style={{
        position: 'relative',
        zIndex: 1001,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 -6px 25px rgba(0,0,0,0.12)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          padding: '12px 18px 22px 18px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '44vh',
          boxSizing: 'border-box'
        }}>
          {/* Thanh kéo gạt nhỏ ở trên */}
          <div style={{
            width: '38px',
            height: '4px',
            backgroundColor: '#D1D5DB',
            borderRadius: '4px',
            margin: '0 auto 12px auto'
          }} />

        {/* Thông tin vị trí chính */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#004D40',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <MapPin size={20} color="#FFFFFF" fill="#FFFFFF" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: '800',
              color: '#111827',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {placeName}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#6B7280',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {detailAddress || 'Kéo bản đồ để chọn đúng vị trí bạn đang đứng'}
            </p>
          </div>

          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Nút trở về đầu trang */}
        <div style={{ marginBottom: '10px' }}>
          <span 
            onClick={() => handleGetGPS()}
            style={{ 
              fontSize: '12px', 
              color: '#2563EB', 
              fontWeight: '600', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '2px' 
            }}
          >
            Trở về đầu trang ↑
          </span>
        </div>

        {/* Ô thêm chi tiết điểm đón (tuỳ chọn) */}
        {showExtraInput ? (
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              value={extraDetail}
              onChange={(e) => setExtraDetail(e.target.value)}
              placeholder="Ví dụ: Tòa nhà A, số nhà 12, gần cây xăng..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #00B14F',
                fontSize: '13px',
                outline: 'none',
                color: '#111827'
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowExtraInput(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '6px 0',
              marginBottom: '14px'
            }}
          >
            <span>Thêm chi tiết điểm đón (ví dụ: gần cổng)</span>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: '700'
            }}>
              +
            </div>
          </button>
        )}

        {/* NÚT CHỌN ĐIỂM ĐÓN NÀY (MÀU XANH LÁ CHUẨN ẢNH 3: #00B14F) */}
        <button
          onClick={handleConfirm}
          style={{
            width: '100%',
            backgroundColor: '#00B14F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '28px',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 177, 79, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Check size={20} strokeWidth={3} />
          <span>Chọn điểm đón này</span>
        </button>
        </div>
      </div>
    </div>
  );
}
