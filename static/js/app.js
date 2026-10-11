/* ==========================================================================
   HemoConnect Application UI Controller Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  HemoApp.init();
});

const HemoApp = {
  currentTab: 'dashboard',
  mapInstance: null,
  activeRequestIdForMatching: null,

  init() {
    this.bindEvents();
    this.initMap();
    this.loadDashboardData();
    this.setupEligibilityLiveChecker();
  },

  initMap() {
    this.mapInstance = new HemoMap('map-container');
    this.mapInstance.init();
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

    // Forms Submit
    const donorForm = document.getElementById('donor-reg-form');
    if (donorForm) {
      donorForm.addEventListener('submit', (e) => this.handleDonorRegistration(e));
    }

    const requestForm = document.getElementById('request-reg-form');
    if (requestForm) {
      requestForm.addEventListener('submit', (e) => this.handleRequestSubmission(e));
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
      this.loadDonors();
    } else if (tabName === 'requests') {
      this.loadRequests();
    } else if (tabName === 'matching') {
      this.loadMatchingView();
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
      if (requestsRes.success && donorsRes.success) {
        this.mapInstance.renderData(requestsRes.requests, donorsRes.donors);
      }
      this.updateEmergencyTicker(requestsRes.requests);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
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
      const urgencyLabel = isSos ? '🚨 CRITICAL SOS' : (isHigh ? '⚡ HIGH PRIORITY' : '📅 NORMAL');

      return `
        <div class="card" style="${isSos ? 'border-color: rgba(255, 46, 85, 0.6); box-shadow: var(--shadow-sos);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <span class="urgency-badge ${urgencyClass}">${urgencyLabel}</span>
              <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 0.5rem;">${req.receiver_type}</span>
              <h3 style="margin-top: 0.35rem; font-size: 1.2rem;">${req.name}</h3>
            </div>
            <div class="blood-badge">${req.blood_group}</div>
          </div>

          <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
            <p><strong>Patient:</strong> ${req.patient_name || 'N/A'}</p>
            <p><strong>Units Required:</strong> ${req.units_required} unit(s) (${req.units_fulfilled || 0} fulfilled)</p>
            <p><strong>Location:</strong> ${req.city} — ${req.hospital_address || ''}</p>
            <p><strong>Contact:</strong> ${req.contact_number}</p>
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
    const data = {
      name: form.name.value,
      age: form.age.value,
      gender: form.gender.value,
      blood_group: form.blood_group.value,
      city: form.city.value,
      address: form.address.value,
      phone: form.phone.value,
      email: form.email.value,
      last_donation_date: form.last_donation_date.value,
      availability_status: form.availability_status.value,
      prev_donations_count: form.prev_donations_count.value || 0,
      weight: form.weight.value || 65.0
    };

    const res = await API.registerDonor(data);
    if (res.success) {
      alert('🎉 Success! You are now registered as a Life-Saving Donor on HemoConnect!');
      form.reset();
      this.switchTab('donors');
    } else {
      alert('❌ Registration Error: ' + (res.error || 'Failed to register'));
    }
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
    const data = {
      receiver_type: form.receiver_type.value,
      name: form.name.value,
      patient_name: form.patient_name.value,
      blood_group: form.blood_group.value,
      units_required: form.units_required.value,
      city: form.city.value,
      hospital_address: form.hospital_address.value,
      contact_number: form.contact_number.value,
      urgency_level: form.urgency_level.value,
      required_datetime: form.required_datetime.value,
      reason_medical_notes: form.reason_medical_notes.value,
      attending_doctor: form.attending_doctor.value
    };

    const res = await API.createRequest(data);
    if (res.success) {
      alert('🚀 Blood Request Broadcasted! AI Matching Engine triggered.');
      form.reset();
      this.triggerMatchingEngine(res.request_id);
    } else {
      alert('❌ Error broadcasting request: ' + (res.error || 'Failed to submit'));
    }
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

    let html = `
      <div class="card" style="margin-bottom: 1.5rem; border-color: var(--primary-red);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="urgency-badge ${req.urgency_level === 'CRITICAL_SOS' ? 'urgency-sos' : 'urgency-high'}">${req.urgency_level}</span>
            <h2 style="font-size: 1.4rem; margin-top: 0.4rem;">Target Request: ${req.name}</h2>
            <div style="font-size: 0.88rem; color: var(--text-muted);">
              Patient: ${req.patient_name || 'N/A'} • Location: ${req.city} • Units Needed: <strong>${req.units_required} unit(s)</strong>
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
    if (modal) modal.classList.add('active');
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

    const data = {
      receiver_type: 'Hospital',
      name: name,
      patient_name: 'CRITICAL EMERGENCY TRAUMA PATIENT',
      blood_group: bg,
      units_required: units,
      city: 'Central City',
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
