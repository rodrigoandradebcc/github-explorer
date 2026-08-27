import type { Issue } from '../entities/Issue';
import type { Page } from '../shared/Page';
import type { RequestOptions } from '../shared/RequestOptions';

export interface IssueRepository {
  findOpenByRepository(
    owner: string,
    repository: string,
    page?: number,
    options?: RequestOptions,
  ): Promise<Page<Issue>>;
}
