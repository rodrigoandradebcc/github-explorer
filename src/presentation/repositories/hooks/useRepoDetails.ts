import { useQuery } from '@tanstack/react-query';

import { useRepoService } from '@/presentation/di/ApplicationProvider';
import { queryKeys } from '@/presentation/shared/queryKeys';

export function useRepoDetails(owner: string, repo: string) {
  const repositories = useRepoService();

  return useQuery({
    queryKey: queryKeys.repositories.detail(owner, repo),
    queryFn: () => repositories.details(owner, repo),
    enabled: owner.length > 0 && repo.length > 0,
    staleTime: 60 * 1000,
  });
}
