// public/js/map.js — Vitendaji vya ramani (Leaflet + OpenStreetMap, bure, hakuna API key)
// Kutumika kwa: (1) kuchagua eneo (map-picker) — mtumiaji anabofya ramani kuweka alama,
// (2) kuonyesha eneo (map-display) — alama isiyobadilika ya eneo lililohifadhiwa.

// Tanzania (Dodoma/Dar es Salaam eneo la kati) kama chaguo-msingi la ramani ikiwa hakuna
// koordineti bado — hii ni sehemu ya kati ya nchi ili mtumiaji abonyeze kuelekeza mahali pake.
const SOKO_DEFAULT_LAT = -6.369028;
const SOKO_DEFAULT_LNG = 34.888822;
const SOKO_DEFAULT_ZOOM = 6;

function sokoInitMapPicker(mapElId, latInputId, lngInputId, locationInputId, statusId) {
  const mapEl = document.getElementById(mapElId);
  const latInput = document.getElementById(latInputId);
  const lngInput = document.getElementById(lngInputId);
  const locationInput = locationInputId ? document.getElementById(locationInputId) : null;
  const statusEl = statusId ? document.getElementById(statusId) : null;
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
    if (statusEl) statusEl.textContent = 'Eneo limechaguliwa. Unaweza kubofya ramani kurekebisha alama.';
  });

  if (locationInput) {
    let searchTimer;
    let activeRequest;
    let latestQuery = '';

    const findLocation = async () => {
      const query = locationInput.value.trim();
      if (query.length < 3) {
        if (statusEl) statusEl.textContent = 'Andika angalau herufi 3 kutafuta eneo kwenye ramani.';
        return;
      }
      latestQuery = query;
      if (activeRequest) activeRequest.abort();
      activeRequest = new AbortController();
      if (statusEl) statusEl.textContent = 'Inatafuta eneo kwenye ramani...';

      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.search = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'tz', q: query });
        const response = await fetch(url, { signal: activeRequest.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Geocoding request failed');
        const results = await response.json();
        if (query !== latestQuery) return;
        if (!results.length) {
          if (statusEl) statusEl.textContent = 'Eneo halijapatikana. Ongeza mtaa au mji, au weka alama kwa kubofya ramani.';
          return;
        }

        const latitude = Number(results[0].lat);
        const longitude = Number(results[0].lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Invalid coordinates');
        map.setView([latitude, longitude], 15);
        setPoint(latitude, longitude);
        if (statusEl) statusEl.textContent = 'Eneo limepatikana na alama imewekwa kwenye ramani.';
      } catch (error) {
        if (error.name !== 'AbortError' && statusEl) {
          statusEl.textContent = 'Ramani haikuweza kutafuta eneo sasa. Jaribu tena au weka alama kwa kubofya ramani.';
        }
      }
    };

    locationInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      latestQuery = locationInput.value.trim();
      if (activeRequest) activeRequest.abort();
      latInput.value = '';
      lngInput.value = '';
      if (marker) { map.removeLayer(marker); marker = null; }
      searchTimer = setTimeout(findLocation, 1000);
    });

    if (locationInput.value.trim() && !hasExisting) searchTimer = setTimeout(findLocation, 1000);
  }

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
