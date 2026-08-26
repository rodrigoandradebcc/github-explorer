import type { DataSourceId } from './DataSource';

export class DataSourceSelection {
  private active: DataSourceId;
  private readonly listeners = new Set<() => void>();

  constructor(initial: DataSourceId) {
    this.active = initial;
  }

  get current(): DataSourceId {
    return this.active;
  }

  set(next: DataSourceId): void {
    if (next === this.active) return;
    this.active = next;
    this.listeners.forEach((listener) => listener());
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}
