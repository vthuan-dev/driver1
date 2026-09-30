const RAW_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${formattedEndpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi gọi máy chủ');
  }
  return data;
}

export const api = {
  // Xác thực & Tài khoản
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  registerUser: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: (id) => request(`/auth/me${id ? `?id=${id}` : ''}`),

  // Tài xế
  getDriverProfile: (id) => request(`/drivers/profile/${id}`),
  registerDriver: (data) => request('/drivers/register', { method: 'POST', body: JSON.stringify(data) }),
  toggleDriverOnline: (id) => request(`/drivers/${id}/toggle-online`, { method: 'PATCH' }),
  updateDriverProfile: (id, data) => request(`/drivers/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) }),

  // Cuốc xe
  getTripsFeed: (status = 'new', driverId) => request(`/trips/feed?status=${status}${driverId ? `&driver_id=${driverId}` : ''}`),
  getTripCounts: (driverId) => request(`/trips/counts${driverId ? `?driver_id=${driverId}` : ''}`),
  acceptTrip: (tripId, driverId) => request(`/trips/${tripId}/accept`, { method: 'POST', body: JSON.stringify({ driver_id: driverId }) }),
  completeTrip: (tripId) => request(`/trips/${tripId}/complete`, { method: 'POST' }),

  // Cấu hình hệ thống
  getSystemConfig: () => request('/system/config'),

  // Admin Portal (Đầy đủ 7 tính năng)
  getAdminOverview: () => request('/admin/overview'),
  getAllDrivers: (status) => request(`/admin/drivers${status ? `?status=${status}` : ''}`),
  approveDriver: (id) => request(`/admin/drivers/${id}/approve`, { method: 'PATCH' }),
  rejectDriver: (id) => request(`/admin/drivers/${id}/reject`, { method: 'PATCH' }),
  updateDriverDocuments: (id, data) => request(`/admin/drivers/${id}/documents`, { method: 'PATCH', body: JSON.stringify(data) }),
  createTrip: (data) => request('/admin/trips', { method: 'POST', body: JSON.stringify(data) }),
  createVirtualTrip: (data) => request('/admin/trips/virtual', { method: 'POST', body: JSON.stringify(data) }),
  autoGenerateVirtualTrips: () => request('/admin/trips/virtual/auto-generate', { method: 'POST' }),
  updateDriverMetrics: (id, data) => request(`/admin/drivers/${id}/metrics`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleBlockDriver: (id) => request(`/admin/drivers/${id}/toggle-block`, { method: 'PATCH' }),
  deleteDriver: (id) => request(`/admin/drivers/${id}`, { method: 'DELETE' }),
  updateDriverIncome: (id, data) => request(`/admin/drivers/${id}/income`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateDriverRating: (id, data) => request(`/admin/drivers/${id}/rating`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAllTrips: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/trips${query ? `?${query}` : ''}`);
  },
  unassignTrip: (id) => request(`/admin/trips/${id}/unassign`, { method: 'PATCH' }),
  adminCompleteTrip: (id) => request(`/admin/trips/${id}/complete`, { method: 'PATCH' }),
  deleteTrip: (id) => request(`/admin/trips/${id}`, { method: 'DELETE' }),
  changeAdminPassword: (data) => request('/admin/change-password', { method: 'POST', body: JSON.stringify(data) })
};

