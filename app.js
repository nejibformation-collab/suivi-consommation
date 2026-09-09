// ---------- Data / constants ----------
const CATS = {
  Famille: { color: "#E0784F", label: "Famille" },
  Equipement: { color: "#4FA39D", label: "Équipement" },
  Nejib: { color: "#D4A24C", label: "Nejib" },
  Voiture: { color: "#5B8DBE", label: "Voiture" },
};
const CAT_KEYS = ["Famille", "Equipement", "Nejib", "Voiture"];
// Categories whose value gets spread (répartie) over 3/6/12 months instead
// of counted all at once on the entry date.
const DISTRIBUTED_CATS = new Set(["Equipement", "Voiture"]);
const ICONS = {
  Famille: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>',
  Equipement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
  Nejib: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0116 0v1"/></svg>',
  Voiture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h14M5 17a2 2 0 01-2-2v-2l2-5a2 2 0 012-2h6a2 2 0 012 2l2 5v2a2 2 0 01-2 2M5 17a2 2 0 002 2h0a2 2 0 002-2M17 17a2 2 0 002 2h0a2 2 0 002-2M5 13h14"/></svg>',
};
// Distinct accent colors for the top tabs — chosen to stand apart from the
// dark app background AND from the category colors above, so they never blend in.
const TAB_COLORS = { add: "#6FA8DC", stats: "#C58FE0", entretien: "#6FBF73", reglages: "#B0B0B0" };
const TAB_ICONS = {
  add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>',
  entretien: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  reglages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
};
// Common car maintenance types offered as suggestions even before any history exists.
const DEFAULT_ENTRETIEN_TYPES = [
  "Vidange huile moteur",
  "Filtre à huile",
  "Filtre à air",
  "Filtre habitacle",
  "Plaquettes de frein",
  "Disques de frein",
  "Pneus",
  "Batterie",
  "Bougies",
  "Courroie de distribution",
  "Liquide de refroidissement",
  "Révision générale",
  "Contrôle technique",
];

let entries = JSON.parse(localStorage.getItem("entries") || "[]");
let entretiens = JSON.parse(localStorage.getItem("entretiens") || "[]");
let syncStatus = "";
let state = {
  tab: "add",
  category: "Famille",
  months: 3,
  statView: "month",
  editingId: null,
  editingEntretienId: null,
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
function isoWeekInfo(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const dayNum = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dayNum + 3); // move to Thursday of this ISO week
  const isoYear = d.getFullYear();
  const firstThursday = new Date(isoYear, 0, 4);
  const firstDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * 86400000));
  return { week, isoYear };
}
function weekLabel(mondayISO) {
  const { week, isoYear } = isoWeekInfo(mondayISO);
  return `${pad(week)}/${String(isoYear).slice(2)}`;
}
function monthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return `${m}/${y.slice(2)}`;
}
function dailyContributions(entry) {
  if (!DISTRIBUTED_CATS.has(entry.category)) return [{ date: entry.date, amount: entry.value }];
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
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function save() {
  localStorage.setItem("entries", JSON.stringify(entries));
  pushToSupabase(true);
}
function saveEntretiens() {
  localStorage.setItem("entretiens", JSON.stringify(entretiens));
  pushToSupabase(true);
}

// ---------- Supabase cloud sync ----------
function getSbConfig() {
  try {
    return JSON.parse(localStorage.getItem("sb_config") || "null");
  } catch (e) {
    return null;
  }
}
function saveSbConfig(cfg) {
  localStorage.setItem("sb_config", JSON.stringify(cfg));
}

function pushToSupabase(auto) {
  const cfg = getSbConfig();
  if (!cfg || !cfg.url || !cfg.key || !cfg.identifiant) return;
  fetch(`${cfg.url.replace(/\/$/, "")}/rest/v1/consumption_data?on_conflict=identifiant`, {
    method: "POST",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      { identifiant: cfg.identifiant, entries, entretiens, updated_at: new Date().toISOString() },
    ]),
  })
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      syncStatus = "Dernière sauvegarde cloud : " + new Date().toLocaleTimeString("fr-FR");
      if (state.tab === "reglages") renderReglages();
    })
    .catch((err) => {
      syncStatus = "Erreur de sauvegarde cloud : " + err.message;
      if (state.tab === "reglages") renderReglages();
    });
}

