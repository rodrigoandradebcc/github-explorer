import React, { createContext, useContext, useMemo } from 'react';

import { type IssueService, type RepoService } from '@/application';

export interface ApplicationServices {
  repoService: RepoService;
  issueService: IssueService;
}

const ApplicationContext = createContext<Partial<ApplicationServices> | null>(null);

export function ApplicationProvider({
  services,
  children,
}: {
  services: Partial<ApplicationServices>;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ repoService: services.repoService, issueService: services.issueService }),
    [services.repoService, services.issueService],
  );

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useApplicationServices(): Partial<ApplicationServices> {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplicationServices must be used inside <ApplicationProvider>');
  }
  return context;
}

export function useRepoService(): RepoService {
  const { repoService } = useApplicationServices();
  if (!repoService) {
    throw new Error('repoService was not provided to <ApplicationProvider>');
  }
  return repoService;
}

export function useIssueService(): IssueService {
  const { issueService } = useApplicationServices();
  if (!issueService) {
    throw new Error('issueService was not provided to <ApplicationProvider>');
  }
  return issueService;
}

export const applicationServicesWithRepo = (
  service: RepoService,
): Partial<ApplicationServices> => ({ repoService: service });
