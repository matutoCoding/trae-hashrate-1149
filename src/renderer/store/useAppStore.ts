import { create } from 'zustand';
import type { User, UserRole } from '@shared/types';
import { mockUsers } from '../services/mockData';

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  sidebarCollapsed: boolean;
  login: (employeeId: string, role: UserRole) => boolean;
  logout: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  sidebarCollapsed: false,

  login: (employeeId: string, role: UserRole) => {
    const user = mockUsers.find(
      u => u.employeeId === employeeId && u.role === role
    );
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
  },

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  }
}));