function testSbConnection() {
  const cfg = getSbConfig();
  if (!cfg || !cfg.url || !cfg.key) {
    alert("Configure et enregistre d'abord tes réglages.");
    return;
  }
  const url = `${cfg.url.replace(/\/$/, "")}/rest/v1/consumption_data?select=identifiant&limit=1`;
  fetch(url, { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } })
    .then(async (res) => {
      const txt = await res.text();
      alert(`Statut HTTP: ${res.status}\n\nRéponse:\n${txt}`);
    })
    .catch((err) => {
      alert(`Erreur réseau (${err.name}):\n${err.message}\n\nURL testée:\n${url}`);
    });
}

function pullFromSupabase(silent) {
  const cfg = getSbConfig();
  if (!cfg || !cfg.url || !cfg.key || !cfg.identifiant) {
    if (!silent) alert("Configure d'abord tes réglages Supabase.");
    return;
  }
  fetch(
    `${cfg.url.replace(/\/$/, "")}/rest/v1/consumption_data?identifiant=eq.${encodeURIComponent(cfg.identifiant)}&select=*`,
    { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } }
  )
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((rows) => {
      if (!rows.length) {
        syncStatus = "Aucune donnée trouvée sur Supabase pour cet identifiant.";
        if (!silent) alert(syncStatus);
        if (state.tab === "reglages") renderReglages();
        return;
      }
      const row = rows[0];
      const doIt = silent
        ? true
        : confirm(
            `Récupérer ${row.entries?.length || 0} entrée(s) et ${
              row.entretiens?.length || 0
            } entretien(s) depuis Supabase ?\nCela remplacera les données actuelles sur ce téléphone.`
          );
      if (!doIt) return;
      entries = row.entries || [];
      entretiens = row.entretiens || [];
      localStorage.setItem("entries", JSON.stringify(entries));
      localStorage.setItem("entretiens", JSON.stringify(entretiens));
      syncStatus = "Données récupérées depuis Supabase ✓";
      render();
      if (!silent) alert("Récupération réussie ✓");
    })
    .catch((err) => {
      syncStatus = "Erreur de récupération : " + err.message;
      if (!silent) alert(syncStatus);
      if (state.tab === "reglages") renderReglages();
    });
}

function emptyCatBucket() {
  const o = {};
  CAT_KEYS.forEach((k) => (o[k] = 0));
  return o;
}
function sumCatBucket(bucket) {
  return CAT_KEYS.reduce((sum, k) => sum + (bucket[k] || 0), 0);
}

// ---------- Rendering ----------
const root = document.getElementById("root");

