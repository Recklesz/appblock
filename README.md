# Breathe Before Browsing

A small unpacked Chrome extension inspired by One Sec. It inserts one intentional 10-second breath before a distracting website opens, then lets you choose whether to continue.

## Features

- Block or unblock the current website from the popup, with the active tab reloading immediately.
- Add domains manually, for example `youtube.com`.
- Open **More** in the popup for manual add, bulk edit, copy, clear, and per-site removal.
- Manage the full list from the options page when opened from extension details.
- Guide users through a calm 4-second inhale and 6-second exhale before revealing the continue action.
- Grant one intentional visit without removing the site from the blocked list, so the pause returns next time.
- Start with `x.com` blocked on a fresh installation.

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
