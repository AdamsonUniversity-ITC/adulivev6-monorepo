import axios from 'axios';
import { env } from './env';
import { redirectOnUnauthorized } from './unauthorized-redirect';

export const hrmdoSvc = axios.create({
  baseURL: env.hrmdoService,
  timeout: 30000,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
},
});

hrmdoSvc.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await redirectOnUnauthorized(window.location.href);
    }

    return Promise.reject(error);
  },
);
