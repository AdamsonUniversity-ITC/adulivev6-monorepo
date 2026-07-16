import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as Window & typeof globalThis & { Pusher: typeof Pusher }).Pusher = Pusher;

export interface EchoConfig {
    key: string;
    wsHost: string;
    wsPort: number;
    wssPort: number;
    forceTLS: boolean;
    authEndpoint?: string;
    auth?: { 
        headers?: Record<string, string>;
        withCredentials?: boolean;
        withXSRFToken?: boolean;
    };
    authorizer?: (channel: { name: string }) => {
        authorize: (socketId: string, callback: (error: boolean, data: any) => void) => void;
    };
}

export function createEcho(config: EchoConfig): Echo {
    return new Echo({
        broadcaster: 'reverb',
        key: config.key,
        wsHost: config.wsHost,
        wsPort: config.wsPort,
        wssPort: config.wssPort,
        forceTLS: config.forceTLS,
        enabledTransports: ['ws', 'wss'],
        ...(config.authEndpoint && { authEndpoint: config.authEndpoint }),
        ...(config.authorizer && { authorizer: config.authorizer }), // ✅ Add this line
        ...(config.auth && {
            auth: {
                headers: config.auth.headers,
                ...(config.auth.withCredentials !== undefined && { withCredentials: config.auth.withCredentials }),
                ...(config.auth.withXSRFToken !== undefined && { withXSRFToken: config.auth.withXSRFToken }),
            }
        }),
    });
}