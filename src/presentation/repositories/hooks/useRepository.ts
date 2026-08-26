import { useQuery } from '@tanstack/react-query';

import { repoService } from '@/application';
import { queryKeys } from '@/presentation/shared/queryKeys';

export function useRepository(owner: string, repo: string) {
  return useQuery({
    queryKey: queryKeys.repositories.detail(owner, repo),
    queryFn: () => repoService.details(owner, repo),
    enabled: owner.length > 0 && repo.length > 0,
    staleTime: 60 * 1000,
  });
}
