'use strict';

/**
 * AI Trip Service - Tự động sinh và kiểm tra cuốc xe ảo bằng Groq AI API
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const FALLBACK_MODEL = 'openai/gpt-oss-120b';

function getApiKey() {
  return process.env.GROQ_API_KEY || '';
}

const SYSTEM_PROMPT = `Bạn là Trợ lý AI chuyên nghiệp của nền tảng dịch vụ "LÁI XE HỘ" (Bạn Uống Tôi Lái) hàng đầu tại Việt Nam.

BẢN CHẤT DỊCH VỤ LÁI XE HỘ:
- Khách hàng là chủ sở hữu xe ô tô (xe 4-7 chỗ số tự động hoặc số sàn cá nhân).
- Khách đi ăn uống, tiệc tùng, có chút men say hoặc mệt mỏi, thuê tài xế lái chính chiếc xe của khách đưa cả người và xe về nhà an toàn.
- ĐẶC THÙ LỘ TRÌNH:
  1. Cuốc xe NỘI TỈNH (trong cùng một tỉnh/thành phố): TỪ TỈNH NÀY ĐI TỈNH NÀY THÔI!
     - Ví dụ Đà Nẵng: từ các quán nhậu ven biển, nhà hàng đường 2/9, Bạch Đằng, Sơn Trà về chung cư/nhà riêng Hải Châu, Cẩm Lệ, Ngũ Hành Sơn.
     - Ví dụ TP. Hồ Chí Minh: từ Quận 1 đi Quận 12, từ Quận 3 đi Bình Thạnh, từ Quận 7 đi Gò Vấp/Tân Bình.
     - Ví dụ Hà Nội: từ Hoàn Kiếm, Cầu Giấy, Tây Hồ về Long Biên, Hà Đông, Nam Từ Liêm.
     - Ví dụ Thanh Hóa: từ TP. Thanh Hóa về Sầm Sơn, Quảng Xương, Hoằng Hóa, Đông Sơn.
     - Khoảng cách nội tỉnh: 4km - 35km. Giá cước: 150.000đ - 450.000đ.
  2. Cuốc xe TỈNH GIÁP RANH (chỉ giữa các tỉnh lân cận sát nhau):
     - Ví dụ: Đà Nẵng đi Hội An/Điện Bàn (Quảng Nam); Hà Nội đi Từ Sơn (Bắc Ninh) hoặc Văn Giang (Hưng Yên); TP.HCM đi Dĩ An/Biên Hòa.
     - Khoảng cách: 25km - 65km. Giá cước: 350.000đ - 800.000đ.
  3. TUYỆT ĐỐI CẤM: Không bao giờ sinh cuốc xe xuyên Việt (như Hà Nội đi TP.HCM, Đà Nẵng đi Cần Thơ) vì dịch vụ lái xe hộ không ai đi như vậy!

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU:
1. Địa chỉ điểm đón (pickup_location) và điểm trả (dropoff_location):
   - Phải có tên quán/nhà hàng/tòa nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố rõ ràng.
   - Điểm đón và điểm trả KHÔNG ĐƯỢC TRÙNG NHAU.
2. Quãng đường (distance_km): Số thực hoặc số nguyên > 0, tính theo khoảng cách thực tế giữa 2 điểm (4 - 40km cho nội tỉnh).
3. Thời gian dự kiến (estimated_minutes): Số nguyên phút, phù hợp với quãng đường (15 - 60 phút).
4. Giá cước (price): Số nguyên tiền Việt Nam Đồng (VNĐ).
   - Nội tỉnh: 150.000đ - 450.000đ.
   - Tỉnh giáp ranh: 350.000đ - 800.000đ.
5. Thẻ dịch vụ (service_tags): Mảng chuỗi tiếng Việt (ví dụ: ["Lái xe hộ", "Đà Nẵng", "Chở người say"], ["Lái xe hộ", "TP. Hồ Chí Minh", "Quận 1 - Quận 12"]).
6. Khách hàng:
   - customer_name: Tên khách xưng hô thân mật (ví dụ: "Anh Nam", "Chị Thảo", "Bác Tuấn", "Anh Minh", "Chị Hương").
   - customer_phone: Số điện thoại Việt Nam ngẫu nhiên (dạng "09xx xxx xxx").
   - notes: Ghi chú cuốc xe thực tế (ví dụ: "Khách có uống rượu bia, xe Mazda CX-5, cần lái xe cẩn thận", "Xe Fortuner số tự động, đón trước sảnh nhà hàng", "Khách say, đưa về tận sảnh chung cư").

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT:
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
 * Gọi Groq API để tạo cuốc xe
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
      temperature: 0.65,
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

/**
 * Kiểm tra, làm sạch và loại bỏ trùng lặp dữ liệu cuốc xe (Sanitization & Validation)
 */
