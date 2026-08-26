import { AxiosGitHubIssueDataSource } from '@/infrastructure/github/AxiosGitHubIssueDataSource';
import { AxiosGitHubRepositoryDataSource } from '@/infrastructure/github/AxiosGitHubRepositoryDataSource';
import { GitHubIssueRepository } from '@/infrastructure/github/GitHubIssueRepository';
import { GitHubRepositoryRepository } from '@/infrastructure/github/GitHubRepositoryRepository';
import { IssueService } from '@/application/issues/IssueService';
import { ListRepoIssuesUseCase } from '@/application/issues/ListRepoIssuesUseCase';
import { GetRepoDetailsUseCase } from '@/application/repositories/GetRepoDetailsUseCase';
import { RepoService } from '@/application/repositories/RepoService';
import { SearchReposUseCase } from '@/application/repositories/SearchReposUseCase';

const repositoryRepository = new GitHubRepositoryRepository(new AxiosGitHubRepositoryDataSource());
const issueRepository = new GitHubIssueRepository(new AxiosGitHubIssueDataSource());

export const repoService = new RepoService(
  new SearchReposUseCase(repositoryRepository),
  new GetRepoDetailsUseCase(repositoryRepository),
);

export const issueService = new IssueService(new ListRepoIssuesUseCase(issueRepository));
