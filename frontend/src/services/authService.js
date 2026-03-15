import axiosClient from "../api/axiosClient";

const AUTH_BASE = "/api/v1/auth";

export async function registerUser(payload) {
  const { data } = await axiosClient.post(`${AUTH_BASE}/register`, payload);
  return data;
}

export async function registerAdmin(payload) {
  const { data } = await axiosClient.post(`${AUTH_BASE}/admin/register`, payload);
  return data;
}

export async function loginUser({ email, password }) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const { data } = await axiosClient.post(`${AUTH_BASE}/login`, formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return data;
}

export async function getCurrentUser() {
  const { data } = await axiosClient.get(`${AUTH_BASE}/me`);
  return data;
}

export function setAccessToken(token) {
  localStorage.setItem("access_token", token);
}

export function clearAccessToken() {
  localStorage.removeItem("access_token");
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}
