/* ==========================================================================
   HemoConnect Leaflet map and address picker
   ========================================================================== */

const MAP_DEFAULT_CENTER = [20.5937, 78.9629];

function getCoordinates(record) {
  if (record?.latitude === null || record?.latitude === undefined || record?.latitude === '' || record?.longitude === null || record?.longitude === undefined || record?.longitude === '') return null;
  const latitude = Number(record?.latitude);
  const longitude = Number(record?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return [latitude, longitude];
}

function distanceBetween(first, second) {
  const radians = value => value * Math.PI / 180;
  const [lat1, lon1] = first.map(radians);
  const [lat2, lon2] = second.map(radians);
  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;
  const arc = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

function makePopup(title, details) {
  const content = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = title;
  content.append(heading);
  details.forEach(detail => {
    const line = document.createElement('div');
    line.textContent = detail;
    content.append(line);
  });
  return content;
}

class HemoMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markers = null;
    this.vectors = null;
  }

  init() {
    if (!this.container) return false;
    if (!window.L) {
      this.container.textContent = 'The map could not load. Check your connection and try again.';
      return false;
    }
    if (this.map) return true;

    this.map = window.L.map(this.container, { zoomControl: true }).setView(MAP_DEFAULT_CENTER, 5);
    this.tileLayer = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(this.map);
    this.tileLayer.on('tileerror', () => this.showTileWarning());
    this.markers = window.L.layerGroup().addTo(this.map);
    this.vectors = window.L.layerGroup().addTo(this.map);
    return true;
  }

  showTileWarning() {
    if (this.container.querySelector('.map-tile-warning')) return;
    const warning = document.createElement('p');
    warning.className = 'map-tile-warning';
    warning.textContent = 'Street map tiles are unavailable. Check your connection and try again.';
    this.container.append(warning);
  }

  renderData(requests = [], donors = [], activeRequestMatches = null) {
    if (!this.init()) return;
    this.map.invalidateSize();
    this.markers.clearLayers();
    this.vectors.clearLayers();
    const bounds = [];
    const visibleDonors = donors.filter(donor => donor.location_sharing === true && getCoordinates(donor));

    visibleDonors.forEach(donor => {
      const coordinates = getCoordinates(donor);
      const color = donor.availability_status === 'Available' ? '#059669' : '#d97706';
      const marker = window.L.circleMarker(coordinates, {
        radius: 7,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2
      });
      marker.bindPopup(makePopup(`${donor.name} (approximate location)`, [
        `${donor.blood_group} · ${donor.availability_status}`,
        donor.city || ''
      ].filter(Boolean)));
      marker.addTo(this.markers);
      bounds.push(coordinates);
    });

    requests.filter(request => (request.status === 'ACTIVE' || !request.status) && (request.coordinates_confirmed === true || request.coordinates_confirmed === 1)).forEach(request => {
      const coordinates = getCoordinates(request);
      if (!coordinates) return;
      const emergency = request.urgency_level === 'CRITICAL_SOS';
      const marker = window.L.circleMarker(coordinates, {
        radius: emergency ? 10 : 8,
        color: emergency ? '#dc2626' : '#2563eb',
        fillColor: emergency ? '#ef4444' : '#3b82f6',
        fillOpacity: 0.9,
        weight: 2
      });
      marker.bindPopup(makePopup(request.hospital_name || request.receiver_name || request.name || 'Blood request', [
        `${request.blood_group} · ${request.units_required} unit(s)`,
        request.location_address || request.city || '',
        emergency ? 'Emergency' : request.urgency_level
      ].filter(Boolean)));
      marker.addTo(this.markers);
      bounds.push(coordinates);
    });

    if (activeRequestMatches?.request && activeRequestMatches.top_matches) {
      const requestPoint = getCoordinates(activeRequestMatches.request);
      if (requestPoint) {
        activeRequestMatches.top_matches.slice(0, 5).forEach(match => {
          const donor = visibleDonors.find(item => item.id === match.donor_id);
          const donorPoint = donor && getCoordinates(donor);
          if (donorPoint) {
            window.L.polyline([requestPoint, donorPoint], {
              color: '#059669', weight: 2, opacity: 0.75, dashArray: '6 7'
            }).addTo(this.vectors);
          }
        });
      }
    }

    if (bounds.length === 1) this.map.setView(bounds[0], 13);
    else if (bounds.length > 1) this.map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }

  renderNearbyDonors(request, donors, container) {
    if (!container) return [];
    const requestPoint = (request.coordinates_confirmed === true || request.coordinates_confirmed === 1) && getCoordinates(request);
    if (!requestPoint) {
      container.textContent = 'This request has no confirmed map location, so nearby distances are unavailable.';
      return [];
    }

    const nearby = donors
      .filter(donor => donor.location_sharing === true && donor.is_eligible && donor.availability_status === 'Available' && getCoordinates(donor))
      .map(donor => ({ donor, distance: distanceBetween(requestPoint, getCoordinates(donor)) }))
      .filter(item => item.distance <= 50)
      .sort((first, second) => first.distance - second.distance)
      .slice(0, 8);

    container.replaceChildren();
    if (!nearby.length) {
      container.textContent = 'No nearby eligible donors have opted in to approximate location sharing.';
      return [];
    }

    nearby.forEach(({ donor, distance }) => {
      const item = document.createElement('div');
      item.className = 'nearby-donor-item';
      item.textContent = `${donor.name} · ${donor.blood_group} · about ${distance.toFixed(1)} km · approximate location`;
      container.append(item);
    });
    return nearby;
  }

  refresh() {
    if (this.map) requestAnimationFrame(() => this.map.invalidateSize());
  }
}

