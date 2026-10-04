const state = {
  data: null,
  placesById: {},
  activePlaceId: "oh-ridge",
  activeDay: 1,
  checklist: {},
  routeMap: null,
  routeLayer: null,
  routeMarkerByPlaceId: new Map()
};

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

function dayByNumber(dayNumber) {
  return state.data.days.find(day => day.day === Number(dayNumber));
}

function routePlaces(day) {
  return (day.routePlaceIds || [])
    .map(id => state.placesById[id])
    .filter(Boolean);
}

function renderHero() {
  const { trip } = state.data;
  $("#trip-title").textContent = trip.title;
  $("#trip-dates").textContent = `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`;
  $("#trip-base").textContent = `🏕 ${trip.baseCamp}`;
  $("#trip-departure").textContent = `🚗 ${trip.departure}`;
}

function setActivePlace(placeId, scroll = false) {
  const place = state.placesById[placeId];
  if (!place || place.routeOnly) return;

  state.activePlaceId = placeId;
  $("#place-map-frame").src = googleEmbedUrl(place.query);
  $("#active-place-link").href = googleSearchUrl(place.query);
  $("#active-place").innerHTML = `
    <h3>${escapeHtml(place.name)}</h3>
    <p>${escapeHtml(place.area)} · ${escapeHtml(place.category)}</p>
    <p>${escapeHtml(place.note || "")}</p>
    <p><strong>坐标</strong> ${place.lat}, ${place.lng}</p>
  `;

  document.querySelectorAll("[data-place-pill]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.placePill === placeId);
  });

  if (scroll) $("#place-preview").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPlacePreview() {
  const places = state.data.places.filter(place => !place.routeOnly);

  $("#map-place-pills").innerHTML = places.map(place => `
    <button class="place-pill" data-place-pill="${escapeHtml(place.id)}">${escapeHtml(place.name)}</button>
  `).join("");

  $("#map-place-pills").addEventListener("click", event => {
    const button = event.target.closest("[data-place-pill]");
    if (button) setActivePlace(button.dataset.placePill);
  });

  const initial = state.placesById[state.activePlaceId] && !state.placesById[state.activePlaceId].routeOnly
    ? state.activePlaceId
    : places[0]?.id;

  if (initial) setActivePlace(initial);
}


