import { DATA_SOURCE_IDS, isDataSourceId } from '../DataSource';
import { DataSourceSelection } from '../DataSourceSelection';

describe('isDataSourceId', () => {
  it.each(DATA_SOURCE_IDS)('accepts %s', (id) => {
    expect(isDataSourceId(id)).toBe(true);
  });

  it.each(['bitbucket', '', null, undefined, 42])('rejects %p', (value) => {
    expect(isDataSourceId(value)).toBe(false);
  });
});

describe('DataSourceSelection', () => {
  it('starts on the provided source', () => {
    expect(new DataSourceSelection('github').current).toBe('github');
    expect(new DataSourceSelection('gitlab').current).toBe('gitlab');
  });

  it('notifies subscribers after the source changes', () => {
    const selection = new DataSourceSelection('github');
    const seen: string[] = [];
    selection.subscribe(() => seen.push(selection.current));

    selection.set('gitlab');

    expect(seen).toEqual(['gitlab']);
    expect(selection.current).toBe('gitlab');
  });

  it('does not notify when setting the already-active source', () => {
    const selection = new DataSourceSelection('github');
    let calls = 0;
    selection.subscribe(() => {
      calls += 1;
    });

    selection.set('github');

    expect(calls).toBe(0);
  });

  it('stops notifying after unsubscribe', () => {
    const selection = new DataSourceSelection('github');
    let calls = 0;
    const unsubscribe = selection.subscribe(() => {
      calls += 1;
    });

    unsubscribe();
    selection.set('gitlab');

    expect(calls).toBe(0);
  });
});
