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

const SYSTEM_PROMPT = `Bạn là Trợ lý AI chuyên nghiệp của nền tảng vận tải & lái xe hộ tại Việt Nam.
Nhiệm vụ của bạn: Tạo danh sách các cuốc xe theo yêu cầu người dùng (prompt).

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU:
1. Địa chỉ điểm đón (pickup_location) và điểm trả (dropoff_location):
   - Phải là địa chỉ có thật, cụ thể, chính xác tại Việt Nam (có tên đường, tòa nhà, khách sạn, bến xe, sân bay, bệnh viện, khu công nghiệp, quận/huyện, tỉnh/thành).
   - Điểm đón và điểm trả KHÔNG ĐƯỢC TRÙNG NHAU.
2. Quãng đường (distance_km): Số thực hoặc số nguyên > 0, tính theo khoảng cách thực tế giữa 2 điểm.
3. Thời gian dự kiến (estimated_minutes): Số nguyên phút, phù hợp với quãng đường (trung bình 30-60 km/h tùy nội thành hoặc đường dài).
4. Giá cước (price): Số nguyên tiền Việt Nam Đồng (VNĐ).
   - Nếu prompt có chỉ định giá (ví dụ "giá 3-5 triệu", "150k - 300k"), BẮT BUỘC giá phải nằm trong khoảng người dùng yêu cầu (ví dụ: 3000000 đến 5000000).
   - Nếu prompt không chỉ định giá: Tính khoảng 12.000đ - 18.000đ/km (tối thiểu 100.000đ).
5. Thẻ dịch vụ (service_tags): Mảng chuỗi tiếng Việt (ví dụ: ["Lái xe hộ", "Xe 7 chỗ", "Đường dài"], ["Lái xe hộ", "Xe 5 chỗ", "Nội thành"], ["Lái xe hộ", "Đi tỉnh", "Cao tốc"]).
6. Khách hàng:
   - customer_name: Tên khách hàng xưng hô thân mật tự nhiên (ví dụ: "Anh Nam", "Chị Hạnh", "Bác Tuấn", "Anh Tuấn Anh", "Chị Mai Phương").
   - customer_phone: Số điện thoại Việt Nam ngẫu nhiên (dạng "09xx xxx xxx" hoặc "08xx xxx xxx").
   - notes: Ghi chú cuốc xe thực tế (ví dụ: "Khách cần lái xe bán tải Ford Ranger số tự động", "Xe Mercedes C200, đón đúng giờ", "Khách có chút men say, yêu cầu lái xe cẩn thận", "Cần xe sạch sẽ, có hành lý đi sân bay").

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
function sanitizeAndValidateTrips(rawTrips) {
  if (!Array.isArray(rawTrips)) {
    return [];
  }

  const seenRoutes = new Set();
  const validTrips = [];

  const defaultNames = ['Anh Hùng', 'Chị Lan', 'Anh Minh', 'Bác Thành', 'Chị Ngọc', 'Anh Dũng', 'Chị Hà'];
  const defaultTags = ['Lái xe hộ', 'Xe gia đình'];

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
      distance = Math.floor(Math.random() * 25) + 5; // 5 - 30km
    }

    let minutes = Number(item.estimated_minutes);
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      minutes = Math.round(distance * 1.5 + 5);
    }

    // 5. Chuẩn hóa Giá cước (VNĐ số nguyên)
    let price = Number(item.price);
    if (!price || isNaN(price) || price < 50000) {
      price = Math.max(100000, Math.round((distance * 15000) / 10000) * 10000);
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

    // 7. Khách hàng & SĐT
    const customerName = (item.customer_name || defaultNames[i % defaultNames.length]).trim();
    let customerPhone = (item.customer_phone || '').trim();
    if (!customerPhone || customerPhone.length < 8) {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
      customerPhone = `09${randomDigits.toString().substring(0, 2)} ${randomDigits.toString().substring(2, 5)} ${randomDigits.toString().substring(5, 7)}`;
    }

    // 8. Ghi chú
    const notes = (item.notes || 'Khách đặt cuốc qua ứng dụng, yêu cầu tài xế hỗ trợ chu đáo.').trim();

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
 * Hàm chính: Tạo danh sách cuốc xe ảo từ Prompt của Admin
 */
async function generateVirtualTrips(userPrompt) {
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error('Vui lòng nhập lệnh prompt mô tả cuốc xe cần tạo');
  }

  const promptText = userPrompt.trim();
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
  const validTrips = sanitizeAndValidateTrips(rawList);

  if (validTrips.length === 0) {
    throw new Error('AI không thể tạo được danh sách cuốc xe hợp lệ từ mô tả này. Vui lòng thử lại với câu lệnh chi tiết hơn!');
  }

  const totalAmount = validTrips.reduce((sum, t) => sum + (t.price || 0), 0);
  const avgDistance = Math.round((validTrips.reduce((sum, t) => sum + (t.distance_km || 0), 0) / validTrips.length) * 10) / 10;

  return {
    success: true,
    model: usedModel,
    prompt: promptText,
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
