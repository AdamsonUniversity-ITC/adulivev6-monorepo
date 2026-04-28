import { authSvc, buildLoginUrl } from '@repo/axios-config';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
  beforeLoad: async () => {
    authSvc.get('user').catch((error) => {
      if (error.response?.status === 401) {
        window.location.assign(buildLoginUrl({ returnTo: window.location.href }));
      }
    });
  },
});

function About() {
  return <div className="p-2">Hello from About!</div>;
}
