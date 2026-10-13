import { readViewAsUserId, VIEW_AS_HEADER } from '@/lib/viewAs.ts';
import { authSvc } from '@repo/axios-config/auth-service';
import { registrarSvc } from '@repo/axios-config/registrar-service';
import axios, { type AxiosInstance } from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

function attachViewAsHeader(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    const userId = readViewAsUserId();
    if (userId) {
      config.headers.set(VIEW_AS_HEADER, userId);
    }

    return config;
  });
}

attachViewAsHeader(authSvc);
attachViewAsHeader(registrarSvc);
