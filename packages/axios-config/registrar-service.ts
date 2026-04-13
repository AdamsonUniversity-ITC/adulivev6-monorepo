import axios from 'axios';
import { env } from './env';

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
