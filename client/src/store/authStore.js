import { create } from "zustand";
import api, { getApiErrorMessage } from "../utils/api";

function saveSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  loading: false,
  error: "",

  signup: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/api/auth/signup", payload);
      saveSession(data);
      set({ token: data.token, user: data.user, error: "" });
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Signup failed");
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  login: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/api/auth/login", payload);
      saveSession(data);
      set({ token: data.token, user: data.user, error: "" });
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Login failed");
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  googleLogin: async (credential) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/api/auth/google", { credential });
      saveSession(data);
      set({ token: data.token, user: data.user, error: "" });
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Google sign-in failed");
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
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
