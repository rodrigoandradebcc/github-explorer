import { useQuery } from '@tanstack/react-query';

import { useRepoService } from '@/presentation/di/ApplicationProvider';
import { useDataSourceScope } from '@/presentation/di/DataSourceProvider';
import { queryKeys } from '@/presentation/shared/queryKeys';

export function useRepoDetails(owner: string, repo: string) {
  const repositories = useRepoService();
  const scope = useDataSourceScope();

  return useQuery({
    queryKey: queryKeys.repositories.detail(scope, owner, repo),
    queryFn: ({ signal }) => repositories.details(owner, repo, { signal }),
    enabled: owner.length > 0 && repo.length > 0,
    staleTime: 60 * 1000,
  });
}
