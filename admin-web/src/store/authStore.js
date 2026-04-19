import { create } from 'zustand';

function getStoredToken() {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create((set) => ({
  admin: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  
  login: (token, admin) => {
    localStorage.setItem('adminToken', token);
    set({ token, admin, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('adminToken');
    set({ token: null, admin: null, isAuthenticated: false });
  },
}));

