/* Gen Diary — школьный дневник.
   Всё хранится только на этом устройстве (localStorage), сеть не нужна. */
import { html, render, useState, useEffect, useRef } from './preact-htm.js';
import { G_PATH, G_VB, G_W, G_H } from './logo.js';

/* ================= константы ================= */
const STORE_KEY = 'gendiary:v1';
const DAY = 86400000;
const DN = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const DP = ['в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье'];
const MG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MN = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const KINDS = [
  { id: 'answer', label: 'Ответ на уроке', short: 'Ответ' },
  { id: 'hw', label: 'Домашняя работа', short: 'ДЗ' },
  { id: 'test', label: 'Самостоятельная', short: 'Самостоятельная' },
  { id: 'exam', label: 'Контрольная', short: 'Контрольная' }
];
const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k]));

/* ================= даты и числа ================= */
const pad = (n) => (n < 10 ? '0' : '') + n;
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const addIso = (s, n) => iso(addDays(parse(s), n));
const wd = (d) => (d.getDay() + 6) % 7;
const wdIso = (s) => wd(parse(s));
const diff = (a, b) => Math.round((parse(a) - parse(b)) / DAY);
const mondayIso = (s) => addIso(s, -wdIso(s));
const dayMonth = (d) => d.getDate() + ' ' + MG[d.getMonth()];
const longDate = (d) => DL[wd(d)] + ', ' + dayMonth(d);
const shortDate = (d) => DN[wd(d)] + ', ' + d.getDate() + ' ' + MS[d.getMonth()];
const todayIso = () => iso(new Date());
const plural = (n, f) => {
  const a = Math.abs(n) % 10, b = Math.abs(n) % 100;
  if (a === 1 && b !== 11) return f[0];
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return f[1];
  return f[2];
};
const pl = (n, f) => n + ' ' + plural(n, f);
const W_GRADE = ['оценка', 'оценки', 'оценок'];
const W_LESSON = ['урок', 'урока', 'уроков'];
const W_TASK = ['задание', 'задания', 'заданий'];
const W_DAY = ['день', 'дня', 'дней'];
const W_WEEK = ['неделю', 'недели', 'недель'];
const W_FIVE = ['пятёрка', 'пятёрки', 'пятёрок'];
const W_FOUR = ['четвёрка', 'четвёрки', 'четвёрок'];
const W_SUBJ = ['предмет', 'предмета', 'предметов'];
const num = (x, k) => x.toFixed(k).replace('.', ',');
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const schoolYearStart = (t) => { const d = parse(t); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return y + '-09-01'; };
const relFuture = (n) => (n === 0 ? 'сегодня' : n === 1 ? 'завтра' : n < 0 ? 'срок прошёл' : 'через ' + pl(n, W_DAY));
const relPast = (n) => (n === 0 ? 'сегодня' : n === 1 ? 'вчера' : pl(n, W_DAY) + ' назад');

/* ================= данные-пример ================= */
const SAMPLE_SUBJECTS = [
  ['alg', 'Алгебра', '214'], ['geo', 'Геометрия', '214'], ['phy', 'Физика', '301'], ['rus', 'Русский язык', '108'],
  ['lit', 'Литература', '108'], ['eng', 'Английский', '205'], ['his', 'История', '112'], ['soc', 'Обществознание', '112'],
  ['inf', 'Информатика', '310'], ['che', 'Химия', '220'], ['bio', 'Биология', '221'], ['pe', 'Физкультура', 'спортзал'], ['obz', 'ОБЗР', '115']
];
const SAMPLE_TT = [
  ['rus', 'alg', 'phy', 'phy', 'eng', 'his', 'pe'],
  ['geo', 'alg', 'lit', 'inf', 'inf', 'che', 'soc'],
  ['alg', 'phy', 'rus', 'eng', 'bio', 'obz'],
  ['geo', 'alg', 'lit', 'soc', 'his', 'pe'],
  ['phy', 'alg', 'rus', 'inf', 'eng', 'che'],
  ['lit', 'geo', 'phy', 'soc']
];
const DEFAULT_BELLS = [['08:30', '09:10'], ['09:20', '10:00'], ['10:20', '11:00'], ['11:20', '12:00'], ['12:10', '12:50'], ['13:00', '13:40'], ['13:50', '14:30'], ['14:40', '15:20']];
// даты привязаны к субботе 03.10.2026 и сдвигаются к текущей неделе
const SAMPLE_GR = [
  ['phy', 5, 'answer', '2026-09-02'], ['phy', 4, 'test', '2026-09-11'], ['phy', 5, 'hw', '2026-09-16'], ['phy', 5, 'exam', '2026-09-25'], ['phy', 4, 'answer', '2026-10-02'],
  ['alg', 4, 'answer', '2026-09-03'], ['alg', 3, 'test', '2026-09-10'], ['alg', 5, 'hw', '2026-09-15'], ['alg', 4, 'exam', '2026-09-24'], ['alg', 5, 'answer', '2026-10-01'],
  ['rus', 4, 'answer', '2026-09-04'], ['rus', 3, 'hw', '2026-09-14'], ['rus', 4, 'exam', '2026-09-23'], ['rus', 4, 'answer', '2026-09-30'],
  ['lit', 5, 'answer', '2026-09-08'], ['lit', 5, 'hw', '2026-09-17'], ['lit', 4, 'answer', '2026-10-01'],
  ['eng', 5, 'answer', '2026-09-07'], ['eng', 4, 'test', '2026-09-16'], ['eng', 5, 'hw', '2026-09-25'], ['eng', 4, 'answer', '2026-09-30'],
  ['his', 4, 'answer', '2026-09-07'], ['his', 5, 'hw', '2026-09-17'], ['his', 3, 'test', '2026-09-24'], ['his', 4, 'answer', '2026-10-01'],
  ['soc', 5, 'answer', '2026-09-08'], ['soc', 4, 'hw', '2026-09-19'], ['soc', 4, 'answer', '2026-09-29'],
  ['geo', 3, 'answer', '2026-09-03'], ['geo', 4, 'hw', '2026-09-12'], ['geo', 3, 'exam', '2026-09-22'], ['geo', 4, 'answer', '2026-10-03'],
  ['inf', 5, 'answer', '2026-09-08'], ['inf', 5, 'test', '2026-09-18'], ['inf', 5, 'hw', '2026-09-29'],
  ['che', 3, 'answer', '2026-09-04'], ['che', 4, 'hw', '2026-09-15'], ['che', 2, 'test', '2026-09-22'], ['che', 4, 'answer', '2026-10-02'],
  ['bio', 4, 'answer', '2026-09-09'], ['bio', 5, 'hw', '2026-09-23'],
  ['pe', 5, 'answer', '2026-09-07'], ['pe', 5, 'answer', '2026-09-24'], ['obz', 5, 'answer', '2026-09-16']
];
const SAMPLE_HW = [
  ['phy', 'Задачи 4.12–4.18, конспект § 14', 'next'], ['alg', '№ 9.14–9.20, производная сложной функции', 'next'],
  ['rus', 'Сочинение по тексту, вариант 3', 'next'], ['eng', 'Unit 2, с. 34, упр. 5–7; слова 2B', 'next'],
  ['his', '§ 8, вопросы 1–4 письменно', 'next-done'], ['geo', '№ 412, 415, 418', 'next'],
  ['lit', 'Бунин, «Чистый понедельник» — прочитать', 'next'], ['inf', '5 задач на обработку строк', 'next'],
  ['che', '§ 5, задачи 1–3 в конце параграфа', 'next'], ['phy', 'Оформить отчёт по лабораторной № 2', 'past'],
  ['soc', 'План ответа по теме «Рынок и конкуренция»', 'past'], ['alg', '№ 9.1–9.8', 'past']
];

function baseDb(t) {
  return {
    v: 1, sample: false, created: t,
    subjects: [], bells: DEFAULT_BELLS.map((b) => b.slice()), tt: [[], [], [], [], [], []], ov: {}, hw: [], grades: [],
    settings: { periodStart: schoolYearStart(t), th: 4.5, examWeight: 2, sixDay: true },
    goal: 4.5, flags: {}
  };
}

function buildSample(t) {
  const db = baseDb(t);
  db.sample = true;
  db.subjects = SAMPLE_SUBJECTS.map((s) => ({ id: s[0], name: s[1], room: s[2] }));
  db.tt = SAMPLE_TT.map((a) => a.slice());
  const back = (wdIso(t) - 5 + 7) % 7;               // сколько дней прошло с последней субботы
  const shift = diff(addIso(t, -back), '2026-10-03');
  db.grades = SAMPLE_GR.map((g, i) => ({ id: 'sg' + i, subj: g[0], v: g[1], kind: g[2], date: addIso(g[3], shift) })).filter((g) => g.date <= t);
  db.hw = SAMPLE_HW.map((h, i) => {
    const due = h[2] === 'past' ? prevLessons(db, h[0], t, 1)[0] || t : nextLessons(db, h[0], t, 1)[0] || addIso(t, 1);
    return { id: 'sh' + i, subj: h[0], text: h[1], due, done: h[2] !== 'next' };
  });
  for (let i = 1; i <= 7; i++) {                       // разовая замена в ближайшую среду
    const s = addIso(t, i);
    if (wdIso(s) === 2) { db.ov[s] = db.tt[2].filter((x) => x !== 'obz'); break; }
  }
  const first = db.grades.reduce((m, g) => (g.date < m ? g.date : m), db.settings.periodStart);
  db.settings.periodStart = first;
  return db;
}

function normalize(d, t) {
  const b = baseDb(t);
  const out = Object.assign({}, b, d);
  out.settings = Object.assign({}, b.settings, d.settings || {});
  out.flags = Object.assign({}, d.flags || {});
  ['subjects', 'hw', 'grades'].forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
  if (!Array.isArray(out.tt) || out.tt.length < 6) out.tt = [[], [], [], [], [], []];
  if (!Array.isArray(out.bells) || !out.bells.length) out.bells = b.bells;
  if (!out.ov || typeof out.ov !== 'object') out.ov = {};
  return out;
}

function loadDb() {
  const t = todayIso();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.v === 1) return normalize(d, t); }
  } catch (e) { /* повреждённые данные — начнём с примера */ }
  return buildSample(t);
}

