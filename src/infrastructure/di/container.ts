import { IssueService } from '@/application/issues/IssueService';
import { ListRepoIssuesUseCase } from '@/application/issues/ListRepoIssuesUseCase';
import { GetRepoDetailsUseCase } from '@/application/repositories/GetRepoDetailsUseCase';
import { RepoService } from '@/application/repositories/RepoService';
import { SearchReposUseCase } from '@/application/repositories/SearchReposUseCase';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import { AxiosGitHubIssueDataSource } from '@/infrastructure/github/AxiosGitHubIssueDataSource';
import { AxiosGitHubRepoDataSource } from '@/infrastructure/github/AxiosGitHubRepoDataSource';
import { GitHubIssueRepository } from '@/infrastructure/github/GitHubIssueRepository';
import { GitHubRepoRepository } from '@/infrastructure/github/GitHubRepoRepository';
import { AxiosGitLabIssueDataSource } from '@/infrastructure/gitlab/AxiosGitLabIssueDataSource';
import { AxiosGitLabRepoDataSource } from '@/infrastructure/gitlab/AxiosGitLabRepoDataSource';
import { GitLabIssueRepository } from '@/infrastructure/gitlab/GitLabIssueRepository';
import { GitLabRepoRepository } from '@/infrastructure/gitlab/GitLabRepoRepository';
import { AsyncStorageDataSourcePreference } from '@/infrastructure/storage/AsyncStorageDataSourcePreference';
import { AsyncStorageThemePreference } from '@/infrastructure/storage/AsyncStorageThemePreference';

import type { DataSourceRegistry } from './DataSourceRegistry';
import { SourceRoutedIssueRepository } from './SourceRoutedIssueRepository';
import { SourceRoutedRepoRepository } from './SourceRoutedRepoRepository';

export const dataSourceSelection = new DataSourceSelection('github');

export const dataSourcePreference = new AsyncStorageDataSourcePreference();
export const themePreference = new AsyncStorageThemePreference();

const registry: DataSourceRegistry = {
  github: {
    repos: new GitHubRepoRepository(new AxiosGitHubRepoDataSource()),
    issues: new GitHubIssueRepository(new AxiosGitHubIssueDataSource()),
  },
  gitlab: {
    repos: new GitLabRepoRepository(new AxiosGitLabRepoDataSource()),
    issues: new GitLabIssueRepository(new AxiosGitLabIssueDataSource()),
  },
};

const repositoryRepository = new SourceRoutedRepoRepository(
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
