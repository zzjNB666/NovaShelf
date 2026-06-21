import { reactive } from 'vue';
import { getProfile } from '../api/auth';

export const authState = reactive({
  token: localStorage.getItem('novashelf_token') || '',
  user: JSON.parse(localStorage.getItem('novashelf_user') || 'null'),
  ready: false
});

export function setSession(token, user) {
  authState.token = token;
  authState.user = user;
  localStorage.setItem('novashelf_token', token);
  localStorage.setItem('novashelf_user', JSON.stringify(user));
}

export async function loadProfile() {
  if (!authState.token) {
    authState.ready = true;
    return;
  }

  try {
    const res = await getProfile();
    authState.user = res.data.data;
    localStorage.setItem('novashelf_user', JSON.stringify(authState.user));
  } catch (err) {
    logout();
  } finally {
    authState.ready = true;
  }
}

export function logout() {
  authState.token = '';
  authState.user = null;
  authState.ready = true;
  localStorage.removeItem('novashelf_token');
  localStorage.removeItem('novashelf_user');
}
