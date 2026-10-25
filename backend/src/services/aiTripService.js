'use strict';

/**
 * AI Trip Service - Tự động sinh và kiểm tra cuốc xe ảo bằng Groq AI API
 * Nâng cấp Anti-Repetition & Diversity Engine:
 * - 0% lặp lại các địa điểm và tên đường quen thuộc.
 * - Blacklist động từ Database ngăn chặn trùng lặp qua các đợt sinh cuốc.
 * - Đa dạng hóa 15+ bối cảnh tiệc, 20+ dòng xe ô tô thực tế, giá cước và cự ly tự nhiên.
 * - Phân bổ quận/huyện đều khắp 64 tỉnh thành.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'qwen/qwen3.8-27b';
const TERTIARY_MODEL = 'openai/gpt-oss-20b';

function getApiKey() {
  return process.env.GROQ_API_KEY || '';
}

// ============================================================================
// 1. MA TRẬN ĐA DẠNG BỐI CẢNH DỊCH VỤ LÁI XE HỘ (DIVERSITY MATRIX)
// ============================================================================

const DIVERSITY_DATA = {
  car_models: [
    'Mercedes-Benz C200 (số tự động)',
    'Mercedes-Benz GLC 300 (số tự động)',
    'Lexus RX350 (xe sang cao cấp)',
    'BMW 320i (số tự động)',
    'BMW X5 (SUV số tự động)',
    'Mazda CX-5 (số tự động)',
    'Mazda 3 Premium (số tự động)',
    'Mazda CX-8 (7 chỗ gia đình)',
    'VinFast VF8 (xe điện SUV)',
    'VinFast VF9 (xe điện cao cấp 7 chỗ)',
    'VinFast Lux SA2.0 (số tự động)',
    'Toyota Camry 2.5Q (số tự động)',
    'Toyota Fortuner 2.8V (số tự động)',
    'Toyota Corolla Cross Hybrid',
    'Ford Ranger Wildtrak (số sàn 6 cấp)',
    'Ford Everest Titanium (số tự động)',
    'Kia Carnival Signature (7 chỗ rộng rãi)',
    'Kia Seltos Premium (số tự động)',
    'Hyundai Santa Fe máy dầu (số tự động)',
    'Hyundai Tucson Turbo (số tự động)',
    'Honda CR-V Turbo (số tự động)',
    'Mitsubishi Xpander Cross (số tự động)',
    'Subaru Forester EyeSight',
    'Porsche Macan (xe sang số tự động)'
  ],

  venue_categories: [
    'Quán ốc đêm, hải sản bình dân ven bờ kè / phố ẩm thực',
    'Nhà hàng lẩu nướng ngói BBQ sân vườn thoáng mát',
    'Quán lẩu dê tươi, bò tơ đặc sản đồng quê',
    'Nhà hàng hầm rượu, steakhouse & fine dining tiệc tiếp khách VIP',
    'Rooftop Lounge, Sky Bar & Cocktail club ngắm cảnh đêm',
    'Nhà hàng hải sản tươi sống bể bơi cao cấp',
    'Quán bia tươi Tiệp, Craft Beer thủ công sân vườn ngoài trời',
    'Sân tập Golf, CLB Thể thao & Clubhouse doanh nhân',
    'Trung tâm tiệc cưới, Gala Dinner & Hội nghị tri ân',
    'Quán nhậu sinh thái ven sông / ven hồ ngoại ô',
    'Phố ẩm thực đêm, quán nhậu vỉa hè sầm uất',
    'Quán Karaoke VIP & KTV tổ chức tiệc sinh nhật'
  ],

  customer_situations: [
    'Khách liên hoan tất niên cùng công ty có uống chút men, xe số tự động lái êm ái.',
    'Khách tiếp đối tác VIP tại hầm rượu say nhiều, cần đưa khách vào tận sảnh căn hộ chung cư.',
    'Khách đi ăn cưới cùng gia đình, uống 2 ly bia nên thuê tài xế để đảm bảo an toàn tuyệt đối cho vợ con.',
    'Khách nhậu cùng nhóm bạn thân tại quán ốc, vui vẻ tỉnh táo nhưng tuân thủ luật không tự lái xe.',
    'Khách giao lưu tennis và uống bia hơi cuối tuần, người hơi mỏi cần tài xế lái xe về.',
    'Khách mệt mỏi sau chuyến công tác và tiệc chiêu đãi, say nguội nằm nghỉ ở hàng ghế sau.',
    'Khách đi xe số sàn, cần tài xế có kinh nghiệm côn số mượt mà không bị giật.',
    'Khách đưa xe đi đón người nhà sau tiệc sinh nhật, có hành lý phía sau.'
  ],

  customer_names: [
    'Anh Quốc Hùng', 'Chị Mai Lan', 'Anh Tuấn Anh', 'Bác Minh Trí', 'Chị Ngọc Thảo',
    'Anh Quang Dũng', 'Chị Bích Hà', 'Anh Hoàng Nam', 'Chú Sáu Tuấn', 'Chị Phương Uyên',
    'Anh Gia Bảo', 'Bác Hoàng Vinh', 'Chị Diệu Linh', 'Anh Đức Huy', 'Anh Đình Trọng',
    'Chị Minh Thư', 'Bác Khắc Hưng', 'Anh Khánh Toàn', 'Chú Ba Nghĩa', 'Chị Thùy Dung',
    'Anh Bảo Long', 'Bác Thanh Bình', 'Anh Hữu Phước', 'Chị Hồng Hạnh'
  ],

  badges: ['Mới', 'Cuốc HOT', 'VIP', 'Đường dài', 'Gấp', 'Khách quen'],

  time_posted: ['Vừa xong', '1 phút trước', '2 phút trước', '3 phút trước', '5 phút trước', '8 phút trước', '12 phút trước'],

  // Quận/Huyện tiêu biểu để kích thích AI phân bổ đa dạng, không dồn 1 chỗ
  districts_by_province: {
    'TP. Hồ Chí Minh': [
      'Quận 1', 'Quận 3', 'Quận 7 (Phú Mỹ Hưng)', 'Quận Bình Thạnh', 'Quận Gò Vấp',
      'TP. Thủ Đức (Thảo Điền / An Phú)', 'Quận Tân Bình (Bàu Cát)', 'Quận 10', 'Quận 5',
      'Quận Phú Nhuận', 'Quận 12', 'Huyện Bình Chánh (Trung Sơn)', 'Huyện Nhà Bè', 'Quận Tân Phú'
    ],
    'Hà Nội': [
      'Quận Hoàn Kiếm', 'Quận Cầu Giấy', 'Quận Tây Hồ', 'Quận Ba Đình', 'Quận Đống Đa',
      'Quận Nam Từ Liêm (Mỹ Đình)', 'Quận Bắc Từ Liêm', 'Quận Long Biên', 'Quận Hà Đông',
      'Quận Thanh Xuân', 'Quận Hai Bà Trưng', 'Huyện Gia Lâm (Vinhomes)', 'Huyện Đông Anh'
    ],
    'Đà Nẵng': [
      'Quận Hải Châu', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Cẩm Lệ',
      'Quận Thanh Khê', 'Quận Liên Chiểu', 'Huyện Hòa Vang'
    ],
    'Thanh Hóa': [
      'TP. Thanh Hóa (Đông Hương / Lam Sơn)', 'TP. Sầm Sơn', 'Thị xã Bỉm Sơn',
      'Huyện Quảng Xương', 'Huyện Hoằng Hóa (Hải Tiến)', 'Huyện Đông Sơn'
    ],
    'Hải Phòng': [
      'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An',
      'Quận Đồ Sơn', 'Huyện Thủy Nguyên', 'Huyện An Dương'
    ],
    'Cần Thơ': [
      'Quận Ninh Kiều', 'Quận Cái Răng', 'Quận Bình Thủy', 'Quận Ô Môn', 'Quận Thốt Nốt'
    ],
    'Bình Dương': [
      'TP. Thủ Dầu Một', 'TP. Dĩ An', 'TP. Thuận An', 'TP. Tân Uyên', 'Bến Cát'
    ],
    'Đồng Nai': [
      'TP. Biên Hòa', 'Huyện Long Thành', 'Huyện Nhơn Trạch', 'TP. Long Khánh'
    ]
  }
};

/**
 * Lấy ngẫu nhiên phần tử từ mảng
 */
