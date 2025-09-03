import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    // Check if window is defined (i.e., we're on the client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors (optional but good practice)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      // For example, remove token and redirect
      localStorage.removeItem('token');
      // This ensures we run this code only on the client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 