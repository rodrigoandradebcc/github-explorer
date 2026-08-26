import React, { createContext, useContext, useMemo } from 'react';

import {
  issueService as defaultIssueService,
  repoService as defaultRepoService,
  type IssueService,
  type RepoService,
} from '@/application';

export interface ApplicationServices {
  repoService: RepoService;
  issueService: IssueService;
}

const ApplicationContext = createContext<ApplicationServices | null>(null);

export function ApplicationProvider({
  services,
  children,
}: {
  services?: Partial<ApplicationServices>;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      repoService: services?.repoService ?? defaultRepoService,
      issueService: services?.issueService ?? defaultIssueService,
    }),
    [services?.repoService, services?.issueService],
  );

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useApplicationServices(): ApplicationServices {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplicationServices must be used inside <ApplicationProvider>');
  }
  return context;
}

export const useRepoService = () => useApplicationServices().repoService;
export const useIssueService = () => useApplicationServices().issueService;

export const applicationServicesWithRepo = (
  service: RepoService,
): Partial<ApplicationServices> => ({ repoService: service });
