import { AxiosGitHubIssueDataSource } from '@/infrastructure/github/AxiosGitHubIssueDataSource';
import { AxiosGitHubRepositoryDataSource } from '@/infrastructure/github/AxiosGitHubRepositoryDataSource';
import { GitHubIssueRepository } from '@/infrastructure/github/GitHubIssueRepository';
import { GitHubRepositoryRepository } from '@/infrastructure/github/GitHubRepositoryRepository';

import { IssueService } from './issues/IssueService';
import { ListRepoIssuesUseCase } from './issues/ListRepoIssuesUseCase';
import { GetRepoDetailsUseCase } from './repositories/GetRepoDetailsUseCase';
import { RepoService } from './repositories/RepoService';
import { SearchReposUseCase } from './repositories/SearchReposUseCase';

export { ApiError } from '@/infrastructure/github/client';

const repositoryRepository = new GitHubRepositoryRepository(new AxiosGitHubRepositoryDataSource());
const issueRepository = new GitHubIssueRepository(new AxiosGitHubIssueDataSource());

export const repoService = new RepoService(
  new SearchReposUseCase(repositoryRepository),
  new GetRepoDetailsUseCase(repositoryRepository),
);

export const issueService = new IssueService(new ListRepoIssuesUseCase(issueRepository));
