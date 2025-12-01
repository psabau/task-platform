// web-shell/src/store/auth.js
import { create } from "zustand";

const useAuth = create((set) => ({
  token: localStorage.getItem("token") || null,
  login: (token) => {
    localStorage.setItem("token", token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null });
  },
}));

export default useAuth;