function initRouteMap() {
  state.routeMap = L.map("route-map", {
    zoomControl: true,
    scrollWheelZoom: true
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    referrerPolicy: "origin",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(state.routeMap);

  state.routeLayer = L.layerGroup().addTo(state.routeMap);
}

function markerLabelsForRoute(places) {
  const labelsByPlaceId = new Map();
  places.forEach((place, index) => {
    const label = String.fromCharCode(65 + index);
    if (!labelsByPlaceId.has(place.id)) labelsByPlaceId.set(place.id, []);
    labelsByPlaceId.get(place.id).push(label);
  });
  return labelsByPlaceId;
}

function renderRoute(day) {
  const places = routePlaces(day);
  if (!state.routeMap || !state.routeLayer || !places.length) return;

  state.routeLayer.clearLayers();
  state.routeMarkerByPlaceId = new Map();

  const latlngs = places.map(place => [place.lat, place.lng]);

  L.polyline(latlngs, {
    color: "#465846",
    weight: 5,
    opacity: 0.86,
    dashArray: "10,8",
    lineCap: "round"
  }).addTo(state.routeLayer);

  const groupedLabels = markerLabelsForRoute(places);

  groupedLabels.forEach((labels, placeId) => {
    const place = state.placesById[placeId];
    if (!place) return;
    const labelText = labels.join("·");
    const width = Math.max(30, 16 + labelText.length * 7);

    const icon = L.divIcon({
      className: "route-marker-icon",
      html: `<div class="route-marker" style="width:${width}px">${escapeHtml(labelText)}</div>`,
      iconSize: [width, 30],
      iconAnchor: [width / 2, 15]
    });

    const marker = L.marker([place.lat, place.lng], { icon });
    marker.bindPopup(`
      <strong>${escapeHtml(place.name)}</strong><br>
      ${escapeHtml(place.note || place.area || "")}<br>
      <a href="${googleSearchUrl(place.query)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
    `);
    marker.addTo(state.routeLayer);
    state.routeMarkerByPlaceId.set(placeId, marker);
  });

  const bounds = L.latLngBounds(latlngs);
  state.routeMap.fitBounds(bounds, {
    padding: [28, 28],
    maxZoom: day.day === 2 ? 11 : 8
  });

  $("#active-route-link").href = day.routeUrl;
  $("#route-summary").innerHTML = `
    <h3>Day ${day.day} · ${escapeHtml(day.title)}</h3>
    <p>${places.length} 个路线节点 · OSM 示意折线</p>
    <span class="route-status">固定顺序 · 不做路线优化</span>
  `;

  $("#route-stops").innerHTML = places.map((place, index) => `
    <div class="route-stop">
      <div class="route-stop__label">${String.fromCharCode(65 + index)}</div>
      <div>
        <strong>${escapeHtml(place.name)}</strong>
        <span>${escapeHtml(place.area || "")}</span>
      </div>
    </div>
  `).join("");

  setTimeout(() => state.routeMap.invalidateSize(), 0);
}

function renderRouteTabs() {
  $("#route-day-tabs").innerHTML = state.data.days.map(day => `
    <button class="day-tab" role="tab" aria-selected="${day.day === state.activeDay}" data-route-day="${day.day}">
      Day ${day.day} · ${formatDate(day.date)}
    </button>
  `).join("");

  $("#route-day-tabs").addEventListener("click", event => {
    const button = event.target.closest("[data-route-day]");
    if (button) selectDay(Number(button.dataset.routeDay));
  });
}

function updateDayUi() {
  document.querySelectorAll("[data-day-tab]").forEach(tab => {
    tab.setAttribute("aria-selected", String(Number(tab.dataset.dayTab) === state.activeDay));
  });
  document.querySelectorAll("[data-route-day]").forEach(tab => {
    tab.setAttribute("aria-selected", String(Number(tab.dataset.routeDay) === state.activeDay));
  });
  document.querySelectorAll("[data-day-panel]").forEach(panel => {
    panel.hidden = Number(panel.dataset.dayPanel) !== state.activeDay;
  });
}

function selectDay(dayNumber) {
  const day = dayByNumber(dayNumber);
  if (!day) return;
  state.activeDay = day.day;
  updateDayUi();
  renderRoute(day);
}

function focusPlaceOnRoute(placeId) {
  const currentDay = dayByNumber(state.activeDay);
  let targetDay = currentDay && (currentDay.routePlaceIds || []).includes(placeId)
    ? currentDay
    : state.data.days.find(day => (day.routePlaceIds || []).includes(placeId));

  if (!targetDay) {
    const place = state.placesById[placeId];
    if (place) window.open(googleSearchUrl(place.query), "_blank", "noopener,noreferrer");
    return;
  }

  selectDay(targetDay.day);
  $("#route-preview").scrollIntoView({ behavior: "smooth", block: "start" });

  setTimeout(() => {
    const marker = state.routeMarkerByPlaceId.get(placeId);
    if (marker) marker.openPopup();
  }, 80);
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
    if (button) selectDay(Number(button.dataset.dayTab));
  });

  panels.addEventListener("click", event => {
    const button = event.target.closest("[data-place-open]");
    if (button) focusPlaceOnRoute(button.dataset.placeOpen);
  });
}

