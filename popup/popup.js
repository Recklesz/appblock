import {
  getState,
  isBlockingActive,
  normalizeSite,
  setState,
  uniqueSortedSites
} from "../src/storage.js";

const enabledToggle = document.querySelector("#enabledToggle");
const statusTitle = document.querySelector("#statusTitle");
const currentSite = document.querySelector("#currentSite");
const currentAction = document.querySelector("#currentAction");
const addForm = document.querySelector("#addForm");
const siteInput = document.querySelector("#siteInput");
const optionsButton = document.querySelector("#optionsButton");
const siteList = document.querySelector("#siteList");
const count = document.querySelector("#count");

let state;
let activeSite = "";

async function getActiveSite() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return "";

  try {
    const url = new URL(tab.url);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return normalizeSite(url.hostname);
  } catch {
    return "";
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

  for (const site of state.blockedSites.slice(0, 6)) {
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
  const active = isBlockingActive(state);
  const currentBlocked = state.blockedSites.includes(activeSite);

  enabledToggle.checked = state.enabled;
  statusTitle.textContent = active ? "Blocking is on" : "Blocking is off";
  currentSite.textContent = activeSite || "No website tab detected";
  currentAction.disabled = !activeSite;
  currentAction.textContent = currentBlocked ? "Unblock" : "Block";

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

enabledToggle.addEventListener("change", async () => {
  state = await setState({
    ...state,
    enabled: enabledToggle.checked
  });
  render();
});

currentAction.addEventListener("click", async () => {
  if (!activeSite) return;
  if (state.blockedSites.includes(activeSite)) {
    await removeSite(activeSite);
  } else {
    await addSite(activeSite);
  }
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await addSite(siteInput.value);
  siteInput.value = "";
});

optionsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());

async function init() {
  [state, activeSite] = await Promise.all([getState(), getActiveSite()]);
  render();
}

init();
