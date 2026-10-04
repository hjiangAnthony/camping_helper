const LOOP_COLORS = {
  BEAR: "#765044",
  DUCK: "#496e79",
  SQUI: "#b66a2a",
  RABB: "#657244",
  COYO: "#8a6745",
  OWL: "#665d7d",
  FISH: "#47758a",
  DEER: "#7a5e4d",
  GULL: "#477b70"
};

const HOST_COLOR = "#8a8d87";
const LABEL_ZOOM = 18;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function isHost(site) {
  return /HOST/i.test(String(site));
}

async function initCampgroundMap() {
  const response = await fetch("data/oh-ridge-campsites.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load campsite data: ${response.status}`);
  const sites = await response.json();

  const map = L.map("campsite-map", {
    zoomControl: true,
    scrollWheelZoom: true
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    referrerPolicy: "origin",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markers = [];
  const bounds = [];

  sites.forEach(site => {
    const host = isHost(site.site);
    const fillColor = host ? HOST_COLOR : (LOOP_COLORS[site.loop] || "#465846");

    const marker = L.circleMarker([site.lat, site.lng], {
      radius: host ? 5 : 6,
      color: "#fffdf9",
      weight: 1.5,
      fillColor,
      fillOpacity: host ? 0.82 : 0.94
    });

    const label = `Site ${escapeHtml(site.site)} · ${escapeHtml(site.loop)} Loop`;
    marker.bindTooltip(label, {
      direction: "top",
      offset: [0, -6],
      className: "campsite-label",
      opacity: 1
    });

    marker.bindPopup(`
      <div class="campsite-popup">
        <strong>Site ${escapeHtml(site.site)}</strong>
        <span>${escapeHtml(site.loop)} Loop${host ? " · HOST" : ""}</span>
      </div>
    `);

    marker.on("mouseover", () => marker.openTooltip());
    marker.on("mouseout", () => {
      if (map.getZoom() < LABEL_ZOOM) marker.closeTooltip();
    });

    marker.addTo(map);
    markers.push(marker);
    bounds.push([site.lat, site.lng]);
  });

  const allBounds = L.latLngBounds(bounds);

  function fitAll() {
    map.fitBounds(allBounds, {
      padding: [28, 28],
      maxZoom: 17
    });
  }

  function updateLabels() {
    const show = map.getZoom() >= LABEL_ZOOM;
    markers.forEach(marker => {
      if (show) marker.openTooltip();
      else marker.closeTooltip();
    });
  }

  map.on("zoomend", updateLabels);
  document.querySelector("#fit-map")?.addEventListener("click", fitAll);

  const loops = [...new Set(sites.map(site => site.loop))].sort();
  document.querySelector("#site-count").textContent = `${sites.length} 个 campsite`;
  document.querySelector("#loop-count").textContent = `${loops.length} 个 loop`;

  document.querySelector("#loop-legend").innerHTML = [
    ...loops.map(loop => `
      <span class="loop-key">
        <span class="loop-dot" style="background:${LOOP_COLORS[loop] || "#465846"}"></span>
        ${escapeHtml(loop)}
      </span>
    `),
    `<span class="loop-key"><span class="loop-dot" style="background:${HOST_COLOR}"></span>HOST</span>`
  ].join("");

  fitAll();
  setTimeout(() => map.invalidateSize(), 0);
}

initCampgroundMap().catch(error => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin",
    `<div style="padding:12px;background:#7f1d1d;color:white;text-align:center">营地地图加载失败：${escapeHtml(error.message)}</div>`);
});