function render() {
  root.innerHTML = `
    <div class="app">
      <header>
        <div class="header-row">
          <h1 class="disp">Suivi de consommation</h1>
          <div class="backup-btns">
            <button id="__exportBtn" title="Exporter les données">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#93A4AD" stroke-width="2"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M4 17v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>
            </button>
            <button id="__importBtn" title="Importer les données">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#93A4AD" stroke-width="2"><path d="M12 15V3"/><path d="M7 10l5 5 5-5"/><path d="M4 17v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>
            </button>
            <input type="file" id="__importFile" accept="application/json" style="display:none" />
          </div>
        </div>
        <div class="stitch"></div>
      </header>
      <div class="tabs">
        <button class="tabbtn ${state.tab === "add" ? "active" : ""}" data-tab="add">
          <span class="tab-icon" style="color:${TAB_COLORS.add}">${TAB_ICONS.add}</span>
          Ajouter
        </button>
        <button class="tabbtn ${state.tab === "stats" ? "active" : ""}" data-tab="stats">
          <span class="tab-icon" style="color:${TAB_COLORS.stats}">${TAB_ICONS.stats}</span>
          Statistiques
        </button>
        <button class="tabbtn ${state.tab === "entretien" ? "active" : ""}" data-tab="entretien">
          <span class="tab-icon" style="color:${TAB_COLORS.entretien}">${TAB_ICONS.entretien}</span>
          Entretien
        </button>
        <button class="tabbtn ${state.tab === "reglages" ? "active" : ""}" data-tab="reglages">
          <span class="tab-icon" style="color:${TAB_COLORS.reglages}">${TAB_ICONS.reglages}</span>
          Réglages
        </button>
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
  document.getElementById("__exportBtn").addEventListener("click", exportData);
  document.getElementById("__importBtn").addEventListener("click", () => {
    document.getElementById("__importFile").click();
  });
  document.getElementById("__importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importData(file);
  });
  if (state.tab === "add") renderAdd();
  else if (state.tab === "stats") renderStats();
  else if (state.tab === "entretien") renderEntretien();
  else renderReglages();
}

function exportData() {
  const payload = { entries, entretiens };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = todayISO();
  a.href = url;
  a.download = `suivi-consommation-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      // Support both the new {entries, entretiens} format and old exports
      // that were just a plain array of entries.
      const importedEntries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.entries) ? parsed.entries : [];
      const importedEntretiens = Array.isArray(parsed.entretiens) ? parsed.entretiens : [];
      const replace = confirm(
        `Importer ${importedEntries.length} entrée(s) et ${importedEntretiens.length} entretien(s).\nOK = remplacer toutes les données actuelles\nAnnuler = ajouter aux données existantes`
      );
      if (replace) {
        entries = importedEntries;
        entretiens = importedEntretiens;
      } else {
        const existingIds = new Set(entries.map((e) => e.id));
        entries = [...importedEntries.filter((e) => !existingIds.has(e.id)), ...entries];
        const existingEntretienIds = new Set(entretiens.map((e) => e.id));
        entretiens = [...importedEntretiens.filter((e) => !existingEntretienIds.has(e.id)), ...entretiens];
      }
      save();
      saveEntretiens();
      render();
      alert("Importation réussie ✓");
    } catch (err) {
      alert("Fichier invalide, impossible d'importer.");
    }
  };
  reader.readAsText(file);
}

function computeSuggestions(sub) {
  const counts = {};
  entries.filter((e) => e.category === state.category).forEach((e) => {
    counts[e.subcategory] = (counts[e.subcategory] || 0) + 1;
  });
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .filter((s) => s.toLowerCase().includes(sub.toLowerCase()))
    .slice(0, 6);
}

