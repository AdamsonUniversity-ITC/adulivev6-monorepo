import axios from 'axios';
import { env } from './env';

export const financeSvc = axios.create({
    baseURL: env.financeService,
    timeout: 300000,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});
