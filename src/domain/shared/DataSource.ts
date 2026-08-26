export const DATA_SOURCE_IDS = ['github', 'gitlab'] as const;

export type DataSourceId = (typeof DATA_SOURCE_IDS)[number];

export function isDataSourceId(value: unknown): value is DataSourceId {
  return (DATA_SOURCE_IDS as readonly unknown[]).includes(value);
}
