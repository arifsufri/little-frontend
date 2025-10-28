import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Debug logging for mobile issues
if (typeof window !== 'undefined') {
  console.log('🔍 API Base URL:', BASE_URL);
  console.log('🔍 Environment:', process.env.NODE_ENV);
  console.log('🔍 All NEXT_PUBLIC vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
  console.log('🔍 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
}

// Default axios instance (matches your other project's pattern)
const axiosInstance: AxiosInstance = axios.create({ baseURL: BASE_URL });

// Request interceptor
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    // Example custom header like your other project
    (request.headers as any).app = 'Little Barbershop App';

    // Attach JWT if present (browser only)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      (request.headers as any).Authorization = `Bearer ${token}`;
    }

    return request;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: AxiosError) => {
    console.error('🚨 Axios error:', error);
    console.error('🚨 Request URL:', error.config?.url);
    console.error('🚨 Base URL:', error.config?.baseURL);
    console.error('🚨 Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // Return structured error data
    const errorData = error.response?.data || { error: 'Network error', message: error.message };
    return Promise.reject(errorData);
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------
// SWR/utility-friendly fetcher similar to your other project
export const fetcher = async <T = any>(args: any): Promise<T> => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.get<T>(url, { ...(config || {}) });
  return res.data as T;
};

// Convenience helpers (optional, keeps current usage working)
export const apiGet = async <T>(url: string, config?: any): Promise<T> => {
  const res = await axiosInstance.get<T>(url, config);
  return res.data;
};

export const apiPost = async <T>(url: string, data?: any, config?: any): Promise<T> => {
  const res = await axiosInstance.post<T>(url, data, config);
  return res.data;
};

export const apiPut = async <T>(url: string, data?: any, config?: any): Promise<T> => {
  const res = await axiosInstance.put<T>(url, data, config);
  return res.data;
};

export const apiPatch = async <T>(url: string, data?: any, config?: any): Promise<T> => {
  const res = await axiosInstance.patch<T>(url, data, config);
  return res.data;
};

export const apiDelete = async <T>(url: string, config?: any): Promise<T> => {
  const res = await axiosInstance.delete<T>(url, config);
  return res.data;
};

export const uploadFile = async <T>(url: string, formData: FormData, config?: any): Promise<T> => {
  const res = await axiosInstance.post<T>(url, formData, {
    ...(config || {}),
    headers: {
      ...((config && config.headers) || {}),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

