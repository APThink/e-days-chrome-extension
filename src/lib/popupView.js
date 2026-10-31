function paint(doc, view) {
  const $ = (id) => doc.getElementById(id);
  const content = $('content');
  const stats = $('stats');
  const warning = $('warning');

  $('goToPage').classList.toggle('hidden', !(view.kind === 'error' && view.offerOpenPage));

  if (view.kind === 'error') {
    stats.classList.add('hidden');
    content.classList.add('hidden');
    warning.classList.add('hidden');
    $('status').textContent = '❌ ' + view.message;
    return;
  }

  const { summary } = view;
  const day = $('day');
  day.textContent = view.label;
  day.classList.toggle('day-other', !view.isToday);
  $('prev').disabled = !view.canPrev;
  $('next').disabled = !view.canNext;

  content.classList.remove('hidden');
  stats.classList.remove('hidden');
  $('work').textContent = summary.work;
  $('pause').textContent = summary.pause;

  $('projectedEnd').textContent = summary.feierabend ?? '-';
  $('projectedEndRow').classList.toggle('hidden', !summary.feierabend);

  $('status').textContent = summary.status;

  warning.textContent = summary.warning ?? '';
  warning.classList.toggle('hidden', !summary.warning);
}

export async function mountPopup(doc, popup) {
  const $ = (id) => doc.getElementById(id);
  $('prev').addEventListener('click', () => paint(doc, popup.navigate(-1)));
  $('next').addEventListener('click', () => paint(doc, popup.navigate(1)));
  $('goToPage').addEventListener('click', () => popup.openPage());
  paint(doc, await popup.load());
}
