import { useInfiniteQuery } from '@tanstack/react-query';

import { issueService } from '@/application';
import { queryKeys } from '@/presentation/shared/queryKeys';

export function useRepositoryIssues(owner: string, repo: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.repositories.issues(owner, repo),
    queryFn: ({ pageParam }) => issueService.listOpen(owner, repo, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: owner.length > 0 && repo.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
