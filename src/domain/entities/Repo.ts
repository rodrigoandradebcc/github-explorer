import type { Owner } from './Owner';

export interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: Owner;
  description: string | null;
  url: string;
  language: string | null;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];
  updatedAt: Date;
  createdAt: Date;
  isPrivate: boolean;
}

export interface RepoDetails extends Repo {
  watchersCount: number | null;
  subscribersCount: number | null;
  networkCount: number | null;
  size: number | null;
  defaultBranch: string | null;
  license: { key: string; name: string; spdxId: string } | null;
  pushedAt: Date;
}
