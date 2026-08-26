import type { Owner } from './Owner';

export interface Repository {
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

export interface RepositoryDetails extends Repository {
  watchersCount: number;
  subscribersCount: number;
  networkCount: number;
  size: number;
  defaultBranch: string;
  license: { key: string; name: string; spdxId: string } | null;
  pushedAt: Date;
}
