import { getState, normalizeSite, siteMatchesHostname } from "./storage.js";

const blockedPageUrl = chrome.runtime.getURL("blocked/blocked.html");

function isBlockableUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function redirectIfBlocked(details) {
  if (details.frameId !== 0 || !isBlockableUrl(details.url)) return;

  const state = await getState();
  const url = new URL(details.url);
  const hostname = normalizeSite(url.hostname);
  const matchedSite = state.blockedSites.find((site) => siteMatchesHostname(site, hostname));

  if (!matchedSite) return;

  const redirectUrl = `${blockedPageUrl}?site=${encodeURIComponent(matchedSite)}&url=${encodeURIComponent(details.url)}`;
  try {
    await chrome.tabs.update(details.tabId, { url: redirectUrl });
  } catch {
    // The tab may have closed or navigated again before the async storage check finished.
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(redirectIfBlocked);