function renderPlaces() {
  const places = state.data.places.filter(place =>
    !place.routeOnly && !["营地", "补给"].includes(place.category)
  );

  $("#places-grid").innerHTML = places.map(place => `
    <article class="place-card">
      <div class="place-card__top">
        <div>
          <h3>${escapeHtml(place.name)}</h3>
          <p class="place-card__area">${escapeHtml(place.area)} · ${escapeHtml(place.category)}</p>
        </div>
        <span class="priority ${priorityClass(place.priority)}">${escapeHtml(place.priority)}</span>
      </div>
      <p class="place-card__note">${escapeHtml(place.note)}</p>
      <div class="place-card__footer">
        <button class="place-link" data-place-preview="${escapeHtml(place.id)}">景点预览</button>
        <button class="place-link" data-place-card-open="${escapeHtml(place.id)}">路线定位</button>
        <a class="map-open" href="${googleSearchUrl(place.query)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
      </div>
    </article>
  `).join("");

  $("#places-grid").addEventListener("click", event => {
    const previewButton = event.target.closest("[data-place-preview]");
    if (previewButton) {
      setActivePlace(previewButton.dataset.placePreview, true);
      return;
    }

    const routeButton = event.target.closest("[data-place-card-open]");
    if (routeButton) focusPlaceOnRoute(routeButton.dataset.placeCardOpen);
  });
}

function forecastDate(period) {
  return String(period.startTime || "").slice(0, 10);
}

function temperatureC(period) {
  if (!period) return null;
  const value = Number(period.temperature);
  if (!Number.isFinite(value)) return null;
  return period.temperatureUnit === "C" ? value : (value - 32) * 5 / 9;
}

function windValuesMph(period) {
  return (String(period?.windSpeed || "").match(/\d+(?:\.\d+)?/g) || [])
    .map(Number)
    .filter(Number.isFinite);
}

function maxWindMph(period) {
  const values = windValuesMph(period);
  return values.length ? Math.max(...values) : 0;
}

function formatWind(period) {
  const raw = String(period?.windSpeed || "").trim();
  const direction = String(period?.windDirection || "").trim();
  if (/calm/i.test(raw)) return "静风";

  const values = windValuesMph(period || {});
  if (!values.length) return [direction, raw].filter(Boolean).join(" · ") || "—";

  const kmh = values.map(value => Math.round(value * 1.60934));
  const speed = kmh.length > 1
    ? `${Math.min(...kmh)}–${Math.max(...kmh)} km/h`
    : `${kmh[0]} km/h`;

  return [direction, speed].filter(Boolean).join(" · ");
}

function feelsLikeC(period) {
  const tempC = temperatureC(period);
  if (!Number.isFinite(tempC)) return null;

  const windMph = windValuesMph(period);
  if (!windMph.length) return tempC;

  const windKmh = (windMph.reduce((sum, value) => sum + value, 0) / windMph.length) * 1.60934;

  if (tempC <= 10 && windKmh > 4.8) {
    const windFactor = Math.pow(windKmh, 0.16);
    return 13.12 + 0.6215 * tempC - 11.37 * windFactor + 0.3965 * tempC * windFactor;
  }

  return tempC;
}

