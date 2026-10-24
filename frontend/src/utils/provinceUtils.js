export const VIETNAM_PROVINCES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 
  'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 
  'Cần Thơ', 'Cao Bằng', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 
  'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội', 'Hà Tây', 
  'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 
  'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 
  'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 
  'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 
  'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh', 
  'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

export const POPULAR_PROVINCES = [
  'Đà Nẵng', 'TP. Hồ Chí Minh', 'Hà Nội', 'Thanh Hóa', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Quảng Nam'
];

export const PROVINCE_CONFIGS = [
  {
    id: 'da_nang',
    name: 'Đà Nẵng',
    shortName: 'Đà Nẵng',
    keywords: [
      'đà nẵng', 'da nang', 'hải châu', 'sơn trà', 'ngũ hành sơn', 
      'thanh khê', 'liên chiểu', 'cẩm lệ', 'hòa vang', 'bà nà', 
      'mỹ khê', 'cầu rồng', 'bạch đằng', 'sân bay đà nẵng'
    ],
    defaultPrompts: [
      'Tạo 5 cuốc lái xe hộ tại Đà Nẵng (Hải Châu, Sơn Trà về Cẩm Lệ, Liên Chiểu), giá 150k - 300k',
      'Tạo 8 cuốc tiệc nhậu đêm đón dọc đường Bạch Đằng, 2/9, Võ Nguyên Giáp về nhà riêng tại Đà Nẵng',
      'Tạo 4 cuốc lái xe hộ từ Đà Nẵng đi Hội An / Điện Bàn (Quảng Nam), giá 350k - 550k'
    ]
  },
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    shortName: 'TP.HCM',
    keywords: [
      'hồ chí minh', 'hcm', 'sài gòn', 'saigon', 'quận 1', 'quận 2', 'quận 3', 'quận 4', 
      'quận 5', 'quận 6', 'quận 7', 'quận 8', 'quận 9', 'quận 10', 'quận 11', 'quận 12', 
      'bình thạnh', 'thủ đức', 'gò vấp', 'phú nhuận', 'tân bình', 'tân phú', 'bình tân', 
      'nhà bè', 'hóc môn', 'củ chi', 'bình chánh', 'tân sơn nhất', 'bến thành', 'thảo điền'
    ],
    defaultPrompts: [
      'Tạo 5 cuốc lái xe hộ nội thành TP.HCM: Quận 1 đi Quận 12, Quận 3 đi Gò Vấp, giá 200k - 380k',
      'Tạo 8 cuốc đón khách nhậu từ Phố Bùi Viện, Thảo Điền, Landmark 81 về Quận 7, Tân Bình, Bình Thạnh',
      'Tạo 4 cuốc lái xe hộ từ TP.HCM đi TP. Dĩ An / TP. Thủ Dầu Một / TP. Biên Hòa, giá 400k - 700k'
    ]
  },
  {
    id: 'ha_noi',
    name: 'Hà Nội',
    shortName: 'Hà Nội',
    keywords: [
      'hà nội', 'ha noi', 'hoàn kiếm', 'ba đình', 'đống đa', 'hai bà trưng', 'cầu giấy', 
      'thanh xuân', 'hoàng mai', 'long biên', 'tây hồ', 'nam từ liêm', 'bắc từ liêm', 
      'hà đông', 'nội bài', 'sơn tây', 'gia lâm', 'đông anh', 'thanh trì'
    ],
    defaultPrompts: [
      'Tạo 5 cuốc lái xe hộ nội thành Hà Nội: Cầu Giấy, Hoàn Kiếm về Hà Đông, Long Biên, giá 180k - 350k',
      'Tạo 8 cuốc đón khách say từ các nhà hàng lẩu nướng Phố Cổ, Tây Hồ về Nam Từ Liêm, Thanh Xuân',
      'Tạo 4 cuốc lái xe hộ từ Hà Nội đi Bắc Ninh / Hưng Yên / Vĩnh Phúc, giá 450k - 750k'
    ]
  },
  {
    id: 'thanh_hoa',
    name: 'Thanh Hóa',
    shortName: 'Thanh Hóa',
    keywords: [
      'thanh hóa', 'thanh hoá', 'sầm sơn', 'bỉm sơn', 'thọ xuân', 'hải tiến', 
      'tĩnh gia', 'nghi sơn', 'quảng xương', 'hoằng hóa', 'nông cống', 'triệu sơn', 'vinhomes thanh hóa'
    ],
    defaultPrompts: [
      'Tạo 5 cuốc lái xe hộ tại TP. Thanh Hóa về Sầm Sơn, Quảng Xương, Hoằng Hóa, giá 150k - 350k',
      'Tạo 6 cuốc khách nhậu tại đại lộ Lê Lợi, Vincom Thanh Hóa về Đông Sơn, Nông Cống, giá 200k - 400k',
      'Tạo 3 cuốc lái xe hộ đón từ Sầm Sơn về TP. Thanh Hóa sau tiệc tối, giá 250k - 450k'
    ]
  }
];

export function checkTripMatchesProvince(trip, provinceName) {
  if (!trip) return false;
  if (!provinceName || provinceName === 'all') return true;

  const target = provinceName.toLowerCase().trim();

  // 1. Kiểm tra service_tags
  if (Array.isArray(trip.service_tags)) {
    const hasTag = trip.service_tags.some(t => {
      const lower = String(t).toLowerCase();
      if (lower.includes(target)) return true;
      if ((target === 'tp. hồ chí minh' || target === 'hồ chí minh' || target === 'hcm') && 
          (lower.includes('hcm') || lower.includes('sài gòn') || lower.includes('saigon'))) return true;
      return false;
    });
    if (hasTag) return true;
  }

  // 2. Tìm config chi tiết nếu có
  const cfg = PROVINCE_CONFIGS.find(p => p.name.toLowerCase() === target || p.id === target);
  let keywords = cfg ? [...cfg.keywords] : [target];

  // Rút gọn tên tỉnh để tìm kiếm tự nhiên
  const cleanName = target.replace(/^tp\.\s*/i, '').replace(/^tỉnh\s*/i, '').trim();
  if (cleanName && !keywords.includes(cleanName)) {
    keywords.push(cleanName);
  }
  if (cleanName.includes('-')) {
    cleanName.split('-').forEach(part => {
      const p = part.trim();
      if (p.length > 3 && !keywords.includes(p)) keywords.push(p);
    });
  }

  const textToSearch = `${trip.pickup_location || ''} ${trip.dropoff_location || ''} ${(trip.service_tags || []).join(' ')} ${trip.notes || ''}`.toLowerCase();

  return keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
}

export function checkTripIsOtherProvince(trip) {
  if (!trip) return false;
  const isKnown = VIETNAM_PROVINCES.some(p => checkTripMatchesProvince(trip, p));
  return !isKnown;
}