function renderAdd() {
  const view = document.getElementById("view");
  const val = document.getElementById("__value")?.value ?? "";
  const sub = document.getElementById("__sub")?.value ?? "";
  const date = document.getElementById("__date")?.value ?? todayISO();
  const detail = document.getElementById("__detail")?.value ?? "";

  const suggestions = computeSuggestions(sub);

  view.innerHTML = `
    <div class="view">
      <div class="cat-row">
        ${CAT_KEYS.map(
          (k) => `
          <button class="cat-btn ${state.category === k ? "active" : ""}" data-cat="${k}">
            <span style="color:${CATS[k].color}">${ICONS[k]}</span>
            <span class="cat-label" style="color:${state.category === k ? CATS[k].color : "var(--text-muted)"}">${CATS[k].label}</span>
          </button>`
        ).join("")}
      </div>

      <div class="card">
        <label>Sous-catégorie</label>
        <input type="text" id="__sub" list="__subList" placeholder="Écrire ou choisir ci-dessous…" value="${sub.replace(/"/g, "&quot;")}" autocomplete="off" />
        <datalist id="__subList">
          ${computeSuggestions("")
            .map((s) => `<option value="${s.replace(/"/g, "&quot;")}"></option>`)
            .join("")}
        </datalist>
        <div class="chips" id="__chips">
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

      <div class="card">
        <label>Détail (optionnel)</label>
        <input type="text" id="__detail" placeholder="Ex: facture EDF de janvier" value="${detail.replace(/"/g, "&quot;")}" />
      </div>

      ${
        DISTRIBUTED_CATS.has(state.category)
          ? `
      <div class="card dist-card" style="background:${CATS[state.category].color}18; border-color:${CATS[state.category].color}">
        <label style="color:${CATS[state.category].color}">Répartir la valeur sur</label>
        <div class="months-row">
          ${[3, 6, 12]
            .map(
              (m) =>
                `<button class="month-btn ${state.months === m ? "active" : ""}" data-months="${m}" style="${
                  state.months === m ? `background:${CATS[state.category].color};color:#12211F` : ""
                }">${m} mois</button>`
            )
            .join("")}
        </div>
        ${
          val && !isNaN(parseFloat(val))
            ? `<p class="equip-hint" id="__equipHint">≈ ${fmt(parseFloat(val) / state.months)} / mois pendant ${state.months} mois</p>`
            : `<p class="equip-hint" id="__equipHint"></p>`
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
          <div class="entry-wrap">
            <div class="entry">
              <div class="entry-left">
                <div class="dot" style="background:${CATS[e.category].color}"></div>
                <div>
                  <div class="entry-sub">${escapeHtml(e.subcategory)}</div>
                  <div class="entry-meta">${e.date}${DISTRIBUTED_CATS.has(e.category) ? " · " + e.months + " mois" : ""}</div>
                </div>
              </div>
              <div class="entry-right">
                <span class="entry-val disp">${fmt(e.value)}</span>
                <button class="edit-btn" data-edit="${e.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93A4AD" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button class="del-btn" data-del="${e.id}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93A4AD" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
            ${
              state.editingId === e.id
                ? `
            <div class="entry-edit">
              <input type="text" class="detail-edit-input" id="__editDetail_${e.id}" value="${escapeHtml(e.detail || "")}" placeholder="Ajouter un détail…" />
              <div class="entry-edit-actions">
                <button class="edit-save-btn" data-save-detail="${e.id}">Enregistrer</button>
                <button class="edit-cancel-btn" data-cancel-detail="${e.id}">Annuler</button>
              </div>
            </div>`
                : e.detail
                ? `<div class="entry-detail">${escapeHtml(e.detail)}</div>`
                : ""
            }
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
  attachChipListeners();
  document.querySelectorAll(".month-btn").forEach((b) =>
    b.addEventListener("click", () => {
      state.months = parseInt(b.dataset.months, 10);
      renderAdd();
    })
  );
  document.getElementById("__sub").addEventListener("input", handleSubInput);
  document.getElementById("__value").addEventListener("input", handleValueInput);

  document.getElementById("__save")?.addEventListener("click", () => {
    const subVal = document.getElementById("__sub").value.trim();
    const valNum = parseFloat(document.getElementById("__value").value);
    const dateVal = document.getElementById("__date").value || todayISO();
    const detailVal = document.getElementById("__detail").value.trim();
    if (!subVal || isNaN(valNum) || valNum <= 0) return;
    entries.unshift({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      category: state.category,
      subcategory: subVal,
      value: valNum,
      date: dateVal,
      detail: detailVal,
      ...(DISTRIBUTED_CATS.has(state.category) ? { months: state.months } : {}),
    });
    save();
    document.getElementById("__sub").value = "";
    document.getElementById("__value").value = "";
    document.getElementById("__detail").value = "";
    renderAdd();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const savedBtn = document.getElementById("__save");
    if (savedBtn) {
      savedBtn.textContent = "✓ Enregistré";
      savedBtn.classList.add("just-saved");
      setTimeout(() => {
        const btn = document.getElementById("__save");
        if (btn && btn.classList.contains("just-saved")) {
          btn.textContent = "Enregistrer";
          btn.classList.remove("just-saved");
        }
      }, 1200);
    }
  });

  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      entries = entries.filter((e) => e.id !== b.dataset.del);
      save();
      renderAdd();
    })
  );

  document.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => {
      state.editingId = b.dataset.edit;
      renderAdd();
      const inp = document.getElementById("__editDetail_" + state.editingId);
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    })
  );
  document.querySelectorAll("[data-save-detail]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.saveDetail;
      const inp = document.getElementById("__editDetail_" + id);
      const entry = entries.find((e) => e.id === id);
      if (entry && inp) entry.detail = inp.value.trim();
      state.editingId = null;
      save();
      renderAdd();
    })
  );
  document.querySelectorAll("[data-cancel-detail]").forEach((b) =>
    b.addEventListener("click", () => {
      state.editingId = null;
      renderAdd();
    })
  );
}

