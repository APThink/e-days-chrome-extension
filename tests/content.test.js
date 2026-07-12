// @vitest-environment jsdom
import { extractTimes, isTodayContainer, statusText, buildInfoText, ensureInfoElement, ensureWarningElement, updateAll, init, INFO_CLASS, WARNING_CLASS } from '../src/content.js';

function buildDayContainer({ periods = [], isToday = false } = {}) {
  const container = document.createElement('div');
  container.className = 'tt_day_container';

  const header = document.createElement('div');
  header.className = 'timesheet_day_header' + (isToday ? ' timesheet_today' : '');
  header.innerHTML = '<span class="timesheet_day_text">Montag - 06-07-2026</span>';
  if (isToday) {
    const chip = document.createElement('span');
    chip.className = 'timesheet_day_chip today_chip';
    chip.textContent = 'Heute';
    header.appendChild(chip);
  }
  container.appendChild(header);

  const inner = document.createElement('div');
  inner.className = 'tt_day_inner_container';
  const periodsContainer = document.createElement('div');
  periodsContainer.className = 'tt_periods_container';

  periods.forEach((time) => {
    const period = document.createElement('div');
    period.className = 'tt_period_container';
    const input = document.createElement('input');
    input.type = 'time';
    input.value = time;
    period.appendChild(input);
    periodsContainer.appendChild(period);
  });

  inner.appendChild(periodsContainer);
  container.appendChild(inner);

  document.body.appendChild(container);
  return container;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('extractTimes', () => {
  test('reads values from time inputs in order, skipping empty ones', () => {
    const container = buildDayContainer({ periods: ['08:28', '12:20', ''] });
    expect(extractTimes(container)).toEqual(['08:28', '12:20']);
  });

  test('returns empty array when there are no periods', () => {
    const container = buildDayContainer({ periods: [] });
    expect(extractTimes(container)).toEqual([]);
  });
});

describe('isTodayContainer', () => {
  test('true when the today chip is present', () => {
    const container = buildDayContainer({ isToday: true });
    expect(isTodayContainer(container)).toBe(true);
  });

  test('false otherwise', () => {
    const container = buildDayContainer({ isToday: false });
    expect(isTodayContainer(container)).toBe(false);
  });
});

describe('statusText', () => {
  test('working state', () => {
    expect(statusText({ state: 'working', lastTime: '08:28' })).toBe('🔨 Arbeitest seit 08:28');
  });

  test('away state', () => {
    expect(statusText({ state: 'away', awayMins: 30, lastTime: '17:00' })).toBe('🚶 Weg: 0h 30m (seit 17:00)');
  });

  test('done state', () => {
    expect(statusText({ state: 'done' })).toBe('🏠 Tag abgeschlossen');
  });

  test('empty state', () => {
    expect(statusText({ state: 'empty' })).toBe('📭 Keine Einträge');
  });
});

describe('buildInfoText', () => {
  test('completed day', () => {
    const container = buildDayContainer({ periods: ['08:28', '12:20', '12:56', '17:48'] });
    const text = buildInfoText(container, new Date('2026-07-06T20:00:00'));
    expect(text).toBe('Arbeit: 8h 44m · Pause: 0h 36m · 🏠 Tag abgeschlossen');
  });

  test('today mid-shift', () => {
    const container = buildDayContainer({ periods: ['09:00'], isToday: true });
    const text = buildInfoText(container, new Date('2026-07-12T10:30:00'));
    expect(text).toBe('Arbeit: 1h 30m · Pause: 0h 0m · 🔨 Arbeitest seit 09:00');
  });

  test('future/empty day', () => {
    const container = buildDayContainer({ periods: [] });
    const text = buildInfoText(container);
    expect(text).toBe('Arbeit: 0h 0m · Pause: 0h 0m · 📭 Keine Einträge');
  });
});

describe('ensureInfoElement', () => {
  test('creates the info element right after the header', () => {
    const container = buildDayContainer({ periods: ['08:00', '12:00'] });
    const el = ensureInfoElement(container);
    expect(el.classList.contains(INFO_CLASS)).toBe(true);
    expect(container.querySelector('.timesheet_day_header').nextElementSibling).toBe(el);
  });

  test('reuses the existing element on a second call instead of duplicating', () => {
    const container = buildDayContainer({ periods: ['08:00', '12:00'] });
    const first = ensureInfoElement(container);
    const second = ensureInfoElement(container);
    expect(second).toBe(first);
    expect(container.querySelectorAll(`.${INFO_CLASS}`).length).toBe(1);
  });

  test('returns null when there is no header to anchor to', () => {
    const container = document.createElement('div');
    container.className = 'tt_day_container';
    document.body.appendChild(container);
    expect(ensureInfoElement(container)).toBeNull();
  });
});

describe('ensureInfoElement day styling', () => {
  test('applies is-today for the today container', () => {
    const container = buildDayContainer({ periods: ['08:00'], isToday: true });
    const el = ensureInfoElement(container);
    expect(el.classList.contains('is-today')).toBe(true);
    expect(el.classList.contains('is-other')).toBe(false);
  });

  test('applies is-other for a non-today container', () => {
    const container = buildDayContainer({ periods: ['08:00'] });
    const el = ensureInfoElement(container);
    expect(el.classList.contains('is-other')).toBe(true);
    expect(el.classList.contains('is-today')).toBe(false);
  });
});

describe('ensureWarningElement', () => {
  test('creates the warning element right after the info element', () => {
    const container = buildDayContainer({ periods: ['08:00', '12:00'] });
    ensureInfoElement(container);
    const el = ensureWarningElement(container);
    expect(el.classList.contains(WARNING_CLASS)).toBe(true);
    expect(container.querySelector(`.${INFO_CLASS}`).nextElementSibling).toBe(el);
  });

  test('reuses the existing warning element on a second call', () => {
    const container = buildDayContainer({ periods: ['08:00', '12:00'] });
    ensureInfoElement(container);
    const first = ensureWarningElement(container);
    const second = ensureWarningElement(container);
    expect(second).toBe(first);
    expect(container.querySelectorAll(`.${WARNING_CLASS}`).length).toBe(1);
  });

  test('returns null when there is no info element to anchor to', () => {
    const container = document.createElement('div');
    container.className = 'tt_day_container';
    document.body.appendChild(container);
    expect(ensureWarningElement(container)).toBeNull();
  });
});

describe('updateAll', () => {
  test('injects text into every day container under root', () => {
    buildDayContainer({ periods: ['08:00', '12:00'] });
    buildDayContainer({ periods: [] });

    updateAll();

    const infos = document.querySelectorAll(`.${INFO_CLASS}`);
    expect(infos.length).toBe(2);
    expect(infos[0].textContent).toContain('Arbeit: 4h 0m');
    expect(infos[1].textContent).toContain('Keine Einträge');
  });

  test('reflects input value changes on the next call without duplicating the element', () => {
    const container = buildDayContainer({ periods: ['08:00', ''] });
    updateAll();
    expect(container.querySelector(`.${INFO_CLASS}`).textContent).toContain('Keine Einträge');

    container.querySelectorAll('input[type="time"]')[1].value = '12:00';
    updateAll();

    expect(container.querySelectorAll(`.${INFO_CLASS}`).length).toBe(1);
    expect(container.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });
});

describe('updateAll break warning', () => {
  test('shows no warning for a day under the threshold', () => {
    buildDayContainer({ periods: ['09:00', '14:00'] }); // 5h worked
    updateAll();
    const warning = document.querySelector(`.${WARNING_CLASS}`);
    expect(warning.textContent).toBe('');
    expect(warning.style.display).toBe('none');
  });

  test('shows a blinking warning when worked over 6h without a qualifying break', () => {
    buildDayContainer({ periods: ['08:00', '12:00', '12:10', '15:01'] }); // 6h51m worked, 10min break
    updateAll();
    const warning = document.querySelector(`.${WARNING_CLASS}`);
    expect(warning.textContent).toBe('⚠️ Noch 0h 30m Pause nötig');
    expect(warning.style.display).toBe('');
  });

  test('clears the warning once a 15+ minute break satisfies the requirement', () => {
    buildDayContainer({ periods: ['08:00', '12:00', '12:35', '16:01'] }); // 7h26m worked, 35min break
    updateAll();
    const warning = document.querySelector(`.${WARNING_CLASS}`);
    expect(warning.textContent).toBe('');
    expect(warning.style.display).toBe('none');
  });
});

describe('init', () => {
  let observer;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    observer?.disconnect();
    observer = undefined;
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('injects text immediately', () => {
    buildDayContainer({ periods: ['08:00', '12:00'] });
    observer = init();
    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });

  test('fallback polling picks up a value change within the first 10 seconds', () => {
    const container = buildDayContainer({ periods: ['08:00', ''] });
    observer = init();
    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Keine Einträge');

    container.querySelectorAll('input[type="time"]')[1].value = '12:00';
    vi.advanceTimersByTime(500);

    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });

  test('keeps updating every 60 seconds after the fallback window ends', () => {
    const container = buildDayContainer({ periods: ['08:00', ''] });
    observer = init();
    vi.advanceTimersByTime(11000);
    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Keine Einträge');

    container.querySelectorAll('input[type="time"]')[1].value = '12:00';
    vi.advanceTimersByTime(60000);

    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });

  test('reacts to new day containers being added to the DOM (week navigation)', async () => {
    observer = init();
    buildDayContainer({ periods: ['08:00', '12:00'] });

    await vi.advanceTimersByTimeAsync(500);

    expect(document.querySelector(`.${INFO_CLASS}`)?.textContent).toContain('Arbeit: 4h 0m');
  });
});
