export const queryKeys = {
  repositories: {
    search: (query: string) => ['repositories', 'search', query] as const,
    detail: (owner: string, repo: string) => ['repositories', 'detail', owner, repo] as const,
    issues: (owner: string, repo: string) => ['repositories', 'issues', owner, repo] as const,
  },
} as const;