class HemoAddressPicker {
  constructor(root) {
    this.root = root;
    this.searchInput = root.querySelector('[data-address-search]');
    this.suggestions = root.querySelector('[data-address-suggestions]');
    this.mapElement = root.querySelector('[data-address-map]');
    this.status = root.querySelector('[data-address-status]');
    this.selectedLabel = root.querySelector('[data-selected-address]');
    this.confirmation = root.querySelector('[data-confirm-address]');
    this.currentLocationButton = root.querySelector('[data-use-current-location]');
    this.addressInput = root.querySelector('[name="address"], [name="location_address"]');
    this.cityInput = root.querySelector('[name="city"]');
    this.latitudeInput = root.querySelector('[name="latitude"]');
    this.longitudeInput = root.querySelector('[name="longitude"]');
    this.map = null;
    this.pin = null;
    this.selected = null;
    this.searchTimer = null;
    this.searchSequence = 0;
    this.reverseSequence = 0;
    this.initialize();
  }

  initialize() {
    this.searchInput.addEventListener('input', () => this.queueSearch());
    this.currentLocationButton.addEventListener('click', () => this.useCurrentLocation());
    this.confirmation.addEventListener('change', () => this.updateConfirmation());
    this.suggestions.addEventListener('click', event => {
      const button = event.target.closest('[data-result-index]');
      if (!button) return;
      this.chooseResult(this.results[Number(button.dataset.resultIndex)]);
    });
    if (!window.L) {
      this.mapElement.textContent = 'Map tiles are unavailable. Address search and browser GPS can still be used.';
      this.setStatus('The interactive map did not load. Search an address or use GPS instead.');
      this.setEnabled(!this.root.closest('#common-request-fields'));
      return;
    }

    this.map = window.L.map(this.mapElement).setView(MAP_DEFAULT_CENTER, 5);
    this.tileLayer = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(this.map);
    this.tileLayer.on('tileerror', () => this.setStatus('Street map tiles are unavailable. Address search and GPS can still be used.'));
    this.map.on('click', event => this.placePin(event.latlng));
    this.setEnabled(!this.root.closest('#common-request-fields'));
  }

  refresh() {
    if (this.map) requestAnimationFrame(() => this.map.invalidateSize());
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.searchInput.disabled = !enabled;
    this.currentLocationButton.disabled = !enabled;
    this.confirmation.disabled = !enabled || !this.selected;
    this.mapElement.classList.toggle('address-picker-disabled', !enabled);
    if (enabled && this.map) requestAnimationFrame(() => this.map.invalidateSize());
    if (!enabled) this.clearSelection();
  }

  setStatus(message) {
    this.status.textContent = message;
  }

  isConfirmed() {
    return Boolean(
      this.enabled && this.selected && this.confirmation.checked &&
      this.latitudeInput.value && this.longitudeInput.value && this.addressInput.value
    );
  }

  getSelection() {
    if (!this.isConfirmed()) return null;
    return {
      ...this.selected,
      address_confirmed: true,
      latitude: Number(this.latitudeInput.value),
      longitude: Number(this.longitudeInput.value)
    };
  }

  updateConfirmation() {
    if (this.confirmation.checked && this.selected) {
      this.setStatus('Address confirmed. You can change the pin or search again before submitting.');
    }
  }

  clearSelection({ removePin = true, clearSearch = true } = {}) {
    this.selected = null;
    this.confirmation.checked = false;
    this.confirmation.disabled = true;
    if (clearSearch) this.searchInput.value = '';
    if (removePin && this.pin) {
      this.map?.removeLayer(this.pin);
      this.pin = null;
    }
    this.hideSuggestions();
    this.addressInput.value = '';
    this.cityInput.value = '';
    this.latitudeInput.value = '';
    this.longitudeInput.value = '';
    this.selectedLabel.textContent = 'No address selected.';
  }