/* ================= вычисления ================= */
const smCache = new WeakMap();
function sm(db) {
  let m = smCache.get(db.subjects);
  if (!m) { m = {}; db.subjects.forEach((s) => { m[s.id] = s; }); smCache.set(db.subjects, m); }
  return m;
}
const sname = (db, id) => (sm(db)[id] || { name: 'Удалённый предмет' }).name;
function lessonsFor(db, s) {
  if (db.ov[s]) return db.ov[s];
  const w = wdIso(s);
  if (w === 6 || (w === 5 && !db.settings.sixDay)) return [];
  return db.tt[w] || [];
}
function nextLessons(db, subj, from, n) {
  const out = [];
  for (let i = 1; i <= 42 && out.length < n; i++) { const s = addIso(from, i); if (lessonsFor(db, s).includes(subj)) out.push(s); }
  return out;
}
function prevLessons(db, subj, from, n) {
  const out = [];
  for (let i = 0; i <= 42 && out.length < n; i++) { const s = addIso(from, -i); if (lessonsFor(db, s).includes(subj)) out.push(s); }
  return out;
}
const kw = (db, g) => (g.kind === 'exam' ? db.settings.examWeight : 1);
function wavg(db, list) {
  let s = 0, w = 0;
  list.forEach((g) => { const k = kw(db, g); s += g.v * k; w += k; });
  return { s, w, a: w ? s / w : null };
}
const mean = (list) => (list.length ? list.reduce((t, g) => t + g.v, 0) / list.length : null);
const predOf = (a, th) => (a >= th - 1e-9 ? 5 : a >= th - 1 - 1e-9 ? 4 : a >= th - 2 - 1e-9 ? 3 : 2);
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const periodGrades = (db, t) => db.grades.filter((g) => g.date >= db.settings.periodStart && g.date <= t);
const bell = (db, i) => db.bells[i] || ['', ''];

function forecast(db, r) {
  const th = db.settings.th;
  const p = predOf(r.a, th);
  let n = 0, k = 0, hint;
  if (p < 5) {
    const T = th - (4 - p);
    n = Math.max(1, Math.ceil((T * r.w - r.s) / (5 - T) - 1e-9));
    hint = n === 1 ? 'До «' + (p + 1) + '» — одна пятёрка' : 'До «' + (p + 1) + '» — ' + pl(n, W_FIVE) + ' подряд';
  } else {
    k = Math.max(0, Math.floor((r.s - th * r.w) / (th - 4) + 1e-9));
    hint = k === 0 ? 'На грани: одна четвёрка — и уже «4»' : 'Запас: ' + pl(k, W_FOUR) + ' без потери «5»';
  }
  return { p, n, k, hint };
}

