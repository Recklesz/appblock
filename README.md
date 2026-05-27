# Local Site Blocker

A small unpacked Chrome extension for local website blocking. It is inspired by AppBlock's basic desktop behavior: keep a local list of distracting domains, block matching sites and subdomains, and unblock only through the extension UI.

## Features

- Block or unblock the current website from the popup, with the active tab reloading immediately.
- Add domains manually, for example `youtube.com`.
- Open **More** in the popup for manual add, bulk edit, copy, clear, and per-site removal.
- Manage the full list from the options page when opened from extension details.
- Redirect blocked pages to a local extension page with randomized background art.

## Load Locally

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select `/Users/ivelinkozarev/PycharmProjects/appblock`.
5. Pin **Local Site Blocker** from Chrome's extensions menu.

## Notes

- Blocking is local to the Chrome profile where the extension is loaded.
- A blocked entry such as `example.com` also blocks `www.example.com` and `docs.example.com`.
- The extension does not collect or send browsing data anywhere.
