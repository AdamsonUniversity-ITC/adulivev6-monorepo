import axios from 'axios';
import { env } from './env';
import { redirectOnUnauthorized } from './unauthorized-redirect';

export const registrarSvc = axios.create({
  baseURL: env.registrarService,
  timeout: 30000,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

registrarSvc.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await redirectOnUnauthorized();
    }

    return Promise.reject(error);
  },
);