/* ================= иконки и логотип ================= */
const IC = {
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  book: '<path d="M5 3.5h12a2 2 0 0 1 2 2v15H7a2 2 0 0 1-2-2z"/><path d="M9 3.5v17M12 8.5h4M12 12h4"/>',
  pen: '<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/><path d="M13.5 7.5l3 3"/>',
  chart: '<path d="M3 20.5h18"/><path d="M6.5 17v-5M11.5 17V6M16.5 17v-8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  undo: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>',
  share: '<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5"/><path d="M5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12"/>',
  download: '<path d="M12 3v12M7.5 10.5L12 15l4.5-4.5"/><path d="M5 17v2.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  homeadd: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>'
};
function Icon({ n, s = 22, w = 1.9 }) {
  return html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${w}
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: IC[n] }}></svg>`;
}
let gid = 0;
function GMark({ h = 24, mono = false }) {
  const [id] = useState(() => 'gg' + (++gid));
  const w = Math.round((h * G_W) / G_H);
  return html`<svg class="gmark" viewBox=${G_VB} width=${w} height=${h} aria-hidden="true">
    ${!mono && html`<defs><linearGradient id=${id} x1="0.1" y1="1" x2="0.95" y2="0">
      <stop offset="0" stop-color="#00229A"/><stop offset="0.5" stop-color="#0070DC"/><stop offset="1" stop-color="#0BD6FF"/>
    </linearGradient></defs>`}
    <path d=${G_PATH} fill=${mono ? 'currentColor' : 'url(#' + id + ')'}/>
  </svg>`;
}
function Wordmark({ h = 24, mono = true }) {
  return html`<span class="brand" role="img" aria-label="Gen Diary">
    <${GMark} h=${h} mono=${mono}/><span class="wm-en" aria-hidden="true">en</span><span class="wm-diary" aria-hidden="true">Diary</span>
  </span>`;
}

/* ================= мелкие компоненты ================= */
const Mark = ({ v, exam, big }) => html`<span class=${'mark m' + v + (exam ? ' exam' : '') + (big ? ' big' : '')}
  aria-label=${'оценка ' + v + (exam ? ', контрольная' : '')}>${v}</span>`;

function Head({ over, title, action }) {
  return html`<header class="head">
    <div class="head-t"><p class="over">${over}</p><h1 class="h1">${title}</h1></div>
    ${action || null}
  </header>`;
}

function Seg({ items, value, onChange, label }) {
  return html`<div class="seg" role="group" aria-label=${label}>
    ${items.map((it) => html`<button type="button" class=${it[0] === value ? 'on' : ''} aria-pressed=${it[0] === value}
      onClick=${() => onChange(it[0])}>${it[1]}</button>`)}
  </div>`;
}

function Empty({ title, sub }) {
  return html`<div class="empty"><b>${title}</b>${sub && html`<span>${sub}</span>`}</div>`;
}

function Sheet({ title, sub, onClose, children }) {
  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, []);
  return html`<div class="sheet-wrap">
    <button type="button" class="sheet-bg" tabindex="-1" aria-label="Закрыть" onClick=${onClose}></button>
    <section class="sheet" role="dialog" aria-modal="true" aria-label=${title}>
      <span class="grab"></span>
      <div class="sheet-head">
        <div><h2>${title}</h2>${sub && html`<p>${sub}</p>`}</div>
        <button type="button" class="icon-btn round" aria-label="Закрыть" onClick=${onClose}><${Icon} n="x" s=${18}/></button>
      </div>
      ${children}
    </section>
  </div>`;
}

function SubjectChips({ db, value, onPick, label = 'Предмет' }) {
  return html`<fieldset class="field"><legend>${label}</legend>
    ${db.subjects.length === 0
      ? html`<p class="note">Сначала добавь предметы в настройках.</p>`
      : html`<div class="chips">${db.subjects.map((s) => html`<button type="button" class=${'chip' + (s.id === value ? ' on' : '')}
          aria-pressed=${s.id === value} onClick=${() => onPick(s.id)}>${s.name}</button>`)}</div>`}
  </fieldset>`;
}

function DateChoice({ label, options, value, onPick }) {
  const [custom, setCustom] = useState(() => !!value && !options.some((o) => o.iso === value));
  return html`<fieldset class="field"><legend>${label}</legend>
    <div class="datechips">
      ${options.map((o) => {
        const on = !custom && o.iso === value;
        return html`<button type="button" class=${'datechip' + (on ? ' on' : '')} aria-pressed=${on}
          onClick=${() => { setCustom(false); onPick(o.iso); }}><b>${shortDate(parse(o.iso))}</b><span>${o.sub}</span></button>`;
      })}
      <button type="button" class=${'datechip' + (custom ? ' on' : '')} aria-pressed=${custom}
        onClick=${() => setCustom(true)}><b>Другая</b><span>дата</span></button>
    </div>
    ${custom && html`<input class="input" type="date" aria-label=${label + ': другая дата'} value=${value || ''}
      onInput=${(e) => e.target.value && onPick(e.target.value)}/>`}
  </fieldset>`;
}

function ConfirmButton({ label, confirm, onConfirm, cls = 'btn btn-danger btn-block' }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  return html`<button type="button" class=${cls} onClick=${() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>
    ${armed ? confirm : label}</button>`;
}

/* ================= расписание ================= */
function ScheduleScreen({ c }) {
  const { db, ui, U, today } = c;
  const monKey = ui.mon || ui.sel.slice(0, 7);
  const away = ui.sel !== today || (ui.view === 'month' && monKey !== today.slice(0, 7));
  return html`<section class="screen">
    <${Head} over=${'Сегодня ' + longDate(parse(today)).toLowerCase()} title="Расписание"
      action=${away && html`<button type="button" class="btn btn-outline" onClick=${() => U({ sel: today, mon: today.slice(0, 7) })}>К сегодня</button>`}/>
    <${Hints} c=${c}/>
    <${Seg} label="Вид расписания" items=${[['day', 'День'], ['month', 'Месяц'], ['template', 'Шаблон']]} value=${ui.view}
      onChange=${(v) => U({ view: v, mon: ui.sel.slice(0, 7), edit: false })}/>
    ${ui.view === 'day' && html`<${DayView} c=${c}/>`}
    ${ui.view === 'month' && html`<${MonthView} c=${c}/>`}
    ${ui.view === 'template' && html`<${TemplateView} c=${c}/>`}
  </section>`;
}

function Hints({ c }) {
  const { db, mut } = c;
  const standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  const hide = (k) => mut((n) => { n.flags[k] = true; });
  return html`
    ${!standalone && !db.flags.hideInstall && html`<div class="hint">
      <${Icon} n="homeadd" s=${20}/>
      <p class="hint-t"><b>Поставь на экран «Домой».</b> В Safari нажми «Поделиться», затем «На экран „Домой“» — дневник откроется как приложение и будет работать без интернета.</p>
      <button type="button" class="icon-btn" aria-label="Скрыть подсказку" onClick=${() => hide('hideInstall')}><${Icon} n="x" s=${18}/></button>
    </div>`}
    ${db.sample && !db.flags.hideSample && html`<div class="hint">
      <${Icon} n="pen" s=${20}/>
      <p class="hint-t"><b>Это пример</b>, чтобы посмотреть, как всё работает. Когда будешь готов: шестерёнка сверху → «Начать с чистого листа».</p>
      <button type="button" class="icon-btn" aria-label="Скрыть подсказку" onClick=${() => hide('hideSample')}><${Icon} n="x" s=${18}/></button>
    </div>`}`;
}

function weekCaption(w) {
  if (w === 0) return 'эта неделя';
  if (w === 1) return 'следующая неделя';
  if (w === -1) return 'прошлая неделя';
  return w > 0 ? 'через ' + pl(w, W_WEEK) : pl(-w, W_WEEK) + ' назад';
}

function DayView({ c }) {
  const { db, ui, U, today, mut, setSheet } = c;
  const sel = ui.sel;
  const selD = parse(sel);
  const mon = mondayIso(sel);
  const monD = parse(mon), sunD = addDays(monD, 6);
  const week = Math.round(diff(mon, mondayIso(today)) / 7);
  const weekLabel = monD.getDate() + (monD.getMonth() !== sunD.getMonth() ? ' ' + MS[monD.getMonth()] : '') + ' – ' + sunD.getDate() + ' ' + MS[sunD.getMonth()];
  const list = lessonsFor(db, sel);
  const isOv = !!db.ov[sel];
  const d = diff(sel, today);
  const tag = d === 0 ? 'сегодня' : d === 1 ? 'завтра' : d === -1 ? 'вчера' : '';
  const pendingOn = (s) => db.hw.some((h) => !h.done && h.due === s);
  const setList = (arr) => mut((n) => { n.ov[sel] = arr; });

  return html`
    <div class="card weeknav">
      <button type="button" class="icon-btn" aria-label="Предыдущая неделя" onClick=${() => U({ sel: addIso(sel, -7) })}><${Icon} n="chevL"/></button>
      <div class="weeknav-mid"><b>${weekLabel}</b><span>${weekCaption(week)}</span></div>
      <button type="button" class="icon-btn" aria-label="Следующая неделя" onClick=${() => U({ sel: addIso(sel, 7) })}><${Icon} n="chevR"/></button>
    </div>
    <div class="daystrip">
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const s = addIso(mon, i), dd = parse(s), on = s === sel;
        const off = i === 6 || (i === 5 && !db.settings.sixDay);
        return html`<button type="button" class=${'daybtn' + (on ? ' on' : '') + (off ? ' off' : '')} aria-pressed=${on}
          aria-label=${longDate(dd) + (s === today ? ', сегодня' : '') + (pendingOn(s) ? ', есть домашка' : '')} onClick=${() => U({ sel: s })}>
          <span class="dn">${DN[i]}</span><span class="dd">${dd.getDate()}</span>
          <span class="dots">${s === today && html`<i class="dot dot-today"></i>`}${pendingOn(s) && html`<i class="dot dot-hw"></i>`}</span>
        </button>`;
      })}
    </div>
    <div class="dayhead">
      <div>
        <h2>${longDate(selD)}</h2>
        <div class="tags">
          <span class="muted">${list.length ? pl(list.length, W_LESSON) : 'нет уроков'}</span>
          ${tag && html`<span class="tag tag-red">${tag}</span>`}
          ${isOv && html`<span class="tag tag-blue">замена</span>`}
        </div>
      </div>
      <button type="button" class=${'btn ' + (ui.edit ? 'btn-primary' : 'btn-outline')} aria-pressed=${ui.edit}
        onClick=${() => U({ edit: !ui.edit })}>${ui.edit ? 'Готово' : 'Изменить'}</button>
    </div>
    ${!ui.edit && list.length > 0 && html`<ol class="lessons">
      ${list.map((sid, i) => html`<li key=${sid + i}><${LessonCard} c=${c} sid=${sid} i=${i} first=${list.indexOf(sid) === i}/></li>`)}
    </ol>`}
    ${!ui.edit && list.length === 0 && html`<${Empty} title=${wdIso(sel) === 6 ? 'Воскресенье — выходной' : 'Уроков нет'}
      sub="Нажми «Изменить», чтобы добавить уроки на этот день"/>`}
    ${ui.edit && html`<p class="note">Правки — только на ${dayMonth(selD)}. Постоянное расписание меняется в «Шаблоне».</p>
      <${EditList} c=${c} list=${list} setList=${setList} ctx=${{ scope: 'day', key: sel }}/>`}
    ${isOv && html`<button type="button" class="btn-link" onClick=${() => mut((n) => { delete n.ov[sel]; })}>
      <${Icon} n="undo" s=${18}/>Вернуть уроки из шаблона</button>`}`;
}

function LessonCard({ c, sid, i, first }) {
  const { db, ui, setSheet } = c;
  const sel = ui.sel;
  const s = sm(db)[sid] || { name: 'Удалённый предмет', room: '' };
  const hw = first ? db.hw.filter((h) => h.subj === sid && h.due === sel) : [];
  const gr = first ? db.grades.filter((g) => g.subj === sid && g.date === sel) : [];
  const allDone = hw.length > 0 && hw.every((h) => h.done);
  const b = bell(db, i);
  const room = s.room ? (/^\d/.test(s.room) ? 'каб. ' + s.room : s.room) : '';
  return html`<button type="button" class="lesson" onClick=${() => setSheet({ type: 'lesson', iso: sel, i, sid })}
    aria-label=${(i + 1) + ' урок, ' + s.name + (hw.length ? ', есть домашка' : '') + (gr.length ? ', есть оценки' : '')}>
    <span class="lesson-n"><b>${i + 1}</b><span>${b[0]}</span><span>${b[1]}</span></span>
    <span class="lesson-b">
      <span class="lesson-top">
        <span class="lesson-name"><b>${s.name}</b>${room && html`<span>${room}</span>`}</span>
        ${gr.length > 0 && html`<span class="marks">${gr.map((g) => html`<${Mark} key=${g.id} v=${g.v} exam=${g.kind === 'exam'}/>`)}</span>`}
      </span>
      ${hw.length > 0 && html`<span class=${'hwbox' + (allDone ? ' done' : '')}>
        <${Icon} n=${allDone ? 'check' : 'book'} s=${16} w=${2}/>
        <span class="t">${hw.map((h) => h.text).join(' · ')}</span>
      </span>`}
    </span>
  </button>`;
}

function EditList({ c, list, setList, ctx }) {
  const { db, setSheet } = c;
  return html`<div class="edit-list">
    ${list.map((sid, i) => {
      const name = sname(db, sid);
      return html`<div class="edit-row" key=${sid + i}>
        <span class="n">${i + 1}</span>
        <button type="button" class="pick" aria-label=${'Урок ' + (i + 1) + ', ' + name + '. Сменить предмет'}
          onClick=${() => setSheet({ type: 'pick', scope: ctx.scope, key: ctx.key, idx: i })}><b>${name}</b><span>Сменить</span></button>
        <button type="button" class="icon-btn" disabled=${i === 0} aria-label=${'Поднять урок ' + (i + 1) + ' выше'}
          onClick=${() => { const a = list.slice(); const t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; setList(a); }}><${Icon} n="up" s=${20}/></button>
        <button type="button" class="icon-btn danger" aria-label=${'Удалить урок ' + (i + 1) + ', ' + name}
          onClick=${() => { const a = list.slice(); a.splice(i, 1); setList(a); }}><${Icon} n="trash" s=${20}/></button>
      </div>`;
    })}
    ${list.length < 8 && html`<button type="button" class="add-row" onClick=${() => setSheet({ type: 'pick', scope: ctx.scope, key: ctx.key, idx: -1 })}>
      <${Icon} n="plus" s=${18} w=${2.2}/>Добавить урок</button>`}
  </div>`;
}

function MonthView({ c }) {
  const { db, ui, U, today } = c;
  const sel = ui.sel;
  const monKey = ui.mon || sel.slice(0, 7);
  const yy = +monKey.slice(0, 4), mm = +monKey.slice(5, 7) - 1;
  const first = new Date(yy, mm, 1);
  const dim = new Date(yy, mm + 1, 0).getDate();
  const lead = wd(first);
  const n = Math.ceil((lead + dim) / 7) * 7;
  const pend = {}, grd = {};
  db.hw.forEach((h) => { if (!h.done) pend[h.due] = 1; });
  db.grades.forEach((g) => { grd[g.date] = 1; });
  const shift = (k) => iso(new Date(yy, mm + k, 1)).slice(0, 7);
  const cells = [];
  for (let i = 0; i < n; i++) {
    const dd = addDays(first, i - lead);
    if (dd.getMonth() !== mm) { cells.push(html`<span key=${'e' + i}></span>`); continue; }
    const s = iso(dd), on = s === sel, isT = s === today;
    cells.push(html`<button type="button" key=${s} class=${'cal-day' + (on ? ' on' : '') + (isT ? ' today' : '') + (wd(dd) === 6 ? ' sun' : '')}
      aria-pressed=${on} aria-label=${longDate(dd) + (isT ? ', сегодня' : '') + (pend[s] ? ', есть домашка' : '') + (grd[s] ? ', есть оценки' : '')}
      onClick=${() => U({ sel: s })}>
      <b>${dd.getDate()}</b>
      <span class="cal-dots">${pend[s] && html`<i class="i-hw"></i>`}${grd[s] && html`<i class="i-gr"></i>`}</span>
    </button>`);
  }
  const selD = parse(sel);
  const list = lessonsFor(db, sel);
  const hw = db.hw.filter((h) => h.due === sel);
  const gr = db.grades.filter((g) => g.date === sel);
  const parts = [list.length ? pl(list.length, W_LESSON) : 'выходной'];
  if (hw.length) parts.push(pl(hw.length, W_TASK));
  if (gr.length) parts.push(pl(gr.length, W_GRADE));
  if (db.ov[sel]) parts.push('замена');
  return html`
    <div class="card cal">
      <div class="cal-head">
        <button type="button" class="icon-btn" aria-label="Предыдущий месяц" onClick=${() => U({ mon: shift(-1) })}><${Icon} n="chevL"/></button>
        <h2>${MN[mm] + ' ' + yy}</h2>
        <button type="button" class="icon-btn" aria-label="Следующий месяц" onClick=${() => U({ mon: shift(1) })}><${Icon} n="chevR"/></button>
      </div>
      <div class="cal-grid">${DN.map((x) => html`<span class="cal-wd">${x}</span>`)}</div>
      <div class="cal-grid">${cells}</div>
      <div class="legend">
        <span><i class="i-hw"></i>домашка к этому дню</span>
        <span><i class="i-gr"></i>оценки</span>
        <span><i class="sq"></i>сегодня</span>
      </div>
    </div>
    <div class="card agenda">
      <div class="agenda-top">
        <div><h2>${longDate(selD)}</h2><p class="small muted">${parts.join(' · ')}</p></div>
        <button type="button" class="btn btn-primary" onClick=${() => U({ view: 'day' })}>Открыть день</button>
      </div>
      ${list.length > 0 && html`<ol class="ag-lessons">${list.map((sid, i) => html`<li key=${sid + i}><i>${i + 1}</i><span>${sname(db, sid)}</span></li>`)}</ol>`}
      ${hw.length > 0 && html`<div class="agenda-sec"><span>Задано к этому дню</span>
        ${hw.map((h) => html`<div key=${h.id} class=${'hw-item' + (h.done ? ' done' : '')} style="border:0;padding:0">
          <div class="hw-body" style="padding:2px 0;min-height:0"><b>${sname(db, h.subj)}</b><span>${h.text}</span></div></div>`)}
      </div>`}
      ${gr.length > 0 && html`<div class="agenda-sec"><span>Оценки за день</span>
        <div class="chips">${gr.map((g) => html`<span key=${g.id} style="display:inline-flex;align-items:center;gap:8px;font-size:14px">
          <${Mark} v=${g.v} exam=${g.kind === 'exam'}/>${sname(db, g.subj)}</span>`)}</div>
      </div>`}
    </div>`;
}

function TemplateView({ c }) {
  const { db, ui, U, today, mut } = c;
  const days = db.settings.sixDay ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4];
  const ovs = Object.keys(db.ov).filter((s) => s >= today).sort();
  return html`
    <p class="note">Типовая неделя. Из неё строится расписание на любую дату. Разовые замены делаются в режиме «День» и шаблон не трогают.</p>
    ${ovs.length > 0 && html`<div class="card card-pad" style="gap:4px;padding-right:8px">
      <div class="card-title"><h2>Ближайшие замены</h2></div>
      ${ovs.map((s) => {
        const d = parse(s);
        const base = wd(d) < 6 ? db.tt[wd(d)] || [] : [];
        const cur = db.ov[s];
        const rem = base.filter((x) => !cur.includes(x)).map((x) => sname(db, x));
        const add = cur.filter((x) => !base.includes(x)).map((x) => sname(db, x));
        const parts = [];
        if (rem.length) parts.push('без: ' + rem.join(', '));
        if (add.length) parts.push('добавлено: ' + add.join(', '));
        return html`<div class="ov-row" key=${s}>
          <div class="t"><b>${longDate(d)}</b><span>${parts.length ? parts.join(' · ') : 'другой порядок уроков'}</span></div>
          <button type="button" class="btn btn-soft" style="min-height:40px;padding:0 12px" onClick=${() => U({ view: 'day', sel: s, edit: false })}>Открыть</button>
          <button type="button" class="icon-btn muted" aria-label=${'Вернуть шаблон на ' + dayMonth(d)}
            onClick=${() => mut((n) => { delete n.ov[s]; })}><${Icon} n="undo" s=${19}/></button>
        </div>`;
      })}
    </div>`}
    ${days.map((d) => {
      const list = db.tt[d] || [];
      const editing = ui.tplEdit === d;
      const setList = (arr) => mut((n) => { n.tt[d] = arr; });
      const end = list.length ? bell(db, list.length - 1)[1] : '';
      return html`<div class="card tpl-card" key=${d}>
        <div class="tpl-head">
          <div><h2>${DL[d]}</h2><span>${list.length ? pl(list.length, W_LESSON) + (end ? ', до ' + end : '') : 'нет уроков'}</span></div>
          <button type="button" class=${'btn ' + (editing ? 'btn-primary' : 'btn-outline')} style="min-height:40px"
            aria-label=${(editing ? 'Готово: ' : 'Изменить шаблон: ') + DL[d].toLowerCase()}
            onClick=${() => U({ tplEdit: editing ? -1 : d })}>${editing ? 'Готово' : 'Изменить'}</button>
        </div>
        ${!editing && list.length > 0 && html`<ol class="tpl-list">${list.map((sid, i) => html`<li key=${sid + i}>
          <i>${i + 1}</i><span>${sname(db, sid)}</span><em>${bell(db, i)[0]}</em></li>`)}</ol>`}
        ${!editing && list.length === 0 && html`<p class="note" style="padding:0 16px 12px">Выходной — уроков нет</p>`}
        ${editing && html`<div class="tpl-edit"><${EditList} c=${c} list=${list} setList=${setList} ctx=${{ scope: 'tpl', key: d }}/></div>`}
      </div>`;
    })}`;
}

/* ================= домашка ================= */
function HwScreen({ c }) {
  const { db, ui, U, today, mut, setSheet, flash } = c;
  const pending = db.hw.filter((h) => !h.done).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  const done = db.hw.filter((h) => h.done).sort((a, b) => (a.due < b.due ? 1 : a.due > b.due ? -1 : 0));
  const groups = [];
  const late = pending.filter((h) => h.due < today);
  if (late.length) groups.push({ key: 'late', title: 'Просрочено', rel: pl(late.length, W_TASK), hot: true, items: late });
  pending.filter((h) => h.due >= today).forEach((h) => {
    let g = groups.find((x) => x.key === h.due);
    if (!g) { const n = diff(h.due, today); g = { key: h.due, title: longDate(parse(h.due)), rel: relFuture(n), hot: n <= 1, items: [] }; groups.push(g); }
    g.items.push(h);
  });
  const toggle = (h) => mut((n) => { const x = n.hw.find((y) => y.id === h.id); if (x) x.done = !x.done; });
  const remove = (h) => {
    mut((n) => { n.hw = n.hw.filter((y) => y.id !== h.id); });
    flash('Задание удалено', { label: 'Вернуть', fn: () => mut((n) => { n.hw.push(h); }) });
  };
  const Item = (h) => html`<li key=${h.id} class=${'hw-item' + (h.done ? ' done' : '')}>
    <button type="button" class=${'check' + (h.done ? ' on' : '')} aria-pressed=${h.done}
      aria-label=${(h.done ? 'Снять отметку: ' : 'Отметить сделанным: ') + sname(db, h.subj)} onClick=${() => toggle(h)}>
      <i>${h.done && html`<${Icon} n="check" s=${14} w=${3}/>`}</i>
    </button>
    <button type="button" class="hw-body" onClick=${() => setSheet({ type: 'hw', id: h.id })}>
      <b>${sname(db, h.subj)}${h.done ? ' · ' + shortDate(parse(h.due)) : ''}</b><span>${h.text}</span>
    </button>
    ${h.done && html`<button type="button" class="icon-btn muted" aria-label=${'Удалить задание: ' + sname(db, h.subj)} onClick=${() => remove(h)}>
      <${Icon} n="trash" s=${18}/></button>`}
  </li>`;
  return html`<section class="screen">
    <${Head} over=${pending.length ? 'Осталось ' + pl(pending.length, W_TASK) : 'Всё сделано'} title="Домашка"
      action=${html`<button type="button" class="btn btn-primary" onClick=${() => setSheet({ type: 'hw' })}><${Icon} n="plus" s=${18} w=${2.2}/>Добавить</button>`}/>
    ${pending.length === 0 && html`<${Empty} title="Всё сделано" sub="Новое задание — кнопка «Добавить»"/>`}
    ${groups.map((g) => html`<div class="hw-group" key=${g.key}>
      <div class="hw-gh"><h2>${g.title}</h2><span class=${g.hot ? 'hot' : ''}>${g.rel}</span></div>
      <ul class="card hw-list">${g.items.map(Item)}</ul>
    </div>`)}
    ${done.length > 0 && html`<button type="button" class="fold" aria-expanded=${ui.showDone} onClick=${() => U({ showDone: !ui.showDone })}>
      <span>Сделано · ${done.length}</span><span class=${'chev' + (ui.showDone ? ' open' : '')}><${Icon} n="chevD" s=${20}/></span>
    </button>`}
    ${ui.showDone && done.length > 0 && html`<ul class="card hw-list">${done.map(Item)}</ul>`}
  </section>`;
}

function HwSheet({ c, init }) {
  const { db, mut, today, setSheet, flash } = c;
  const orig = init.id ? db.hw.find((h) => h.id === init.id) : null;
  const [subj, setSubj] = useState(orig ? orig.subj : init.subj || (db.subjects[0] || {}).id);
  const [text, setText] = useState(orig ? orig.text : '');
  const [due, setDue] = useState(orig ? orig.due : null);
  const from = init.from || today;
  const opts = nextLessons(db, subj, from, 3);
  const dueVal = due || opts[0] || null;
  const ok = !!(subj && text.trim() && dueVal);
  const save = () => {
    if (!ok) return;
    mut((n) => {
      if (orig) { const h = n.hw.find((x) => x.id === orig.id); if (h) { h.subj = subj; h.text = text.trim(); h.due = dueVal; } }
      else n.hw.push({ id: uid('h'), subj, text: text.trim(), due: dueVal, done: false });
    });
    setSheet(null);
    flash(orig ? 'Задание сохранено' : 'Задание добавлено на ' + shortDate(parse(dueVal)).toLowerCase());
  };
  const del = () => {
    mut((n) => { n.hw = n.hw.filter((x) => x.id !== orig.id); });
    setSheet(null);
    flash('Задание удалено', { label: 'Вернуть', fn: () => mut((n) => { n.hw.push(orig); }) });
  };
  return html`<${Sheet} title=${orig ? 'Задание' : 'Новое задание'} onClose=${() => setSheet(null)}>
    <${SubjectChips} db=${db} value=${subj} onPick=${(id) => { setSubj(id); setDue(null); }}/>
    <div class="field">
      <label for="hw-text">Что задали</label>
      <textarea id="hw-text" class="input" rows="3" placeholder="Например: № 9.21–9.25" value=${text} onInput=${(e) => setText(e.target.value)}></textarea>
    </div>
    ${opts.length === 0 && html`<p class="warnline">Этого предмета нет в расписании на ближайшие 6 недель — выбери дату вручную.</p>`}
    <${DateChoice} key=${subj} label="К какому дню" value=${dueVal}
      options=${opts.map((s, j) => ({ iso: s, sub: j === 0 ? 'след. урок' : relFuture(diff(s, today)) }))} onPick=${setDue}/>
    <div class="sheet-actions">
      <button type="button" class="btn btn-primary btn-block" disabled=${!ok} onClick=${save}>${orig ? 'Сохранить' : 'Добавить задание'}</button>
      ${orig && html`<button type="button" class="btn btn-danger btn-block" onClick=${del}>Удалить задание</button>`}
    </div>
  <//>`;
}

