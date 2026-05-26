const params = new URLSearchParams(location.search);
const site = params.get("site") || "this website";
const backgrounds = ["jose", "slipper"];
const selectedBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

document.querySelector(".blocked").dataset.background = selectedBackground;
document.querySelector("#site").textContent = site;
