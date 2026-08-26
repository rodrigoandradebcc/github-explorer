export interface Page<T> {
  items: T[];
  total: number | null;
  nextPage: number | null;
}
