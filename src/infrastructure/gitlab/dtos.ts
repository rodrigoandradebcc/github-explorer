export interface GitLabNamespaceDto {
  id: number;
  name: string;
  path: string;
  kind: 'user' | 'group';
  full_path: string;
  avatar_url: string | null;
  web_url: string;
}

export interface GitLabProjectDto {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  avatar_url: string | null;
  star_count: number;
  forks_count: number;
  open_issues_count?: number;
  topics?: string[];
  last_activity_at: string;
  created_at: string;
  visibility?: 'public' | 'internal' | 'private';
  default_branch: string | null;
  namespace: GitLabNamespaceDto;
}

export type GitLabProjectDetailsDto = GitLabProjectDto;

export interface GitLabIssueAuthorDto {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
  web_url: string;
}

export interface GitLabIssueDto {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed';
  author: GitLabIssueAuthorDto;
  labels: string[];
  user_notes_count: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  web_url: string;
}

/**
 * GitLab paginates via response headers (x-total, x-next-page). The datasource
 * hands them over verbatim (string or null when absent/empty); the repository
 * adapter parses them. `total` may be absent for expensive queries.
 */
export interface GitLabPageDto<T> {
  items: T[];
  totalHeader: string | null;
  nextPageHeader: string | null;
}