/* ================= оценки ================= */
function GradesScreen({ c }) {
  const { db, ui, U, today, mut, setSheet, flash } = c;
  const G = periodGrades(db, today);
  const by = {};
  G.forEach((g) => { (by[g.subj] = by[g.subj] || []).push(g); });
  const remove = (g) => {
    mut((n) => { n.grades = n.grades.filter((x) => x.id !== g.id); });
    flash('Оценка удалена', { label: 'Вернуть', fn: () => mut((n) => { n.grades.push(g); }) });
  };
  const ew = db.settings.examWeight;
  return html`<section class="screen">
    <${Head} over=${'С ' + dayMonth(parse(db.settings.periodStart)) + ' · ' + pl(G.length, W_GRADE)} title="Оценки"
      action=${html`<button type="button" class="btn btn-primary" onClick=${() => setSheet({ type: 'grade' })}><${Icon} n="plus" s=${18} w=${2.2}/>Оценка</button>`}/>
    <p class="note">${ew > 1 ? 'Контрольные — в рамке, в среднем считаются ×' + ew + '. ' : ''}Нажми на предмет, чтобы открыть все оценки.</p>
    ${db.subjects.length === 0 && html`<${Empty} title="Нет предметов" sub="Добавь их в настройках — шестерёнка сверху"/>`}
    <ul class="subj-list">
      ${db.subjects.map((s) => {
        const list = (by[s.id] || []).slice().sort(byDate);
        const r = wavg(db, list);
        const open = ui.openSubj === s.id;
        return html`<li class="card subj" key=${s.id}>
          <button type="button" class="subj-btn" aria-expanded=${open} onClick=${() => U({ openSubj: open ? null : s.id })}>
            <span class="subj-main"><b>${s.name}</b>
              ${list.length
                ? html`<span class="marks">${list.map((g) => html`<${Mark} key=${g.id} v=${g.v} exam=${g.kind === 'exam'}/>`)}</span>`
                : html`<span class="small muted">пока нет оценок</span>`}
            </span>
            <span class="subj-avg"><b>${r.a === null ? '—' : num(r.a, 2)}</b><span>средний</span></span>
            <span class=${'chev' + (open ? ' open' : '')}><${Icon} n="chevD" s=${18}/></span>
          </button>
          ${open && html`<div class="subj-det">
            ${list.slice().reverse().map((g) => html`<div class="gr-row" key=${g.id}>
              <${Mark} v=${g.v} exam=${g.kind === 'exam'} big/>
              <div class="t"><b>${(KIND[g.kind] || KINDS[0]).label}</b><span>${shortDate(parse(g.date)) + (kw(db, g) > 1 ? ' · вес ×' + kw(db, g) : '')}</span></div>
              <button type="button" class="icon-btn muted" aria-label=${'Удалить оценку ' + g.v} onClick=${() => remove(g)}><${Icon} n="trash" s=${18}/></button>
            </div>`)}
            <button type="button" class="btn-link" onClick=${() => setSheet({ type: 'grade', subj: s.id })}><${Icon} n="plus" s=${16} w=${2.2}/>Оценка по предмету</button>
          </div>`}
        </li>`;
      })}
    </ul>
  </section>`;
}

