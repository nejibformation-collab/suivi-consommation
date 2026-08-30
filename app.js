// ---------- Data / constants ----------
const CATS = {
  Famille: { color: "#E0784F", label: "Famille" },
  Equipement: { color: "#4FA39D", label: "Équipement" },
  Nejib: { color: "#D4A24C", label: "Nejib" },
};
const CAT_KEYS = ["Famille", "Equipement", "Nejib"];
const ICONS = {
  Famille: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>',
  Equipement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
  Nejib: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0116 0v1"/></svg>',
};

let entries = JSON.parse(localStorage.getItem("entries") || "[]");
let state = {
  tab: "add",
  category: "Famille",
  months: 3,
  statView: "month",
};

// ---------- Date helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());

function addMonths(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d;
}
function daysBetween(d1, d2) {
  return Math.max(1, Math.round((d2 - d1) / 86400000));
}
function getMonday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISO(d);
}
function lastNWeeks(n) {
  const monday = getMonday(todayISO());
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(monday + "T00:00:00");
    d.setDate(d.getDate() - 7 * i);
    arr.push(toISO(d));
  }
  return arr;
}
function lastNMonths(n) {
  const now = new Date();
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  }
  return arr;
}
function weekLabel(mondayISO) {
  const d = new Date(mondayISO + "T00:00:00");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
function monthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  const noms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return noms[parseInt(m, 10) - 1] + " " + y.slice(2);
}
function dailyContributions(entry) {
  if (entry.category !== "Equipement") return [{ date: entry.date, amount: entry.value }];
  const months = entry.months || 3;
  const start = new Date(entry.date + "T00:00:00");
  const end = addMonths(entry.date, months);
  const totalDays = daysBetween(start, end);
  const daily = entry.value / totalDays;
  const out = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    out.push({ date: toISO(d), amount: daily });
  }
  return out;
}
function fmt(n) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n || 0) + " DT";
}
function save() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

// ---------- Rendering ----------
const root = document.getElementById("root");

function render() {
  root.innerHTML = `
    <div class="app">
      <header>
        <h1 class="disp">Suivi de consommation</h1>
        <div class="stitch"></div>
      </header>
      <div class="tabs">
        <button class="tabbtn ${state.tab === "add" ? "active" : ""}" data-tab="add">Ajouter</button>
        <button class="tabbtn ${state.tab === "stats" ? "active" : ""}" data-tab="stats">Statistiques</button>
      </div>
      <div id="view"></div>
    </div>
  `;
  document.querySelectorAll(".tabbtn").forEach((b) =>
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab;
      render();
    })
  );
  if (state.tab === "add") renderAdd();
  else renderStats();
}

