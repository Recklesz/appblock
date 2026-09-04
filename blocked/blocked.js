const TOTAL_MS = 14_000;
const REVEAL_RADIUS_VMAX = 90;

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

function smoothStep(progress) {
  return progress * progress * (3 - 2 * progress);
}

function softCircle(radius, x, y, feather) {
  if (radius < 0.1) return "linear-gradient(transparent, transparent)";
  const innerRadius = Math.max(0, radius - feather);
  return `radial-gradient(circle ${radius}vmax at ${x}% ${y}%, #000 0, #000 ${innerRadius}vmax, transparent ${radius}vmax)`;
}

function revealImage(progress) {
  const eased = Math.pow(smoothStep(progress), 1.7);
  const drift = Math.sin(progress * Math.PI) * 4;
  const primaryRadius = eased * REVEAL_RADIUS_VMAX;
  const secondProgress = Math.max(0, (progress - 0.1) / 0.9);
  const thirdProgress = Math.max(0, (progress - 0.2) / 0.8);
  const masks = [
    softCircle(primaryRadius, 47 + drift, 53 - drift * 0.35, Math.min(16, primaryRadius)),
    softCircle(Math.pow(smoothStep(secondProgress), 1.7) * 64, 70, 35, 13),
    softCircle(Math.pow(smoothStep(thirdProgress), 1.7) * 58, 28, 72, 14)
  ].join(", ");

  imageReveal.style.webkitMaskImage = masks;
  imageReveal.style.maskImage = masks;
}

function completeBreath() {
  completed = true;
  revealImage(1);
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
  imageReveal.style.transform = `scale(${1.035 - progress * 0.035})`;
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

requestAnimationFrame(animate);
