import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
// Import the generated route tree
import { DrsErrorPage } from '@/components/drs-error-page.tsx';
import { DrsNotFoundPage } from '@/components/drs-not-found-page.tsx';
import { drsDocumentTitle } from '@/lib/drsTenantLabel.ts';
import './axios.ts';
import { routeTree } from './routeTree.gen';

document.title = drsDocumentTitle(window.location.hostname);

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultNotFoundComponent: DrsNotFoundPage,
  defaultErrorComponent: DrsErrorPage,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
