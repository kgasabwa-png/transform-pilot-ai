const API_BASE = "https://transform-pilot-ai.lovable.app";
const APP_URL = `${API_BASE}/app`;
const SETTINGS_URL = `${API_BASE}/app/settings`;

const app = document.getElementById("app");

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

function header() {
  return el("header", {}, [
    el("div", { class: "brand" }, [
      el("div", { class: "mark" }, [el("div", { class: "dot" })]),
      "Nyvlo",
    ]),
    el("a", { class: "link", href: APP_URL, target: "_blank" }, "Open app →"),
  ]);
}

function fmtRel(iso) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.abs(t - now);
  const past = t < now;
  const mins = Math.round(diff / 60000);
  const hrs = Math.round(mins / 60);
  if (hrs < 1) return past ? `${mins}m ago` : `in ${mins}m`;
  if (hrs < 24) return past ? `${hrs}h ago` : `in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return past ? `${days}d ago` : `in ${days}d`;
}

function renderSetup(errorMsg) {
  app.innerHTML = "";
  app.appendChild(header());
  const input = el("input", {
    type: "text",
    placeholder: "nyv_...",
    autocomplete: "off",
  });
  const errEl = el("div", { class: "error" }, errorMsg || "");
  const save = el(
    "button",
    {
      onclick: async () => {
        const token = input.value.trim();
        if (!token.startsWith("nyv_")) {
          errEl.textContent = "Token should start with nyv_";
          return;
        }
        await chrome.storage.local.set({ nyvlo_token: token });
        await load();
      },
    },
    "Save token",
  );
  app.appendChild(
    el("div", { class: "setup" }, [
      el("p", {}, "Paste your Nyvlo extension token to connect this browser."),
      input,
      el("div", { style: "display:flex; gap:6px; align-items:center;" }, [
        save,
        el("a", { class: "btn btn-ghost", href: SETTINGS_URL, target: "_blank" }, "Get token"),
      ]),
      errEl,
    ]),
  );
}

function renderDashboard(data) {
  app.innerHTML = "";
  app.appendChild(header());

  const main = el("main");

  const reliability = data.reliability;
  const score = reliability && reliability.score != null
    ? `${Math.round(Number(reliability.score) * 100)}%`
    : "—";
  const hint = reliability
    ? `${reliability.kept} kept · ${reliability.missed} missed`
    : "Building history";

  main.appendChild(
    el("div", { class: "stat" }, [
      el("div", {}, [
        el("div", { class: "stat-label" }, "Reliability"),
        el("div", { class: "stat-hint" }, hint),
      ]),
      el("div", { class: "stat-value" }, score),
    ]),
  );

  main.appendChild(el("h3", {}, "Today + overdue"));

  if (!data.promises || data.promises.length === 0) {
    main.appendChild(el("div", { class: "empty" }, "Inbox zero. Nothing slipping."));
  } else {
    for (const p of data.promises) {
      const overdue = p.due_at && new Date(p.due_at).getTime() < Date.now();
      main.appendChild(
        el("div", { class: "promise" }, [
          el("div", { class: "promise-title" }, p.summary || "(untitled)"),
          el("div", { class: "promise-meta" + (overdue ? " overdue" : "") }, [
            overdue ? "Overdue · " : "Due ",
            p.due_at ? fmtRel(p.due_at) : "no date",
            p.owed_to ? ` · ${p.owed_to}` : "",
          ]),
        ]),
      );
    }
  }

  app.appendChild(main);

  app.appendChild(
    el("footer", {}, [
      el("a", { class: "link", href: APP_URL, target: "_blank" }, "All promises"),
      el(
        "a",
        {
          class: "link",
          href: "#",
          onclick: async (e) => {
            e.preventDefault();
            await chrome.storage.local.remove("nyvlo_token");
            renderSetup();
          },
        },
        "Disconnect",
      ),
    ]),
  );
}

function renderLoading() {
  app.innerHTML = "";
  app.appendChild(header());
  app.appendChild(el("div", { class: "empty" }, "Loading…"));
}

async function load() {
  renderLoading();
  const { nyvlo_token } = await chrome.storage.local.get("nyvlo_token");
  if (!nyvlo_token) return renderSetup();

  try {
    const res = await fetch(`${API_BASE}/api/public/extension/today`, {
      headers: { Authorization: `Bearer ${nyvlo_token}` },
    });
    if (res.status === 401) {
      await chrome.storage.local.remove("nyvlo_token");
      return renderSetup("That token isn't valid. Generate a new one.");
    }
    if (!res.ok) throw new Error(`Failed (${res.status})`);
    const data = await res.json();
    renderDashboard(data);
  } catch (e) {
    app.innerHTML = "";
    app.appendChild(header());
    app.appendChild(el("div", { class: "empty error" }, e.message || "Network error"));
  }
}

load();
