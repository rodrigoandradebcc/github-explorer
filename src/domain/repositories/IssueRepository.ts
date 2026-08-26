import type { Issue } from '../entities/Issue';
import type { Page } from '../shared/Page';

export interface IssueRepository {
  findOpenByRepository(owner: string, repository: string, page?: number): Promise<Page<Issue>>;
}
