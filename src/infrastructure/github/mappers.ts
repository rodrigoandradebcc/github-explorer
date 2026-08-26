import type { Issue } from '@/domain/entities/Issue';
import type { Owner } from '@/domain/entities/Owner';
import type { Repository, RepositoryDetails } from '@/domain/entities/Repository';

import type {
  GitHubIssueDto,
  GitHubOwnerDto,
  GitHubRepositoryDetailsDto,
  GitHubRepositoryDto,
} from './dtos';

function mapOwner(dto: GitHubOwnerDto): Owner {
  return {
    id: dto.id,
    login: dto.login,
    avatarUrl: dto.avatar_url,
    profileUrl: dto.html_url,
    type: dto.type === 'Organization' ? 'organization' : 'user',
  };
}

export function mapRepository(dto: GitHubRepositoryDto): Repository {
  return {
    id: dto.id,
    name: dto.name,
    fullName: dto.full_name,
    owner: mapOwner(dto.owner),
    description: dto.description,
    url: dto.html_url,
    language: dto.language,
    starsCount: dto.stargazers_count,
    forksCount: dto.forks_count,
    openIssuesCount: dto.open_issues_count,
    topics: dto.topics,
    updatedAt: new Date(dto.updated_at),
    createdAt: new Date(dto.created_at),
    isPrivate: dto.private,
  };
}

export function mapRepositoryDetails(dto: GitHubRepositoryDetailsDto): RepositoryDetails {
  return {
    ...mapRepository(dto),
    watchersCount: dto.watchers_count,
    subscribersCount: dto.subscribers_count,
    networkCount: dto.network_count,
    size: dto.size,
    defaultBranch: dto.default_branch,
    license: dto.license
      ? { key: dto.license.key, name: dto.license.name, spdxId: dto.license.spdx_id }
      : null,
    pushedAt: new Date(dto.pushed_at),
  };
}

export function mapIssue(dto: GitHubIssueDto): Issue {
  return {
    id: dto.id,
    number: dto.number,
    title: dto.title,
    body: dto.body,
    state: dto.state,
    author: mapOwner(dto.user),
    labels: dto.labels,
    commentsCount: dto.comments,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
    closedAt: dto.closed_at ? new Date(dto.closed_at) : null,
    url: dto.html_url,
    isPullRequest: Boolean(dto.pull_request),
  };
}
