const CATS = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Other'];
const KEYWORDS = {
  Food: ['coffee', 'lunch', 'dinner', 'breakfast', 'restaurant', 'food', 'grocery', 'cafe', 'pizza', 'burger'],
  Transport: ['bus', 'taxi', 'uber', 'metro', 'train', 'gas', 'fuel', 'parking', 'ticket'],
  Entertainment: ['movie', 'cinema', 'game', 'concert', 'netflix', 'spotify', 'book'],
  Shopping: ['amazon', 'clothes', 'shirt', 'shoes', 'mall', 'store', 'buy']
};

function load() {
  return JSON.parse(localStorage.getItem('cc') || '{"budget":1500,"spent":[],"goal":{"name":"","target":0,"saved":0},"notifTime":"20:00"}');
}
function save(d) { localStorage.setItem('cc', JSON.stringify(d)); }

let selectedCat = 'Other';

function show(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('nav button').forEach((b, i) => {
    b.classList.toggle('active', ['home','add','settings'][i] === id);
  });
  document.getElementById(id).classList.add('active');
  if (id === 'home') renderHome();
  if (id === 'settings') loadSettings();
  if (id === 'add') renderCatButtons();
}

function renderHome() {
  const d = load();
  const now = new Date();
  const thisMonth = d.spent.filter(e => {
    const dt = new Date(e.date);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });
  const totalSpent = thisMonth.reduce((s, e) => s + e.amount, 0);
  const left = d.budget - totalSpent;
  document.getElementById('money-left').textContent = `$${left.toFixed(2)}`;
  document.getElementById('money-left').style.color = left < 0 ? '#c0392b' : '#2d6a4f';

  // Bar chart by category
  const totals = {};
  CATS.forEach(c => totals[c] = 0);
  thisMonth.forEach(e => { totals[e.cat] = (totals[e.cat] || 0) + e.amount; });
  const max = Math.max(...Object.values(totals), 1);
  const chart = document.getElementById('bar-chart');
  chart.innerHTML = CATS.map(c => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.round((totals[c]/max)*90)}px" title="$${totals[c].toFixed(2)}"></div>
      <div class="bar-lbl">${c.slice(0,4)}</div>
    </div>`).join('');

  // Goal ring
  const g = d.goal;
  document.getElementById('goal-name').textContent = g.name || 'No goal set';
  const pct = g.target > 0 ? Math.min(g.saved / g.target, 1) : 0;
  const circ = 2 * Math.PI * 50;
  document.getElementById('ring-arc').setAttribute('stroke-dashoffset', circ * (1 - pct));
  document.getElementById('ring-pct').textContent = `${Math.round(pct * 100)}%`;
}

function renderCatButtons() {
  document.getElementById('cat-buttons').innerHTML = CATS.map(c =>
    `<button class="cat-btn${c === selectedCat ? ' selected' : ''}" onclick="selectCat('${c}')">${c}</button>`
  ).join('');
}

function selectCat(c) {
  selectedCat = c;
  renderCatButtons();
}

function suggestCat() {
  const desc = document.getElementById('exp-desc').value.toLowerCase();
  let suggested = 'Other';
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => desc.includes(w))) { suggested = cat; break; }
  }
  document.getElementById('cat-suggestion').textContent = desc ? `Suggested: ${suggested}` : '';
  selectCat(suggested);
}

function addExpense() {
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const desc = document.getElementById('exp-desc').value.trim();
  if (!amount || amount <= 0) return;
  const d = load();
  d.spent.push({ amount, desc, cat: selectedCat, date: new Date().toISOString() });
  save(d);
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-desc').value = '';
  document.getElementById('cat-suggestion').textContent = '';
  selectedCat = 'Other';
  renderCatButtons();
  show('home');
}

function loadSettings() {
  const d = load();
  document.getElementById('s-budget').value = d.budget;
  document.getElementById('s-goal-name').value = d.goal.name;
  document.getElementById('s-goal-target').value = d.goal.target;
  document.getElementById('s-goal-saved').value = d.goal.saved;
  document.getElementById('s-notif-time').value = d.notifTime;
}

function saveSettings() {
  const d = load();
  d.budget = parseFloat(document.getElementById('s-budget').value) || 0;
  d.goal.name = document.getElementById('s-goal-name').value.trim();
  d.goal.target = parseFloat(document.getElementById('s-goal-target').value) || 0;
  d.goal.saved = parseFloat(document.getElementById('s-goal-saved').value) || 0;
  d.notifTime = document.getElementById('s-notif-time').value;
  save(d);
  if (window.api) window.api.scheduleNotif(d.notifTime);
  show('home');
}

// Check notification time every minute
setInterval(() => {
  const d = load();
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  if (hhmm === d.notifTime && window.api) window.api.scheduleNotif(d.notifTime);
}, 60000);

renderHome();
