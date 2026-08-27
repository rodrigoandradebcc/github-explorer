import type { Repository, RepositoryDetails } from '../entities/Repository';
import type { Page } from '../shared/Page';
import type { RequestOptions } from '../shared/RequestOptions';

export interface RepositoryRepository {
  search(query: string, page?: number, options?: RequestOptions): Promise<Page<Repository>>;
  findByOwnerAndName(
    owner: string,
    name: string,
    options?: RequestOptions,
  ): Promise<RepositoryDetails>;
}
