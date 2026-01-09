/**
 * Tenant Management API Service
 */

import axios from 'axios';

const API_BASE = '/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Request interceptor for CSRF token
apiClient.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Super Admin - Tenant Management API
export const superAdminTenantsApi = {
  list: (params) => apiClient.get('/super_admin/tenants', { params }),
  get: (id) => apiClient.get(`/super_admin/tenants/${id}`),
  create: (data) => apiClient.post('/super_admin/tenants', data),
  update: (id, data) => apiClient.patch(`/super_admin/tenants/${id}`, data),
  delete: (id) => apiClient.delete(`/super_admin/tenants/${id}`),
  suspend: (id, reason) => apiClient.post(`/super_admin/tenants/${id}/suspend`, { reason }),
  reactivate: (id) => apiClient.post(`/super_admin/tenants/${id}/reactivate`),
  impersonate: (id) => apiClient.post(`/super_admin/tenants/${id}/impersonate`),
  stopImpersonation: () => apiClient.post('/super_admin/tenants/stop_impersonation'),
  dashboard: () => apiClient.get('/super_admin/tenants/dashboard'),
};

// Admin - User Management API
export const adminUsersApi = {
  list: (params) => apiClient.get('/admin/users', { params }),
  get: (id) => apiClient.get(`/admin/users/${id}`),
  create: (data) => apiClient.post('/admin/users', data),
  update: (id, data) => apiClient.patch(`/admin/users/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/users/${id}`),
};

export default apiClient;
