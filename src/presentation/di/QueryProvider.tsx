import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

export function QueryProvider({
  createClient,
  children,
}: {
  createClient: () => QueryClient;
  children: ReactNode;
}) {
  const [queryClient] = useState(createClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
