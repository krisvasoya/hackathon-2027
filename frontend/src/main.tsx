import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './routes';
import './styles/globals.css';

// ─── TanStack Query Client ────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,         // 30 seconds
      gcTime: 5 * 60 * 1000,        // 5 minutes garbage collection
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        const err = error as { response?: { status?: number } };
        if (err?.response?.status && err.response.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Root ─────────────────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
