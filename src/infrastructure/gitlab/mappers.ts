import type { Issue } from '@/domain/entities/Issue';
import type { Owner } from '@/domain/entities/Owner';
import type { Repository, RepositoryDetails } from '@/domain/entities/Repository';

import { GITLAB_WEB_BASE_URL } from './constants';
import type {
  GitLabIssueAuthorDto,
  GitLabIssueDto,
  GitLabNamespaceDto,
  GitLabProjectDetailsDto,
  GitLabProjectDto,
} from './dtos';

function toAbsoluteUrl(url: string | null): string | null {
  if (url === null || url.length === 0) return null;
  return url.startsWith('http') ? url : `${GITLAB_WEB_BASE_URL}${url}`;
}

function mapNamespaceOwner(dto: GitLabNamespaceDto): Owner {
  return {
    id: dto.id,
    login: dto.full_path,
    avatarUrl: toAbsoluteUrl(dto.avatar_url),
    profileUrl: dto.web_url,
    type: dto.kind === 'user' ? 'user' : 'organization',
  };
}

function mapAuthorOwner(dto: GitLabIssueAuthorDto): Owner {
  return {
    id: dto.id,
    login: dto.username,
    avatarUrl: toAbsoluteUrl(dto.avatar_url),
    profileUrl: dto.web_url,
    type: 'user',
  };
}

export function mapProject(dto: GitLabProjectDto): Repository {
  return {
    id: dto.id,
    name: dto.path,
    fullName: dto.path_with_namespace,
    owner: mapNamespaceOwner(dto.namespace),
    description: dto.description,
    url: dto.web_url,
    language: null,
    starsCount: dto.star_count,
    forksCount: dto.forks_count,
    openIssuesCount: dto.open_issues_count ?? 0,
    topics: dto.topics ?? [],
    updatedAt: new Date(dto.last_activity_at),
    createdAt: new Date(dto.created_at),
    isPrivate: dto.visibility !== undefined && dto.visibility !== 'public',
  };
}

export function mapProjectDetails(dto: GitLabProjectDetailsDto): RepositoryDetails {
  return {
    ...mapProject(dto),
    watchersCount: null,
    subscribersCount: null,
    networkCount: null,
    size: null,
    defaultBranch: dto.default_branch,
    license: null,
    pushedAt: new Date(dto.last_activity_at),
  };
}

export function mapIssue(dto: GitLabIssueDto): Issue {
  return {
    id: dto.id,
    number: dto.iid,
    title: dto.title,
    body: dto.description,
    state: dto.state === 'closed' ? 'closed' : 'open',
    author: mapAuthorOwner(dto.author),
    labels: dto.labels.map((name, index) => ({
      id: index,
      name,
      color: null,
      description: null,
    })),
    commentsCount: dto.user_notes_count,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
    closedAt: dto.closed_at ? new Date(dto.closed_at) : null,
    url: dto.web_url,
    isPullRequest: false,
  };
}

export function parsePositiveIntHeader(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