function GradeSheet({ c, init }) {
  const { db, mut, today, setSheet, flash, U } = c;
  const [v, setV] = useState(init.v || 5);
  const [subj, setSubj] = useState(init.subj || (db.subjects[0] || {}).id);
  const [kind, setKind] = useState('answer');
  const [date, setDate] = useState(init.date || null);
  const opts = prevLessons(db, subj, today, 3);
  const dateVal = date || opts[0] || today;
  const save = () => {
    if (!subj) return;
    mut((n) => { n.grades.push({ id: uid('g'), subj, v, kind, date: dateVal }); });
    setSheet(null);
    U({ openSubj: subj });
    flash('«' + v + '» — ' + sname(db, subj) + '. Метрики пересчитаны');
  };
  return html`<${Sheet} title="Новая оценка" onClose=${() => setSheet(null)}>
    <fieldset class="field"><legend>Оценка</legend>
      <div class="vals">${[5, 4, 3, 2].map((x) => html`<button type="button" class=${'val m' + x + (x === v ? ' on' : '')} aria-pressed=${x === v}
        aria-label=${'Оценка ' + x} onClick=${() => setV(x)}>${x}</button>`)}</div>
    </fieldset>
    <${SubjectChips} db=${db} value=${subj} onPick=${(id) => { setSubj(id); setDate(null); }}/>
    <fieldset class="field"><legend>За что</legend>
      <div class="chips">${KINDS.map((k) => html`<button type="button" class=${'chip' + (k.id === kind ? ' on' : '')} aria-pressed=${k.id === kind}
        onClick=${() => setKind(k.id)}>${k.short}${k.id === 'exam' && db.settings.examWeight > 1 ? ' ×' + db.settings.examWeight : ''}</button>`)}</div>
    </fieldset>
    <${DateChoice} key=${subj} label="Урок" value=${dateVal}
      options=${opts.map((s) => ({ iso: s, sub: relPast(-diff(s, today)) }))} onPick=${setDate}/>
    ${dateVal < db.settings.periodStart && html`<p class="warnline">Эта дата раньше начала четверти (${dayMonth(parse(db.settings.periodStart))}) — оценка не попадёт в метрики.</p>`}
    <button type="button" class="btn btn-primary btn-block" disabled=${!subj} onClick=${save}>Сохранить оценку</button>
  <//>`;
}

/* ================= шторки расписания ================= */
function PickSheet({ c, init }) {
  const { db, mut, setSheet } = c;
  const list = init.scope === 'tpl' ? db.tt[init.key] || [] : lessonsFor(db, init.key);
  const cur = init.idx >= 0 ? list[init.idx] : null;
  const pick = (id) => {
    const a = list.slice();
    if (init.idx >= 0 && init.idx < a.length) a[init.idx] = id; else a.push(id);
    mut((n) => { if (init.scope === 'tpl') n.tt[init.key] = a; else n.ov[init.key] = a; });
    setSheet(null);
  };
  const sub = init.scope === 'tpl' ? 'Шаблон · ' + DL[init.key].toLowerCase() + ', все недели' : 'Только на ' + dayMonth(parse(init.key));
  return html`<${Sheet} title=${init.idx >= 0 ? 'Урок ' + (init.idx + 1) : 'Новый урок'} sub=${sub} onClose=${() => setSheet(null)}>
    <${SubjectChips} db=${db} value=${cur} onPick=${pick} label="Выбери предмет"/>
  <//>`;
}

function LessonSheet({ c, init }) {
  const { db, mut, today, setSheet } = c;
  const s = sm(db)[init.sid] || { name: 'Удалённый предмет', room: '' };
  const b = bell(db, init.i);
  const hw = db.hw.filter((h) => h.subj === init.sid && h.due === init.iso);
  const gr = db.grades.filter((g) => g.subj === init.sid && g.date === init.iso);
  const toggle = (h) => mut((n) => { const x = n.hw.find((y) => y.id === h.id); if (x) x.done = !x.done; });
  const sub = (init.i + 1) + ' урок · ' + b[0] + '–' + b[1] + (s.room ? ' · ' + (/^\d/.test(s.room) ? 'каб. ' + s.room : s.room) : '') + ' · ' + shortDate(parse(init.iso)).toLowerCase();
  return html`<${Sheet} title=${s.name} sub=${sub} onClose=${() => setSheet(null)}>
    <div class="field"><span class="lbl" style="margin:0">Домашка к этому уроку</span>
      ${hw.length === 0 ? html`<p class="note" style="padding:0">Ничего не задано.</p>` : html`<ul class="card hw-list">
        ${hw.map((h) => html`<li key=${h.id} class=${'hw-item' + (h.done ? ' done' : '')}>
          <button type="button" class=${'check' + (h.done ? ' on' : '')} aria-pressed=${h.done} aria-label=${h.done ? 'Снять отметку' : 'Отметить сделанным'} onClick=${() => toggle(h)}>
            <i>${h.done && html`<${Icon} n="check" s=${14} w=${3}/>`}</i></button>
          <button type="button" class="hw-body" onClick=${() => setSheet({ type: 'hw', id: h.id })}><span>${h.text}</span></button>
        </li>`)}
      </ul>`}
    </div>
    ${gr.length > 0 && html`<div class="field"><span class="lbl" style="margin:0">Оценки за урок</span>
      <div class="marks">${gr.map((g) => html`<${Mark} key=${g.id} v=${g.v} exam=${g.kind === 'exam'} big/>`)}</div></div>`}
    <div class="sheet-actions">
      <button type="button" class="btn btn-primary btn-block" onClick=${() => setSheet({ type: 'hw', subj: init.sid, from: init.iso })}>
        <${Icon} n="book" s=${18}/>Задать домашку к следующему уроку</button>
      <button type="button" class="btn btn-soft btn-block" onClick=${() => setSheet({ type: 'grade', subj: init.sid, date: init.iso <= today ? init.iso : null })}>
        <${Icon} n="pen" s=${18}/>Поставить оценку</button>
    </div>
  <//>`;
}

/* ================= метрики ================= */
function StatsScreen({ c }) {
  const { db, ui, U, today } = c;
  const all = periodGrades(db, today);
  const withGr = db.subjects.filter((s) => all.some((g) => g.subj === s.id));
  const subj = ui.statsSubj && withGr.some((s) => s.id === ui.statsSubj) ? ui.statsSubj : null;
  const G = subj ? all.filter((g) => g.subj === subj) : all;
  const scope = subj ? sname(db, subj).toLowerCase() : 'все предметы';
  return html`<section class="screen">
    <${Head} over=${'С ' + dayMonth(parse(db.settings.periodStart)) + ' · ' + pl(G.length, W_GRADE)} title="Метрики"/>
    <${Seg} label="Раздел метрик" items=${[['overview', 'Обзор'], ['subjects', 'Предметы'], ['details', 'Разбор']]} value=${ui.statsView}
      onChange=${(v) => U({ statsView: v })}/>
    ${ui.statsView !== 'subjects' && withGr.length > 0 && html`<div class="chips-scroll" role="group" aria-label="Предмет">
      ${[{ id: null, name: 'Все' }].concat(withGr).map((s) => html`<button type="button" key=${s.id || 'all'} class=${'chip' + (s.id === subj ? ' on' : '')}
        aria-pressed=${s.id === subj} onClick=${() => U({ statsSubj: s.id })}>${s.name}</button>`)}
    </div>`}
    ${all.length === 0
      ? html`<${Empty} title="Пока нет оценок" sub="Добавь первую оценку во вкладке «Оценки» — здесь появятся графики"/>`
      : ui.statsView === 'overview' ? html`<${Overview} c=${c} G=${G} all=${all} subj=${subj} scope=${scope}/>`
      : ui.statsView === 'subjects' ? html`<${SubjectsStats} c=${c} all=${all}/>`
      : html`<${Details} c=${c} G=${G}/>`}
  </section>`;
}

