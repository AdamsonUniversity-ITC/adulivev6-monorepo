import axios from 'axios';
import { env } from './env';
import { buildLoginUrl } from './login-url';

export const authSvc = axios.create({
  baseURL: env.authService,
  timeout: 300000,
  withCredentials: true,
  withXSRFToken: true,
});

authSvc.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.assign(buildLoginUrl());
    }
    return Promise.reject(error);
  },
);
