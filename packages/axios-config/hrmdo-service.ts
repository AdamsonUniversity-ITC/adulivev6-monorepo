import axios from 'axios';
import { env } from './env';
import { buildLoginUrl } from './login-url';

export const hrmdoSvc = axios.create({
  baseURL: env.hrmdoService,
  timeout: 5000,
  withCredentials: true,
  withXSRFToken: true,
});

hrmdoSvc.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.assign(buildLoginUrl({ returnTo: window.location.href }));
    }

    return Promise.reject(error);
  },
);