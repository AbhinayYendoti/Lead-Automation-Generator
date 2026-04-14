(() => {
  'use strict';

  // ── API Base URL ─────────────────────────────────────────────────────────────
  // Production Render backend. Change to '' if frontend and backend are
  // served from the same origin (same Express instance).
  const API_BASE = 'https://lead-automation-generator.onrender.com';

  // ── DOM Refs ────────────────────────────────────────────────────────────────
  const form            = document.getElementById('leadForm');
  const submitBtn       = document.getElementById('submitBtn');
  const btnText         = document.getElementById('btnText');
  const btnArrow        = document.getElementById('btnArrow');
  const spinner         = document.getElementById('spinner');
  const workflowBox     = document.getElementById('workflowBox');
  const responseBox     = document.getElementById('responseBox');
  const testToggle      = document.getElementById('testModeToggle');
  const toggleLabel     = document.getElementById('toggleLabel');
  const testFields      = document.getElementById('testModeFields');
  const testModeBlock   = document.getElementById('testModeBlock');
  const testModeHeader  = document.getElementById('testModeHeader');
  const formProgress    = document.getElementById('formProgress');
  const fieldsCount     = document.getElementById('fieldsFilledCount');
  const processingBadge = document.getElementById('processingBadge');
  const footerTime      = document.getElementById('footerTime');

  // ── Footer Clock ────────────────────────────────────────────────────────────
  function updateClock() {
    const now = new Date();
    footerTime.textContent = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Kolkata',
    }) + ' IST';
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ── Form Progress Tracker ────────────────────────────────────────────────────
  const CORE_FIELDS = ['name', 'phone', 'email', 'source'];
  const FIELD_TOTAL = CORE_FIELDS.length;

  function updateProgress() {
    let filled = 0;
    CORE_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim() !== '') filled++;
    });
    const pct = Math.round((filled / FIELD_TOTAL) * 100);
    formProgress.style.width = pct + '%';
    formProgress.closest('[role="progressbar"]').setAttribute('aria-valuenow', pct);
    fieldsCount.textContent = filled + '/' + FIELD_TOTAL;
  }

  CORE_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateProgress);
      el.addEventListener('change', updateProgress);
    }
  });

  // ── Contact field muting (Test Mode) ──────────────────────────────────────
  const CONTACT_FIELDS = [
    { inputId: 'email', groupId: 'emailGroup' },
    { inputId: 'phone', groupId: 'phoneGroup' },
  ];

  function muteContactFields(mute) {
    CONTACT_FIELDS.forEach(({ inputId, groupId }) => {
      const input = document.getElementById(inputId);
      const group = document.getElementById(groupId);
      if (input) {
        input.disabled = mute;
        if (mute) clearFieldError(inputId);
      }
      if (group) group.classList.toggle('field-muted', mute);
    });
  }

  // ── Live Test Mode Toggle ────────────────────────────────────────────────────
  function setTestMode(active) {
    testFields.classList.toggle('visible', active);
    testFields.setAttribute('aria-hidden', String(!active));
    testModeBlock.classList.toggle('is-active', active);
    testModeHeader.setAttribute('aria-expanded', String(active));
    muteContactFields(active);
    if (!active) {
      clearFieldError('testEmail');
      clearFieldError('testPhone');
    }
  }

  testToggle.addEventListener('change', () => setTestMode(testToggle.checked));

  // Prevent label click from bubbling up to the header (which would double-toggle).
  // This replaces the removed inline onclick="event.stopPropagation()" (CSP fix).
  if (toggleLabel) {
    toggleLabel.addEventListener('click', e => e.stopPropagation());
  }

  // Allow keyboard activation on the header div
  testModeHeader.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      testToggle.checked = !testToggle.checked;
      setTestMode(testToggle.checked);
    }
  });

  // ── Validators ───────────────────────────────────────────────────────────────
  const validators = {
    name:      v => v.trim().length >= 2      ? null : 'Name must be at least 2 characters.',
    email:     v => /^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Enter a valid email address.',
    phone:     v => /^\+?[0-9]{10,15}$/.test(v.trim()) ? null : 'Phone must be 10–15 digits (+ optional).',
    source:    v => v                         ? null : 'Please select a lead source.',
    testEmail: v => /^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Enter a valid email address.',
    testPhone: v => /^\+?[0-9]{10,15}$/.test(v.trim()) ? null : 'Phone must be 10–15 digits (+ optional).',
  };

  function showFieldError(id, msg) {
    const input   = document.getElementById(id);
    const wrapper = document.getElementById(id + '-error');
    const text    = document.getElementById(id + '-error-text');
    if (input)   input.classList.add('input-error');
    if (wrapper) wrapper.classList.add('visible');
    if (text)    text.textContent = msg;
  }

  function clearFieldError(id) {
    const input   = document.getElementById(id);
    const wrapper = document.getElementById(id + '-error');
    const text    = document.getElementById(id + '-error-text');
    if (input)   input.classList.remove('input-error');
    if (wrapper) wrapper.classList.remove('visible');
    if (text)    text.textContent = '';
  }

  // Blur + input validation
  Object.keys(validators).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      if ((id === 'testEmail' || id === 'testPhone') && !testToggle.checked) return;
      const msg = validators[id](el.value);
      msg ? showFieldError(id, msg) : clearFieldError(id);
    });
    el.addEventListener('input', () => clearFieldError(id));
  });

  function validateAll() {
    let valid = true;
    const isTest = testToggle.checked;
    // In test mode, email + phone are disabled and not the notification target —
    // skip their validation entirely (source of truth is testEmail / testPhone).
    const activeCore = isTest
      ? ['name', 'source']
      : ['name', 'email', 'phone', 'source'];

    activeCore.forEach(id => {
      const el  = document.getElementById(id);
      const msg = validators[id](el ? el.value : '');
      if (msg) { showFieldError(id, msg); valid = false; }
      else     { clearFieldError(id); }
    });

    if (isTest) {
      ['testEmail', 'testPhone'].forEach(id => {
        const el  = document.getElementById(id);
        const msg = validators[id](el ? el.value : '');
        if (msg) { showFieldError(id, msg); valid = false; }
        else     { clearFieldError(id); }
      });
    }

    return valid;
  }

  // ── Workflow Stepper ─────────────────────────────────────────────────────────
  const STEP_IDS = ['step-1', 'step-2', 'step-3', 'step-4'];
  const stepStartTimes = {};

  function resetSteps() {
    STEP_IDS.forEach(id => {
      const el = document.getElementById(id);
      el.classList.remove('active', 'done');
    });
  }

  function activateStep(index) {
    const el = document.getElementById(STEP_IDS[index]);
    el.classList.add('active');
    stepStartTimes[index] = performance.now();
  }

  function completeStep(index) {
    const el      = document.getElementById(STEP_IDS[index]);
    const timeEl  = document.getElementById(STEP_IDS[index] + '-time');
    const elapsed = performance.now() - (stepStartTimes[index] || performance.now());
    el.classList.remove('active');
    el.classList.add('done');
    if (timeEl) timeEl.textContent = (elapsed / 1000).toFixed(2) + 's';
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Runs animated stepper in parallel with the API call.
  // Steps 1–3 animate quickly; step 4 awaits the real API response.
  async function runStepperAnimation(apiPromise) {
    workflowBox.style.display = 'block';
    responseBox.style.display = 'none';
    responseBox.classList.remove('animate-in');
    resetSteps();

    // Brief entrance settle
    workflowBox.style.opacity = '0';
    workflowBox.style.transform = 'translateY(8px)';
    workflowBox.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    requestAnimationFrame(() => {
      workflowBox.style.opacity = '1';
      workflowBox.style.transform = 'translateY(0)';
    });

    // Step 1: Validating Input
    activateStep(0);
    await delay(580);
    completeStep(0);

    // Step 2: Assigning Priority
    activateStep(1);
    await delay(680);
    completeStep(1);

    // Step 3: Persisting to DB
    activateStep(2);
    await delay(760);
    completeStep(2);

    // Step 4: Dispatching Notifications — waits for real API
    activateStep(3);
    const result = await apiPromise;
    completeStep(3);

    // Swap badge to "Complete"
    processingBadge.style.background = 'rgba(16,185,129,0.1)';
    processingBadge.style.borderColor = 'rgba(16,185,129,0.25)';
    processingBadge.style.color = '#10B981';
    processingBadge.querySelector('.workflow-processing-dot').style.background = '#10B981';
    processingBadge.querySelector('.workflow-processing-dot').style.animation = 'none';
    processingBadge.querySelector('.workflow-processing-dot').style.opacity = '1';
    processingBadge.querySelector('.workflow-processing-dot').style.transform = 'scale(1)';
    const badgeText = processingBadge.childNodes[processingBadge.childNodes.length - 1];
    if (badgeText && badgeText.nodeType === Node.TEXT_NODE) {
      badgeText.textContent = ' Complete';
    }

    return result;
  }

  // ── Response Rendering ───────────────────────────────────────────────────────

  function priorityBadgeHTML(priority) {
    const map = {
      'High':   { cls: 'priority-high',   label: 'High' },
      'Medium': { cls: 'priority-medium', label: 'Medium' },
      'Low':    { cls: 'priority-low',    label: 'Low' },
    };
    const p = map[priority] || map['Low'];
    return `<span class="priority-badge ${p.cls}">
      <span class="priority-badge-dot"></span>${p.label}
    </span>`;
  }

  function notifChipHTML(channel, status, icon) {
    const isSent = status === 'sent';
    return `
      <div class="notif-chip">
        <div class="notif-chip-icon ${isSent ? 'sent' : 'failed'}">
          ${icon}
        </div>
        <div class="notif-chip-text">
          <div class="notif-chip-name">${channel}</div>
          <div class="notif-chip-status ${isSent ? 'sent' : 'failed'}">${isSent ? 'Sent' : 'Failed'}</div>
        </div>
      </div>`;
  }

  const WHATSAPP_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5C3.96 1.5 1.5 3.96 1.5 7c0 .96.25 1.87.69 2.66L1.5 12.5l2.92-.68A5.49 5.49 0 007 12.5c3.04 0 5.5-2.46 5.5-5.5S10.04 1.5 7 1.5z" stroke="currentColor" stroke-width="1.2"/>
    <path d="M5 5.5s.5 1 1.5 2S8.5 9 8.5 9l1-.5s.5-.3 0-1L9 7c-.3-.5-.5-.3-.5-.3L8 7s-1-1-1.5-2l.5-.5s.2-.2-.3-.5l-.5-.5c-.5-.5-.7 0-.7 0L5 5.5z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
  </svg>`;

  const EMAIL_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
    <path d="M1.5 4.5L7 8L12.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

  function showResponse(data) {
    const d  = data.data;
    const n  = data.notifications;
    const isTest = n.mode === 'live_test';

    const ts = new Date(d.timestamp).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }) + ' IST';

    const deliveredBanner = isTest && n.deliveredTo
      ? `<div class="delivered-banner">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5l1.5 3 3.3.5-2.4 2.3.6 3.2L7 9 4 10.5l.6-3.2L2.2 5l3.3-.5L7 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          </svg>
          <div class="delivered-banner-text">
            <strong>Live Test — </strong>Notifications rerouted to
            <strong>${n.deliveredTo.email}</strong> &amp;
            <strong>${n.deliveredTo.whatsapp}</strong>
          </div>
        </div>`
      : '';

    responseBox.innerHTML = `
      <div class="result-card">
        <div class="result-success-bar"></div>
        <div class="result-header">
          <div class="result-icon success">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l4 4 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="result-header-text">
            <div class="result-title">Lead Processed Successfully</div>
            <div class="result-lead-id">${d.leadId}</div>
          </div>
          <div class="result-timestamp">${ts}</div>
        </div>
        <div class="result-grid">
          <div class="result-row">
            <span class="result-label">Priority</span>
            ${priorityBadgeHTML(d.priority)}
          </div>
          <div class="result-row">
            <span class="result-label">Name</span>
            <span class="result-value">${escapeHTML(d.name)}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Email</span>
            <span class="result-value">${escapeHTML(d.email)}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Source</span>
            <span class="result-value">${escapeHTML(d.source)}</span>
          </div>
        </div>
        <div class="notif-section">
          ${notifChipHTML('WhatsApp', n.whatsapp, WHATSAPP_ICON)}
          ${notifChipHTML('Email', n.email, EMAIL_ICON)}
        </div>
        ${deliveredBanner}
      </div>`;

    responseBox.style.display = 'block';
    // Trigger animation on next frame
    requestAnimationFrame(() => responseBox.classList.add('animate-in'));
  }

  function showError(title, detail) {
    responseBox.innerHTML = `
      <div class="error-card">
        <div class="error-top-bar"></div>
        <div class="error-body">
          <div class="error-icon-wrap">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/>
              <path d="M8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
            </svg>
          </div>
          <div class="error-text-wrap">
            <div class="error-title">${escapeHTML(title)}</div>
            <div class="error-detail">${escapeHTML(detail)}</div>
          </div>
        </div>
      </div>`;
    responseBox.style.display = 'block';
    requestAnimationFrame(() => responseBox.classList.add('animate-in'));
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Loading State ─────────────────────────────────────────────────────────────
  function setLoading(on) {
    submitBtn.disabled      = on;
    spinner.style.display   = on ? 'inline-block' : 'none';
    btnArrow.style.display  = on ? 'none' : 'block';
    btnText.textContent     = on ? 'Processing…' : 'Submit Lead';
  }

  // ── Form Submit ───────────────────────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    responseBox.style.display = 'none';
    responseBox.classList.remove('animate-in');

    if (!validateAll()) return;

    const isTestMode = testToggle.checked;

    // Build payload based on active mode.
    // Test Mode  → omit email/phone (disabled, not the notification target)
    //              include testEmail/testPhone as the routing destination.
    // Default Mode → include email/phone; omit test fields entirely.
    const payload = {
      name:     document.getElementById('name').value.trim(),
      source:   document.getElementById('source').value,
      testMode: isTestMode,
    };

    if (isTestMode) {
      payload.testEmail = document.getElementById('testEmail').value.trim();
      payload.testPhone = document.getElementById('testPhone').value.trim();
    } else {
      payload.email = document.getElementById('email').value.trim();
      payload.phone = document.getElementById('phone').value.trim();
    }

    setLoading(true);

    // Reset processing badge style
    processingBadge.removeAttribute('style');
    const badgeText = processingBadge.childNodes[processingBadge.childNodes.length - 1];
    if (badgeText && badgeText.nodeType === Node.TEXT_NODE) {
      badgeText.textContent = ' Processing';
    }

    // Fire API call immediately (do not await here)
    const apiCall = fetch(`${API_BASE}/lead`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })));

    // Run stepper animation concurrently with API
    runStepperAnimation(apiCall)
      .then(result => {
        if (result.ok && result.data.status === 'success') {
          showResponse(result.data);
          form.reset();
          updateProgress();
          testToggle.checked = false;
          setTestMode(false);
        } else if (result.status === 422 && result.data.errors) {
          result.data.errors.forEach(err => {
            if (err.field) showFieldError(err.field, err.message);
          });
          workflowBox.style.display = 'none';
          showError('Validation Error', result.data.message || 'Please correct the highlighted fields.');
        } else {
          workflowBox.style.display = 'none';
          showError('Processing Failed', result.data.message || 'Something went wrong. Please try again.');
        }
      })
      .catch(() => {
        workflowBox.style.display = 'none';
        showError('Network Error', 'Could not reach the server. Check your connection and try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  });

})();
