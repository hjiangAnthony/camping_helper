const state = { data: null, placesById: {}, activePlaceId: "oh-ridge", activeDay: 1 };

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function googleSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function googleEmbedUrl(query) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric", day: "numeric", weekday: "short"
  }).format(date);
}

function priorityClass(priority) {
  if (priority === "必去") return "priority--must";
  if (priority === "基地") return "priority--base";
  if (priority === "推荐") return "priority--recommended";
  if (priority === "可删" || priority === "机动") return "priority--optional";
  return "priority--supply";
}

function typeClass(type) {
  if (["drive", "scenic", "camp", "meal", "flex"].includes(type)) return `type-${type}`;
  return "";
}

function typeLabel(type) {
  return ({
    drive: "驾驶", scenic: "游玩", camp: "营地", meal: "餐饮", flex: "机动", stop: "短停"
  })[type] || type;
}

function setActivePlace(placeId, scroll = false) {
  const place = state.placesById[placeId];
  if (!place) return;
  state.activePlaceId = placeId;

  const frame = $("#place-map-frame");
  frame.src = googleEmbedUrl(place.query);

  $("#active-place-link").href = googleSearchUrl(place.query);
  $("#active-place").innerHTML = `
    <h3>${escapeHtml(place.name)}</h3>
    <p>${escapeHtml(place.area)} · ${escapeHtml(place.category)}</p>
    <p>${escapeHtml(place.note)}</p>
    <p><strong>坐标</strong> ${place.lat}, ${place.lng}</p>
  `;

  document.querySelectorAll("[data-place-pill]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.placePill === placeId);
  });

  if (scroll) $("#map").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHero() {
  const { trip } = state.data;
  $("#trip-title").textContent = trip.title;
  $("#trip-eyebrow").textContent = trip.eyebrow;
  $("#trip-dates").textContent = `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`;
  $("#trip-base").textContent = `🏕 ${trip.baseCamp}`;
  $("#trip-departure").textContent = `🚗 ${trip.departure}`;
  $("#strategy-title").textContent = state.data.strategy.title;
  $("#strategy-text").textContent = state.data.strategy.text;
}

function renderMap() {
  const featured = ["oh-ridge","june-lake","silver-lake","twin-lakes","lake-mary","lake-george","lee-vining","tenaya-lake","olmsted-point"];
  $("#map-place-pills").innerHTML = featured
    .map(id => state.placesById[id])
    .filter(Boolean)
    .map(place => `<button class="place-pill" data-place-pill="${escapeHtml(place.id)}">${escapeHtml(place.name)}</button>`)
    .join("");

  $("#map-place-pills").addEventListener("click", event => {
    const button = event.target.closest("[data-place-pill]");
    if (button) setActivePlace(button.dataset.placePill);
  });

  setActivePlace(state.activePlaceId);
}

function renderDays() {
  const tabs = $("#day-tabs");
  const panels = $("#day-panels");

  tabs.innerHTML = state.data.days.map(day => `
    <button class="day-tab" role="tab" aria-selected="${day.day === state.activeDay}" data-day-tab="${day.day}">
      Day ${day.day} · ${formatDate(day.date)}
    </button>
  `).join("");

  panels.innerHTML = state.data.days.map(day => {
    const rows = day.items.map(item => {
      const links = (item.placeIds || [])
        .map(id => state.placesById[id])
        .filter(Boolean)
        .map(place => `<button class="place-link" data-place-open="${escapeHtml(place.id)}">${escapeHtml(place.name)}</button>`)
        .join("");

      return `
        <tr>
          <td>${escapeHtml(item.time)}</td>
          <td><span class="type-badge ${typeClass(item.type)}">${escapeHtml(typeLabel(item.type))}</span></td>
          <td>
            <span class="item-title">${escapeHtml(item.title)}</span>
            <span class="item-detail">${escapeHtml(item.detail)}</span>
          </td>
          <td><div class="place-links">${links || "—"}</div></td>
        </tr>
      `;
    }).join("");

    return `
      <article class="day-panel" data-day-panel="${day.day}" ${day.day === state.activeDay ? "" : "hidden"}>
        <div class="day-panel__head">
          <div>
            <div class="day-meta">DAY ${String(day.day).padStart(2, "0")} · ${escapeHtml(formatDate(day.date))} · ${escapeHtml(day.subtitle)}</div>
            <h3>${escapeHtml(day.title)}</h3>
          </div>
          <a class="route-link" href="${escapeHtml(day.routeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(day.routeLabel)} ↗</a>
        </div>
        <div class="table-wrap">
          <table class="itinerary-table">
            <thead>
              <tr><th>时间</th><th>类型</th><th>安排</th><th>地图</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </article>
    `;
  }).join("");

  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-day-tab]");
    if (!button) return;
    state.activeDay = Number(button.dataset.dayTab);
    document.querySelectorAll("[data-day-tab]").forEach(tab => {
      tab.setAttribute("aria-selected", String(Number(tab.dataset.dayTab) === state.activeDay));
    });
    document.querySelectorAll("[data-day-panel]").forEach(panel => {
      panel.hidden = Number(panel.dataset.dayPanel) !== state.activeDay;
    });
  });

  panels.addEventListener("click", event => {
    const button = event.target.closest("[data-place-open]");
    if (button) setActivePlace(button.dataset.placeOpen, true);
  });
}

function renderPlaces() {
  const scenicPlaces = state.data.places.filter(place => place.photo);
  $("#places-grid").innerHTML = scenicPlaces.map(place => `
    <article class="place-card place-card--photo">
      <a class="place-card__image-link" href="${escapeHtml(place.photo.source)}" target="_blank" rel="noopener noreferrer" aria-label="查看 ${escapeHtml(place.name)} 照片来源">
        <img class="place-card__image" src="${escapeHtml(place.photo.path)}" alt="${escapeHtml(place.name)} 参考照片" loading="lazy">
      </a>
      <div class="place-card__body">
        <div class="place-card__top">
          <div>
            <h3>${escapeHtml(place.name)}</h3>
            <p class="place-card__area">${escapeHtml(place.area)} · ${escapeHtml(place.category)}</p>
          </div>
          <span class="priority ${priorityClass(place.priority)}">${escapeHtml(place.priority)}</span>
        </div>
        <p class="place-card__note">${escapeHtml(place.note)}</p>
        <div class="place-card__footer">
          <button class="place-link" data-place-card-open="${escapeHtml(place.id)}">页内地图</button>
          <a class="map-open" href="${googleSearchUrl(place.query)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
        </div>
      </div>
    </article>
  `).join("");

  $("#places-grid").addEventListener("click", event => {
    const button = event.target.closest("[data-place-card-open]");
    if (button) setActivePlace(button.dataset.placeCardOpen, true);
  });

  renderPhotoCredits(scenicPlaces);
}

function renderPhotoCredits(places) {
  const target = $("#photo-credits-list");
  if (!target) return;
  target.innerHTML = places.map(place => `
    <li>
      <a href="${escapeHtml(place.photo.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(place.name)}</a>
      — ${escapeHtml(place.photo.author)}, ${escapeHtml(place.photo.license)}
    </li>
  `).join("");
}

async function init() {
  const response = await fetch("trip-data.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load trip-data.json: ${response.status}`);
  state.data = await response.json();
  state.placesById = Object.fromEntries(state.data.places.map(place => [place.id, place]));

  renderHero();
  renderMap();
  renderDays();
  renderPlaces();
}

init().catch(error => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin",
    `<div style="padding:12px;background:#7f1d1d;color:white;text-align:center">页面数据加载失败：${escapeHtml(error.message)}</div>`);
});