function updateSaveButtonState() {
  const sub = document.getElementById("__sub")?.value.trim() || "";
  const val = document.getElementById("__value")?.value || "";
  const btn = document.getElementById("__save");
  if (!btn) return;
  const ready = !!(sub && val);
  btn.classList.toggle("ready", ready);
  btn.disabled = !ready;
}

function attachChipListeners() {
  document.querySelectorAll(".chip").forEach((b) =>
    b.addEventListener("click", () => {
      const subInput = document.getElementById("__sub");
      subInput.value = b.dataset.sub;
      handleSubInput();
    })
  );
}

function handleSubInput() {
  updateSaveButtonState();
}

function handleValueInput() {
  const val = document.getElementById("__value").value;
  const hint = document.getElementById("__equipHint");
  if (hint) {
    hint.textContent =
      val && !isNaN(parseFloat(val)) ? `≈ ${fmt(parseFloat(val) / state.months)} / mois pendant ${state.months} mois` : "";
  }
  updateSaveButtonState();
}


function computeBuckets() {
  const daily = entries.flatMap((e) => dailyContributions(e).map((d) => ({ ...d, category: e.category })));
  const weeks = lastNWeeks(8);
  const wmap = Object.fromEntries(weeks.map((w) => [w, emptyCatBucket()]));
  daily.forEach((d) => {
    const wk = getMonday(d.date);
    if (wmap[wk]) wmap[wk][d.category] += d.amount;
  });
  const weekBuckets = weeks.map((w) => ({ key: w, label: weekLabel(w), ...wmap[w] }));

  const months = lastNMonths(6);
  const mmap = Object.fromEntries(months.map((m) => [m, emptyCatBucket()]));
  daily.forEach((d) => {
    const mk = d.date.slice(0, 7);
    if (mmap[mk]) mmap[mk][d.category] += d.amount;
  });
  const monthBuckets = months.map((m) => ({ key: m, label: monthLabel(m), ...mmap[m] }));

  return { weekBuckets, monthBuckets };
}

// Same as computeBuckets, but distributed-category entries are NOT spread
// across months — the full value is counted on its actual purchase date.
function computeRawBuckets() {
  const raw = entries.map((e) => ({ date: e.date, amount: e.value, category: e.category }));
  const weeks = lastNWeeks(8);
  const wmap = Object.fromEntries(weeks.map((w) => [w, emptyCatBucket()]));
  raw.forEach((d) => {
    const wk = getMonday(d.date);
    if (wmap[wk]) wmap[wk][d.category] += d.amount;
  });
  const weekBuckets = weeks.map((w) => ({ key: w, label: weekLabel(w), ...wmap[w] }));

  const months = lastNMonths(6);
  const mmap = Object.fromEntries(months.map((m) => [m, emptyCatBucket()]));
  raw.forEach((d) => {
    const mk = d.date.slice(0, 7);
    if (mmap[mk]) mmap[mk][d.category] += d.amount;
  });
  const monthBuckets = months.map((m) => ({ key: m, label: monthLabel(m), ...mmap[m] }));

  return { weekBuckets, monthBuckets };
}