function renderAdd() {
  const view = document.getElementById("view");
  const val = document.getElementById("__value")?.value ?? "";
  const sub = document.getElementById("__sub")?.value ?? "";
  const date = document.getElementById("__date")?.value ?? todayISO();

  // Remember which field was focused (and cursor position) so we can restore it after re-render
  const activeEl = document.activeElement;
  const activeId = activeEl && activeEl.id && activeEl.id.startsWith("__") ? activeEl.id : null;
  const selStart = activeEl && "selectionStart" in activeEl ? activeEl.selectionStart : null;
  const selEnd = activeEl && "selectionEnd" in activeEl ? activeEl.selectionEnd : null;

  const suggestions = (() => {
    const counts = {};
    entries.filter((e) => e.category === state.category).forEach((e) => {
      counts[e.subcategory] = (counts[e.subcategory] || 0) + 1;
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .filter((s) => s.toLowerCase().includes(sub.toLowerCase()))
      .slice(0, 6);
  })();

  view.innerHTML = `
    <div class="view">
      <div class="cat-row">
        ${CAT_KEYS.map(
          (k) => `
          <button class="cat-btn ${state.category === k ? "active" : ""}" data-cat="${k}">
            ${ICONS[k]}
            <span>${CATS[k].label}</span>
          </button>`
        ).join("")}
      </div>

      <div class="card">
        <label>Sous-catégorie</label>
        <input type="text" id="__sub" placeholder="Écrire ou choisir ci-dessous…" value="${sub.replace(/"/g, "&quot;")}" />
        <div class="chips">
          ${suggestions
            .map(
              (s) => `<button class="chip ${s === sub ? "selected" : ""}" data-sub="${s.replace(/"/g, "&quot;")}">${s}</button>`
            )
            .join("")}
        </div>
      </div>

      <div class="row2">
        <div class="card">
          <label>Valeur (DT)</label>
          <div class="value-row">
            <input type="number" inputmode="decimal" id="__value" placeholder="0" value="${val}" />
            <span class="unit">DT</span>
          </div>
        </div>
        <div class="card">
          <label>Date</label>
          <input type="date" id="__date" value="${date}" />
        </div>
      </div>

      ${
        state.category === "Equipement"
          ? `
      <div class="card equip-card">
        <label>Répartir la valeur sur</label>
        <div class="months-row">
          ${[3, 6, 12]
            .map((m) => `<button class="month-btn ${state.months === m ? "active" : ""}" data-months="${m}">${m} mois</button>`)
            .join("")}
        </div>
        ${
          val && !isNaN(parseFloat(val))
            ? `<p class="equip-hint">≈ ${fmt(parseFloat(val) / state.months)} / mois pendant ${state.months} mois</p>`
            : ""
        }
      </div>`
          : ""
      }

      <button class="save-btn ${sub.trim() && val ? "ready" : ""}" data-cat="${state.category}" id="__save" ${
    sub.trim() && val ? "" : "disabled"
  }>
        Enregistrer
      </button>

      ${
        entries.length
          ? `
      <div>
        <p class="recent-title disp">Entrées récentes</p>
        ${entries
          .slice(0, 12)
          .map(
            (e) => `
          <div class="entry">
            <div class="entry-left">
              <div class="dot" style="background:${CATS[e.category].color}"></div>
              <div>
                <div class="entry-sub">${e.subcategory}</div>
                <div class="entry-meta">${e.date}${e.category === "Equipement" ? " · " + e.months + " mois" : ""}</div>
              </div>
            </div>
            <div class="entry-right">
              <span class="entry-val disp">${fmt(e.value)}</span>
              <button class="del-btn" data-del="${e.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93A4AD" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              </button>
            </div>
          </div>`
          )
          .join("")}
      </div>`
          : ""
      }
    </div>
  `;

  // Preserve focus/cursor for text inputs
  document.querySelectorAll(".cat-btn").forEach((b) =>
    b.addEventListener("click", () => {
      state.category = b.dataset.cat;
      renderAdd();
    })
  );
  document.querySelectorAll(".chip").forEach((b) =>
    b.addEventListener("click", () => {
      document.getElementById("__sub").value = b.dataset.sub;
      renderAdd();
    })
  );
  document.querySelectorAll(".month-btn").forEach((b) =>
    b.addEventListener("click", () => {
      state.months = parseInt(b.dataset.months, 10);
      renderAdd();
    })
  );
  document.getElementById("__sub").addEventListener("input", () => renderAdd());
  document.getElementById("__value").addEventListener("input", () => renderAdd());

  // Restore focus/cursor so the keyboard stays open while typing
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.focus();
      if (selStart !== null && selEnd !== null && typeof el.setSelectionRange === "function") {
        try {
          el.setSelectionRange(selStart, selEnd);
        } catch (e) {}
      }
    }
  }

  document.getElementById("__save")?.addEventListener("click", () => {
    const subVal = document.getElementById("__sub").value.trim();
    const valNum = parseFloat(document.getElementById("__value").value);
    const dateVal = document.getElementById("__date").value || todayISO();
    if (!subVal || isNaN(valNum) || valNum <= 0) return;
    entries.unshift({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      category: state.category,
      subcategory: subVal,
      value: valNum,
      date: dateVal,
      ...(state.category === "Equipement" ? { months: state.months } : {}),
    });
    save();
    renderAdd();
  });

  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      entries = entries.filter((e) => e.id !== b.dataset.del);
      save();
      renderAdd();
    })
  );
}

function computeBuckets() {
  const daily = entries.flatMap((e) => dailyContributions(e).map((d) => ({ ...d, category: e.category })));
  const weeks = lastNWeeks(8);
  const wmap = Object.fromEntries(weeks.map((w) => [w, { Famille: 0, Equipement: 0, Nejib: 0 }]));
  daily.forEach((d) => {
    const wk = getMonday(d.date);
    if (wmap[wk]) wmap[wk][d.category] += d.amount;
  });
  const weekBuckets = weeks.map((w) => ({ key: w, label: weekLabel(w), ...wmap[w] }));

  const months = lastNMonths(6);
  const mmap = Object.fromEntries(months.map((m) => [m, { Famille: 0, Equipement: 0, Nejib: 0 }]));
  daily.forEach((d) => {
    const mk = d.date.slice(0, 7);
    if (mmap[mk]) mmap[mk][d.category] += d.amount;
  });
  const monthBuckets = months.map((m) => ({ key: m, label: monthLabel(m), ...mmap[m] }));

  return { weekBuckets, monthBuckets };
}

function renderChartSVG(data) {
  const w = 320, h = 200, padL = 30, padB = 20, padT = 10, padR = 6;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => d.Famille + d.Equipement + d.Nejib));
  const barW = (chartW / data.length) * 0.55;
  const gap = (chartW / data.length) * 0.45;

  let bars = "";
  let labels = "";
  let gridLines = "";
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padT + (chartH / steps) * i;
    const val = Math.round((maxVal * (steps - i)) / steps);
    gridLines += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#33434D" stroke-dasharray="3,3"/>`;
    gridLines += `<text x="0" y="${y + 3}">${val}</text>`;
  }

  data.forEach((d, i) => {
    const x = padL + i * (barW + gap) + gap / 2;
    let yCursor = padT + chartH;
    ["Famille", "Equipement", "Nejib"].forEach((cat) => {
      const val = d[cat] || 0;
      const barH = (val / maxVal) * chartH;
      const y = yCursor - barH;
      bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${CATS[cat].color}" rx="2"/>`;
      yCursor -= barH;
    });
    labels += `<text x="${x + barW / 2}" y="${h - 4}" text-anchor="middle">${d.label}</text>`;
  });

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="230">${gridLines}${bars}${labels}</svg>`;
}

function renderStats() {
  const view = document.getElementById("view");
  const { weekBuckets, monthBuckets } = computeBuckets();
  const chartData = state.statView === "week" ? weekBuckets : monthBuckets;
  const current = chartData[chartData.length - 1] || { Famille: 0, Equipement: 0, Nejib: 0 };
  const currentTotal = (current.Famille || 0) + (current.Equipement || 0) + (current.Nejib || 0);

  view.innerHTML = `
    <div class="view">
      <div class="stat-toggle">
        <button class="${state.statView === "week" ? "active" : ""}" data-view="week">Hebdomadaire</button>
        <button class="${state.statView === "month" ? "active" : ""}" data-view="month">Mensuelle</button>
      </div>

      <div class="card">
        <p class="total-label">${state.statView === "week" ? "Cette semaine" : "Ce mois-ci"}</p>
        <p class="total-value disp">${fmt(currentTotal)}</p>
        <div class="legend">
          ${CAT_KEYS.map(
            (k) => `
            <div class="legend-item">
              <div class="dot" style="width:7px;height:7px;background:${CATS[k].color}"></div>
              ${CATS[k].label} · ${fmt(current[k])}
            </div>`
          ).join("")}
        </div>
      </div>

      <div class="card">
        <p class="chart-title">${state.statView === "week" ? "8 dernières semaines" : "6 derniers mois"}</p>
        ${renderChartSVG(chartData)}
      </div>

      ${entries.length === 0 ? `<p class="empty-msg">Aucune donnée pour l'instant. Ajoutez une première entrée dans l'onglet "Ajouter".</p>` : ""}
    </div>
  `;

  document.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => {
      state.statView = b.dataset.view;
      renderStats();
    })
  );
}

render();

// ---------- Service worker registration ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
