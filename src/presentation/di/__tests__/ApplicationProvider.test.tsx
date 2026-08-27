import { render } from '@testing-library/react-native';
import React from 'react';

import { ApplicationProvider, useRepoService } from '../ApplicationProvider';

function Probe() {
  useRepoService();
  return null;
}

describe('ApplicationProvider', () => {
  it('fails loudly when a screen asks for a service nobody injected', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      render(
        <ApplicationProvider services={{}}>
          <Probe />
        </ApplicationProvider>,
      ),
    ).toThrow('repoService was not provided to <ApplicationProvider>');

    consoleError.mockRestore();
  });

  it('fails loudly when the provider is missing entirely', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow(
      'useApplicationServices must be used inside <ApplicationProvider>',
    );

    consoleError.mockRestore();
  });
});
