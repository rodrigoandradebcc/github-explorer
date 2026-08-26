import type { Owner } from './Owner';

export interface IssueLabel {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  author: Owner;
  labels: IssueLabel[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  url: string;
  isPullRequest: boolean;
}