function TrendChart({ db, G, today }) {
  const Gs = G.slice().sort(byDate);
  const runs = [];
  let s = 0, w = 0;
  const dates = [];
  Gs.forEach((g) => { if (!dates.includes(g.date)) dates.push(g.date); });
  dates.forEach((d) => {
    Gs.filter((g) => g.date === d).forEach((g) => { const k = kw(db, g); s += g.v * k; w += k; });
    runs.push({ d, a: s / w });
  });
  if (!runs.length) return null;
  const start = db.settings.periodStart < runs[0].d ? db.settings.periodStart : runs[0].d;
  const span = Math.max(1, diff(today, start));
  const CW = 312, CT = 12, CB = 112;
  const minA = Math.min.apply(null, runs.map((r) => r.a));
  const lo = minA < 3 ? Math.max(2, Math.floor(minA * 2) / 2) : 3;
  const y = (a) => CT + ((5 - a) / (5 - lo)) * (CB - CT);
  const x = (d) => Math.max(0, Math.min(CW, (diff(d, start) / span) * CW));
  const P = runs.map((r) => [x(r.d), y(r.a)]);
  P.push([CW, P[P.length - 1][1]]);
  const f = (n) => n.toFixed(1);
  const pts = P.map((p) => f(p[0]) + ',' + f(p[1])).join(' ');
  const area = 'M' + f(P[0][0]) + ',' + CB + ' L' + P.map((p) => f(p[0]) + ',' + f(p[1])).join(' L') + ' L' + f(P[P.length - 1][0]) + ',' + CB + ' Z';
  const th = db.settings.th;
  const midD = addIso(start, Math.round(span / 2));
  const lab = (d) => parse(d).getDate() + ' ' + MS[parse(d).getMonth()];
  const guides = [[th, '«5»'], [th - 1, '«4»']].filter((g) => g[0] > lo && g[0] < 5);
  return html`<svg viewBox="0 0 320 134" role="img" aria-label=${'Средний балл менялся с ' + num(runs[0].a, 2) + ' до ' + num(runs[runs.length - 1].a, 2)}>
    <path d=${area} fill="rgba(255,255,255,0.10)"/>
    ${guides.map((g) => html`<line x1="0" x2="320" y1=${f(y(g[0]))} y2=${f(y(g[0]))} stroke="rgba(255,255,255,0.42)" stroke-width="1" stroke-dasharray="3 4"/>
      <text x="318" y=${f(y(g[0]) - 5)} font-size="10" text-anchor="end" fill="rgba(255,255,255,0.8)">${num(g[0], 1) + ' → ' + g[1]}</text>`)}
    <polyline points=${pts} fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx=${f(P[P.length - 1][0])} cy=${f(P[P.length - 1][1])} r="4.5" fill="#FFFFFF"/>
    <text x="0" y="131" font-size="10" fill="rgba(255,255,255,0.75)">${lab(start)}</text>
    <text x=${f(x(midD))} y="131" font-size="10" text-anchor="middle" fill="rgba(255,255,255,0.75)">${lab(midD)}</text>
    <text x="320" y="131" font-size="10" text-anchor="end" fill="rgba(255,255,255,0.75)">${lab(today)}</text>
  </svg>`;
}

function Overview({ c, G, all, subj, scope }) {
  const { db, mut, today } = c;
  const week0 = mondayIso(today);
  const A = wavg(db, G), P = wavg(db, G.filter((g) => g.date < week0));
  const delta = A.a !== null && P.a !== null ? A.a - P.a : 0;
  const Gs = G.slice().sort(byDate);
  let streak = 0;
  for (let i = Gs.length - 1; i >= 0 && Gs[i].v >= 4; i--) streak++;
  const fives = G.filter((g) => g.v === 5).length;
  const exams = G.filter((g) => g.kind === 'exam');
  const ea = mean(exams);
  const weekNew = G.filter((g) => g.date >= week0).length;
  const th = db.settings.th;
  const goal = db.goal;
  let msg = 'Пока нет оценок', ok = false;
  if (A.a !== null) {
    if (A.a >= goal - 1e-9) {
      ok = true;
      if (goal > 4) {
        const k = Math.max(0, Math.floor((A.s - goal * A.w) / (goal - 4) + 1e-9));
        msg = k === 0 ? 'Цель достигнута, но впритык: одна четвёрка опустит ниже' : 'Цель достигнута. Запас — ' + pl(k, W_FOUR);
      } else msg = 'Цель достигнута, четвёрки её не опустят';
    } else {
      const n = Math.max(1, Math.ceil((goal * A.w - A.s) / (5 - goal) - 1e-9));
      msg = 'Не хватает ' + num(goal - A.a, 2) + ' — это ' + pl(n, W_FIVE) + ' подряд';
    }
  }
  const setGoal = (g) => mut((n) => { n.goal = Math.round(Math.min(4.9, Math.max(3, g)) * 10) / 10; });
  // главное — только по всем предметам
  const ins = [];
  if (!subj) {
    const by = {};
    all.forEach((g) => { (by[g.subj] = by[g.subj] || []).push(g); });
    const fc = Object.keys(by).map((id) => { const r = wavg(db, by[id]); return Object.assign({ id, a: r.a }, forecast(db, r)); }).sort((a, b) => a.a - b.a);
    fc.filter((f) => f.p <= 3).forEach((f) => ins.push({ s: sname(db, f.id), dot: 'var(--danger)',
      t: 'прогноз «' + f.p + '». ' + (f.n === 1 ? 'Одна пятёрка — и будет «' + (f.p + 1) + '»' : pl(f.n, W_FIVE) + ' подряд — и будет «' + (f.p + 1) + '»') }));
    fc.filter((f) => f.p === 4 && f.n <= 2).forEach((f) => ins.push({ s: sname(db, f.id), dot: 'var(--brand)',
      t: f.n === 1 ? 'одна пятёрка до «5» за четверть' : 'две пятёрки подряд до «5» за четверть' }));
    fc.filter((f) => f.p === 5 && f.k === 0).forEach((f) => ins.push({ s: sname(db, f.id), dot: 'var(--ink)', t: '«5» на грани — любая четвёрка её опустит' }));
  }
  const tiles = [
    { k: 'Оценок', v: String(G.length), s: weekNew ? '+' + weekNew + ' на этой неделе' : 'на этой неделе пока нет' },
    { k: 'Доля пятёрок', v: (G.length ? Math.round((fives / G.length) * 100) : 0) + '%', s: fives + ' из ' + G.length },
    { k: 'Серия без троек', v: String(streak), cls: streak >= 5 ? 'good' : '', s: streak === 1 ? 'последняя оценка — 4 или 5' : streak ? 'последние ' + pl(streak, W_GRADE) + ' — только 4 и 5' : 'последняя оценка ниже 4' },
    { k: 'Контрольные', v: ea === null ? '—' : num(ea, 2), cls: ea !== null && ea < th - 1 ? 'bad' : '', s: exams.length ? pl(exams.length, ['работа', 'работы', 'работ']) + ' за четверть' : 'пока не было' }
  ];
  return html`
    <div class="hero">
      <div class="hero-top">
        <div class="l"><span>Средний балл · ${scope}</span><b class="hero-num">${A.a === null ? '—' : num(A.a, 2)}</b></div>
        <span class="pill-dark">${Math.abs(delta) < 0.005 ? 'без изменений за неделю' : (delta > 0 ? '+' : '−') + num(Math.abs(delta), 2) + ' за неделю'}</span>
      </div>
      <${TrendChart} db=${db} G=${G} today=${today}/>
      <span class="cap">Как менялся средний балл с начала четверти</span>
    </div>
    <div class="tiles">${tiles.map((t) => html`<div class="card tile" key=${t.k}><span class="k">${t.k}</span><b class=${'v ' + (t.cls || '')}>${t.v}</b><span class="s">${t.s}</span></div>`)}</div>
    <div class="card card-pad">
      <div class="goal-row">
        <div><h2 class="h2">Цель на четверть</h2><p class="small muted">средний балл · ${scope}</p></div>
        <div class="stepper">
          <button type="button" class="icon-btn" aria-label="Уменьшить цель" onClick=${() => setGoal(goal - 0.1)}><${Icon} n="minus" s=${16} w=${2.4}/></button>
          <b aria-live="polite">${num(goal, 2)}</b>
          <button type="button" class="icon-btn" aria-label="Увеличить цель" onClick=${() => setGoal(goal + 0.1)}><${Icon} n="plus" s=${16} w=${2.4}/></button>
        </div>
      </div>
      <div class="meter" aria-hidden="true">
        <span class="fill" style=${{ width: A.a === null ? '0%' : Math.max(2, ((A.a - 2) / 3) * 100).toFixed(1) + '%', background: ok ? 'var(--brand)' : 'var(--danger)' }}></span>
        <span class="tick" style=${{ left: (((goal - 2) / 3) * 100).toFixed(1) + '%' }}></span>
      </div>
      <div class="meter-cap"><span>2</span><span>сейчас ${A.a === null ? '—' : num(A.a, 2)} · метка — цель</span><span>5</span></div>
      <p class=${'msg' + (ok ? '' : ' bad')}>${msg}</p>
    </div>
    ${ins.length > 0 && html`<div class="card card-pad" style="gap:10px">
      <div class="card-title"><h2>Главное</h2></div>
      ${ins.slice(0, 4).map((x) => html`<p class="ins"><i style=${{ background: x.dot }}></i><span><b>${x.s}</b> — ${x.t}</span></p>`)}
    </div>`}`;
}

