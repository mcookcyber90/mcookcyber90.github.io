const STORAGE = {
  mode: "mc-portfolio-mode",
  missions: "mc-local-mission-drafts",
  vocabulary: "mc-local-vocabulary-drafts"
};

let publishedMissions = [];
let publishedVocabulary = [];

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function safeText(value = "") {
  const span = document.createElement("span");
  span.textContent = String(value);
  return span.innerHTML;
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `mission-${Date.now()}`;
}

function safeHref(value, allowRelative = false) {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  if (allowRelative && /^(?:reports|assets)\/[a-zA-Z0-9._/-]+$/.test(candidate)) return candidate;
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function setMode(mode, remember = true) {
  const finalMode = mode === "recruiter" ? "recruiter" : "classified";
  document.body.dataset.mode = finalMode;
  $$('[data-set-mode]').forEach(button => button.setAttribute("aria-pressed", String(button.dataset.setMode === finalMode)));
  $$('[data-classified][data-recruiter]').forEach(element => {
    element.textContent = element.dataset[finalMode];
  });
  if (remember) localStorage.setItem(STORAGE.mode, finalMode);
}

function missionCard(mission, index) {
  const mode = document.body.dataset.mode;
  const titleTop = mode === "classified" ? mission.codeName : mission.title;
  const titleMain = mode === "classified" ? mission.title : mission.codeName;
  const tools = Array.isArray(mission.tools) ? mission.tools.join(" · ") : mission.tools;
  const repositoryHref = safeHref(mission.repository);
  const reportHref = safeHref(mission.report, true);
  const repository = repositoryHref
    ? `<a href="${safeText(repositoryHref)}" target="_blank" rel="noreferrer">Repository</a>`
    : `<a href="#" aria-disabled="true">Repository pending</a>`;
  const report = reportHref
    ? `<a href="${safeText(reportHref)}" target="_blank" rel="noreferrer">View report</a>`
    : `<a href="#" aria-disabled="true">Report pending</a>`;

  return `<article class="mission-card" data-index="${String(index + 1).padStart(2, "0")}" data-domain="${safeText(mission.domain)}">
    <div class="mission-card-header">
      <span class="mission-code">${safeText(titleTop)}</span>
      <span class="mission-status ${safeText(mission.status)}">${safeText(mission.status.replace("-", " "))}</span>
    </div>
    <div>
      <h3>${safeText(titleMain)}</h3>
      <p class="mission-domain">${safeText(mission.domain)}</p>
    </div>
    <p class="mission-summary">${safeText(mission.summary)}</p>
    <div>
      <p class="mission-tools"><b>Tools:</b> ${safeText(tools)}</p>
      <div class="card-actions">${repository}${report}</div>
    </div>
  </article>`;
}

function renderMissions() {
  const missions = [...publishedMissions, ...readLocal(STORAGE.missions)];
  $("#mission-grid").innerHTML = missions.map(missionCard).join("");
}

function termCard(item) {
  return `<article class="term-card">
    <header><h3>${safeText(item.term)}</h3><span class="abbreviation">${safeText(item.abbreviation)}</span></header>
    <p class="term-category">${safeText(item.category)}</p>
    <p class="term-definition">${safeText(item.definition)}</p>
    ${item.example ? `<p class="term-example"><b>Analyst note:</b> ${safeText(item.example)}</p>` : ""}
  </article>`;
}

function allVocabulary() {
  return [...publishedVocabulary, ...readLocal(STORAGE.vocabulary)];
}

function updateCategoryOptions() {
  const select = $("#vault-category");
  const current = select.value;
  const categories = [...new Set(allVocabulary().map(item => item.category))].sort();
  select.innerHTML = `<option value="all">All categories</option>${categories.map(category => `<option value="${safeText(category)}">${safeText(category)}</option>`).join("")}`;
  select.value = categories.includes(current) ? current : "all";
}

function renderVocabulary() {
  const query = $("#vault-search").value.trim().toLowerCase();
  const category = $("#vault-category").value;
  const filtered = allVocabulary().filter(item => {
    const searchable = `${item.term} ${item.abbreviation} ${item.category} ${item.definition} ${item.example}`.toLowerCase();
    return (!query || searchable.includes(query)) && (category === "all" || item.category === category);
  });
  $("#vocabulary-grid").innerHTML = filtered.map(termCard).join("");
  $("#vault-empty").hidden = filtered.length > 0;
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`${filename} exported. Replace the matching file in your GitHub data folder to publish.`);
}

function downloadText(filename, value) {
  const blob = new Blob([value], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`${filename} exported. Review and redact it before publishing.`);
}

function linesToMarkdown(value, fallback = "To be completed.") {
  const lines = String(value || "").split("\n").map(line => line.trim()).filter(Boolean);
  return lines.length ? lines.map(line => `- ${line}`).join("\n") : fallback;
}

function missionReportMarkdown(mission) {
  const tools = Array.isArray(mission.tools) ? mission.tools.join(", ") : mission.tools;
  return `# ${mission.codeName}\n\n## Professional Project Title\n\n${mission.title}\n\n## Status\n\n${mission.status.replace("-", " ")}\n\n## Cybersecurity Domain\n\n${mission.domain}\n\n## Executive Summary\n\n${mission.summary || "To be completed."}\n\n## Mission Objective\n\n${mission.objective || "To be completed."}\n\n## Lab Environment\n\n${mission.environment || "To be completed."}\n\n## Tools Used\n\n${tools || "To be completed."}\n\n## Investigation Steps\n\n${linesToMarkdown(mission.steps)}\n\n## Findings and Evidence\n\n${mission.findings || "To be completed."}\n\n## MITRE ATT&CK Mapping\n\n${mission.mitre || "Not applicable or to be completed."}\n\n## Remediation Recommendations\n\n${linesToMarkdown(mission.remediation)}\n\n## Lessons Learned\n\n${mission.lessons || "To be completed."}\n\n## Supporting Links\n\n- Repository: ${mission.repository || "To be added"}\n- Published report: ${mission.report || "To be added"}\n\n---\n\n> Before publishing: remove passwords, personal information, sensitive IP addresses, restricted lab answers, and information you do not have permission to share.\n`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 4800);
}