function renderChartSVG(data) {
  const w = 320, h = 200, padL = 30, padB = 20, padT = 10, padR = 6;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => sumCatBucket(d)));
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
    CAT_KEYS.forEach((cat) => {
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
  const { weekBuckets: rawWeekBuckets, monthBuckets: rawMonthBuckets } = computeRawBuckets();

  const chartData = state.statView === "week" ? weekBuckets : monthBuckets;
  const rawChartData = state.statView === "week" ? rawWeekBuckets : rawMonthBuckets;

  const current = chartData[chartData.length - 1] || emptyCatBucket();
  const currentTotal = sumCatBucket(current);

  const rawCurrent = rawChartData[rawChartData.length - 1] || emptyCatBucket();
  const rawTotal = sumCatBucket(rawCurrent);

  view.innerHTML = `
    <div class="view">
      <div class="stat-toggle">
        <button class="${state.statView === "week" ? "active" : ""}" data-view="week">Hebdomadaire</button>
        <button class="${state.statView === "month" ? "active" : ""}" data-view="month">Mensuelle</button>
      </div>

      <div class="card card-total-current">
        <p class="total-label">${state.statView === "week" ? "Cette semaine" : "Ce mois-ci"} · Total actuel (réparti)</p>
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

      <div class="card card-total-raw">
        <p class="total-label">${state.statView === "week" ? "Cette semaine" : "Ce mois-ci"} · Total sans répartition</p>
        <p class="total-value disp">${fmt(rawTotal)}</p>
        <p class="total-sub-hint">Équipement et Voiture comptés en une fois, à leur date d'achat</p>
        <div class="legend">
          ${CAT_KEYS.map(
            (k) => `
            <div class="legend-item">
              <div class="dot" style="width:7px;height:7px;background:${CATS[k].color}"></div>
              ${CATS[k].label} · ${fmt(rawCurrent[k])}
            </div>`
          ).join("")}
        </div>
      </div>

      <div class="card card-chart">
        <p class="chart-title">${state.statView === "week" ? "8 dernières semaines" : "6 derniers mois"} · réparti</p>
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

// ---------- Entretien voiture (car maintenance) ----------
function computeEntretienTypeOptions() {
  const used = [...new Set(entretiens.map((e) => e.type))];
  const combined = [...used, ...DEFAULT_ENTRETIEN_TYPES.filter((t) => !used.includes(t))];
  return combined;
}

function daysFromToday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(todayISO() + "T00:00:00");
  return Math.round((d - t) / 86400000);
}

function renderEntretien() {
  const view = document.getElementById("view");
  const type = document.getElementById("__etype")?.value ?? "";
  const date = document.getElementById("__edate")?.value ?? todayISO();
  const km = document.getElementById("__ekm")?.value ?? "";
  const nextDate = document.getElementById("__enextDate")?.value ?? "";
  const nextKm = document.getElementById("__enextKm")?.value ?? "";
  const detail = document.getElementById("__edetail")?.value ?? "";

  const typeOptions = computeEntretienTypeOptions();

  const sorted = [...entretiens].sort((a, b) => (a.date < b.date ? 1 : -1));

  view.innerHTML = `
    <div class="view">
      <div class="card">
        <label>Type d'entretien</label>
        <input type="text" id="__etype" list="__etypeList" placeholder="Écrire ou choisir…" value="${escapeHtml(type)}" autocomplete="off" />
        <datalist id="__etypeList">
          ${typeOptions.map((t) => `<option value="${escapeHtml(t)}"></option>`).join("")}
        </datalist>
      </div>

      <div class="row2">
        <div class="card">
          <label>Date</label>
          <input type="date" id="__edate" value="${date}" />
        </div>
        <div class="card">
          <label>Kilométrage (optionnel)</label>
          <input type="number" inputmode="numeric" id="__ekm" placeholder="Ex: 45000" value="${km}" />
        </div>
      </div>

      <div class="card entretien-next-card">
        <label>Prochain entretien prévu (optionnel)</label>
        <div class="row2" style="margin-top:8px">
          <div class="card" style="background:transparent;border:none;padding:0">
            <label>À la date du</label>
            <input type="date" id="__enextDate" value="${nextDate}" />
          </div>
          <div class="card" style="background:transparent;border:none;padding:0">
            <label>Ou au kilométrage</label>
            <input type="number" inputmode="numeric" id="__enextKm" placeholder="Ex: 50000" value="${nextKm}" />
          </div>
        </div>
      </div>

      <div class="card">
        <label>Détail (optionnel)</label>
        <input type="text" id="__edetail" placeholder="Ex: Total Quartz 5W30, garage Ben Ali" value="${escapeHtml(detail)}" />
      </div>

      <button class="save-btn ${type.trim() ? "ready" : ""}" id="__esave" ${type.trim() ? "" : "disabled"} style="${
    type.trim() ? `background:${TAB_COLORS.entretien};color:#12211F` : ""
  }">
        Enregistrer
      </button>

      ${
        sorted.length
          ? `
      <div>
        <p class="recent-title disp">Historique</p>
        ${sorted
          .map((e) => {
            const dueSoon = e.nextDate && daysFromToday(e.nextDate) <= 30;
            const overdue = e.nextDate && daysFromToday(e.nextDate) < 0;
            return `
          <div class="entry-wrap">
            <div class="entry ${dueSoon ? "entretien-due" : ""}">
              <div class="entry-left">
                <div class="dot" style="background:${TAB_COLORS.entretien}"></div>
                <div>
                  <div class="entry-sub">${escapeHtml(e.type)}</div>
                  <div class="entry-meta">${e.date}${e.km ? " · " + Number(e.km).toLocaleString("fr-FR") + " km" : ""}</div>
                </div>
              </div>
              <div class="entry-right">
                <button class="edit-btn" data-eedit="${e.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93A4AD" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button class="del-btn" data-edel="${e.id}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93A4AD" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
            ${
              state.editingEntretienId === e.id
                ? `
            <div class="entry-edit">
              <input type="text" id="__editEType_${e.id}" placeholder="Type" value="${escapeHtml(e.type || "")}" />
              <input type="date" id="__editEDate_${e.id}" value="${e.date || ""}" />
              <input type="number" id="__editEKm_${e.id}" placeholder="Kilométrage" value="${e.km || ""}" />
              <input type="date" id="__editENextDate_${e.id}" value="${e.nextDate || ""}" />
              <input type="number" id="__editENextKm_${e.id}" placeholder="Prochain km" value="${e.nextKm || ""}" />
              <input type="text" id="__editEDetail_${e.id}" placeholder="Détail" value="${escapeHtml(e.detail || "")}" />
              <div class="entry-edit-actions">
                <button class="edit-save-btn" data-esave="${e.id}">Enregistrer</button>
                <button class="edit-cancel-btn" data-ecancel="${e.id}">Annuler</button>
              </div>
            </div>`
                : `
            <div class="entry-detail entretien-info ${overdue ? "overdue" : dueSoon ? "due-soon" : ""}">
              ${e.nextDate ? `Prochain : ${e.nextDate}${overdue ? " (dépassé)" : dueSoon ? " (bientôt)" : ""}` : ""}
              ${e.nextDate && e.nextKm ? " · " : ""}
              ${e.nextKm ? `${Number(e.nextKm).toLocaleString("fr-FR")} km` : ""}
              ${e.detail ? `<br/>${escapeHtml(e.detail)}` : ""}
            </div>`
            }
          </div>`;
          })
          .join("")}
      </div>`
          : `<p class="empty-msg">Aucun entretien enregistré. Ajoute la première vidange, changement de pneus, etc.</p>`
      }
    </div>
  `;

  document.getElementById("__esave")?.addEventListener("click", () => {
    const typeVal = document.getElementById("__etype").value.trim();
    if (!typeVal) return;
    entretiens.unshift({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type: typeVal,
      date: document.getElementById("__edate").value || todayISO(),
      km: document.getElementById("__ekm").value || "",
      nextDate: document.getElementById("__enextDate").value || "",
      nextKm: document.getElementById("__enextKm").value || "",
      detail: document.getElementById("__edetail").value.trim(),
    });
    saveEntretiens();
    document.getElementById("__etype").value = "";
    document.getElementById("__ekm").value = "";
    document.getElementById("__enextDate").value = "";
    document.getElementById("__enextKm").value = "";
    document.getElementById("__edetail").value = "";
    renderEntretien();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const btn = document.getElementById("__esave");
    if (btn) {
      btn.textContent = "✓ Enregistré";
      btn.style.background = "#5FBF77";
      btn.style.color = "#12211F";
      setTimeout(() => {
        const b2 = document.getElementById("__esave");
        if (b2) renderEntretien();
      }, 1000);
    }
  });

  document.getElementById("__etype")?.addEventListener("input", () => {
    const btn = document.getElementById("__esave");
    if (!btn) return;
    const ready = !!document.getElementById("__etype").value.trim();
    btn.disabled = !ready;
    btn.classList.toggle("ready", ready);
    btn.style.background = ready ? TAB_COLORS.entretien : "";
    btn.style.color = ready ? "#12211F" : "";
  });

  document.querySelectorAll("[data-edel]").forEach((b) =>
    b.addEventListener("click", () => {
      entretiens = entretiens.filter((e) => e.id !== b.dataset.edel);
      saveEntretiens();
      renderEntretien();
    })
  );
  document.querySelectorAll("[data-eedit]").forEach((b) =>
    b.addEventListener("click", () => {
      state.editingEntretienId = b.dataset.eedit;
      renderEntretien();
    })
  );
  document.querySelectorAll("[data-ecancel]").forEach((b) =>
    b.addEventListener("click", () => {
      state.editingEntretienId = null;
      renderEntretien();
    })
  );
  document.querySelectorAll("[data-esave]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.esave;
      const ent = entretiens.find((e) => e.id === id);
      if (ent) {
        ent.type = document.getElementById("__editEType_" + id).value.trim() || ent.type;
        ent.date = document.getElementById("__editEDate_" + id).value || ent.date;
        ent.km = document.getElementById("__editEKm_" + id).value || "";
        ent.nextDate = document.getElementById("__editENextDate_" + id).value || "";
        ent.nextKm = document.getElementById("__editENextKm_" + id).value || "";
        ent.detail = document.getElementById("__editEDetail_" + id).value.trim();
      }
      state.editingEntretienId = null;
      saveEntretiens();
      renderEntretien();
    })
  );
}

// ---------- Réglages (Supabase cloud sync settings) ----------
function renderReglages() {
  const view = document.getElementById("view");
  const cfg = getSbConfig() || { url: "", key: "", identifiant: "" };

  view.innerHTML = `
    <div class="view">
      <div class="card">
        <p class="reglages-title disp">Sauvegarde cloud (Supabase)</p>
        <p class="reglages-hint">
          Configure une fois ces informations pour que tes données soient sauvegardées automatiquement
          et récupérables même après un effacement des données du téléphone.
        </p>
      </div>

      <div class="card">
        <label>URL du projet Supabase</label>
        <input type="text" id="__sbUrl" placeholder="https://xxxxx.supabase.co" value="${escapeHtml(cfg.url)}" autocomplete="off" />
      </div>

      <div class="card">
        <label>Clé publique (anon / publishable)</label>
        <input type="text" id="__sbKey" placeholder="sb_publishable_... ou eyJ..." value="${escapeHtml(cfg.key)}" autocomplete="off" />
      </div>

      <div class="card">
        <label>Identifiant personnel (à retenir !)</label>
        <input type="text" id="__sbId" placeholder="Ex: nejib2026" value="${escapeHtml(cfg.identifiant)}" autocomplete="off" />
        <p class="reglages-hint">Choisis un mot que toi seul connais et note-le en sécurité. Il sert à retrouver tes données.</p>
      </div>

      <button class="save-btn ready" id="__sbSaveConfig" style="background:${TAB_COLORS.reglages};color:#12211F">
        Enregistrer les réglages
      </button>

      <div class="row2" style="margin-top:4px">
        <button class="month-btn sync-btn" id="__sbPush">↑ Sauvegarder maintenant</button>
        <button class="month-btn sync-btn" id="__sbPull">↓ Récupérer depuis le cloud</button>
      </div>

      <button class="month-btn sync-btn" id="__sbTest" style="width:100%">🔍 Tester la connexion (diagnostic)</button>

      ${syncStatus ? `<p class="reglages-status">${escapeHtml(syncStatus)}</p>` : ""}
    </div>
  `;

  document.getElementById("__sbSaveConfig").addEventListener("click", () => {
    const url = document.getElementById("__sbUrl").value.trim();
    const key = document.getElementById("__sbKey").value.trim();
    const identifiant = document.getElementById("__sbId").value.trim();
    if (!url || !key || !identifiant) {
      alert("Remplis les 3 champs (URL, clé, identifiant) avant d'enregistrer.");
      return;
    }
    saveSbConfig({ url, key, identifiant });
    syncStatus = "Réglages enregistrés ✓";
    renderReglages();
  });
  document.getElementById("__sbPush").addEventListener("click", () => pushToSupabase(false));
  document.getElementById("__sbPull").addEventListener("click", () => pullFromSupabase(false));
  document.getElementById("__sbTest").addEventListener("click", testSbConnection);
}

render();

// If this device has no local data yet (fresh install, or data was cleared)
// but Supabase credentials are already saved, try to silently restore
// the last cloud backup automatically.
if (entries.length === 0 && entretiens.length === 0 && getSbConfig()) {
  pullFromSupabase(true);
}

// ---------- Service worker registration ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
