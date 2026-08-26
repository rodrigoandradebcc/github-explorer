export interface GitHubOwnerDto {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
}

export interface GitHubRepositoryDto {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubOwnerDto;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  updated_at: string;
  created_at: string;
  private: boolean;
}

export interface GitHubRepositoryDetailsDto extends GitHubRepositoryDto {
  watchers_count: number;
  subscribers_count: number;
  network_count: number;
  size: number;
  default_branch: string;
  license: { key: string; name: string; spdx_id: string } | null;
  pushed_at: string;
}

export interface GitHubIssueDto {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubOwnerDto;
  labels: { id: number; name: string; color: string; description: string | null }[];
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  pull_request?: { url: string };
}

export interface GitHubSearchRepositoriesResponseDto {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepositoryDto[];
}