function SubjectsStats({ c, all }) {
  const { db } = c;
  const th = db.settings.th;
  const by = {};
  all.forEach((g) => { (by[g.subj] = by[g.subj] || []).push(g); });
  const fc = Object.keys(by).map((id) => { const r = wavg(db, by[id]); return Object.assign({ id, a: r.a }, forecast(db, r)); }).sort((a, b) => a.a - b.a);
  const dyn = Object.keys(by).filter((id) => by[id].length >= 2).map((id) => {
    const list = by[id].slice().sort(byDate);
    const h = Math.floor(list.length / 2);
    return { id, list, d: wavg(db, list.slice(h)).a - wavg(db, list.slice(0, h)).a };
  }).sort((a, b) => b.d - a.d);
  const pos = (a) => Math.max(0, Math.min(100, ((a - 2) / 3) * 100));
  return html`
    <div class="card card-pad">
      <div class="card-title"><h2>Прогноз на четверть</h2><span>«5» от ${num(th, 1)} · «4» от ${num(th - 1, 1)}</span></div>
      <div class="psum">${[5, 4, 3, 2].map((v) => { const n = fc.filter((f) => f.p === v).length; return html`<div class=${n ? '' : 'zero'}>
        <${Mark} v=${v}/><span>${pl(n, W_SUBJ)}</span></div>`; })}</div>
      <ul>${fc.map((f) => {
        const edge = f.p === 5 && f.k === 0;
        return html`<li class="fc-row" key=${f.id}>
          <div class="fc-main">
            <div class="fc-top"><b>${sname(db, f.id)}</b><span>${num(f.a, 2)}</span></div>
            <div class="bar" aria-hidden="true">
              <span class="fill" style=${{ width: Math.max(2, pos(f.a)).toFixed(1) + '%', background: f.p <= 3 ? 'var(--danger)' : 'var(--brand)' }}></span>
              <span class="tk" style=${{ left: pos(th - 1).toFixed(1) + '%' }}></span>
              <span class="tk" style=${{ left: pos(th).toFixed(1) + '%' }}></span>
            </div>
            <span class=${'fc-hint' + (f.p <= 3 ? ' bad' : edge ? ' edge' : '')}>${f.hint}</span>
          </div>
          <${Mark} v=${f.p} big/>
        </li>`;
      })}</ul>
    </div>
    ${dyn.length > 0 && html`<div class="card card-pad" style="gap:6px">
      <div class="card-title"><h2>Растут и падают</h2></div>
      <p class="small muted">Первая половина оценок против второй. Каждый столбик — одна оценка по порядку.</p>
      <ul>${dyn.map((x) => {
        const flat = Math.abs(x.d) < 0.05;
        return html`<li class="dyn-row" key=${x.id}>
          <b>${sname(db, x.id)}</b>
          <span class="spark" aria-hidden="true">${x.list.map((g) => html`<i style=${{ height: 6 + (g.v - 2) * 8 + 'px', background: 'var(--c' + g.v + ')' }}></i>`)}</span>
          <span class=${'dyn-d ' + (flat ? 'flat' : x.d > 0 ? 'up' : 'down')}>${flat ? 'ровно' : (x.d > 0 ? '↑ +' : '↓ −') + num(Math.abs(x.d), 1)}</span>
        </li>`;
      })}</ul>
    </div>`}`;
}

function Details({ c, G }) {
  const { db, U, today } = c;
  const tot = G.length;
  const cnt = [5, 4, 3, 2].map((v) => G.filter((g) => g.v === v).length);
  const C = 2 * Math.PI * 40;
  let acc = 0;
  const segs = [5, 4, 3, 2].map((v, j) => {
    const len = tot ? (cnt[j] / tot) * C : 0;
    const vis = Math.max(0, len - (len > 4 ? 1.5 : 0));
    const o = { v, dash: vis.toFixed(2) + ' ' + (C - vis).toFixed(2), off: (-acc).toFixed(2), n: cnt[j], pct: tot ? Math.round((cnt[j] / tot) * 100) : 0 };
    acc += len;
    return o;
  });
  const kinds = KINDS.map((k) => { const l = G.filter((g) => g.kind === k.id); return { k, n: l.length, a: mean(l) }; });
  const ka = kinds[0].a, ke = kinds[3].a;
  let kindIns = '';
  if (ka !== null && ke !== null) {
    const d = ke - ka;
    kindIns = Math.abs(d) < 0.15 ? 'На контрольных и на уроках результат примерно одинаковый.' : 'На контрольных средний на ' + num(Math.abs(d), 1) + (d < 0 ? ' ниже' : ' выше') + ', чем ответы на уроках.';
  }
  const wds = [0, 1, 2, 3, 4, 5].map((i) => ({ i, a: wavg(db, G.filter((g) => wdIso(g.date) === i)).a }));
  const has = wds.filter((x) => x.a !== null);
  const best = has.length ? has.reduce((p, q) => (q.a > p.a ? q : p)) : null;
  const worst = has.length ? has.reduce((p, q) => (q.a < p.a ? q : p)) : null;
  // тепловая карта: последние до 6 недель периода
  const th = db.settings.th;
  const m0 = mondayIso(today);
  const ps = mondayIso(db.settings.periodStart);
  const nW = Math.max(1, Math.min(6, Math.round(diff(m0, ps) / 7) + 1));
  const wk = []; for (let k = nW - 1; k >= 0; k--) wk.push(addIso(m0, -7 * k));
  const cols = '26px repeat(' + nW + ', minmax(0, 1fr))';
  const heatBg = (a) => (a >= th ? ['var(--c5)', '#FFFFFF'] : a >= th - 1 ? ['var(--g5-bg)', 'var(--g5-fg)'] : a >= th - 2 ? ['var(--g3-bg)', 'var(--g3-fg)'] : ['var(--c2)', '#FFFFFF']);
  return html`
    <div class="card card-pad">
      <div class="card-title"><h2>Из чего складывается балл</h2></div>
      <div class="donut-row">
        <div class="donut">
          <svg viewBox="0 0 100 100" width="124" height="124" aria-hidden="true">
            <g transform="rotate(-90 50 50)">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--track)" stroke-width="13"/>
              ${segs.map((s) => html`<circle cx="50" cy="50" r="40" fill="none" stroke=${'var(--c' + s.v + ')'} stroke-width="13" stroke-dasharray=${s.dash} stroke-dashoffset=${s.off}/>`)}
            </g>
          </svg>
          <div class="c"><b>${tot}</b><span>${plural(tot, W_GRADE)}</span></div>
        </div>
        <ul class="dleg">${segs.map((s) => html`<li><span class="sw" style=${{ background: 'var(--c' + s.v + ')' }}></span><${Mark} v=${s.v}/>
          <span class="n">${pl(s.n, W_GRADE)}</span><span class="p">${s.pct}%</span></li>`)}</ul>
      </div>
    </div>
    <div class="card card-pad">
      <div class="card-title"><h2>По типу работ</h2></div>
      ${kinds.map((x) => html`<div class="kind">
        <div class="kind-top"><b>${x.k.label} <em>· ${pl(x.n, W_GRADE)}</em></b><span>${x.a === null ? '—' : num(x.a, 2)}</span></div>
        <div class="bar" aria-hidden="true"><span class="fill" style=${{ width: x.a === null ? '0%' : Math.max(2, ((x.a - 2) / 3) * 100).toFixed(1) + '%', background: x.a !== null && x.a < th - 1 ? 'var(--danger)' : 'var(--brand)' }}></span></div>
      </div>`)}
      ${kindIns && html`<p class="small">${kindIns}</p>`}
    </div>
    <div class="card card-pad">
      <div class="card-title"><h2>По дням недели</h2></div>
      <div class="cols">${wds.map((x) => html`<div>
        <b>${x.a === null ? '—' : num(x.a, 1)}</b>
        <i style=${{ height: (x.a === null ? 4 : Math.round(10 + ((x.a - 2) / 3) * 78)) + 'px', background: best && x.i === best.i ? 'var(--c5)' : 'var(--g5-bg)' }}></i>
        <span>${DN[x.i]}</span>
      </div>`)}</div>
      ${best && worst && best.i !== worst.i && html`<p class="small">Лучше всего — ${DP[best.i]} (${num(best.a, 1)}), слабее всего — ${DP[worst.i]} (${num(worst.a, 1)}).</p>`}
    </div>
    <div class="card card-pad">
      <div class="card-title"><h2>Календарь оценок</h2></div>
      <p class="small muted" style="margin-top:-6px">Средняя оценка за день. Нажми на день — откроется расписание.</p>
      <div class="heat">
        ${[0, 1, 2, 3, 4, 5].map((r) => html`<div class="heat-row" style=${{ gridTemplateColumns: cols }}>
          <span>${DN[r]}</span>
          ${wk.map((m) => {
            const s = addIso(m, r);
            const active = s >= db.settings.periodStart && s <= today;
            const l = active ? G.filter((g) => g.date === s) : [];
            const a = l.length ? wavg(db, l).a : null;
            const col = a === null ? ['var(--surface-2)', 'var(--ink)'] : heatBg(a);
            return html`<button type="button" class="heat-cell" disabled=${!active} style=${{ background: col[0], color: col[1] }}
              aria-label=${longDate(parse(s)) + (a === null ? ', оценок нет' : ', средняя ' + num(a, 1))}
              onClick=${() => U({ tab: 'sched', view: 'day', sel: s, edit: false })}>${a === null ? '' : num(a, 1)}</button>`;
          })}
        </div>`)}
        <div class="heat-row" style=${{ gridTemplateColumns: cols }}><span></span>
          ${wk.map((m) => html`<span class="heat-wk">${parse(m).getDate() + '–' + parse(addIso(m, 5)).getDate()}</span>`)}</div>
      </div>
      <div class="legend-sq">
        <span><i style="background:var(--c5)"></i>«5»</span>
        <span><i style="background:var(--g5-bg)"></i>«4»</span>
        <span><i style="background:var(--g3-bg)"></i>«3»</span>
        <span><i style="background:var(--c2)"></i>«2»</span>
        <span><i style="background:var(--surface-2);border:1px solid var(--line)"></i>без оценок</span>
      </div>
    </div>`;
}

