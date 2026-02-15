import { create } from "zustand";
import api from "../utils/api";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  loading: false,
  error: "",

  signup: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/api/auth/signup", payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ token: data.token, user: data.user, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  login: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/api/auth/login", payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ token: data.token, user: data.user, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  googleLogin: async (credential) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/api/auth/google", { credential });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ token: data.token, user: data.user, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || "Google sign-in failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({ user });
  },
}));

export default useAuthStore;