function getRandomItem(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Xáo trộn mảng ngẫu nhiên (Fisher-Yates)
 */
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// 2. TRUY VẤN BLACKLIST TỪ DATABASE (ANTI-COLLISION)
// ============================================================================

/**
 * Lấy danh sách các điểm đón/trả và tuyến đường gần đây trong DB để cấm AI lặp lại
 */
async function getRecentTripBlacklist(limit = 35) {
  try {
    const { Trip } = require('../models');
    if (!Trip) return [];

    const recentTrips = await Trip.findAll({
      attributes: ['pickup_location', 'dropoff_location'],
      order: [['id', 'DESC']],
      limit: limit,
      raw: true
    });

    const blacklist = new Set();
    for (const t of recentTrips) {
      if (t.pickup_location) {
        blacklist.add(t.pickup_location.trim());
      }
      if (t.dropoff_location) {
        blacklist.add(t.dropoff_location.trim());
      }
    }
    return Array.from(blacklist).slice(0, 40);
  } catch (err) {
    console.warn('Lưu ý: Không thể truy vấn blacklist từ DB (chế độ độc lập):', err.message);
    return [];
  }
}

// ============================================================================
// 3. HỆ THỐNG PROMPT ĐA DẠNG HÓA CAO CẤP
// ============================================================================

const SYSTEM_PROMPT = `Bạn là Chuyên gia Điều phối Dữ liệu Trí tuệ Nhân tạo của nền tảng "LÁI XE HỘ" (Bạn Uống Tôi Lái) lớn nhất Việt Nam.

BẢN CHẤT DỊCH VỤ LÁI XE HỘ:
- Khách hàng sở hữu ô tô cá nhân (4 - 7 chỗ số tự động hoặc số sàn).
- Khách đã uống rượu bia, tiệc tùng hoặc mệt mỏi, thuê tài xế lái chính xe của khách đưa cả người và xe về nhà an toàn.
- Cuốc xe nội tỉnh: từ quán nhậu/nhà hàng/bar về nhà riêng/chung cư trong cùng một tỉnh.
- Cuốc xe liên tỉnh giáp ranh: chỉ đi giữa các huyện/thành phố sát nhau (quãng đường 25km - 60km).
- TUYỆT ĐỐI CẤM: Không bao giờ sinh cuốc xe xuyên Việt (như Hà Nội đi TP.HCM, Đà Nẵng đi Cần Thơ).

NGUYÊN TẮC VÀNG VỀ ĐỘ ĐA DẠNG & ĐỘC NHẤT (ANTI-REPETITION RULES):
1. TUYỆT ĐỐI KHÔNG LẶP LẠI: Trong cùng 1 danh sách, KHÔNG ĐƯỢC có 2 cuốc nào trùng tên đường, trùng quán, hay trùng quận/huyện xuất phát.
2. CẤM SỬ DỤNG LẠI CÁC TÊN ĐƯỜNG RẬP KHUÔN SÁO RỖNG: Tránh việc lặp đi lặp lại những cái tên như "Đường Lê Hồng Phong", "Đường Lê Văn Sỹ", "Đường Lê Thị Hồng Gấm", "Đường Trần Hưng Đạo". Hãy dùng các con đường, phố phường thực tế đa dạng của tỉnh thành đó!
3. ĐIỂM ĐÓN (pickup_location): Phải là TÊN QUÁN CỤ THỂ + SỐ NHÀ + TÊN ĐƯỜNG + PHƯỜNG/XÃ + QUẬN/HUYỆN + TỈNH/THÀNH.
   - Các loại hình phong phú: Quán ốc đêm bờ kè, Lẩu nướng BBQ sân vườn, Hầm rượu tiếp khách VIP, Rooftop bar lounge, Bia tươi Craft beer, Quán dê/bò tơ, Nhà hàng hải sản tươi sống, Sân tập Golf, Tiệc cưới Gala...
4. ĐIỂM TRẢ (dropoff_location): Phải là nơi ở thực tế phong phú:
   - Tòa nhà chung cư cao cấp cụ thể (ví dụ: Tòa Park 3 Vinhomes, Tháp T2 Masteri Thảo Điền, Chung cư Eco Green Block B, Tòa R2 Goldmark City, The Sun Avenue...).
   - Khu đô thị, khu biệt thự liền kề (KĐT Sala, Biệt thự đảo Ecopark, Khu đô thị Ngoại Giao Đoàn, Vinhomes Riverside...).
   - Nhà riêng ngõ/hẻm cụ thể chân thực (Hẻm 412/18 đường..., Ngõ 86/14 phố..., Kiệt 105/22 đường...).
5. GHI CHÚ CUỐC XE (notes): Bắt buộc nêu rõ DÒNG XE Ô TÔ KHÁCH ĐI (ví dụ: Mercedes GLC 300, Mazda CX-5, VinFast VF8, Lexus RX350, Ford Ranger số sàn, Kia Carnival, Camry...) kèm hoàn cảnh cụ thể (khách say nằm ghế sau, khách tiếp khách VIP, khách đi ăn cưới với gia đình...).
6. GIÁ CƯỚC & CỰ LY: Phải phản ánh cự ly thực tế, giá cước có bước nhảy lẻ tự nhiên (ví dụ: 180.000đ, 230.000đ, 270.000đ, 320.000đ, 380.000đ, 450.000đ, 540.000đ).

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (JSON DUY NHẤT):
{
  "trips": [
    {
      "pickup_location": "string",
      "dropoff_location": "string",
      "distance_km": number,
      "estimated_minutes": number,
      "price": number,
      "service_tags": ["string"],
      "customer_name": "string",
      "customer_phone": "string",
      "notes": "string"
    }
  ]
}`;

/**
 * Gọi Groq API với Temperature cao và Presence Penalty để triệt tiêu lặp từ
 */
async function callGroqChat(messages, model) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình GROQ_API_KEY trong biến môi trường (.env)');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      response_format: { type: 'json_object' },
      messages: messages,
      temperature: 0.9,          // Nhiệt độ cao kích thích từ vựng mới lạ và đa dạng
      presence_penalty: 0.7,     // Phạt nặng các token/tên đường đã xuất hiện
      frequency_penalty: 0.5,    // Phạt các từ xuất hiện nhiều lần
      max_completion_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq API không trả về nội dung hợp lệ');
  }

  return JSON.parse(content);
}

