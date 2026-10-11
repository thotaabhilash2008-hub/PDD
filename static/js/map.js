/* ==========================================================================
   HemoConnect Interactive Map & Radar Visualizer Module
   ========================================================================== */

class HemoMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.svg = null;
    this.centerLat = 12.9716;
    this.centerLon = 77.5946;
    this.zoom = 12000; // SVG scale
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = `
      <svg id="hemo-svg-map" width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" style="background:#060911;">
        <defs>
          <radialGradient id="grid-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#060911" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="hospital-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ff2e55" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#ff2e55" stop-opacity="0"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Grid Lines -->
        <g stroke="rgba(255,255,255,0.04)" stroke-width="1">
          <line x1="0" y1="100" x2="800" y2="100" />
          <line x1="0" y1="200" x2="800" y2="200" />
          <line x1="0" y1="300" x2="800" y2="300" />
          <line x1="200" y1="0" x2="200" y2="400" />
          <line x1="400" y1="0" x2="400" y2="400" />
          <line x1="600" y1="0" x2="600" y2="400" />
        </g>

        <!-- Radar Pulse Background -->
        <circle cx="400" cy="200" r="180" fill="url(#grid-glow)" />
        <circle cx="400" cy="200" r="120" stroke="rgba(239,68,68,0.15)" stroke-width="1" fill="none" stroke-dasharray="4,4" />
        <circle cx="400" cy="200" r="220" stroke="rgba(239,68,68,0.1)" stroke-width="1" fill="none" />

        <!-- Vectors Layer -->
        <g id="map-vectors"></g>

        <!-- Markers Layer -->
        <g id="map-markers"></g>
      </svg>
    `;
    this.svg = document.getElementById('hemo-svg-map');
  }

  // Convert GPS (Lat, Lon) to Canvas (x, y) coordinates
  gpsToXY(lat, lon) {
    const x = 400 + (lon - this.centerLon) * 3500;
    const y = 200 - (lat - this.centerLat) * 3500;
    return { 
      x: Math.max(40, Math.min(760, x)), 
      y: Math.max(40, Math.min(360, y)) 
    };
  }

  renderData(requests = [], donors = [], activeRequestMatches = null) {
    if (!this.svg) this.init();

    const vectorsGroup = document.getElementById('map-vectors');
    const markersGroup = document.getElementById('map-markers');

    if (!vectorsGroup || !markersGroup) return;

    vectorsGroup.innerHTML = '';
    markersGroup.innerHTML = '';

    // Render Donors
    donors.forEach(donor => {
      const { x, y } = this.gpsToXY(donor.latitude, donor.longitude);
      const isAvailable = donor.availability_status === 'Available';
      const color = isAvailable ? '#10b981' : '#f59e0b';

      markersGroup.innerHTML += `
        <g class="map-node donor-node" transform="translate(${x}, ${y})" style="cursor:pointer;" title="${donor.name} (${donor.blood_group})">
          <circle r="8" fill="${color}" fill-opacity="0.3" />
          <circle r="5" fill="${color}" />
          <text x="9" y="3" fill="#9ca3af" font-size="10" font-family="Outfit, sans-serif" font-weight="600">${donor.name.split(' ')[0]} (${donor.blood_group})</text>
        </g>
      `;
    });

    // Render Requests / Hospitals
    requests.forEach(req => {
      const { x, y } = this.gpsToXY(req.latitude, req.longitude);
      const isCritical = req.urgency_level === 'CRITICAL_SOS';
      const color = isCritical ? '#ff2e55' : '#3b82f6';

      // SOS Pulse Ring
      if (isCritical) {
        markersGroup.innerHTML += `
          <circle cx="${x}" cy="${y}" r="22" fill="none" stroke="#ff2e55" stroke-width="1.5" opacity="0.6">
            <animate attributeName="r" values="10;30;10" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
        `;
      }

      markersGroup.innerHTML += `
        <g class="map-node hospital-node" transform="translate(${x}, ${y})" style="cursor:pointer;" filter="url(#glow)">
          <rect x="-10" y="-10" width="20" height="20" rx="4" fill="${color}" />
          <text x="0" y="4" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">🏥</text>
          <text x="14" y="3" fill="#ffffff" font-size="11" font-family="Outfit, sans-serif" font-weight="700">${req.name} [${req.blood_group}]</text>
        </g>
      `;
    });

    // Render Connection Vectors for active matched request
    if (activeRequestMatches && activeRequestMatches.top_matches) {
      const targetReq = activeRequestMatches.request;
      const reqPos = this.gpsToXY(targetReq.latitude, targetReq.longitude);

      activeRequestMatches.top_matches.slice(0, 5).forEach((match, idx) => {
        const donor = donors.find(d => d.id === match.donor_id);
        if (donor) {
          const donorPos = this.gpsToXY(donor.latitude, donor.longitude);
          const strokeColor = idx === 0 ? '#10b981' : '#3b82f6';
          const dash = idx === 0 ? 'none' : '4,4';

          vectorsGroup.innerHTML += `
            <line x1="${reqPos.x}" y1="${reqPos.y}" x2="${donorPos.x}" y2="${donorPos.y}" 
                  stroke="${strokeColor}" stroke-width="${idx === 0 ? 2.5 : 1.5}" stroke-dasharray="${dash}" opacity="0.85">
              <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
            </line>
            <text x="${(reqPos.x + donorPos.x)/2}" y="${(reqPos.y + donorPos.y)/2 - 5}" 
                  fill="${strokeColor}" font-size="9" font-weight="700" text-anchor="middle">
              ${match.distance_km} km (${match.match_score}%)
            </text>
          `;
        }
      });
    }
  }
}

window.HemoMap = HemoMap;
