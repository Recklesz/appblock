import {
  getState,
  normalizeSite,
  setState,
  uniqueSortedSites
} from "../src/storage.js";

const currentSite = document.querySelector("#currentSite");
const currentAction = document.querySelector("#currentAction");
const addForm = document.querySelector("#addForm");
const siteInput = document.querySelector("#siteInput");
const bulkInput = document.querySelector("#bulkInput");
const saveBulkButton = document.querySelector("#saveBulkButton");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const siteList = document.querySelector("#siteList");
const count = document.querySelector("#count");

const blockedPageUrl = chrome.runtime.getURL("blocked/blocked.html");

let state;
let activeContext = {
  tabId: null,
  site: "",
  mode: "none",
  originalUrl: ""
};

function isHttpUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function getActiveContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    return { tabId: null, site: "", mode: "none", originalUrl: "" };
  }

  try {
    const url = new URL(tab.url);
    if (tab.url.startsWith(blockedPageUrl)) {
      const site = normalizeSite(url.searchParams.get("site"));
      const originalUrl = url.searchParams.get("url") || "";

      return {
        tabId: tab.id,
        site,
        mode: site ? "blocked" : "none",
        originalUrl: isHttpUrl(originalUrl) ? originalUrl : ""
      };
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      return { tabId: tab.id, site: "", mode: "none", originalUrl: "" };
    }

    return {
      tabId: tab.id,
      site: normalizeSite(url.hostname),
      mode: "normal",
      originalUrl: tab.url
    };
  } catch {
    return { tabId: tab.id, site: "", mode: "none", originalUrl: "" };
  }
}

function renderList() {
  count.textContent = String(state.blockedSites.length);
  siteList.textContent = "";

  if (!state.blockedSites.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No blocked sites yet";
    siteList.append(empty);
    return;
  }

  for (const site of state.blockedSites) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const remove = document.createElement("button");

    label.textContent = site;
    remove.className = "remove";
    remove.type = "button";
    remove.title = `Unblock ${site}`;
    remove.textContent = "×";
    remove.addEventListener("click", () => removeSite(site));

    item.append(label, remove);
    siteList.append(item);
  }
}

function render() {
  const currentBlocked =
    activeContext.mode === "blocked" || state.blockedSites.includes(activeContext.site);

  currentSite.textContent = activeContext.site || "No website tab detected";
  currentAction.disabled = !activeContext.tabId || !activeContext.site;
  currentAction.textContent = currentBlocked ? "Unblock" : "Block";
  bulkInput.value = state.blockedSites.join("\n");

  renderList();
}

async function saveBlockedSites(blockedSites) {
  state = await setState({ ...state, blockedSites: uniqueSortedSites(blockedSites) });
  render();
}

async function addSite(site) {
  const normalized = normalizeSite(site);
  if (!normalized) return;
  await saveBlockedSites([...state.blockedSites, normalized]);
}

async function removeSite(site) {
  await saveBlockedSites(state.blockedSites.filter((blockedSite) => blockedSite !== site));
}

currentAction.addEventListener("click", async () => {
  if (!activeContext.tabId || !activeContext.site) return;

  const currentBlocked =
    activeContext.mode === "blocked" || state.blockedSites.includes(activeContext.site);

  if (currentBlocked) {
    await removeSite(activeContext.site);

    if (activeContext.mode === "blocked") {
      await chrome.tabs.update(activeContext.tabId, {
        url: activeContext.originalUrl || `https://${activeContext.site}/`
      });
    } else {
      await chrome.tabs.reload(activeContext.tabId);
    }
  } else {
    await addSite(activeContext.site);
    await chrome.tabs.reload(activeContext.tabId);
  }
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await addSite(siteInput.value);
  siteInput.value = "";
});

saveBulkButton.addEventListener("click", async () => {
  await saveBlockedSites(bulkInput.value.split(/\s+/));
});

exportButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.blockedSites.join("\n"));
  exportButton.textContent = "Copied";
  setTimeout(() => {
    exportButton.textContent = "Copy list";
  }, 1200);
});

clearButton.addEventListener("click", async () => {
  await saveBlockedSites([]);
});

async function init() {
  [state, activeContext] = await Promise.all([getState(), getActiveContext()]);
  render();
}

init();
