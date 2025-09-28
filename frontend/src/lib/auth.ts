import { api } from "@/services/api";
import type { ApiUser, AuthResponse, ProfileResponse, UpdateProfilePayload } from "@/services/api";

export type { ApiUser, AuthResponse, ProfileResponse, UpdateProfilePayload } from "@/services/api";
export type LoginPayload = Parameters<typeof api.auth.login>[0];
export type RegisterPayload = Parameters<typeof api.auth.register>[0];
export type ProfileOptions = Parameters<typeof api.auth.profile>[0];
export type UpdateProfileOptions = Parameters<typeof api.auth.updateProfile>[1];

const TOKEN_KEY = "token";
const USER_KEY = "user";

export async function login(payload: LoginPayload) {
  const response = await api.auth.login(payload);

  setToken(response.token);
  setStoredUser(response.user);
  return response;
}

export async function register(payload: RegisterPayload) {
  const response = await api.auth.register(payload);

  setToken(response.token);
  setStoredUser(response.user);
  return response;
}

export async function fetchProfile(options?: ProfileOptions) {
  const response = await api.auth.profile(options);
  setStoredUser(response.user);
  return response;
}

export async function updateProfile(payload: UpdateProfilePayload, options?: UpdateProfileOptions) {
  const response = await api.auth.updateProfile(payload, options);
  setStoredUser(response.user);
  return response;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setStoredUser(user: ApiUser | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
  return JSON.parse(raw) as ApiUser;
  } catch (error) {
    console.warn("Failed to parse stored user", error);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function logout() {
  clearToken();
}
