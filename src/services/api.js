const BASE = '/api';

const getToken = () => localStorage.getItem('tatabu_auth_token');

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || 'Request failed');
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const put = (path, body) => request('PUT', path, body);
const del = (path) => request('DELETE', path);

// Auth
export const authAPI = {
  login: (identifier, password, role) => post('/auth/login', { identifier, password, role }),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
};

// Users
export const usersAPI = {
  getAll: (role) => get(`/users${role ? `?role=${role}` : ''}`),
  getById: (id) => get(`/users/${id}`),
  create: (data) => post('/users', data),
  update: (id, data) => put(`/users/${id}`, data),
  remove: (id) => del(`/users/${id}`),
};

// Classes
export const classesAPI = {
  getAll: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get(`/classes${qs}`);
  },
  getById: (id) => get(`/classes/${id}`),
  create: (data) => post('/classes', data),
  update: (id, data) => put(`/classes/${id}`, data),
  remove: (id) => del(`/classes/${id}`),
  enrollStudent: (classId, studentId) => post(`/classes/${classId}/students`, { studentId }),
  unenrollStudent: (classId, studentId) => del(`/classes/${classId}/students/${studentId}`),
};

// Attendance
export const attendanceAPI = {
  getAll: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get(`/attendance${qs}`);
  },
  create: (data) => post('/attendance', data),
  bulkUpsert: (data) => post('/attendance/bulk', data),
  update: (id, data) => put(`/attendance/${id}`, data),
  remove: (id) => del(`/attendance/${id}`),
};

// Memorization
export const memorizationAPI = {
  getAll: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get(`/memorization${qs}`);
  },
  create: (data) => post('/memorization', data),
  update: (id, data) => put(`/memorization/${id}`, data),
  remove: (id) => del(`/memorization/${id}`),
};

// Messages
export const messagesAPI = {
  getAll: () => get('/messages'),
  getConversation: (chatId) => get(`/messages/conversation/${chatId}`),
  send: (toId, message, type) => post('/messages', { toId, message, type }),
};

// Notifications
export const notificationsAPI = {
  getAll: () => get('/notifications'),
  create: (message, senderName) => post('/notifications', { message, senderName }),
  markRead: (id) => put(`/notifications/${id}/read`),
  markAllRead: () => put('/notifications/read-all'),
};

// Academic Years
export const academicYearsAPI = {
  getAll: () => get('/academic-years'),
  create: (data) => post('/academic-years', data),
  update: (id, data) => put(`/academic-years/${id}`, data),
  remove: (id) => del(`/academic-years/${id}`),
};
