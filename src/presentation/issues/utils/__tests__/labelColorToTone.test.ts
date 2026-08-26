import { labelColorToTone } from '../labelColorToTone';

describe('labelColorToTone', () => {
  it('returns default when the label has no color', () => {
    expect(labelColorToTone(null)).toBe('default');
  });

  it('maps a red hex to danger', () => {
    expect(labelColorToTone('ee0701')).toBe('danger');
  });

  it('maps a neutral hex to default', () => {
    expect(labelColorToTone('cccccc')).toBe('default');
  });
});
