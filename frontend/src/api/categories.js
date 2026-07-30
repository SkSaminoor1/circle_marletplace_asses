import api from './axios';

export const categoriesApi = {
  // Categories
  list: (params) => api.get('/categories/', { params }).then((res) => res.data),
  retrieve: (id) => api.get(`/categories/${id}/`).then((res) => res.data),
  create: (data) => api.post('/categories/', data).then((res) => res.data),
  update: (id, data) => api.patch(`/categories/${id}/`, data).then((res) => res.data),
  delete: (id) => api.delete(`/categories/${id}/`).then((res) => res.data),

  // Field configurations for a specific category
  getFields: (categoryId) => api.get(`/categories/${categoryId}/fields/`).then((res) => res.data),

  // Reusable Field Definitions
  listFields: (params) => api.get('/fields/', { params }).then((res) => res.data),
  createField: (data) => api.post('/fields/', data).then((res) => res.data),
  updateField: (id, data) => api.patch(`/fields/${id}/`, data).then((res) => res.data),
  deleteField: (id) => api.delete(`/fields/${id}/`).then((res) => res.data),

  // Assign Field to Category (CategoryField)
  assignField: (data) => api.post('/category-fields/', data).then((res) => res.data),
  updateCategoryField: (id, data) => api.patch(`/category-fields/${id}/`, data).then((res) => res.data),
  unassignField: (id) => api.delete(`/category-fields/${id}/`).then((res) => res.data),
};
