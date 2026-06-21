import request from './http';

export function getStats() {
  return request.get('/admin/stats');
}

export function getUsers() {
  return request.get('/admin/users');
}

export function updateUserRole(id, role) {
  return request.put(`/admin/users/${id}/role`, { role });
}

export function getAdminComments() {
  return request.get('/admin/comments');
}
