import type { GetRepoDetailsUseCase } from './GetRepoDetailsUseCase';
import type { SearchReposUseCase } from './SearchReposUseCase';

export class RepoService {
  constructor(
    private readonly searchRepos: SearchReposUseCase,
    private readonly getRepoDetails: GetRepoDetailsUseCase,
  ) {}

  search(query: string, page = 1) {
    return this.searchRepos.execute({ query, page });
  }

  details(owner: string, name: string) {
    return this.getRepoDetails.execute({ owner, name });
  }
}
