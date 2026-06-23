import { createEcho } from '@repo/echo-config';
import { financeSvc } from '@repo/axios-config/finance-service';

const echo = createEcho({
    key: "sps1wgcoaooyc9frjvxu",
    wsHost: import.meta.env.VITE_REVERB_HOST as string,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',

    authorizer: (channel) => ({
        authorize: (socketId, callback) => {
            financeSvc
                .post('/broadcasting/auth', {  
                    socket_id: socketId,
                    channel_name: channel.name,
                })
                .then(res => callback(false, res.data))
                .catch(err => callback(true, err));
        },
    }),
});

export default echo;