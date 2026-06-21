import request from './http';

export function getResources(params) {
  return request.get('/resources', { params });
}

export function getResource(id) {
  return request.get(`/resources/${id}`);
}

export function createResource(payload) {
  return request.post('/resources', payload);
}

export function updateResource(id, payload) {
  return request.put(`/resources/${id}`, payload);
}

export function deleteResource(id) {
  return request.delete(`/resources/${id}`);
}

export function getComments(resourceId) {
  return request.get(`/resources/${resourceId}/comments`);
}

export function createComment(resourceId, payload) {
  return request.post(`/resources/${resourceId}/comments`, payload);
}

export function deleteComment(id) {
  return request.delete(`/comments/${id}`);
}

export function getRating(resourceId) {
  return request.get(`/resources/${resourceId}/rating`);
}

export function submitRating(resourceId, score) {
  return request.post(`/resources/${resourceId}/rating`, { score });
}

export function uploadCover(file) {
  const formData = new FormData();
  formData.append('cover', file);
  return request.post('/uploads/cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function normalizeResourceResponse(response) {
  const payload = response.data.data;
  if (Array.isArray(payload)) {
    return {
      items: payload,
      pagination: {
        page: 1,
        pageSize: payload.length,
        total: payload.length,
        totalPages: 1
      },
      sort: {
        sortBy: 'created_at',
        order: 'desc'
      }
    };
  }
  return payload;
}