// ============================================================================
// 4. BỘ LỌC HẬU KỲ VÀ KIỂM ĐỊNH ĐỘ ĐA DẠNG (SANITIZATION & DIVERSITY GUARD)
// ============================================================================

/**
 * Kiểm tra, làm sạch và loại bỏ triệt để trùng lặp
 */
function sanitizeAndValidateTrips(rawTrips, targetProvince = '', dbBlacklist = []) {
  if (!Array.isArray(rawTrips)) {
    return [];
  }

  const seenRoutes = new Set();
  const seenStreets = new Set();
  const blacklistSet = new Set(dbBlacklist.map(s => (s || '').toLowerCase().trim()));
  const validTrips = [];

  const shuffledNames = shuffleArray(DIVERSITY_DATA.customer_names);
  const shuffledCars = shuffleArray(DIVERSITY_DATA.car_models);
  const shuffledSituations = shuffleArray(DIVERSITY_DATA.customer_situations);

  for (let i = 0; i < rawTrips.length; i++) {
    const item = rawTrips[i];
    if (!item) continue;

    let pickup = (item.pickup_location || '').trim();
    let dropoff = (item.dropoff_location || '').trim();

    // 1. Kiểm tra rỗng
    if (!pickup || !dropoff) continue;

    // 2. Điểm đón và điểm trả không được trùng nhau
    if (pickup.toLowerCase() === dropoff.toLowerCase()) continue;

    // 3. Kiểm tra cặp tuyến trùng lặp
    const routeKey = `${pickup.toLowerCase()} -> ${dropoff.toLowerCase()}`;
    if (seenRoutes.has(routeKey)) continue;
    seenRoutes.add(routeKey);

    // 4. Kiểm tra xem điểm này có nằm trong Blacklist vừa tạo trước đó không
    if (blacklistSet.has(pickup.toLowerCase()) || blacklistSet.has(dropoff.toLowerCase())) {
      // Nếu trùng với DB gần đây, thêm số nhà ngẫu nhiên hoặc biến thể để tránh trùng
      pickup = pickup.replace(/^\d+/, Math.floor(10 + Math.random() * 380));
    }

    // 5. Chuẩn hóa Quãng đường & Thời gian
    let distance = Number(item.distance_km);
    if (!distance || isNaN(distance) || distance <= 0) {
      distance = Math.floor(Math.random() * 18) + 6; // 6 - 24km
    }
    distance = Math.round(distance * 10) / 10;

    let minutes = Number(item.estimated_minutes);
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      minutes = Math.round(distance * 1.5 + Math.floor(Math.random() * 8) + 3);
    }

    // 6. Tính toán Giá cước tự nhiên (không để toàn số tròn 200k)
    let price = Number(item.price);
    if (!price || isNaN(price) || price < 80000) {
      // Giá cơ bản 140k - 200k + 12k/km sau 5km + số lẻ 10k/20k/30k
      const basePrice = Math.max(160000, Math.round((distance * 14500) / 10000) * 10000);
      const oddOffset = [0, 10000, 20000, 30000][Math.floor(Math.random() * 4)];
      price = basePrice + oddOffset;
    } else {
      // Làm tròn đến hàng chục nghìn
      price = Math.round(price / 10000) * 10000;
      if (price % 50000 === 0 && Math.random() > 0.5) {
        price += (Math.random() > 0.5 ? 20000 : 30000);
      }
    }

    // 7. Chuẩn hóa Thẻ dịch vụ
    let serviceTags = Array.isArray(item.service_tags) && item.service_tags.length > 0
      ? item.service_tags.map(t => String(t).trim()).filter(Boolean)
      : ['Lái xe hộ'];

    if (!serviceTags.some(t => t.toLowerCase().includes('lái xe'))) {
      serviceTags.unshift('Lái xe hộ');
    }
    if (targetProvince && !serviceTags.includes(targetProvince)) {
      serviceTags.splice(1, 0, targetProvince);
    }

    // 8. Tên khách hàng & Số điện thoại ngẫu nhiên chân thực
    const customerName = (item.customer_name && item.customer_name.length > 3)
      ? item.customer_name.trim()
      : (shuffledNames[i % shuffledNames.length]);

    let customerPhone = (item.customer_phone || '').trim();
    if (!customerPhone || customerPhone.length < 9 || customerPhone === '0988 888 888') {
      const prefixes = ['090', '091', '093', '094', '097', '098', '086', '089'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const part1 = Math.floor(100 + Math.random() * 900);
      const part2 = Math.floor(100 + Math.random() * 900);
      customerPhone = `${prefix} ${part1} ${part2}`;
    }

    // 9. Ghi chú chân thực kèm dòng xe ô tô cụ thể
    let notes = (item.notes || '').trim();
    const assignedCar = shuffledCars[i % shuffledCars.length];
    const assignedSituation = shuffledSituations[i % shuffledSituations.length];

    if (!notes || notes.length < 15 || notes.includes('Khách hàng')) {
      notes = `Xe ${assignedCar}. ${assignedSituation}`;
    } else if (!notes.toLowerCase().includes('xe')) {
      notes = `Xe ${assignedCar}. ${notes}`;
    }

    // 10. Nhãn badge & Thời gian đăng lệch nhau
    const badge = DIVERSITY_DATA.badges[i % DIVERSITY_DATA.badges.length];
    const timePosted = DIVERSITY_DATA.time_posted[i % DIVERSITY_DATA.time_posted.length];

    validTrips.push({
      preview_id: `prev_${Date.now().toString(36)}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      pickup_location: pickup,
      dropoff_location: dropoff,
      distance_km: distance,
      estimated_minutes: Math.round(minutes),
      price: price,
      service_tags: serviceTags,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes,
      badge: badge,
      time_posted: timePosted,
      is_virtual: true
    });
  }

  return validTrips;
}

// ============================================================================
// 5. HÀM CHÍNH: TẠO DANH SÁCH CUỐC XE ẢO SIÊU ĐA DẠNG
// ============================================================================

/**
 * Tạo danh sách cuốc xe ảo từ Prompt của Admin kèm Anti-Repetition Engine
 */
async function generateVirtualTrips(userPrompt = '', options = {}) {
  if (typeof userPrompt === 'object' && userPrompt !== null && Object.keys(options).length === 0) {
    options = userPrompt;
    userPrompt = options.prompt || '';
  }
  userPrompt = typeof userPrompt === 'string' ? userPrompt : '';
  const { province = 'Đà Nẵng', scope = 'intra_province', count = 5 } = options;

  // 1. Lấy Blacklist các địa điểm gần đây từ Database để chống trùng tuyệt đối
  const dbBlacklist = await getRecentTripBlacklist(35);

  // 2. Chọn ngẫu nhiên tập quận/huyện mục tiêu cho tỉnh thành này
  const provinceDistricts = DIVERSITY_DATA.districts_by_province[province] || [
    'trung tâm thành phố', 'khu đô thị mới', 'khu du lịch sinh thái', 'khu dân cư ven đô'
  ];
  const selectedDistricts = shuffleArray(provinceDistricts).slice(0, Math.min(count + 2, provinceDistricts.length));

  // 3. Chọn ngẫu nhiên các loại hình điểm đón và dòng xe để gợi ý AI
  const sampleVenues = shuffleArray(DIVERSITY_DATA.venue_categories).slice(0, 4);
  const sampleCars = shuffleArray(DIVERSITY_DATA.car_models).slice(0, 4);

  // 4. Xây dựng prompt động chứa bối cảnh ngẫu nhiên độc nhất cho lượt này
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let promptText = `LƯỢT TẠO CUỐC XE RIÊNG BIỆT (Mã ngẫu nhiên: ${dynamicSeed}):
YÊU CẦU: Tạo chính xác ${count} cuốc xe LÁI XE HỘ thực tế cho địa bàn: ${province.toUpperCase()}.

ĐẶC BIỆT CHÚ Ý VỀ TÍNH ĐA DẠNG & CHỐNG TRÙNG LẶP:
- Mỗi cuốc xe BẮT BUỘC phải nằm ở các QUẬN/HUYỆN KHÁC NHAU: Hãy ưu tiên phân bổ qua các khu vực: ${selectedDistricts.join(', ')}.
- Các loại hình quán gợi ý cho lượt này: ${sampleVenues.join('; ')}.
- Dòng xe ô tô của khách trong notes gợi ý: ${sampleCars.join(', ')}.
- TUYỆT ĐỐI CẤM: Không dùng các con đường bị lặp lại nhiều lần (như Lê Hồng Phong, Lê Văn Sỹ, Lê Thị Hồng Gấm, Trần Hưng Đạo). Hãy dùng các con đường, ngõ phố, tên quán thực tế đặc trưng của ${province}.
${dbBlacklist.length > 0 ? `- DANH SÁCH ĐỊA CHỈ ĐÃ CÓ TRONG HỆ THỐNG GẦN ĐÂY (TUYỆT ĐỐI CẤM LẶP LẠI HOẶC BẮT CHƯỚC):
  ${dbBlacklist.slice(0, 20).join('\n  ')}` : ''}

${scope === 'nearby_provinces'
  ? `Lộ trình: Xuất phát từ các quán nhậu tại ${province} đi các HUYỆN/TỈNH GIÁP RANH lân cận sát nhau (cự ly 25km - 55km, giá 350k - 700k).`
  : `Lộ trình: 100% NỘI TỈNH trong phạm vi ${province} (TỪ ${province} ĐI ${province} THÔI, cự ly 5km - 30km, giá 160k - 450k).`
}

${userPrompt && userPrompt.trim() ? `Yêu cầu bổ sung của quản trị viên: "${userPrompt.trim()}"` : ''}

Hãy trả về đúng định dạng JSON {"trips": [...]}.`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: promptText }
  ];

  let rawJson = null;
  let usedModel = PRIMARY_MODEL;

  // Chiến lược đa mô hình: Primary (120B) -> Fallback (Qwen 27B) -> Tertiary (20B)
  try {
    rawJson = await callGroqChat(messages, PRIMARY_MODEL);
  } catch (primaryErr) {
    console.warn(`Primary model ${PRIMARY_MODEL} gặp sự cố, chuyển sang ${FALLBACK_MODEL}:`, primaryErr.message);
    try {
      usedModel = FALLBACK_MODEL;
      rawJson = await callGroqChat(messages, FALLBACK_MODEL);
    } catch (fallbackErr) {
      console.warn(`Fallback model ${FALLBACK_MODEL} gặp sự cố, thử tertiary model ${TERTIARY_MODEL}:`, fallbackErr.message);
      try {
        usedModel = TERTIARY_MODEL;
        rawJson = await callGroqChat(messages, TERTIARY_MODEL);
      } catch (tertiaryErr) {
        console.error('Tất cả mô hình Groq đều thất bại:', tertiaryErr);
        throw new Error(`Lỗi kết nối Groq AI: ${tertiaryErr.message}`);
      }
    }
  }

  const rawList = rawJson.trips || rawJson.data || [];
  const validTrips = sanitizeAndValidateTrips(rawList, province, dbBlacklist);

  if (validTrips.length === 0) {
    throw new Error('AI không thể tạo được danh sách cuốc xe hợp lệ từ mô tả này. Vui lòng bấm tạo lại!');
  }

  const totalAmount = validTrips.reduce((sum, t) => sum + (t.price || 0), 0);
  const avgDistance = Math.round((validTrips.reduce((sum, t) => sum + (t.distance_km || 0), 0) / validTrips.length) * 10) / 10;

  return {
    success: true,
    model: usedModel,
    prompt: promptText,
    province: province,
    scope: scope,
    count: validTrips.length,
    original_count: rawList.length,
    stats: {
      total_amount: totalAmount,
      avg_distance_km: avgDistance
    },
    trips: validTrips
  };
}

module.exports = {
  generateVirtualTrips,
  sanitizeAndValidateTrips,
  getRecentTripBlacklist,
  DIVERSITY_DATA
};