  queueSearch() {
    clearTimeout(this.searchTimer);
    const query = this.searchInput.value.trim();
    if (query.length < 3) {
      this.hideSuggestions();
      return;
    }
    this.searchTimer = setTimeout(() => this.search(query), 400);
  }

  async search(query) {
    const sequence = ++this.searchSequence;
    const mapCenter = this.map?.getCenter();
    const filters = mapCenter ? { latitude: mapCenter.lat, longitude: mapCenter.lng } : {};
    this.setStatus('Searching OpenStreetMap addresses…');
    let response;
    try {
      response = await API.searchAddresses(query, filters);
    } catch (error) {
      this.setStatus('Address search is unavailable. Check your connection or choose a map pin.');
      this.hideSuggestions();
      return;
    }
    if (sequence !== this.searchSequence) return;
    if (!response.success) {
      this.setStatus(response.error || 'Address search is temporarily unavailable.');
      this.hideSuggestions();
      return;
    }
    this.results = response.results || [];
    this.suggestions.replaceChildren();
    this.results.forEach((result, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.resultIndex = String(index);
      button.textContent = result.address;
      item.append(button);
      this.suggestions.append(item);
    });
    this.suggestions.hidden = !this.results.length;
    this.setStatus(this.results.length ? 'Choose the matching address from the suggestions.' : 'No addresses found. Try a nearby street, landmark, or PIN code.');
  }

  hideSuggestions() {
    this.suggestions.hidden = true;
    this.suggestions.replaceChildren();
  }

  chooseResult(result) {
    if (!result) return;
    this.hideSuggestions();
    this.searchInput.value = result.address;
    this.selectAddress(result, [result.latitude, result.longitude]);
    if (this.map) this.map.setView([result.latitude, result.longitude], 16);
  }

  selectAddress(result, coordinates) {
    this.selected = { address: result.address, city: result.city || '' };
    this.addressInput.value = result.address;
    this.cityInput.value = result.city || '';
    this.latitudeInput.value = String(coordinates[0]);
    this.longitudeInput.value = String(coordinates[1]);
    this.selectedLabel.textContent = result.address;
    this.confirmation.checked = false;
    this.confirmation.disabled = false;
    this.setStatus('Confirm this address before submitting. You can move the pin to adjust its location.');
    this.putPin(coordinates);
  }

  putPin(coordinates) {
    if (!this.map) return;
    if (!this.pin) {
      this.pin = window.L.marker(coordinates, { draggable: true }).addTo(this.map);
      this.pin.on('dragend', () => this.reversePin());
    } else {
      this.pin.setLatLng(coordinates);
    }
  }

  async placePin(latlng) {
    if (!this.enabled) return;
    this.clearSelection({ removePin: false });
    const coordinates = [latlng.lat, latlng.lng];
    this.putPin(coordinates);
    this.searchInput.value = '';
    this.setStatus('Looking up the address at the selected pin…');
    await this.reversePin(coordinates);
  }

  async reversePin(coordinates = null) {
    const sequence = ++this.reverseSequence;
    const point = coordinates || (this.pin && [this.pin.getLatLng().lat, this.pin.getLatLng().lng]);
    if (!point) return;
    this.clearSelection({ removePin: false });
    this.setStatus('Looking up the address at the selected pin…');
    let response;
    try {
      response = await API.reverseGeocode(point[0], point[1]);
    } catch (error) {
      this.setStatus('Address lookup is unavailable. Try searching for the address instead.');
      return;
    }
    if (sequence !== this.reverseSequence) return;
    if (!response.success || !response.result) {
      this.setStatus(response.error || 'No address found near this pin. Move it closer to a mapped street or building.');
      return;
    }
    this.selectAddress(response.result, point);
    this.searchInput.value = response.result.address;
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.setStatus('This browser does not support GPS location. Search for an address or choose a map pin.');
      return;
    }
    this.currentLocationButton.disabled = true;
    this.setStatus('Waiting for browser location permission…');
    navigator.geolocation.getCurrentPosition(
      position => {
        this.currentLocationButton.disabled = !this.enabled;
        const point = [position.coords.latitude, position.coords.longitude];
        if (this.map) this.map.setView(point, 16);
        this.putPin(point);
        this.reversePin(point);
      },
      error => {
        this.currentLocationButton.disabled = !this.enabled;
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Search for an address or choose a map pin instead.'
          : 'Could not read your location. Search for an address or choose a map pin instead.';
        this.setStatus(message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }
}

window.HemoMap = HemoMap;
window.HemoAddressPicker = HemoAddressPicker;