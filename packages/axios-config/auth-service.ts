import axios from 'axios';
import { env } from './env';
import { redirectOnUnauthorized } from './unauthorized-redirect';

export const authSvc = axios.create({
  baseURL: env.authService,
  timeout: 300000,
  withCredentials: true,
  withXSRFToken: true,
});

authSvc.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await redirectOnUnauthorized(window.location.href);
    }
    return Promise.reject(error);
  },
);
