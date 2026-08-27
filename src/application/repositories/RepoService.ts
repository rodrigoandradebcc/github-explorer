import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { GetRepoDetailsUseCase } from './GetRepoDetailsUseCase';
import type { SearchReposUseCase } from './SearchReposUseCase';

export class RepoService {
  constructor(
    private readonly searchRepos: SearchReposUseCase,
    private readonly getRepoDetails: GetRepoDetailsUseCase,
  ) {}

  search(query: string, page = 1, options: RequestOptions = {}) {
    return this.searchRepos.execute({ query, page, signal: options.signal });
  }

  details(owner: string, name: string, options: RequestOptions = {}) {
    return this.getRepoDetails.execute({ owner, name, signal: options.signal });
  }
}
