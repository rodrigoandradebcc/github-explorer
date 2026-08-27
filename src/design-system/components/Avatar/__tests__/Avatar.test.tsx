import { screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '../../../__test-utils__/renderWithTheme';
import { Avatar } from '../index';

describe('Avatar', () => {
  it('renders fallback initials when no uri', () => {
    renderWithTheme(<Avatar testID="av" fallback="John Doe" />);
    expect(screen.getByTestId('avatar-fallback').props.children).toBe('JO');
  });

  it('truncates fallback to 2 uppercase characters', () => {
    renderWithTheme(<Avatar testID="av" fallback="rodrigo" />);
    expect(screen.getByTestId('avatar-fallback').props.children).toBe('RO');
  });

  it('renders Image when uri is provided', () => {
    renderWithTheme(<Avatar testID="av" fallback="AB" uri="https://example.com/avatar.jpg" />);
    expect(screen.getByTestId('avatar-image')).toBeTruthy();
    expect(screen.queryByTestId('avatar-fallback')).toBeNull();
  });

  it('applies sm dimensions (32px)', () => {
    renderWithTheme(<Avatar testID="av" fallback="AB" size="sm" />);
    const container = screen.getByTestId('av');
    expect(container.props.style.width).toBe(32);
    expect(container.props.style.height).toBe(32);
  });

  it('applies lg dimensions (64px)', () => {
    renderWithTheme(<Avatar testID="av" fallback="AB" size="lg" />);
    const container = screen.getByTestId('av');
    expect(container.props.style.width).toBe(64);
  });

  it('is circular (borderRadius = dimension / 2)', () => {
    renderWithTheme(<Avatar testID="av" fallback="AB" size="md" />);
    const container = screen.getByTestId('av');
    expect(container.props.style.borderRadius).toBe(24);
  });
});
