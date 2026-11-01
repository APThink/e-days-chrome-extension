import { loadConfig } from '../src/lib/configLoader.js';

const moduleOf = (config) => async () => ({ config });
const URL_ = 'https://example.e-days.com/TimeSubmission';

describe('Config loader', () => {
  let warn;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  test('returns allowedUrl and target hours from the module', async () => {
    const config = await loadConfig(moduleOf({ allowedUrl: URL_, targetHours: { Mo: '07:28', Fr: 6, Sa: 0 } }));

    expect(config).toEqual({ allowedUrl: URL_, targetHours: { Mo: '07:28', Fr: 6, Sa: 0 } });
  });

  test('target hours are optional', async () => {
    const config = await loadConfig(moduleOf({ allowedUrl: URL_ }));

    expect(config).toEqual({ allowedUrl: URL_, targetHours: undefined });
  });

  test('drops invalid target hours per day with a warning, keeps the rest', async () => {
    const config = await loadConfig(moduleOf({ allowedUrl: URL_, targetHours: { Mo: 'abc', Di: -1, Mi: '8:00', Do: NaN } }));

    expect(config.targetHours).toEqual({ Mi: '8:00' });
    expect(warn).toHaveBeenCalledTimes(3);
  });

  test('ignores target hours that are not an object', async () => {
    const config = await loadConfig(moduleOf({ allowedUrl: URL_, targetHours: 8 }));

    expect(config.targetHours).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('rejects with a readable message when the module cannot be loaded', async () => {
    const importModule = async () => { throw new Error('Failed to fetch'); };

    await expect(loadConfig(importModule)).rejects.toThrow('config.js konnte nicht geladen werden: Failed to fetch');
  });

  test.each([[undefined], [{}], [{ allowedUrl: '' }], [{ allowedUrl: 42 }]])('rejects when allowedUrl is unusable (%j)', async (config) => {
    await expect(loadConfig(moduleOf(config))).rejects.toThrow('allowedUrl fehlt');
  });
});