function sanitizeAndValidateTrips(rawTrips, targetProvince = '') {
  if (!Array.isArray(rawTrips)) {
    return [];
  }

  const seenRoutes = new Set();
  const validTrips = [];

  const defaultNames = ['Anh Hùng', 'Chị Lan', 'Anh Minh', 'Bác Thành', 'Chị Ngọc', 'Anh Dũng', 'Chị Hà'];
  const defaultTags = ['Lái xe hộ'];

  for (let i = 0; i < rawTrips.length; i++) {
    const item = rawTrips[i];
    if (!item) continue;

    const pickup = (item.pickup_location || '').trim();
    const dropoff = (item.dropoff_location || '').trim();

    // 1. Kiểm tra dữ liệu thiếu: Điểm đón và Điểm trả không được để trống
    if (!pickup || !dropoff) continue;

    // 2. Điểm đón và Điểm trả không được giống hệt nhau
    if (pickup.toLowerCase() === dropoff.toLowerCase()) continue;

    // 3. Kiểm tra tuyến trùng: không sinh lặp lại cùng 1 cặp đón -> trả trong cùng đợt
    const routeKey = `${pickup.toLowerCase()} -> ${dropoff.toLowerCase()}`;
    if (seenRoutes.has(routeKey)) continue;
    seenRoutes.add(routeKey);

    // 4. Chuẩn hóa Quãng đường & Thời gian
    let distance = Number(item.distance_km);
    if (!distance || isNaN(distance) || distance <= 0) {
      distance = Math.floor(Math.random() * 20) + 5; // 5 - 25km
    }

    let minutes = Number(item.estimated_minutes);
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      minutes = Math.round(distance * 1.6 + 5);
    }

    // 5. Chuẩn hóa Giá cước (VNĐ số nguyên)
    let price = Number(item.price);
    if (!price || isNaN(price) || price < 50000) {
      price = Math.max(150000, Math.round((distance * 15000) / 10000) * 10000);
    } else {
      // Làm tròn đến hàng nghìn
      price = Math.round(price / 1000) * 1000;
    }

    // 6. Chuẩn hóa Thẻ dịch vụ
    let serviceTags = Array.isArray(item.service_tags) && item.service_tags.length > 0
      ? item.service_tags.map(t => String(t).trim()).filter(Boolean)
      : defaultTags;
    if (!serviceTags.some(t => t.toLowerCase().includes('lái xe'))) {
      serviceTags.unshift('Lái xe hộ');
    }
    // Gắn thẻ Tỉnh thành vào cuốc xe để hỗ trợ bộ lọc
    if (targetProvince && !serviceTags.includes(targetProvince)) {
      serviceTags.splice(1, 0, targetProvince);
    }

    // 7. Khách hàng & SĐT
    const customerName = (item.customer_name || defaultNames[i % defaultNames.length]).trim();
    let customerPhone = (item.customer_phone || '').trim();
    if (!customerPhone || customerPhone.length < 8) {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
      customerPhone = `09${randomDigits.toString().substring(0, 2)} ${randomDigits.toString().substring(2, 5)} ${randomDigits.toString().substring(5, 7)}`;
    }

    // 8. Ghi chú
    const notes = (item.notes || 'Khách say cần lái xe hộ đưa cả người và xe về nhà an toàn.').trim();

    validTrips.push({
      preview_id: `prev_${Date.now().toString(36)}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      pickup_location: pickup,
      dropoff_location: dropoff,
      distance_km: Math.round(distance * 10) / 10,
      estimated_minutes: Math.round(minutes),
      price: price,
      service_tags: serviceTags,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes,
      badge: 'Mới',
      is_virtual: true
    });
  }

  return validTrips;
}

/**
 * Hàm chính: Tạo danh sách cuốc xe ảo từ Prompt của Admin (có phân chia theo Tỉnh/Thành phố)
 */
async function generateVirtualTrips(userPrompt, options = {}) {
  const { province = 'Đà Nẵng', scope = 'intra_province', count = 5 } = options;

  let promptText = '';
  if (province) {
    if (scope === 'intra_province') {
      promptText = `YÊU CẦU LỘ TRÌNH ĐẶC THÙ LÁI XE HỘ:
Tạo chính xác ${count} cuốc xe LÁI XE HỘ NỘI TỈNH trong phạm vi ${province} (TỪ ${province.toUpperCase()} ĐI ${province.toUpperCase()} THÔI).
Tất cả điểm đón và điểm trả 100% BẮT BUỘC phải nằm trong địa bàn ${province}.
- Điểm đón: Các quán nhậu, nhà hàng, quán bar, quán bia, khách sạn, trung tâm tiệc tại ${province}.
- Điểm trả: Chung cư, khu dân cư, ngõ phố nhà riêng tại ${province}.
- Ví dụ nếu là TP. Hồ Chí Minh: Sinh các cuốc như Quận 1 đi Quận 12, Quận 3 đi Gò Vấp, Bình Thạnh đi Thủ Đức, Quận 7 đi Tân Bình...
- Ví dụ nếu là Đà Nẵng: Sinh các cuốc như Hải Châu, Sơn Trà, Ngũ Hành Sơn đi Cẩm Lệ, Thanh Khê, Liên Chiểu...
- Quãng đường: 4km đến 35km. Giá cước: 150.000đ đến 450.000đ.
${userPrompt && userPrompt.trim() ? `Yêu cầu thêm từ người dùng: ${userPrompt.trim()}` : ''}`;
    } else if (scope === 'nearby_provinces') {
      promptText = `YÊU CẦU LỘ TRÌNH LÁI XE HỘ LIÊN TỈNH GẦN NHAU:
Tạo chính xác ${count} cuốc xe LÁI XE HỘ xuất phát từ ${province} đi các HUYỆN/TỈNH LÂN CẬN GIÁP RANH SÁT NHAU với ${province} (ví dụ Đà Nẵng đi Hội An/Điện Bàn Quảng Nam; Hà Nội đi Từ Sơn Bắc Ninh/Văn Giang Hưng Yên; TP.HCM đi Dĩ An/Biên Hòa; Thanh Hóa đi Sầm Sơn/Bỉm Sơn/Ninh Bình).
- Quãng đường hợp lý: 25km đến 65km. Giá cước: 350.000đ đến 800.000đ.
${userPrompt && userPrompt.trim() ? `Yêu cầu thêm từ người dùng: ${userPrompt.trim()}` : ''}`;
    } else {
      promptText = `Tạo ${count} cuốc xe lái xe hộ tại ${province}. ${userPrompt ? userPrompt.trim() : ''}`;
    }
  } else {
    promptText = userPrompt && userPrompt.trim() ? userPrompt.trim() : 'Tạo 5 cuốc xe lái xe hộ trong nội thành.';
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: promptText }
  ];

  let rawJson = null;
  let usedModel = PRIMARY_MODEL;

  try {
    // Thử với Primary Model (qwen/qwen3.8-27b)
    rawJson = await callGroqChat(messages, PRIMARY_MODEL);
  } catch (primaryErr) {
    console.warn(`Primary model ${PRIMARY_MODEL} failed, trying fallback ${FALLBACK_MODEL}:`, primaryErr.message);
    try {
      usedModel = FALLBACK_MODEL;
      rawJson = await callGroqChat(messages, FALLBACK_MODEL);
    } catch (fallbackErr) {
      console.error('All Groq models failed:', fallbackErr);
      throw new Error(`Lỗi kết nối Groq AI: ${fallbackErr.message}`);
    }
  }

  const rawList = rawJson.trips || rawJson.data || [];
  const validTrips = sanitizeAndValidateTrips(rawList, province);

  if (validTrips.length === 0) {
    throw new Error('AI không thể tạo được danh sách cuốc xe hợp lệ từ mô tả này. Vui lòng thử lại!');
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
  sanitizeAndValidateTrips
};
