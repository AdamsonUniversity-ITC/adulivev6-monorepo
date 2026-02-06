import axios from 'axios';
import { env } from './env';

export const registrarSvc = axios
  .create({
    baseURL: env.registrarService,
    timeout: 5000,
    withCredentials: true,
    withXSRFToken: true,
  })
  .interceptors.response.use(
    function onFulfilled(response) {
      return response;
    },
    function onRejected(error) {
      if (error.response.status == 401) {
        window.location.href = env.aduLive;
      }
    },
  );
