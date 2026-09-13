import { createDissolve } from "./dissolve.js";

const TOTAL_MS = 14_000;

const backgrounds = ["jose", "slipper", "beavers"];
const params = new URLSearchParams(location.search);
const site = params.get("site") || "this website";
const originalUrl = params.get("url") || `https://${site}/`;

const pause = document.querySelector(".pause");
const siteLabel = document.querySelector("#site");
const breathCue = document.querySelector("#breathCue");
const imageReveal = document.querySelector("#imageReveal");
const haze = document.querySelector("#haze");
const decision = document.querySelector("#decision");
const continueButton = document.querySelector("#continueButton");
const leaveButton = document.querySelector("#leaveButton");
const status = document.querySelector("#status");

pause.dataset.background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
siteLabel.textContent = site;

let startTime;
let completed = false;
let dissolve;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function revealImage(progress) {
  if (dissolve && !reducedMotion.matches) dissolve.render(progress);
  else {
    dissolve?.dispose();
    dissolve = null;
    imageReveal.style.opacity = String(progress * progress * (3 - 2 * progress));
  }
}

function completeBreath() {
  completed = true;
  revealImage(1);
  dissolve?.dispose();
  dissolve = null;
  imageReveal.style.opacity = "1";
  imageReveal.style.transform = "scale(1)";
  haze.style.opacity = "0";
  breathCue.classList.add("is-complete");
  breathCue.setAttribute("aria-hidden", "true");
  decision.classList.add("is-visible");
  decision.setAttribute("aria-hidden", "false");
  continueButton.disabled = false;
  window.setTimeout(() => continueButton.focus({ preventScroll: true }), 420);
}

function animate(now) {
  if (!startTime) startTime = now;
  const elapsed = Math.min(now - startTime, TOTAL_MS);
  const progress = elapsed / TOTAL_MS;
  revealImage(progress);
  imageReveal.style.transform = reducedMotion.matches ? "none" : `scale(${1.035 - progress * 0.035})`;
  haze.style.opacity = String(0.26 * (1 - progress));

  if (elapsed >= TOTAL_MS) {
    completeBreath();
    return;
  }

  requestAnimationFrame(animate);
}

continueButton.addEventListener("click", async () => {
  if (!completed) return;

  continueButton.disabled = true;
  status.textContent = `Opening ${site}\u2026`;

  const response = await chrome.runtime.sendMessage({
    type: "continueAfterBreath",
    site,
    url: originalUrl
  });

  if (!response?.ok) {
    continueButton.disabled = false;
    status.textContent = response?.error || "Please try again.";
  }
});

leaveButton.addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
  } else {
    location.href = "about:blank";
  }
});

async function start() {
  if (!reducedMotion.matches) {
    dissolve = await createDissolve(imageReveal, `../assets/${pause.dataset.background}-blocked-bg.png`);
  }
  requestAnimationFrame(animate);
}

start();
