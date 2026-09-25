// public/js/map.js — Vitendaji vya ramani (Leaflet + OpenStreetMap, bure, hakuna API key)
// Kutumika kwa: (1) kuchagua eneo (map-picker) — mtumiaji anabofya ramani kuweka alama,
// (2) kuonyesha eneo (map-display) — alama isiyobadilika ya eneo lililohifadhiwa.

// Tanzania (Dodoma/Dar es Salaam eneo la kati) kama chaguo-msingi la ramani ikiwa hakuna
// koordineti bado — hii ni sehemu ya kati ya nchi ili mtumiaji abonyeze kuelekeza mahali pake.
const SOKO_DEFAULT_LAT = -6.369028;
const SOKO_DEFAULT_LNG = 34.888822;
const SOKO_DEFAULT_ZOOM = 6;

function sokoInitMapPicker(mapElId, latInputId, lngInputId) {
  const mapEl = document.getElementById(mapElId);
  const latInput = document.getElementById(latInputId);
  const lngInput = document.getElementById(lngInputId);
  if (!mapEl || typeof L === 'undefined') return;

  const hasExisting = latInput.value && lngInput.value;
  const startLat = hasExisting ? parseFloat(latInput.value) : SOKO_DEFAULT_LAT;
  const startLng = hasExisting ? parseFloat(lngInput.value) : SOKO_DEFAULT_LNG;
  const startZoom = hasExisting ? 15 : SOKO_DEFAULT_ZOOM;

  const map = L.map(mapEl).setView([startLat, startLng], startZoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);

  let marker = hasExisting ? L.marker([startLat, startLng]).addTo(map) : null;

  function setPoint(lat, lng) {
    latInput.value = lat.toFixed(6);
    lngInput.value = lng.toFixed(6);
    if (marker) { marker.setLatLng([lat, lng]); }
    else { marker = L.marker([lat, lng]).addTo(map); }
  }

  map.on('click', function (e) {
    setPoint(e.latlng.lat, e.latlng.lng);
  });

  // Jaribu kutumia eneo halisi la kifaa (GPS) ikiwa mtumiaji ataruhusu, na hakuna eneo tayari
  if (!hasExisting && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      map.setView([pos.coords.latitude, pos.coords.longitude], 15);
    }, function () { /* mtumiaji amekataa au haipatikani - endelea na default */ });
  }

  setTimeout(function () { map.invalidateSize(); }, 200);
}

function sokoInitMapDisplay(mapElId, lat, lng, labelText) {
  const mapEl = document.getElementById(mapElId);
  if (!mapEl || typeof L === 'undefined' || lat == null || lng == null) return;

  const map = L.map(mapEl, { scrollWheelZoom: false }).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);
  const m = L.marker([lat, lng]).addTo(map);
  if (labelText) m.bindPopup(labelText);

  setTimeout(function () { map.invalidateSize(); }, 200);
}
