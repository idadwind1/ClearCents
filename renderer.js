const DEFAULT_CATS = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Other'];
function getCats() {
  const d = load();
  return [...DEFAULT_CATS, ...(d.customCats || [])];
}
const CATS = null; // replaced by getCats()
const KEYWORDS = {
  Food: ['coffee', 'lunch', 'dinner', 'breakfast', 'restaurant', 'food', 'grocery', 'cafe', 'pizza', 'burger'],
  Transport: ['bus', 'taxi', 'uber', 'metro', 'train', 'gas', 'fuel', 'parking', 'ticket'],
  Entertainment: ['movie', 'cinema', 'game', 'concert', 'netflix', 'spotify', 'book'],
  Shopping: ['amazon', 'clothes', 'shirt', 'shoes', 'mall', 'store', 'buy']
};

function load() {
  return JSON.parse(localStorage.getItem('cc') || '{"budget":1500,"spent":[],"goal":{"name":"","target":0,"saved":0},"notifTime":"20:00","customCats":[]}');
}
function save(d) { localStorage.setItem('cc', JSON.stringify(d)); }

let selectedCat = 'Other';

function show(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('nav button').forEach((b, i) => {
    b.classList.toggle('active', ['home','add','expenses','settings'][i] === id);
  });
  document.getElementById(id).classList.add('active');
  if (id === 'home') renderHome();
  if (id === 'settings') loadSettings();
  if (id === 'add') renderCatButtons();
  if (id === 'expenses') renderExpenses();
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
  const cats = getCats();
  const totals = {};
  cats.forEach(c => totals[c] = 0);
  thisMonth.forEach(e => { totals[e.cat] = (totals[e.cat] || 0) + e.amount; });
  const max = Math.max(...Object.values(totals), 1);
  const chart = document.getElementById('bar-chart');
  chart.innerHTML = cats.map(c => `
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
  document.getElementById('cat-buttons').innerHTML = getCats().map(c =>
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
  // also check custom cats by name match
  if (suggested === 'Other') {
    const custom = load().customCats || [];
    const match = custom.find(c => desc.includes(c.toLowerCase()));
    if (match) suggested = match;
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

function renderExpenses() {
  const d = load();
  const list = document.getElementById('exp-list');
  if (!d.spent.length) { list.innerHTML = '<li style="color:#aaa;padding:12px 0">No expenses yet.</li>'; return; }
  list.innerHTML = [...d.spent].reverse().map((e, ri) => {
    const i = d.spent.length - 1 - ri;
    const dt = new Date(e.date).toLocaleDateString();
    return `<li class="exp-item" id="exp-row-${i}">
      <div class="exp-info">
        <div>${e.desc || '—'} <span class="exp-cat">${e.cat}</span></div>
        <div class="exp-date">${dt}</div>
      </div>
      <div class="exp-amt">$${e.amount.toFixed(2)}</div>
      <button class="btn-sm" onclick="startEdit(${i})">Edit</button>
      <button class="btn-sm del" onclick="deleteExpense(${i})">Del</button>
    </li>`;
  }).join('');
}

function deleteExpense(i) {
  const d = load();
  d.spent.splice(i, 1);
  save(d);
  renderExpenses();
}

function startEdit(i) {
  const d = load();
  const e = d.spent[i];
  const catOptions = getCats().map(c => `<option${c === e.cat ? ' selected' : ''}>${c}</option>`).join('');
  document.getElementById(`exp-row-${i}`).outerHTML = `
    <li class="edit-row" id="exp-row-${i}">
      <input type="number" id="edit-amt-${i}" value="${e.amount}" min="0" step="0.01" style="width:80px">
      <input type="text" id="edit-desc-${i}" value="${e.desc || ''}">
      <select id="edit-cat-${i}">${catOptions}</select>
      <button class="btn-sm btn-primary" onclick="saveEdit(${i})">Save</button>
      <button class="btn-sm" onclick="renderExpenses()">Cancel</button>
    </li>`;
}

function saveEdit(i) {
  const d = load();
  const amount = parseFloat(document.getElementById(`edit-amt-${i}`).value);
  if (!amount || amount <= 0) return;
  d.spent[i].amount = amount;
  d.spent[i].desc = document.getElementById(`edit-desc-${i}`).value.trim();
  d.spent[i].cat = document.getElementById(`edit-cat-${i}`).value;
  save(d);
  renderExpenses();
}

function loadSettings() {
  const d = load();
  document.getElementById('s-budget').value = d.budget;
  document.getElementById('s-goal-name').value = d.goal.name;
  document.getElementById('s-goal-target').value = d.goal.target;
  document.getElementById('s-goal-saved').value = d.goal.saved;
  document.getElementById('s-notif-time').value = d.notifTime;
  renderCustomCats();
}

function renderCustomCats() {
  const d = load();
  document.getElementById('custom-cats-list').innerHTML = (d.customCats || []).map(c =>
    `<span class="cat-tag">${c} <button onclick="removeCat('${c}')">×</button></span>`
  ).join('');
}

function addCustomCat() {
  const input = document.getElementById('new-cat-input');
  const name = input.value.trim();
  if (!name) return;
  const d = load();
  d.customCats = d.customCats || [];
  if (!getCats().includes(name)) d.customCats.push(name);
  save(d);
  input.value = '';
  renderCustomCats();
}

function removeCat(name) {
  const d = load();
  d.customCats = (d.customCats || []).filter(c => c !== name);
  save(d);
  renderCustomCats();
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
