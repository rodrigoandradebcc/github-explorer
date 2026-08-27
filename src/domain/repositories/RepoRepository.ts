import type { Repo, RepoDetails } from '../entities/Repo';
import type { Page } from '../shared/Page';
import type { RequestOptions } from '../shared/RequestOptions';

export interface RepoRepository {
  search(query: string, page?: number, options?: RequestOptions): Promise<Page<Repo>>;
  findByOwnerAndName(owner: string, name: string, options?: RequestOptions): Promise<RepoDetails>;
}
