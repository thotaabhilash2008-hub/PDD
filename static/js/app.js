/* ==========================================================================
   HemoConnect Application UI Controller Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.authenticated === 'true') HemoApp.init();
});
document.addEventListener('hemo-authenticated', () => {
  HemoApp.init();
  HemoApp.updateLocationSharingControl();
});

const HemoApp = {
  currentTab: 'dashboard',
  mapInstance: null,
  activeRequestIdForMatching: null,
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.initMap();
    this.initAddressPickers();
    this.bindEvents();
    this.loadDashboardData();
    this.setupEligibilityLiveChecker();
  },

  initMap() {
    this.mapInstance = new HemoMap('map-container');
    this.mapInstance.init();
  },

  initAddressPickers() {
    this.addressPickers = {
      donor: new HemoAddressPicker(document.getElementById('donor-address-picker')),
      receiver: new HemoAddressPicker(document.getElementById('receiver-address-picker')),
      sos: new HemoAddressPicker(document.getElementById('sos-address-picker'))
    };
    this.updateLocationSharingControl();
  },

  refreshVisibleAddressPicker(name) {
    requestAnimationFrame(() => this.addressPickers?.[name]?.refresh());
  },

  updateLocationSharingControl() {
    const sharing = document.querySelector('#donor-reg-form [name="location_sharing"]');
    const hint = document.getElementById('location-sharing-hint');
    if (!sharing) return;
    const signedIn = Boolean(window.HemoAuth?.currentUser && !window.HemoAuth?.isGuest);
    sharing.disabled = !signedIn;
    if (!signedIn) sharing.checked = false;
    if (hint) hint.textContent = signedIn
      ? 'Your exact address is never shown publicly. Shared map locations are approximate.'
      : 'Sign in to opt in. Exact addresses are never shown publicly.';
  },

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        themeBtn.innerHTML = newTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
      });
    }

    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => window.HemoAuth.signOut());
    }

    // Forms Submit
    const donorForm = document.getElementById('donor-reg-form');
    if (donorForm) {
      donorForm.addEventListener('submit', (e) => this.handleDonorRegistration(e));
      this.updateLocationSharingControl();
      const donorAge = donorForm.elements.namedItem('age');
      donorAge.addEventListener('input', () => {
        const age = Number(donorAge.value);
        if (donorAge.value && age < 18) {
          donorAge.setCustomValidity('Donors must be at least 18 years old.');
        } else if (donorAge.value && (!Number.isInteger(age) || age > 120)) {
          donorAge.setCustomValidity('Enter a whole-number age between 18 and 120.');
        } else {
          donorAge.setCustomValidity('');
        }
      });
    }

    const requestForm = document.getElementById('request-reg-form');
    if (requestForm) {
      requestForm.addEventListener('submit', (e) => this.handleRequestSubmission(e));
      const receiverType = requestForm.elements.namedItem('receiver_type');
      receiverType.addEventListener('change', () => {
        this.addressPickers.receiver.clearSelection();
        this.updateReceiverFields(receiverType.value);
      });
      this.updateReceiverFields(receiverType.value);
    }

    // Filters
    const donorSearch = document.getElementById('donor-search-input');
    if (donorSearch) {
      donorSearch.addEventListener('input', () => this.loadDonors());
    }

    const donorBgFilter = document.getElementById('donor-bg-filter');
    if (donorBgFilter) {
      donorBgFilter.addEventListener('change', () => this.loadDonors());
    }

    const reqUrgencyFilter = document.getElementById('req-urgency-filter');
    if (reqUrgencyFilter) {
      reqUrgencyFilter.addEventListener('change', () => this.loadRequests());
    }

    const mapRequestSelect = document.getElementById('map-request-select');
    if (mapRequestSelect) {
      mapRequestSelect.addEventListener('change', () => this.renderSelectedNearbyDonors());
    }
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = content.id === `tab-${tabName}` ? 'block' : 'none';
    });

    if (tabName === 'dashboard') {
      this.loadDashboardData();
    } else if (tabName === 'donors') {
      this.refreshVisibleAddressPicker('donor');
      this.loadDonors();
    } else if (tabName === 'requests') {
      this.refreshVisibleAddressPicker('receiver');
      this.loadRequests();
    } else if (tabName === 'matching') {
      this.loadMatchingView();
    } else if (tabName === 'map') {
      this.loadMapData();
    }
  },

  async loadDashboardData() {
    try {
      const [statsRes, requestsRes, donorsRes] = await Promise.all([
        API.getStats(),
        API.getRequests({ status: 'ACTIVE' }),
        API.getDonors()
      ]);

      if (statsRes.success) this.renderStats(statsRes.stats);
      if (requestsRes.success) this.renderActiveRequestsFeed(requestsRes.requests);
      this.updateEmergencyTicker(requestsRes.requests);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  },

  async loadMapData() {
    const [requestsRes, donorsRes] = await Promise.all([
      API.getRequests({ status: 'ACTIVE' }),
      API.getDonors()
    ]);
    if (requestsRes.success && donorsRes.success) {
      this.mapInstance.renderData(requestsRes.requests, donorsRes.donors);
      const select = document.getElementById('map-request-select');
      const hasCoordinates = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
      const requestsWithLocation = requestsRes.requests.filter(request =>
        (request.coordinates_confirmed === true || request.coordinates_confirmed === 1) &&
        hasCoordinates(request.latitude) && hasCoordinates(request.longitude)
      );
      this.mapRequests = requestsWithLocation;
      this.mapDonors = donorsRes.donors;
      select.replaceChildren();
      requestsWithLocation.forEach(request => {
        const option = document.createElement('option');
        option.value = String(request.id);
        option.textContent = `${request.hospital_name || request.receiver_name || request.name} · ${request.blood_group} · ${request.units_required} unit(s)`;
        select.append(option);
      });
      select.disabled = !requestsWithLocation.length;
      document.getElementById('nearby-donors-list').textContent = requestsWithLocation.length
        ? ''
        : 'No active requests with confirmed map locations.';
      if (requestsWithLocation.length) this.renderSelectedNearbyDonors(donorsRes.donors);
    }
  },

  async renderSelectedNearbyDonors(donors = null) {
    const select = document.getElementById('map-request-select');
    const target = document.getElementById('nearby-donors-list');
    const request = (this.mapRequests || []).find(item => String(item.id) === select.value);
    if (!request) {
      target.textContent = 'Select an active request to see nearby eligible donors.';
      return;
    }
    const donorList = donors || this.mapDonors || [];
    this.mapInstance.renderNearbyDonors(request, donorList, target);
  },

  renderStats(stats) {
    document.getElementById('stat-donors').innerText = stats.total_donors || 0;
    document.getElementById('stat-available').innerText = stats.available_donors || 0;
    document.getElementById('stat-requests').innerText = stats.active_requests || 0;
    document.getElementById('stat-sos').innerText = stats.critical_sos_requests || 0;
    document.getElementById('stat-fulfilled').innerText = stats.total_units_fulfilled || 0;
  },

  updateEmergencyTicker(requests = []) {
    const ticker = document.getElementById('emergency-ticker-bar');
    const sosRequests = requests.filter(r => r.urgency_level === 'CRITICAL_SOS');
    if (sosRequests.length > 0) {
      const topSos = sosRequests[0];
      ticker.style.display = 'flex';
      document.getElementById('ticker-text').innerHTML = 
        `🚨 <strong>EMERGENCY SOS BROADCAST:</strong> ${topSos.name} urgently requires <strong>${topSos.units_required} unit(s) of ${topSos.blood_group}</strong> blood at ${topSos.city}. Required immediately!`;
    } else {
      ticker.style.display = 'none';
    }
  },

  renderActiveRequestsFeed(requests = []) {
    const container = document.getElementById('active-requests-container');
    if (!container) return;

    if (requests.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
          ✨ No active blood requests at this time. All patients are fulfilled!
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const isSos = req.urgency_level === 'CRITICAL_SOS';
      const isHigh = req.urgency_level === 'HIGH';
      const urgencyClass = isSos ? 'urgency-sos' : (isHigh ? 'urgency-high' : 'urgency-normal');
      const urgencyLabel = isSos ? '🚨 EMERGENCY' : (isHigh ? '⚡ URGENT' : '📅 NORMAL');
      const contactLabel = req.receiver_type === 'Hospital' ? 'Contact Person' : 'Receiver';
      const receiverHeading = req.receiver_type === 'Hospital' ? req.hospital_name || req.name : req.receiver_name || req.name;
      const receiverPerson = req.receiver_type === 'Hospital'
        ? req.contact_person || req.patient_name
        : req.receiver_name || req.patient_name;
      const requestLocation = req.location_address || req.hospital_address || req.city;

      return `
        <div class="card" style="${isSos ? 'border-color: rgba(255, 46, 85, 0.6); box-shadow: var(--shadow-sos);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <span class="urgency-badge ${urgencyClass}">${urgencyLabel}</span>
              <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 0.5rem;">${req.receiver_type}</span>
              <h3 style="margin-top: 0.35rem; font-size: 1.2rem;">${receiverHeading}</h3>
            </div>
            <div class="blood-badge">${req.blood_group}</div>
          </div>

          <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
            <p><strong>${contactLabel}:</strong> ${receiverPerson || 'N/A'}</p>
            <p><strong>Units Required:</strong> ${req.units_required} unit(s) (${req.units_fulfilled || 0} fulfilled)</p>
            <p><strong>Location:</strong> ${requestLocation}</p>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
            <button class="btn btn-primary" style="flex: 1;" onclick="HemoApp.triggerMatchingEngine(${req.id})">
              🎯 Find Donor Match
            </button>
            <button class="btn btn-outline-danger" onclick="HemoApp.openPledgeModal(${req.id}, '${req.blood_group}', '${req.name}')">
              🩸 Pledge
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async loadRequests() {
    const urgency = document.getElementById('req-urgency-filter')?.value || '';
    const res = await API.getRequests({ status: 'ACTIVE', urgency });
    if (res.success) this.renderActiveRequestsFeed(res.requests);
  },

  async loadDonors() {
    const search = document.getElementById('donor-search-input')?.value || '';
    const bg = document.getElementById('donor-bg-filter')?.value || '';
    const status = document.getElementById('donor-status-filter')?.value || '';

    const container = document.getElementById('donors-grid');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Loading registered donors...</div>';

    const res = await API.getDonors({ search, blood_group: bg, status });
    if (res.success && res.donors) {
      if (res.donors.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No donors found matching criteria.</div>';
        return;
      }

      container.innerHTML = res.donors.map(d => {
        const availClass = d.availability_status === 'Available' ? 'pill-available' : (d.availability_status === 'On Call' ? 'pill-oncall' : 'pill-unavailable');
        const eligClass = d.is_eligible ? 'pill-eligible' : 'pill-ineligible';
        const sharingToggle = d.can_manage_location_sharing
          ? `<label class="donor-sharing-toggle"><input type="checkbox" ${d.location_sharing ? 'checked' : ''} onchange="HemoApp.setDonorLocationSharing(${d.id}, this.checked)"> Share approximate location</label>`
          : `<span class="donor-location-status">${d.location_sharing ? 'Approximate location shared' : 'Location private'}</span>`;

        return `
          <div class="donor-card">
            <div>
              <div class="donor-card-header">
                <div>
                  <div class="donor-name">${d.name}</div>
                  <div class="donor-meta">Age: ${d.age} • ${d.gender} • 📍 ${d.city}</div>
                </div>
                <div class="blood-badge">${d.blood_group}</div>
              </div>

              <div style="display: flex; gap: 0.5rem; margin: 0.75rem 0; flex-wrap: wrap;">
                <span class="status-pill ${availClass}">${d.availability_status}</span>
                <span class="status-pill ${eligClass}">${d.is_eligible ? '✅ Eligible' : '⏳ Wait (' + d.days_until_eligible + 'd)'}</span>
              </div>
              ${sharingToggle}

              <div class="donor-card-stats">
                <div class="stat-item">
                  <span class="stat-item-label">Donations</span>
                  <span class="stat-item-val">${d.prev_donations_count} times</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">Lives Saved</span>
                  <span class="stat-item-val" style="color: #10b981;">~${d.prev_donations_count * 3} lives</span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <a href="tel:${d.phone}" class="btn btn-secondary" style="flex:1; font-size: 0.82rem; padding: 0.5rem;">
                📞 Call
              </a>
              <button class="btn btn-outline-danger" style="flex:1; font-size: 0.82rem; padding: 0.5rem;" onclick="HemoApp.quickToggleAvailability(${d.id}, '${d.availability_status}')">
                ⚙️ Status
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  async handleDonorRegistration(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.reportValidity()) return;
    const selectedAddress = this.addressPickers.donor.getSelection();
    if (!selectedAddress) {
      this.addressPickers.donor.setStatus('Select an address, choose a map pin, and confirm it before registering.');
      this.addressPickers.donor.searchInput.focus();
      return;
    }
    const data = {
      name: form.elements.namedItem('name').value.trim(),
      age: form.elements.namedItem('age').value,
      blood_group: form.elements.namedItem('blood_group').value,
      city: selectedAddress.city || selectedAddress.address,
      phone: form.elements.namedItem('phone').value.trim(),
      availability: form.elements.namedItem('availability').value,
      address: selectedAddress.address,
      address_confirmed: true,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
      address_confirmed: true,
      location_sharing: form.elements.namedItem('location_sharing').checked
    };

    const res = await API.registerDonor(data);
    if (res.success) {
      alert('🎉 Success! You are now registered as a Life-Saving Donor on HemoConnect!');
      form.reset();
      this.addressPickers.donor.clearSelection();
      this.updateLocationSharingControl();
      this.switchTab('donors');
    } else {
      alert('❌ Registration Error: ' + (res.error || 'Failed to register'));
    }
  },

  async setDonorLocationSharing(donorId, locationSharing) {
    const checkbox = document.querySelector(`[onchange="HemoApp.setDonorLocationSharing(${donorId}, this.checked)"]`);
    if (checkbox) checkbox.disabled = true;
    const res = await API.updateDonorLocationSharing(donorId, locationSharing);
    if (!res.success) {
      if (checkbox) {
        checkbox.checked = !locationSharing;
        checkbox.disabled = false;
      }
      alert(res.error || 'Could not update location sharing.');
      return;
    }
    this.loadDonors();
  },

  setupEligibilityLiveChecker() {
    const dateInput = document.getElementById('last_donation_date');
    const ageInput = document.getElementById('donor_age');
    const box = document.getElementById('eligibility-preview-box');

    if (!dateInput || !box) return;

    const check = () => {
      const dateVal = dateInput.value;
      const ageVal = parseInt(ageInput?.value || '25');

      if (ageVal < 18) {
        box.className = 'status-pill pill-ineligible';
        box.innerHTML = '⚠️ Must be at least 18 years old to donate.';
        return;
      }

      if (!dateVal) {
        box.className = 'status-pill pill-eligible';
        box.innerHTML = '✅ Eligible for immediate donation!';
        return;
      }

      const lastDate = new Date(dateVal);
      const today = new Date();
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 56) {
        box.className = 'status-pill pill-eligible';
        box.innerHTML = `✅ Eligible! (Last donated ${diffDays} days ago)`;
      } else {
        const remaining = 56 - diffDays;
        box.className = 'status-pill pill-ineligible';
        box.innerHTML = `⏳ Ineligible: Must wait ${remaining} more days before next donation.`;
      }
    };

    dateInput.addEventListener('change', check);
    if (ageInput) ageInput.addEventListener('input', check);
  },

  async handleRequestSubmission(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.reportValidity()) return;
    const receiverType = form.elements.namedItem('receiver_type').value;
    const isHospital = receiverType === 'Hospital';
    const selectedAddress = this.addressPickers.receiver.getSelection();
    if (!selectedAddress) {
      this.addressPickers.receiver.setStatus('Select an address, choose a map pin, and confirm it before submitting.');
      this.addressPickers.receiver.searchInput.focus();
      return;
    }
    const location = selectedAddress.city || selectedAddress.address;
    const personName = form.elements.namedItem(isHospital ? 'contact_person' : 'individual_name').value.trim();
    const requestName = isHospital
      ? form.elements.namedItem('hospital_name').value.trim()
      : personName;
    const now = new Date();
    const requiredDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    const urgencyMap = { Normal: 'NORMAL', Urgent: 'HIGH', Emergency: 'CRITICAL_SOS' };
    const data = {
      receiver_type: receiverType,
      hospital_name: isHospital ? requestName : '',
      receiver_name: isHospital ? '' : personName,
      contact_person: isHospital ? personName : '',
      individual_name: isHospital ? '' : personName,
      name: requestName,
      patient_name: personName,
      contact_number: form.elements.namedItem('contact_number').value.trim(),
      blood_group: form.elements.namedItem('blood_group').value,
      units_required: form.elements.namedItem('units_required').value,
      location,
      location_address: selectedAddress.address,
      address_confirmed: true,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
      address_confirmed: true,
      city: location,
      hospital_address: isHospital ? location : '',
      urgency_level: urgencyMap[form.elements.namedItem('urgency_level').value],
      required_datetime: requiredDatetime
    };

    const res = await API.createRequest(data);
    if (res.success) {
      alert('🚀 Blood Request Broadcasted! AI Matching Engine triggered.');
      form.reset();
      this.addressPickers.receiver.clearSelection();
      this.triggerMatchingEngine(res.request_id);
    } else {
      alert('❌ Error broadcasting request: ' + (res.error || 'Failed to submit'));
    }
  },

  updateReceiverFields(receiverType) {
    const isHospital = receiverType === 'Hospital';
    const hospitalFields = document.getElementById('hospital-fields');
    const individualFields = document.getElementById('individual-fields');
    const commonFields = document.getElementById('common-request-fields');
    hospitalFields.hidden = !isHospital;
    individualFields.hidden = isHospital || !receiverType;
    commonFields.hidden = !receiverType;
    hospitalFields.querySelectorAll('input').forEach(input => { input.disabled = !isHospital; });
    individualFields.querySelectorAll('input').forEach(input => { input.disabled = isHospital || !receiverType; });
    commonFields.querySelectorAll('input, select').forEach(input => { input.disabled = !receiverType; });
    this.addressPickers.receiver.setEnabled(Boolean(receiverType));

    const locationLabel = document.getElementById('request-location-label');
    locationLabel.textContent = isHospital ? 'Specific Address *' : 'Current Address *';
  },

  async loadMatchingView(requestId = null) {
    if (!requestId && !this.activeRequestIdForMatching) {
      // Pick first active request
      const reqsRes = await API.getRequests({ status: 'ACTIVE' });
      if (reqsRes.success && reqsRes.requests.length > 0) {
        requestId = reqsRes.requests[0].id;
      }
    } else if (!requestId) {
      requestId = this.activeRequestIdForMatching;
    }

    if (!requestId) {
      document.getElementById('matching-results-box').innerHTML = 
        '<div style="text-align:center; padding: 3rem; color: var(--text-muted);">No active requests to match. File a request first!</div>';
      return;
    }

    this.activeRequestIdForMatching = requestId;

    const res = await API.getRequestMatches(requestId);
    if (res.success) {
      this.renderMatchingResults(res);
      // Update Map vectors
      const donorsRes = await API.getDonors();
      if (donorsRes.success) {
        this.mapInstance.renderData([res.request], donorsRes.donors, res);
      }
    }
  },

  triggerMatchingEngine(requestId) {
    this.activeRequestIdForMatching = requestId;
    this.switchTab('matching');
    this.loadMatchingView(requestId);
  },

  renderMatchingResults(matchData) {
    const container = document.getElementById('matching-results-box');
    const req = matchData.request;
    const matches = matchData.top_matches || [];
    const urgencyLabel = req.urgency_level === 'CRITICAL_SOS' ? 'Emergency' : (req.urgency_level === 'HIGH' ? 'Urgent' : 'Normal');
    const contactLabel = req.receiver_type === 'Hospital' ? 'Contact Person' : 'Receiver';
    const receiverHeading = req.receiver_type === 'Hospital' ? req.hospital_name || req.name : req.receiver_name || req.name;
    const receiverPerson = req.receiver_type === 'Hospital'
      ? req.contact_person || req.patient_name
      : req.receiver_name || req.patient_name;

    let html = `
      <div class="card" style="margin-bottom: 1.5rem; border-color: var(--primary-red);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="urgency-badge ${req.urgency_level === 'CRITICAL_SOS' ? 'urgency-sos' : 'urgency-high'}">${urgencyLabel}</span>
            <h2 style="font-size: 1.4rem; margin-top: 0.4rem;">Target Request: ${receiverHeading}</h2>
            <div style="font-size: 0.88rem; color: var(--text-muted);">
              ${contactLabel}: ${receiverPerson || 'N/A'} • Location: ${req.location_address || req.city} • Units Needed: <strong>${req.units_required} unit(s)</strong>
            </div>
          </div>
          <div class="blood-badge" style="font-size: 1.3rem; padding: 0.5rem 1rem;">${req.blood_group}</div>
        </div>
      </div>

      <h3 style="margin-bottom: 1rem;">🎯 Top AI-Ranked Donor Matches (${matches.length} compatible donors)</h3>
    `;

    if (matches.length === 0) {
      html += '<div class="card" style="text-align: center; padding: 2rem;">No compatible donors currently available for this blood group in the matching radius.</div>';
    } else {
      html += matches.map((m, idx) => `
        <div class="match-card">
          <div class="match-score-circle">
            <div class="match-score-num">${m.match_score}%</div>
            <div class="match-score-sub">MATCH</div>
          </div>

          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <h4 style="font-size: 1.15rem;">#${idx+1} ${m.donor_name}</h4>
              <span class="blood-badge" style="font-size: 0.8rem; padding: 0.15rem 0.5rem;">${m.donor_blood_group}</span>
              <span class="status-pill pill-${m.donor_availability.toLowerCase().replace(' ', '')}">${m.donor_availability}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
              📍 <strong>${m.distance_km} km away</strong> (${m.donor_city}) • ⏱️ ETA: <strong>~${m.eta_minutes} mins</strong> • ${m.compatibility_type}
            </div>
            <div class="match-breakdown-bar">
              <span>Compat: ${m.score_breakdown.compatibility}%</span> • 
              <span>Distance: ${m.score_breakdown.distance}%</span> • 
              <span>Availability: ${m.score_breakdown.availability}%</span>
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: #10b981; font-weight: 700;">${m.badge}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${m.prev_donations_count} Past Donations</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <a href="tel:${m.donor_phone}" class="btn btn-primary" style="font-size: 0.82rem; padding: 0.45rem;">
              📞 Call Donor
            </a>
            <button class="btn btn-outline-danger" style="font-size: 0.82rem; padding: 0.45rem;" onclick="HemoApp.executePledge(${req.id}, ${m.donor_id})">
              🩸 Pledge & Dispatch
            </button>
          </div>
        </div>
      `).join('');
    }

    container.innerHTML = html;
  },

  async executePledge(requestId, donorId) {
    if (!confirm('Confirm pledging this donor to fulfill 1 unit for the request?')) return;
    const res = await API.pledgeDonor(requestId, donorId, 1);
    if (res.success) {
      alert(`🎉 Pledge Confirmed! Request now has ${res.units_fulfilled}/${res.units_required} unit(s) fulfilled.`);
      this.loadDashboardData();
      this.loadMatchingView(requestId);
    }
  },

  openPledgeModal(requestId, bg, name) {
    const donorId = prompt(`Enter Donor ID or Select donor to pledge for ${name} [${bg}]:`, '1');
    if (donorId) {
      this.executePledge(requestId, parseInt(donorId));
    }
  },

  async quickToggleAvailability(donorId, currentStatus) {
    const nextStatus = currentStatus === 'Available' ? 'On Call' : (currentStatus === 'On Call' ? 'Unavailable' : 'Available');
    const res = await API.updateDonorStatus(donorId, { availability_status: nextStatus });
    if (res.success) {
      this.loadDonors();
    }
  },

  openSosModal() {
    const modal = document.getElementById('sos-modal');
    if (modal) {
      modal.classList.add('active');
      this.refreshVisibleAddressPicker('sos');
    }
  },

  closeSosModal() {
    const modal = document.getElementById('sos-modal');
    if (modal) modal.classList.remove('active');
  },

  async submitEmergencySos() {
    const bg = document.getElementById('sos-bg').value;
    const name = document.getElementById('sos-hospital').value;
    const units = document.getElementById('sos-units').value;
    const phone = document.getElementById('sos-phone').value;

    if (!name || !phone) {
      alert('Please fill in Hospital Name and Emergency Contact Phone.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      alert('Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    const selectedAddress = this.addressPickers.sos.getSelection();
    if (!selectedAddress) {
      this.addressPickers.sos.setStatus('Select and confirm an emergency address before broadcasting.');
      alert('Select and confirm the emergency location before broadcasting.');
      return;
    }

    const data = {
      receiver_type: 'Hospital',
      hospital_name: name,
      name: name,
      patient_name: 'CRITICAL EMERGENCY TRAUMA PATIENT',
      blood_group: bg,
      units_required: units,
      city: selectedAddress.city || selectedAddress.address,
      location_address: selectedAddress.address,
      address_confirmed: true,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
      contact_number: phone,
      urgency_level: 'CRITICAL_SOS',
      required_datetime: new Date().toISOString().slice(0, 16),
      reason_medical_notes: 'IMMEDIATE EMERGENCY SOS DISPATCH TRIGGERED BY FIRST RESPONDER'
    };

    const res = await API.createRequest(data);
    if (res.success) {
      this.closeSosModal();
      alert('🚨 EMERGENCY SOS BROADCASTED TO ALL NEARBY MATCHING DONORS!');
      this.loadDashboardData();
      this.triggerMatchingEngine(res.request_id);
    }
  }
};

window.HemoApp = HemoApp;
