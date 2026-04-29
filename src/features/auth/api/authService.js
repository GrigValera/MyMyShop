// ============================================
// РЕАЛЬНЫЙ API (раскомментировать для продакшена)
// ============================================
// const API_URL = 'https://your-real-api.com';
// 
// export const registerUser = async (email, password, name) => {
//   try {
//     const response = await fetch(`${API_URL}/auth/register`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password, name })
//     });
//     const data = await response.json();
//     if (!response.ok) throw new Error(data.error);
//     return { user: data.user, error: null };
//   } catch (error) {
//     return { user: null, error: error.message };
//   }
// };
// 
// export const loginUser = async (email, password) => {
//   try {
//     const response = await fetch(`${API_URL}/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password })
//     });
//     const data = await response.json();
//     if (!response.ok) throw new Error(data.error);
//     return { user: data.user, error: null };
//   } catch (error) {
//     return { user: null, error: error.message };
//   }
// };
// 
// export const logoutUser = async () => {
//   try {
//     const token = localStorage.getItem('auth_token');
//     await fetch(`${API_URL}/auth/logout`, {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     localStorage.removeItem('auth_token');
//     localStorage.removeItem('auth_user');
//     return { error: null };
//   } catch (error) {
//     return { error: error.message };
//   }
// };
// 
// export const getCurrentUser = async () => {
//   try {
//     const token = localStorage.getItem('auth_token');
//     if (!token) return { user: null, error: null };
//     const response = await fetch(`${API_URL}/auth/me`, {
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     const data = await response.json();
//     if (!response.ok) throw new Error(data.error);
//     return { user: data.user, error: null };
//   } catch (error) {
//     return { user: null, error: error.message };
//   }
// };
// 
// export const updateProfile = async (updates) => {
//   try {
//     const token = localStorage.getItem('auth_token');
//     const response = await fetch(`${API_URL}/auth/profile`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify(updates)
//     });
//     const data = await response.json();
//     if (!response.ok) throw new Error(data.error);
//     return { user: data.user, error: null };
//   } catch (error) {
//     return { user: null, error: error.message };
//   }
// };

// ============================================
// MOCK API (для разработки)
// ============================================
import { mockApi } from '../../../shared/lib/mock/mockApi';

export const registerUser = async (email, password, name) => {
  const result = await mockApi.register(email, password, name);
  return { user: result.success ? result.data.user : null, error: result.error };
};

export const loginUser = async (email, password) => {
  const result = await mockApi.login(email, password);
  return { user: result.success ? result.data.user : null, error: result.error };
};

export const logoutUser = async () => {
  const result = await mockApi.logout();
  return { error: result.error };
};

export const getCurrentUser = async () => {
  const result = await mockApi.getCurrentUser();
  return { user: result.success ? result.data : null, error: result.error };
};

export const updateProfile = async (updates) => {
  const result = await mockApi.updateProfile(updates);
  return { user: result.success ? result.data : null, error: result.error };
};