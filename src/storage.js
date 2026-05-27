const DEFAULT_STATE = {
  blockedSites: []
};

export async function getState() {
  const stored = await chrome.storage.local.get(DEFAULT_STATE);
  return {
    blockedSites: Array.isArray(stored.blockedSites) ? stored.blockedSites : []
  };
}

export async function setState(nextState) {
  await chrome.storage.local.set(nextState);
  return getState();
}

export async function updateState(updater) {
  const state = await getState();
  const nextState = updater(state);
  return setState(nextState);
}

export function normalizeSite(input) {
  const value = String(input || "").trim().toLowerCase();
  if (!value) return "";

  let hostname = value;

  try {
    hostname = new URL(value.includes("://") ? value : `https://${value}`).hostname;
  } catch {
    hostname = value.split("/")[0];
  }

  return hostname
    .replace(/^www\./, "")
    .replace(/^\*+\./, "")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/\.+$/g, "");
}

export function siteMatchesHostname(site, hostname) {
  const normalizedSite = normalizeSite(site);
  const normalizedHost = normalizeSite(hostname);

  return (
    Boolean(normalizedSite) &&
    (normalizedHost === normalizedSite || normalizedHost.endsWith(`.${normalizedSite}`))
  );
}

export function uniqueSortedSites(sites) {
  return [...new Set(sites.map(normalizeSite).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}
