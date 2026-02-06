import { authSvc, env } from '@repo/axios-config';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
  beforeLoad: async () => {
    authSvc.get('user').catch((error) => {
      if (error.status === 401) {
        window.location.href = `${env.aduLive}login?redirect-url=${window.location}`;
      }
    });
  },
});

function About() {
  return <div className="p-2">Hello from About!</div>;
}
