import axios from 'axios'

const api = axios.create({ 
  baseURL: 'https://miniprojetdev.onrender.com', 
  timeout: 15000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const authAPI = {
  register: (d)  => api.post('/auth/register', d),
  login:    (d)  => api.post('/auth/login', d),
  getMe:    ()   => api.get('/auth/me'),
}
export const articlesAPI = {
  getAll:         (p)       => api.get('/articles', { params: p }),
  getBySlug:      (slug)    => api.get(`/articles/${slug}`),
  create:         (fd)      => api.post('/articles', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:         (id, fd)  => api.put(`/articles/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:         (id)      => api.delete(`/articles/${id}`),
  getUserArticles:(uid, p)  => api.get(`/articles/user/${uid}`, { params: p }),
  getMyArticles:  (p)       => api.get('/articles/me/list', { params: p }),
  toggleLike:     (id)      => api.post(`/articles/${id}/like`),
  toggleBookmark: (id)      => api.post(`/articles/${id}/bookmark`),
  getBookmarks:   ()        => api.get('/articles/me/bookmarks'),
  addComment:     (id, d)   => api.post(`/articles/${id}/comments`, d),
  deleteComment:  (cid)     => api.delete(`/articles/comments/${cid}`),
}
export const usersAPI = {
  getProfile:     (u)  => api.get(`/users/profile/${u}`),
  updateProfile:  (d)  => api.put('/users/me', d),
  updateAvatar:   (fd) => api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (d)  => api.put('/users/me/password', d),
  getAll:         (p)  => api.get('/users', { params: p }),
  toggleStatus:   (id) => api.patch(`/users/${id}/toggle`),
  delete:         (id) => api.delete(`/users/${id}`),
}
export const categoriesAPI = {
  getAll:   () => api.get('/categories'),
  create:   (d) => api.post('/categories', d),
  delete:   (id) => api.delete(`/categories/${id}`),
  getStats: () => api.get('/categories/stats'),
}
export const notificationsAPI = {
  getAll:      () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead:    (id) => api.put(`/notifications/${id}/read`),
}
