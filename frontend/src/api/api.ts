import axios from 'axios';

// Canlıda ve yerelde çalışacak şekilde API adresini otomatik ayarla
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://adimodtu.onrender.com/api'
  : 'http://localhost:5757/api';

const api = axios.create({
  baseURL: API_URL,
});

// Her API isteğine otomatik olarak 'authtoken' ekleyen interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authtoken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['authtoken'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