function formatForecastDay(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function dailyForecasts(periods) {
  const grouped = new Map();

  periods.forEach(period => {
    const date = forecastDate(period);
    if (!date) return;
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date).push(period);
  });

  return [...grouped.entries()].map(([date, dayPeriods]) => {
    const daytime = dayPeriods.find(period => period.isDaytime === true);
    const nighttime = dayPeriods.find(period => period.isDaytime === false);
    const temps = dayPeriods.map(temperatureC).filter(Number.isFinite);
    const feels = dayPeriods.map(feelsLikeC).filter(Number.isFinite);
    const strongestWind = dayPeriods.reduce((best, period) =>
      maxWindMph(period) > maxWindMph(best) ? period : best
    , dayPeriods[0]);

    return {
      date,
      label: formatForecastDay(date),
      summary: daytime?.shortForecast || dayPeriods[0]?.shortForecast || "",
      high: Number.isFinite(temperatureC(daytime))
        ? temperatureC(daytime)
        : (temps.length ? Math.max(...temps) : null),
      low: Number.isFinite(temperatureC(nighttime))
        ? temperatureC(nighttime)
        : (temps.length ? Math.min(...temps) : null),
      feelsLow: feels.length ? Math.min(...feels) : null,
      feelsHigh: feels.length ? Math.max(...feels) : null,
      wind: formatWind(strongestWind)
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function formatTempValue(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°C` : "—";
}

function formatFeelsRange(low, high) {
  if (!Number.isFinite(low) && !Number.isFinite(high)) return "—";
  if (!Number.isFinite(low)) return formatTempValue(high);
  if (!Number.isFinite(high)) return formatTempValue(low);
  if (Math.round(low) === Math.round(high)) return formatTempValue(low);
  return `${Math.round(low)}–${Math.round(high)}°C`;
}

function renderForecastCard(location, periods, updated) {
  const start = state.data.trip.startDate;
  const end = state.data.trip.endDate;
  const daily = dailyForecasts(periods);
  const tripDays = daily.filter(day => day.date >= start && day.date <= end);
  const selected = tripDays.length ? tripDays : daily.slice(0, 4);
  const note = tripDays.length
    ? "已覆盖本次出行日期"
    : "当前预报窗口尚未覆盖 10/9–10/11";

  const rows = selected.map(day => `
    <div class="forecast-period">
      <div class="forecast-period__summary">
        <strong>${escapeHtml(day.label)}</strong>
        <span>${escapeHtml(day.summary)}</span>
      </div>
      <div class="forecast-metrics">
        <span><b>最高</b> ${escapeHtml(formatTempValue(day.high))}</span>
        <span><b>最低</b> ${escapeHtml(formatTempValue(day.low))}</span>
        <span><b>体感</b> ${escapeHtml(formatFeelsRange(day.feelsLow, day.feelsHigh))}</span>
        <span><b>风力</b> ${escapeHtml(day.wind)}</span>
      </div>
    </div>
  `).join("");

  const nwsUrl = `https://forecast.weather.gov/MapClick.php?lat=${location.lat}&lon=${location.lng}`;

  return `
    <article class="weather-card">
      <div class="weather-card__head">
        <div>
          <h4>${escapeHtml(location.name)}</h4>
          <span>${escapeHtml(note)}</span>
        </div>
        <a href="${nwsUrl}" target="_blank" rel="noopener noreferrer">NWS ↗</a>
      </div>
      <div class="forecast-list">${rows}</div>
      ${updated ? `<p class="weather-updated">更新：${escapeHtml(new Date(updated).toLocaleString("zh-CN"))}</p>` : ""}
    </article>
  `;
}

async function loadForecast(location) {
  const pointUrl = `https://api.weather.gov/points/${location.lat},${location.lng}`;
  const pointResponse = await fetch(pointUrl, {
    headers: { "Accept": "application/geo+json" },
    cache: "no-store"
  });
  if (!pointResponse.ok) throw new Error(`point lookup ${pointResponse.status}`);
  const point = await pointResponse.json();
  const forecastUrl = point.properties?.forecast;
  if (!forecastUrl) throw new Error("forecast URL unavailable");

  const forecastResponse = await fetch(forecastUrl, {
    headers: { "Accept": "application/geo+json" },
    cache: "no-store"
  });
  if (!forecastResponse.ok) throw new Error(`forecast ${forecastResponse.status}`);
  const forecast = await forecastResponse.json();

  return {
    periods: forecast.properties?.periods || [],
    updated: forecast.properties?.updated || null
  };
}

async function renderWeather() {
  const target = $("#weather-cards");
  if (!target || !Array.isArray(state.data.weather)) return;

  target.innerHTML = state.data.weather.map(location => `
    <article class="weather-card weather-card--loading" data-weather-id="${escapeHtml(location.id)}">
      <h4>${escapeHtml(location.name)}</h4>
      <p>读取预报中…</p>
    </article>
  `).join("");

  await Promise.all(state.data.weather.map(async location => {
    const card = target.querySelector(`[data-weather-id="${location.id}"]`);
    try {
      const forecast = await loadForecast(location);
      card.outerHTML = renderForecastCard(location, forecast.periods, forecast.updated);
    } catch (error) {
      console.warn("NWS forecast failed", location.name, error);
      const nwsUrl = `https://forecast.weather.gov/MapClick.php?lat=${location.lat}&lon=${location.lng}`;
      card.innerHTML = `
        <h4>${escapeHtml(location.name)}</h4>
        <p>暂时无法读取预报。</p>
        <a class="text-button" href="${nwsUrl}" target="_blank" rel="noopener noreferrer">直接打开 NWS ↗</a>
      `;
      card.classList.remove("weather-card--loading");
    }
  }));
}

const CHECKLIST_KEY = "camping-helper-checklist-v1";

function loadChecklistState() {
  try {
    state.checklist = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "{}");
  } catch {
    state.checklist = {};
  }
}

function saveChecklistState() {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state.checklist));
  } catch {}
}

