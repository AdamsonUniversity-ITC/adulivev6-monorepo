import axios from 'axios';
import { env } from './env';

export const hrmdoSvc = axios.create({
  baseURL: env.hrmdoService,
  timeout: 5000,
  withCredentials: true,
  withXSRFToken: true,
});

hrmdoSvc.interceptors.response.use(
  function onFulfilled(response) {
    return response;
  },
  function onRejected(error) {
    return Promise.reject(error);
  },
);
