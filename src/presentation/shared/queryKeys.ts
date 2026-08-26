import type { DataSourceId } from '@/domain/shared/DataSource';

export const queryKeys = {
  repositories: {
    search: (scope: DataSourceId, query: string) =>
      ['repositories', scope, 'search', query] as const,
    detail: (scope: DataSourceId, owner: string, repo: string) =>
      ['repositories', scope, 'detail', owner, repo] as const,
    issues: (scope: DataSourceId, owner: string, repo: string) =>
      ['repositories', scope, 'issues', owner, repo] as const,
  },
} as const;
