import axios from 'axios';
import { env } from './env';

export const authSvc = axios.create({
  baseURL: env.authService,
  timeout: 5000,
  withCredentials: true,
  withXSRFToken: true,
});

// authSvc.interceptors.response.use(
//   function onFulfilled(response) {
//     return response;
//   },
//   function onRejected(error) {
//     if (error.status === 401) {
//       window.location.href = `${env.aduLive}login`;
//     }
//     return Promise.reject(error);
//   },
// );
