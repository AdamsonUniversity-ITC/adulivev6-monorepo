import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { env } from './env';

export const financeSvc = axios.create({
    baseURL: env.financeService,
    timeout: 30000,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

type IdempotentConfig = InternalAxiosRequestConfig & {
    __financialFingerprint?: string;
};

const financialMutation = /^\/?abms\/(?:budget-proposal-entry\/save|budget-adjustment-entry(?:\/?$|\/\d+$)|budget-request-entry(?:\/?$|\/items(?:\/\d+)?$|\/\d+\/items$|\/\d+\/(?:save|print-events)$|\/\d+$)|requisition-process\/\d+(?:\/items|\/item-descriptions|\/quoted-prices|\/accept-quoted-prices)?$|liquidation-submission\/rs\/\d+\/returned-amounts$)/;
const storagePrefix = 'abms-financial-idempotency:';

const createUuid = (): string => {
    const browserCrypto = globalThis.crypto;
    if (typeof browserCrypto?.randomUUID === 'function') {
        return browserCrypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    if (typeof browserCrypto?.getRandomValues === 'function') {
        browserCrypto.getRandomValues(bytes);
    } else {
        for (let index = 0; index < bytes.length; index++) {
            bytes[index] = Math.floor(Math.random() * 256);
        }
    }
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    const isFormData = typeof FormData !== 'undefined' && value instanceof FormData;
    if (value && typeof value === 'object' && !isFormData) {
        return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
            result[key] = canonical((value as Record<string, unknown>)[key]);
            return result;
        }, {});
    }
    return value;
};

const fingerprintFor = (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? 'get').toUpperCase();
    const url = String(config.url ?? '').replace(/^\/+/, '');
    return `${method}|${url}|${JSON.stringify(canonical({ params: config.params, data: config.data }))}`;
};

financeSvc.interceptors.request.use((config: IdempotentConfig) => {
    const method = (config.method ?? 'get').toUpperCase();
    const url = String(config.url ?? '');
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || !financialMutation.test(url)) return config;

    const fingerprint = fingerprintFor(config);
    const storageKey = `${storagePrefix}${fingerprint}`;
    const existing = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(storageKey);
    const idempotencyKey = existing ?? createUuid();
    if (!existing && typeof sessionStorage !== 'undefined') sessionStorage.setItem(storageKey, idempotencyKey);
    config.headers.set('Idempotency-Key', idempotencyKey);
    config.__financialFingerprint = fingerprint;
    return config;
});

const clearCompletedKey = (config?: IdempotentConfig) => {
    if (config?.__financialFingerprint && typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(`${storagePrefix}${config.__financialFingerprint}`);
    }
};

financeSvc.interceptors.response.use(
    response => {
        clearCompletedKey(response.config as IdempotentConfig);
        return response;
    },
    error => {
        if (error.response) clearCompletedKey(error.config as IdempotentConfig);
        return Promise.reject(error);
    },
);
