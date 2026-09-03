const API_BASE = 'https://kzsite.onrender.com';
const TOKEN_KEY = 'kz_auth_token';
const LEGACY_TOKEN_KEY = 'kz_token';

export const API = API_BASE;

export function token() {
  const current = localStorage.getItem(TOKEN_KEY);
  if (current) return current;

  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacy;
  }

  return '';
}

export function authHeaders() {
  const value = token();
  return value ? { Authorization: `Bearer ${value}` } : {};
}

export function isAuthenticated() {
  return Boolean(token());
}

export function loginUrl(returnTo = window.location.href) {
  return `../../login.html?returnTo=${encodeURIComponent(returnTo)}`;
}

export function redirectToLogin(returnTo = window.location.href) {
  window.location.href = loginUrl(returnTo);
}
