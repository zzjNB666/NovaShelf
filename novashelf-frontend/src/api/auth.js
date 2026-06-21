import request from './http';

export function register(payload) {
  return request.post('/auth/register', payload);
}

export function login(payload) {
  return request.post('/auth/login', payload);
}

export function getProfile() {
  return request.get('/auth/profile');
}
