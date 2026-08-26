import { IssueService } from '@/application/issues/IssueService';
import { ListRepoIssuesUseCase } from '@/application/issues/ListRepoIssuesUseCase';
import { GetRepoDetailsUseCase } from '@/application/repositories/GetRepoDetailsUseCase';
import { RepoService } from '@/application/repositories/RepoService';
import { SearchReposUseCase } from '@/application/repositories/SearchReposUseCase';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import { AxiosGitHubIssueDataSource } from '@/infrastructure/github/AxiosGitHubIssueDataSource';
import { AxiosGitHubRepositoryDataSource } from '@/infrastructure/github/AxiosGitHubRepositoryDataSource';
import { GitHubIssueRepository } from '@/infrastructure/github/GitHubIssueRepository';
import { GitHubRepositoryRepository } from '@/infrastructure/github/GitHubRepositoryRepository';
import { AxiosGitLabIssueDataSource } from '@/infrastructure/gitlab/AxiosGitLabIssueDataSource';
import { AxiosGitLabRepositoryDataSource } from '@/infrastructure/gitlab/AxiosGitLabRepositoryDataSource';
import { GitLabIssueRepository } from '@/infrastructure/gitlab/GitLabIssueRepository';
import { GitLabRepositoryRepository } from '@/infrastructure/gitlab/GitLabRepositoryRepository';

import type { DataSourceRegistry } from './DataSourceRegistry';
import { SourceRoutedIssueRepository } from './SourceRoutedIssueRepository';
import { SourceRoutedRepositoryRepository } from './SourceRoutedRepositoryRepository';

export const dataSourceSelection = new DataSourceSelection('github');

const registry: DataSourceRegistry = {
  github: {
    repositories: new GitHubRepositoryRepository(new AxiosGitHubRepositoryDataSource()),
    issues: new GitHubIssueRepository(new AxiosGitHubIssueDataSource()),
  },
  gitlab: {
    repositories: new GitLabRepositoryRepository(new AxiosGitLabRepositoryDataSource()),
    issues: new GitLabIssueRepository(new AxiosGitLabIssueDataSource()),
  },
};

const repositoryRepository = new SourceRoutedRepositoryRepository(
  registry,
  () => dataSourceSelection.current,
);
const issueRepository = new SourceRoutedIssueRepository(
  registry,
  () => dataSourceSelection.current,
);

export const repoService = new RepoService(
  new SearchReposUseCase(repositoryRepository),
  new GetRepoDetailsUseCase(repositoryRepository),
);

export const issueService = new IssueService(new ListRepoIssuesUseCase(issueRepository));
