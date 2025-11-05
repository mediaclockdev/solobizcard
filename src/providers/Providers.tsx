'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

import { CardDataProvider } from '@/contexts/CardDataContext';

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
            <CardDataProvider>{children}</CardDataProvider>
            </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
