export const PAST_DATE = '2000-01-01';

export function buildTimeField({ value = '', readOnly = false } = {}) {
  const field = document.createElement('div');
  field.className = '_col-time_174qg_24';

  const timeContainer = document.createElement('div');
  timeContainer.className = '_time-container_1eu8w_51';

  const [hh = '', mm = ''] = value ? value.split(':') : [];

  const hourInput = document.createElement('input');
  hourInput.type = 'text';
  hourInput.value = hh;

  const minuteInput = document.createElement('input');
  minuteInput.type = 'number';
  minuteInput.value = mm;

  if (readOnly) {
    hourInput.disabled = true;
    minuteInput.disabled = true;
  }

  timeContainer.append(hourInput, document.createElement('span'), minuteInput);
  field.appendChild(timeContainer);
  return field;
}

export function buildPeriodRow({ start = '', end = '' } = {}) {
  const row = document.createElement('div');
  row.className = '_period-container_174qg_15';
  row.appendChild(buildTimeField({ value: start }));
  row.appendChild(buildTimeField({ value: end }));
  row.appendChild(buildTimeField({ readOnly: true }));
  return row;
}

export function buildDayContainer({ rows = [], date = PAST_DATE } = {}) {
  const container = document.createElement('div');
  container.id = `timesheet-day-${date}`;

  const topRow = document.createElement('div');
  topRow.className = '_top-row_1qp1z_21';
  topRow.innerHTML = '<span class="_date_1qp1z_111">Montag - 06-07-2026</span>';
  container.appendChild(topRow);

  const periods = document.createElement('div');
  periods.className = '_periods_dy7ys_13';
  rows.forEach((row) => periods.appendChild(buildPeriodRow(row)));
  container.appendChild(periods);

  document.body.appendChild(container);
  return container;
}

export function buildWeekLabel(text) {
  const label = document.createElement('div');
  label.className = '_header-label_9xk2p_3';
  label.textContent = text;
  document.body.appendChild(label);
  return label;
}
