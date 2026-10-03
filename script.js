const starterIdeas = [
  { id: 1, text: 'Talent show: live chicken??', category: 'Talent show', color: 'yellow', date: 'just now', x: 7, y: 12, tilt: -2 },
  { id: 2, text: 'What if the finale is everyone singing one wildly dramatic song?', category: 'Big ideas', color: 'pink', date: 'yesterday', x: 38, y: 8, tilt: 2 },
  { id: 3, text: 'Ask the art club to make a giant cardboard moon.', category: 'To explore', color: 'blue', date: '2 days ago', x: 70, y: 18, tilt: -1 },
  { id: 4, text: 'Snake idea, but maybe… no more snakes in school vents.', category: 'Unsorted', color: 'green', date: 'last week', x: 22, y: 52, tilt: 1.5 }
];

const storageKey = 'idea-scratchpad-ideas';
let ideas = JSON.parse(localStorage.getItem(storageKey) || 'null') || starterIdeas;
let selectedColor = 'yellow';
let selectedFilter = 'All categories';
let zCounter = Math.max(5, ...ideas.map((idea) => idea.z || 1));
const $ = (selector) => document.querySelector(selector);

function randomPosition() {
  return { x: Math.round(4 + Math.random() * 78), y: Math.round(5 + Math.random() * 67), tilt: Math.round((Math.random() * 5 - 2.5) * 10) / 10 };
}

ideas.forEach((idea) => Object.assign(idea, idea.x == null ? randomPosition() : {}, { z: idea.z || 1 }));

function saveIdeas() {
  localStorage.setItem(storageKey, JSON.stringify(ideas));
  $('#saveState').textContent = 'saved in this browser';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);
}

function render() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const visible = ideas.filter((idea) => {
    const matchesFilter = selectedFilter === 'All categories' || idea.category === selectedFilter;
    const matchesQuery = !query || `${idea.text} ${idea.category} ${idea.tag || ''}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });
  const board = $('#ideaGrid');
  board.innerHTML = visible.map((idea) => `
    <article class="idea-card ${escapeHtml(idea.color)}" data-id="${idea.id}" style="--x:${idea.x}%;--y:${idea.y}%;--tilt:${idea.tilt}deg;--z:${idea.z}">
      <div class="card-category"><span>${escapeHtml(idea.category)}${idea.tag ? ` · #${escapeHtml(idea.tag)}` : ''}</span><button class="delete-card" data-delete="${idea.id}" title="Remove idea" aria-label="Remove idea">×</button></div>
      <p class="card-text">${escapeHtml(idea.text)}</p>
      <div class="card-footer"><span>${escapeHtml(idea.date || 'just now')}</span><span>✦</span></div>
    </article>`).join('');
  $('#ideaCount').textContent = `${ideas.length} idea${ideas.length === 1 ? '' : 's'}, no bad ones`;
  $('#emptyState').hidden = visible.length > 0;
  $('#emptyTitle').textContent = ideas.length === 0 ? 'The wall is waiting.' : 'No ideas found.';
  $('#emptyCopy').textContent = ideas.length === 0 ? 'Your next weird, wonderful idea goes right here.' : 'Try a different search or category.';
  $('#emptyAction').hidden = ideas.length > 0;
  $('#activeFilter').hidden = selectedFilter === 'All categories';
  $('#activeFilter').textContent = selectedFilter === 'All categories' ? '' : `Showing: ${selectedFilter}`;
  updateFilterMenu();
}

function updateFilterMenu() {
  const categories = ['All categories', ...new Set(ideas.map((idea) => idea.category))];
  $('#filterMenu').innerHTML = categories.map((category) => `<button class="filter-option" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
  $('#filterButton').innerHTML = `${escapeHtml(selectedFilter)} <span>⌄</span>`;
}

function mixIdeas() {
  ideas.forEach((idea) => Object.assign(idea, randomPosition(), { z: ++zCounter }));
  saveIdeas();
  render();
}

$('#ideaForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#ideaInput');
  const text = input.value.trim();
  if (!text) return;
  ideas.unshift({ id: Date.now(), text, category: $('#categoryInput').value, tag: $('#tagInput').value.trim().replace(/^#/, ''), color: selectedColor, date: 'just now', ...randomPosition(), z: ++zCounter });
  saveIdeas();
  input.value = '';
  $('#tagInput').value = '';
  render();
  input.focus();
});

$('#ideaInput').addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') $('#ideaForm').requestSubmit();
});

document.querySelectorAll('.color-choice').forEach((button) => button.addEventListener('click', () => {
  selectedColor = button.dataset.color;
  document.querySelectorAll('.color-choice').forEach((item) => item.classList.toggle('active', item === button));
}));

$('#searchInput').addEventListener('input', render);
$('#scatterButton').addEventListener('click', mixIdeas);
$('#filterButton').addEventListener('click', () => {
  const menu = $('#filterMenu');
  menu.hidden = !menu.hidden;
  $('#filterButton').setAttribute('aria-expanded', String(!menu.hidden));
});
$('#filterMenu').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  selectedFilter = button.dataset.filter;
  $('#filterMenu').hidden = true;
  $('#filterButton').setAttribute('aria-expanded', 'false');
  render();
});

$('#ideaGrid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  ideas = ideas.filter((idea) => String(idea.id) !== button.dataset.delete);
  saveIdeas();
  render();
});

let drag = null;
$('#ideaGrid').addEventListener('pointerdown', (event) => {
  const card = event.target.closest('.idea-card');
  if (!card || event.target.closest('button')) return;
  const idea = ideas.find((item) => String(item.id) === card.dataset.id);
  if (!idea) return;
  const board = $('#ideaGrid').getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  drag = { card, idea, board, offsetX: event.clientX - cardRect.left, offsetY: event.clientY - cardRect.top };
  idea.z = ++zCounter;
  card.setPointerCapture(event.pointerId);
  card.classList.add('is-dragging');
  event.preventDefault();
});
$('#ideaGrid').addEventListener('pointermove', (event) => {
  if (!drag) return;
  const x = Math.max(8, Math.min(88, ((event.clientX - drag.board.left - drag.offsetX) / drag.board.width) * 100));
  const y = Math.max(4, Math.min(82, ((event.clientY - drag.board.top - drag.offsetY) / drag.board.height) * 100));
  drag.idea.x = x;
  drag.idea.y = y;
  drag.card.style.left = `${x}%`;
  drag.card.style.top = `${y}%`;
  drag.card.style.zIndex = drag.idea.z;
});
$('#ideaGrid').addEventListener('pointerup', () => {
  if (!drag) return;
  drag.card.classList.remove('is-dragging');
  saveIdeas();
  drag = null;
});

$('#emptyAction').addEventListener('click', () => $('#ideaInput').focus());
$('#clearAll').addEventListener('click', () => {
  if (!ideas.length || !window.confirm('Clear every idea from your wall?')) return;
  ideas = [];
  saveIdeas();
  render();
});
render();
