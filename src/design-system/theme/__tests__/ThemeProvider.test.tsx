import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { ThemeProvider, useTheme } from '../ThemeProvider';
import type { ThemePreferenceStorage } from '../ThemePreferenceStorage';

function fakeStorage(
  overrides: Partial<ThemePreferenceStorage> = {},
): jest.Mocked<ThemePreferenceStorage> {
  return {
    load: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<ThemePreferenceStorage>;
}

function TestConsumer() {
  const { mode, toggleMode, colors, spacing, sizes, radius } = useTheme();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="bg-color">{colors.background}</Text>
      <Text testID="spacing-md">{spacing.md}</Text>
      <Text testID="size-md">{sizes.md}</Text>
      <Text testID="radius-md">{radius.md}</Text>
      <TouchableOpacity testID="toggle" onPress={toggleMode} />
    </>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  it('provides light mode by default', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(screen.getByTestId('bg-color').props.children).toBe('#E9E7E9');
  });

  it('toggles from light to dark and persists the choice', async () => {
    const storage = fakeStorage();
    render(
      <ThemeProvider storage={storage}>
        <TestConsumer />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('bg-color').props.children).toBe('#0D1117');
    expect(storage.save).toHaveBeenCalledWith('dark');
  });

  it('toggles back from dark to light', async () => {
    const storage = fakeStorage();
    render(
      <ThemeProvider initialMode="dark" storage={storage}>
        <TestConsumer />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(storage.save).toHaveBeenCalledWith('light');
  });

  it('adopts the mode loaded from injected storage', async () => {
    const storage = fakeStorage({ load: jest.fn().mockResolvedValue('dark') });

    render(
      <ThemeProvider storage={storage}>
        <TestConsumer />
      </ThemeProvider>,
    );

    await act(async () => {});

    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mode').props.children).toBe('dark');
  });

  it('exposes correct token values', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('spacing-md').props.children).toBe(16);
    expect(screen.getByTestId('size-md').props.children).toBe(16);
    expect(screen.getByTestId('radius-md').props.children).toBe(8);
  });

  it('throws when useTheme is called outside a provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within a ThemeProvider');
    spy.mockRestore();
  });
});