function updateDraftStatus() {
  const missions = readLocal(STORAGE.missions).length;
  const terms = readLocal(STORAGE.vocabulary).length;
  $("#draft-status").textContent = `${missions} local mission draft${missions === 1 ? "" : "s"} · ${terms} local vocabulary draft${terms === 1 ? "" : "s"}`;
}

function openOwnerTools() {
  updateDraftStatus();
  $("#owner-tools").showModal();
}

function wireInteractions() {
  $$('[data-set-mode]').forEach(button => button.addEventListener("click", () => {
    setMode(button.dataset.setMode);
    renderMissions();
  }));

  const mobileMenu = $(".mobile-menu");
  mobileMenu.addEventListener("click", () => {
    const open = $("#main-nav").classList.toggle("open");
    mobileMenu.setAttribute("aria-expanded", String(open));
  });
  $$("#main-nav a").forEach(link => link.addEventListener("click", () => {
    $("#main-nav").classList.remove("open");
    mobileMenu.setAttribute("aria-expanded", "false");
  }));

  $$('.disabled-link').forEach(link => link.addEventListener("click", event => event.preventDefault()));
  $$('[data-open-owner-tools]').forEach(button => button.addEventListener("click", openOwnerTools));

  $("#vault-search").addEventListener("input", renderVocabulary);
  $("#vault-category").addEventListener("change", renderVocabulary);

  $("#mission-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const draft = {
      id: slugify(data.codeName || data.title),
      codeName: data.codeName.trim(),
      title: data.title.trim(),
      domain: data.domain,
      status: data.status,
      tools: data.tools.split(",").map(item => item.trim()).filter(Boolean),
      summary: data.summary.trim(),
      objective: data.objective.trim(),
      environment: data.environment.trim(),
      steps: data.steps.trim(),
      findings: data.findings.trim(),
      mitre: data.mitre.trim(),
      remediation: data.remediation.trim(),
      lessons: data.lessons.trim(),
      repository: data.repository.trim(),
      report: data.report.trim()
    };
    const drafts = readLocal(STORAGE.missions);
    drafts.push(draft);
    writeLocal(STORAGE.missions, drafts);
    event.currentTarget.reset();
    updateDraftStatus();
    renderMissions();
    showToast("Mission draft saved on this device. Export missions.json when ready to publish.");
  });

  $("#vocabulary-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const draft = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.trim()]));
    const drafts = readLocal(STORAGE.vocabulary);
    drafts.push(draft);
    writeLocal(STORAGE.vocabulary, drafts);
    event.currentTarget.reset();
    updateDraftStatus();
    updateCategoryOptions();
    renderVocabulary();
    showToast("Vocabulary draft saved on this device. Export vocabulary.json when ready to publish.");
  });

  $("#export-missions").addEventListener("click", () => downloadJson("missions.json", [...publishedMissions, ...readLocal(STORAGE.missions)]));
  $("#export-latest-report").addEventListener("click", () => {
    const drafts = readLocal(STORAGE.missions);
    const mission = drafts.at(-1);
    if (!mission) {
      showToast("Save a mission draft first, then export its report.");
      return;
    }
    downloadText(`${slugify(mission.codeName)}-report.md`, missionReportMarkdown(mission));
  });
  $("#export-vocabulary").addEventListener("click", () => downloadJson("vocabulary.json", allVocabulary()));
  $("#clear-local-drafts").addEventListener("click", () => {
    if (!confirm("Clear all browser-only mission and vocabulary drafts? Published GitHub files will not be affected.")) return;
    localStorage.removeItem(STORAGE.missions);
    localStorage.removeItem(STORAGE.vocabulary);
    updateDraftStatus();
    updateCategoryOptions();
    renderMissions();
    renderVocabulary();
    showToast("Browser-only drafts cleared.");
  });

  $$('.map-node').forEach(node => node.addEventListener("click", () => {
    const card = $(`.mission-card[data-domain*="${node.dataset.focus === "network" ? "Network" : node.dataset.focus === "vulnerability" ? "Vulnerability" : "Threat"}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    card?.animate([{ boxShadow: "0 0 0 rgba(208,163,77,0)" }, { boxShadow: "0 0 35px rgba(208,163,77,.48)" }, { boxShadow: "0 0 0 rgba(208,163,77,0)" }], { duration: 1100 });
  }));
}

async function initialize() {
  try {
    [publishedMissions, publishedVocabulary] = await Promise.all([
      loadJson("data/missions.json"),
      loadJson("data/vocabulary.json")
    ]);
  } catch (error) {
    console.error(error);
    showToast("Some portfolio data could not be loaded. Try refreshing the page.");
  }

  const requestedMode = new URLSearchParams(location.search).get("mode");
  const rememberedMode = localStorage.getItem(STORAGE.mode);
  setMode(requestedMode || rememberedMode || "classified", false);
  renderMissions();
  updateCategoryOptions();
  renderVocabulary();
  wireInteractions();
  $("#year").textContent = new Date().getFullYear();
}

initialize();
