import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

import type { DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourcePreferenceStorage } from '@/domain/shared/DataSourcePreferenceStorage';
import type { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

export interface DataSourceContextValue {
  source: DataSourceId;
  setSource: (source: DataSourceId) => void;
}

const noOpStorage: DataSourcePreferenceStorage = {
  load: async () => null,
  save: async () => undefined,
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({
  selection,
  storage = noOpStorage,
  children,
}: {
  selection: DataSourceSelection;
  storage?: DataSourcePreferenceStorage;
  children: React.ReactNode;
}) {
  const source = useSyncExternalStore(selection.subscribe, () => selection.current);

  const userChoseRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void storage.load().then((stored) => {
      if (!cancelled && !userChoseRef.current && stored !== null) selection.set(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [selection, storage]);

  const value = useMemo<DataSourceContextValue>(
    () => ({
      source,
      setSource: (next) => {
        userChoseRef.current = true;
        selection.set(next);
        void storage.save(next);
      },
    }),
    [source, selection, storage],
  );

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): DataSourceContextValue {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used inside <DataSourceProvider>');
  }
  return context;
}

export const useDataSourceScope = (): DataSourceId => useDataSource().source;
