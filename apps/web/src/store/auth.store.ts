// apps/web/src/store/auth.store.ts
import { create } from "zustand";

type User = {
  id: string;
  email: string;
  name: string | null;
};

// Define the shape of the authentication state
type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  // set is used to update the state
  // initial state values null and false(not authenticated)
  user: null,
  isAuthenticated: false,
  // methods to update the state
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
