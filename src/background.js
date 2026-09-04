import { getState, normalizeSite, siteMatchesHostname } from "./storage.js";

const blockedPageUrl = chrome.runtime.getURL("blocked/blocked.html");
const BYPASS_KEY = "breathingBypass";
const BYPASS_LIFETIME_MS = 15_000;

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

  const stored = await chrome.storage.session.get(BYPASS_KEY);
  const bypass = stored[BYPASS_KEY];
  const canBypass =
    bypass?.tabId === details.tabId &&
    bypass?.site === matchedSite &&
    bypass?.expiresAt > Date.now();

  if (canBypass) {
    await chrome.storage.session.remove(BYPASS_KEY);
    return;
  }

  const redirectUrl = `${blockedPageUrl}?site=${encodeURIComponent(matchedSite)}&url=${encodeURIComponent(details.url)}`;
  try {
    await chrome.tabs.update(details.tabId, { url: redirectUrl });
  } catch {
    // The tab may have closed or navigated again before the async storage check finished.
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(redirectIfBlocked);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "continueAfterBreath") return false;

  (async () => {
    const tabId = sender.tab?.id;
    const site = normalizeSite(message.site);
    const originalUrl = message.url;

    if (!tabId || !site || !isBlockableUrl(originalUrl)) {
      sendResponse({ ok: false, error: "This page could not be opened." });
      return;
    }

    const destination = new URL(originalUrl);
    if (!siteMatchesHostname(site, destination.hostname)) {
      sendResponse({ ok: false, error: "The destination did not match the paused site." });
      return;
    }

    await chrome.storage.session.set({
      [BYPASS_KEY]: {
        tabId,
        site,
        expiresAt: Date.now() + BYPASS_LIFETIME_MS
      }
    });

    await chrome.tabs.update(tabId, { url: originalUrl });
    sendResponse({ ok: true });
  })().catch(() => {
    sendResponse({ ok: false, error: "Something went wrong. Please try again." });
  });

  return true;
});
