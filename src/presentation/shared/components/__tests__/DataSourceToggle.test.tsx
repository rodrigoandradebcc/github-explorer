import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import { renderWithProviders } from '@/presentation/__test-utils__/renderWithProviders';

import { DataSourceToggle } from '../DataSourceToggle';

describe('DataSourceToggle', () => {
  it('renders one option per data source with the active one selected', () => {
    renderWithProviders(<DataSourceToggle />);

    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText('GitLab')).toBeTruthy();
    expect(screen.getByTestId('data-source-option-github').props.accessibilityState.selected).toBe(
      true,
    );
    expect(screen.getByTestId('data-source-option-gitlab').props.accessibilityState.selected).toBe(
      false,
    );
  });

  it('switches the shared selection when an option is pressed', () => {
    const selection = new DataSourceSelection('github');
    renderWithProviders(<DataSourceToggle />, { dataSourceSelection: selection });

    fireEvent.press(screen.getByTestId('data-source-option-gitlab'));

    expect(selection.current).toBe('gitlab');
    expect(screen.getByTestId('data-source-option-gitlab').props.accessibilityState.selected).toBe(
      true,
    );
  });
});
