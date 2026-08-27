import type { Repo } from '@/domain/entities/Repo';
import type { RepoRepository } from '@/domain/repositories/RepoRepository';
import type { Page } from '@/domain/shared/Page';

export interface SearchReposInput {
  query: string;
  page?: number;
  signal?: AbortSignal;
}

export class SearchReposUseCase {
  constructor(private readonly repositories: RepoRepository) {}

  async execute({ query, page = 1, signal }: SearchReposInput): Promise<Page<Repo>> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return { items: [], total: 0, nextPage: null };

    return this.repositories.search(normalizedQuery, page, { signal });
  }
}
