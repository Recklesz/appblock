import { getState, normalizeSite, setState, uniqueSortedSites } from "../src/storage.js";

const enabledToggle = document.querySelector("#enabledToggle");
const addForm = document.querySelector("#addForm");
const siteInput = document.querySelector("#siteInput");
const bulkInput = document.querySelector("#bulkInput");
const saveBulkButton = document.querySelector("#saveBulkButton");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const siteList = document.querySelector("#siteList");
const count = document.querySelector("#count");

let state;

function render() {
  enabledToggle.checked = state.enabled;
  count.textContent = `${state.blockedSites.length} blocked`;
  bulkInput.value = state.blockedSites.join("\n");
  siteList.textContent = "";

  if (!state.blockedSites.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No blocked sites yet.";
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
    remove.addEventListener("click", () => saveSites(state.blockedSites.filter((entry) => entry !== site)));

    item.append(label, remove);
    siteList.append(item);
  }
}

async function saveSites(sites) {
  state = await setState({ ...state, blockedSites: uniqueSortedSites(sites) });
  render();
}

enabledToggle.addEventListener("change", async () => {
  state = await setState({ ...state, enabled: enabledToggle.checked });
  render();
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const site = normalizeSite(siteInput.value);
  if (!site) return;
  await saveSites([...state.blockedSites, site]);
  siteInput.value = "";
});

saveBulkButton.addEventListener("click", async () => {
  await saveSites(bulkInput.value.split(/\s+/));
});

exportButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.blockedSites.join("\n"));
  exportButton.textContent = "Copied";
  setTimeout(() => {
    exportButton.textContent = "Copy list";
  }, 1200);
});

clearButton.addEventListener("click", async () => {
  await saveSites([]);
});

async function init() {
  state = await getState();
  render();
}

init();
