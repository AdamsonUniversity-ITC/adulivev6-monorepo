import axios from 'axios';
import { env } from './env';
import { buildLoginUrl } from './login-url';

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
  (error) => {
    if (error.response?.status === 401) {
      window.location.assign(buildLoginUrl());
    }

    return Promise.reject(error);
  },
);