function updateChecklistProgress() {
  const allItems = state.data.checklist.flatMap(group => group.items);
  const checked = allItems.filter(item => state.checklist[item.id]).length;
  const total = allItems.length;
  const pct = total ? Math.round((checked / total) * 100) : 0;

  $("#checklist-progress").textContent = `${checked} / ${total} · ${pct}%`;
  $("#checklist-progressbar-fill").style.width = `${pct}%`;
}

function renderChecklist() {
  loadChecklistState();
  const target = $("#checklist-groups");
  if (!target || !Array.isArray(state.data.checklist)) return;

  const personalGroups = state.data.checklist.filter(group => group.id !== "car");
  const teamGroups = state.data.checklist.filter(group => group.id === "car");

  function renderGroups(groups) {
    return groups.map(group => `
      <section class="checklist-group">
        <h4>${escapeHtml(group.title)}</h4>
        <div class="checklist-items">
          ${group.items.map(item => `
            <label class="checklist-item">
              <input type="checkbox" data-checklist-id="${escapeHtml(item.id)}" ${state.checklist[item.id] ? "checked" : ""}>
              <span>${escapeHtml(item.text)}</span>
            </label>
          `).join("")}
        </div>
      </section>
    `).join("");
  }

  target.innerHTML = `
    <section class="checklist-scope">
      <h3>个人出行检查清单</h3>
      <div class="checklist-scope__groups">
        ${renderGroups(personalGroups)}
      </div>
    </section>
    <section class="checklist-scope">
      <h3>团队出行检查清单</h3>
      <div class="checklist-scope__groups checklist-scope__groups--team">
        ${renderGroups(teamGroups)}
      </div>
    </section>
  `;

  target.addEventListener("change", event => {
    const input = event.target.closest("[data-checklist-id]");
    if (!input) return;
    state.checklist[input.dataset.checklistId] = input.checked;
    saveChecklistState();
    updateChecklistProgress();
  });

  $("#checklist-reset").addEventListener("click", () => {
    if (!confirm("清空当前浏览器里的 Checklist 勾选状态？")) return;
    state.checklist = {};
    saveChecklistState();
    target.querySelectorAll("input[type='checkbox']").forEach(input => { input.checked = false; });
    updateChecklistProgress();
  });

  updateChecklistProgress();
}

function initSideMenu() {
  const menu = $(".side-menu");
  const toggle = $(".side-menu__toggle");
  if (!menu || !toggle) return;

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  menu.addEventListener("click", event => {
    if (!event.target.closest("a")) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

async function init() {
  const response = await fetch("trip-data.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load trip-data.json: ${response.status}`);
  state.data = await response.json();
  state.placesById = Object.fromEntries(state.data.places.map(place => [place.id, place]));

  renderHero();
  initSideMenu();
  renderPlacePreview();
  initRouteMap();
  renderRouteTabs();
  renderDays();
  renderPlaces();
  renderChecklist();
  renderWeather();
  selectDay(state.activeDay);

  $("#weather-refresh")?.addEventListener("click", renderWeather);
}

init().catch(error => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin",
    `<div style="padding:12px;background:#7f1d1d;color:white;text-align:center">页面数据加载失败：${escapeHtml(error.message)}</div>`);
});