/* ================= настройки ================= */
function Settings({ c }) {
  const { db, mut, U, setSheet, flash, setDb, today } = c;
  const fileRef = useRef(null);
  const st = db.settings;
  const set = (k, v) => mut((n) => { n.settings[k] = v; });
  const exportData = async () => {
    const name = 'gendiary-' + today + '.json';
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Gen Diary — копия' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  const importData = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || d.v !== 1 || !Array.isArray(d.subjects)) throw new Error('bad');
        setDb(normalize(d, today));
        flash('Копия загружена');
      } catch (err) { flash('Не получилось прочитать файл — это точно копия Gen Diary?'); }
    };
    r.readAsText(f);
  };
  return html`<section class="screen">
    <div class="settings-top">
      <button type="button" class="icon-btn" aria-label="Назад" onClick=${() => U({ settings: false })}><${Icon} n="chevL"/></button>
      <h1>Настройки</h1>
    </div>

    <div class="set-sec"><h2>Предметы</h2>
      <div class="card set-list">
        ${db.subjects.map((s) => html`<button type="button" class="set-row" key=${s.id} onClick=${() => setSheet({ type: 'subject', id: s.id })}>
          <span class="t"><b>${s.name}</b>${s.room && html`<span>${/^\d/.test(s.room) ? 'каб. ' + s.room : s.room}</span>`}</span>
          <${Icon} n="chevR" s=${18}/></button>`)}
        <button type="button" class="set-row" onClick=${() => setSheet({ type: 'subject' })} style="color:var(--brand-ink)">
          <${Icon} n="plus" s=${18} w=${2.2}/><span class="t"><b style="font-weight:600">Добавить предмет</b></span></button>
      </div>
    </div>

    <div class="set-sec"><h2>Звонки</h2>
      <div class="card set-list">
        ${db.bells.map((b, i) => html`<div class="bell-row" key=${i}>
          <i>${i + 1}</i>
          <input type="time" aria-label=${'Начало ' + (i + 1) + ' урока'} value=${b[0]} onChange=${(e) => mut((n) => { n.bells[i][0] = e.target.value; })}/>
          <span>–</span>
          <input type="time" aria-label=${'Конец ' + (i + 1) + ' урока'} value=${b[1]} onChange=${(e) => mut((n) => { n.bells[i][1] = e.target.value; })}/>
        </div>`)}
      </div>
    </div>

    <div class="set-sec"><h2>Учёба</h2>
      <div class="card set-list">
        <label class="set-row"><span class="t"><b>Начало четверти</b><span>Оценки до этой даты не попадают в метрики</span></span>
          <input class="date-in" type="date" value=${st.periodStart} onChange=${(e) => e.target.value && set('periodStart', e.target.value)}/></label>
        <button type="button" class="set-row" role="switch" aria-checked=${st.sixDay} onClick=${() => set('sixDay', !st.sixDay)}>
          <span class="t"><b>Учусь по субботам</b><span>Шестидневка</span></span><span class=${'switch' + (st.sixDay ? ' on' : '')}></span></button>
      </div>
    </div>

    <div class="set-sec"><h2>Как считать оценки</h2>
      <div class="card set-list">
        <div class="set-row"><span class="t"><b>«5» за четверть от</b><span>«4» и «3» — на 1 и 2 ниже</span></span>
          <span class="seg-mini" role="group" aria-label="Порог пятёрки">${[4.5, 4.6].map((v) => html`<button type="button" class=${st.th === v ? 'on' : ''}
            aria-pressed=${st.th === v} onClick=${() => set('th', v)}>${num(v, 1)}</button>`)}</span></div>
        <div class="set-row"><span class="t"><b>Вес контрольной</b><span>Во сколько раз она важнее обычной оценки</span></span>
          <span class="seg-mini" role="group" aria-label="Вес контрольной">${[1, 2, 3].map((v) => html`<button type="button" class=${st.examWeight === v ? 'on' : ''}
            aria-pressed=${st.examWeight === v} onClick=${() => set('examWeight', v)}>×${v}</button>`)}</span></div>
      </div>
    </div>

    <div class="set-sec"><h2>Данные</h2>
      <p class="note">Всё хранится только на этом телефоне. Время от времени сохраняй копию — если удалить приложение с экрана «Домой», данные пропадут.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-soft btn-block" onClick=${exportData}><${Icon} n="share" s=${18}/>Сохранить копию</button>
        <button type="button" class="btn btn-soft btn-block" onClick=${() => fileRef.current && fileRef.current.click()}><${Icon} n="download" s=${18}/>Загрузить копию</button>
        <input ref=${fileRef} type="file" accept="application/json,.json" style="display:none" onChange=${importData}/>
        ${db.sample
          ? html`<${ConfirmButton} label="Начать с чистого листа" confirm="Точно? Удалятся пример-оценки и домашка"
              onConfirm=${() => { mut((n) => { n.grades = []; n.hw = []; n.ov = {}; n.sample = false; n.settings.periodStart = schoolYearStart(today); }); U({ settings: false, tab: 'sched', view: 'template' }); flash('Готово! Расписание осталось — поправь его в «Шаблоне»'); }}/>`
          : html`<${ConfirmButton} label="Вернуть пример" confirm="Точно? Твои данные заменятся примером" cls="btn btn-soft btn-block"
              onConfirm=${() => { setDb(buildSample(today)); U({ settings: false, tab: 'sched', view: 'day', sel: today }); flash('Пример загружен'); }}/>`}
        <${ConfirmButton} label="Удалить всё, включая расписание" confirm="Точно удалить всё? Это не отменить"
          onConfirm=${() => { setDb(baseDb(today)); U({ settings: false, tab: 'sched', view: 'template', sel: today }); flash('Всё удалено. Начни с предметов в настройках'); }}/>
      </div>
    </div>

    <div class="about">
      <span class="logo-big"><${Wordmark} h=${36} mono=${false}/></span>
      <p>Версия 1.0 · работает без интернета · данные не уходят с телефона</p>
    </div>
  </section>`;
}

function SubjectSheet({ c, init }) {
  const { db, mut, setSheet, flash } = c;
  const orig = init.id ? db.subjects.find((s) => s.id === init.id) : null;
  const [name, setName] = useState(orig ? orig.name : '');
  const [room, setRoom] = useState(orig ? orig.room || '' : '');
  const ok = name.trim().length > 0;
  const nG = orig ? db.grades.filter((g) => g.subj === orig.id).length : 0;
  const nH = orig ? db.hw.filter((h) => h.subj === orig.id).length : 0;
  const save = () => {
    if (!ok) return;
    mut((n) => {
      if (orig) { const s = n.subjects.find((x) => x.id === orig.id); if (s) { s.name = name.trim(); s.room = room.trim(); } }
      else n.subjects.push({ id: uid('s'), name: name.trim(), room: room.trim() });
    });
    setSheet(null);
  };
  const del = () => {
    mut((n) => {
      n.subjects = n.subjects.filter((s) => s.id !== orig.id);
      n.tt = n.tt.map((d) => d.filter((x) => x !== orig.id));
      Object.keys(n.ov).forEach((k) => { n.ov[k] = n.ov[k].filter((x) => x !== orig.id); });
      n.grades = n.grades.filter((g) => g.subj !== orig.id);
      n.hw = n.hw.filter((h) => h.subj !== orig.id);
    });
    setSheet(null);
    flash('Предмет удалён');
  };
  return html`<${Sheet} title=${orig ? 'Предмет' : 'Новый предмет'} onClose=${() => setSheet(null)}>
    <div class="field"><label for="s-name">Название</label>
      <input id="s-name" class="input" type="text" autocomplete="off" placeholder="Например: Вероятность и статистика" value=${name} onInput=${(e) => setName(e.target.value)}/></div>
    <div class="field"><label for="s-room">Кабинет</label>
      <input id="s-room" class="input" type="text" autocomplete="off" placeholder="Например: 214 или спортзал" value=${room} onInput=${(e) => setRoom(e.target.value)}/></div>
    <div class="sheet-actions">
      <button type="button" class="btn btn-primary btn-block" disabled=${!ok} onClick=${save}>${orig ? 'Сохранить' : 'Добавить предмет'}</button>
      ${orig && html`<${ConfirmButton} label="Удалить предмет"
        confirm=${'Точно? Удалятся ' + pl(nG, W_GRADE) + ' и ' + pl(nH, W_TASK) + ', он уйдёт из расписания'} onConfirm=${del}/>`}
    </div>
  <//>`;
}

/* ================= приложение ================= */
const TABS = [['sched', 'Расписание', 'calendar'], ['hw', 'Домашка', 'book'], ['grades', 'Оценки', 'pen'], ['stats', 'Метрики', 'chart']];

function App() {
  const [db, setDb] = useState(loadDb);
  const [today, setToday] = useState(todayIso);
  const [ui, setUi] = useState(() => ({
    tab: 'sched', view: 'day', sel: todayIso(), mon: null, edit: false, tplEdit: -1,
    showDone: false, openSubj: null, statsView: 'overview', statsSubj: null, settings: false
  }));
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const mainRef = useRef(null);
  const toastT = useRef(0);

  useEffect(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* нет места */ } }, [db]);
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const f = () => { if (document.visibilityState === 'visible') setToday(todayIso()); };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [ui.tab, ui.view, ui.statsView, ui.settings]);

  const mut = (fn) => setDb((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });
  const U = (patch) => setUi((prev) => Object.assign({}, prev, patch));
  const flash = (msg, action) => {
    setToast({ msg, action });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), action ? 5000 : 2800);
  };
  const c = { db, setDb, mut, ui, U, today, setSheet, flash };
  const pending = db.hw.filter((h) => !h.done).length;

  let screen;
  if (ui.settings) screen = html`<${Settings} c=${c}/>`;
  else if (ui.tab === 'sched') screen = html`<${ScheduleScreen} c=${c}/>`;
  else if (ui.tab === 'hw') screen = html`<${HwScreen} c=${c}/>`;
  else if (ui.tab === 'grades') screen = html`<${GradesScreen} c=${c}/>`;
  else screen = html`<${StatsScreen} c=${c}/>`;

  let sheetEl = null;
  if (sheet) {
    const k = JSON.stringify(sheet);
    if (sheet.type === 'hw') sheetEl = html`<${HwSheet} key=${k} c=${c} init=${sheet}/>`;
    else if (sheet.type === 'grade') sheetEl = html`<${GradeSheet} key=${k} c=${c} init=${sheet}/>`;
    else if (sheet.type === 'pick') sheetEl = html`<${PickSheet} key=${k} c=${c} init=${sheet}/>`;
    else if (sheet.type === 'lesson') sheetEl = html`<${LessonSheet} key=${k} c=${c} init=${sheet}/>`;
    else if (sheet.type === 'subject') sheetEl = html`<${SubjectSheet} key=${k} c=${c} init=${sheet}/>`;
  }

  return html`<div class="app">
    <header class="appbar">
      <div class="appbar-in">
        <${Wordmark} h=${24}/>
        <button type="button" class="icon-btn on-dark" aria-label="Настройки" aria-pressed=${ui.settings}
          onClick=${() => { U({ settings: !ui.settings }); setSheet(null); }}><${Icon} n="gear"/></button>
      </div>
    </header>
    <main class="main" ref=${mainRef}>${screen}</main>
    <nav class="tabbar" aria-label="Разделы">
      ${TABS.map((t) => {
        const on = !ui.settings && ui.tab === t[0];
        return html`<button type="button" class=${'tab' + (on ? ' on' : '')} aria-current=${on ? 'page' : null}
          onClick=${() => { U({ tab: t[0], settings: false }); setSheet(null); }}>
          <span class="tab-ic"><${Icon} n=${t[2]}/>${t[0] === 'hw' && pending > 0 && html`<span class="badge">${pending}</span>`}</span>
          <span class="tab-l">${t[1]}</span>
        </button>`;
      })}
    </nav>
    ${toast && html`<div class="toast" role="status"><span>${toast.msg}</span>
      ${toast.action && html`<button type="button" onClick=${() => { toast.action.fn(); setToast(null); }}>${toast.action.label}</button>`}</div>`}
    ${sheetEl}
  </div>`;
}

render(html`<${App}/>`, document.getElementById('root'));
