import { issueRepository } from '@/infrastructure/github/GitHubIssueRepository';
import { repositoryRepository } from '@/infrastructure/github/GitHubRepositoryRepository';

import { IssueService } from './issues/IssueService';
import { ListRepoIssuesUseCase } from './issues/ListRepoIssuesUseCase';
import { GetRepoDetailsUseCase } from './repositories/GetRepoDetailsUseCase';
import { RepoService } from './repositories/RepoService';
import { SearchReposUseCase } from './repositories/SearchReposUseCase';

export { ApiError } from '@/infrastructure/github/client';

export const repoService = new RepoService(
  new SearchReposUseCase(repositoryRepository),
  new GetRepoDetailsUseCase(repositoryRepository),
);

export const issueService = new IssueService(new ListRepoIssuesUseCase(issueRepository));
