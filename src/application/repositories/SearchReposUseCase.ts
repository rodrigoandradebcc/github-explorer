import type { Repository } from '@/domain/entities/Repository';
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import type { Page } from '@/domain/shared/Page';

export interface SearchReposInput {
  query: string;
  page?: number;
}

export class SearchReposUseCase {
  constructor(private readonly repositories: RepositoryRepository) {}

  async execute({ query, page = 1 }: SearchReposInput): Promise<Page<Repository>> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return { items: [], total: 0, nextPage: null };

    return this.repositories.search(normalizedQuery, page);
  }
}
