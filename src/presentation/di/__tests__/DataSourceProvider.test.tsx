import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

import type { DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourcePreferenceStorage } from '@/domain/shared/DataSourcePreferenceStorage';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

import { DataSourceProvider, useDataSource } from '../DataSourceProvider';

function Probe() {
  const { source, setSource } = useDataSource();
  return (
    <Pressable testID="switch-to-gitlab" onPress={() => setSource('gitlab')}>
      <Text testID="current-source">{source}</Text>
    </Pressable>
  );
}

function fakeStorage(loadValue: DataSourceId | null = null) {
  const saved: DataSourceId[] = [];
  const storage: DataSourcePreferenceStorage = {
    load: async () => loadValue,
    save: async (source) => {
      saved.push(source);
    },
  };
  return { storage, saved };
}

describe('DataSourceProvider', () => {
  it('exposes the selection current source', () => {
    render(
      <DataSourceProvider selection={new DataSourceSelection('github')}>
        <Probe />
      </DataSourceProvider>,
    );

    expect(screen.getByTestId('current-source')).toHaveTextContent('github');
  });

  it('switches the shared selection and persists the choice', async () => {
    const selection = new DataSourceSelection('github');
    const { storage, saved } = fakeStorage();

    render(
      <DataSourceProvider selection={selection} storage={storage}>
        <Probe />
      </DataSourceProvider>,
    );

    fireEvent.press(screen.getByTestId('switch-to-gitlab'));

    expect(selection.current).toBe('gitlab');
    expect(screen.getByTestId('current-source')).toHaveTextContent('gitlab');
    await waitFor(() => expect(saved).toEqual(['gitlab']));
  });

  it('applies the persisted source after mount', async () => {
    const { storage } = fakeStorage('gitlab');

    render(
      <DataSourceProvider selection={new DataSourceSelection('github')} storage={storage}>
        <Probe />
      </DataSourceProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('current-source')).toHaveTextContent('gitlab'));
  });

  it('throws when useDataSource is used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(
      'useDataSource must be used inside <DataSourceProvider>',
    );
    spy.mockRestore();
  });
});
