const params = new URLSearchParams(location.search);
const site = params.get("site") || "this website";

document.querySelector("#site").textContent = site;
