import type { Repository, RepositoryDetails } from '../entities/Repository';
import type { Page } from '../shared/Page';

export interface RepositoryRepository {
  search(query: string, page?: number): Promise<Page<Repository>>;
  findByOwnerAndName(owner: string, name: string): Promise<RepositoryDetails>;
}
