(function () {
  'use strict';
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSehpOy8crRqbjNS5iCjGY2YenrhVkN9d5gKrTYvzWoIAcX9nQ/formResponse';
  const FIELD_MAP = Object.freeze({
    full_name: 'entry.174957854', phone: 'entry.1983000286', email: 'entry.491185921',
    instagram_handle: 'entry.709092237', linkedin_profile: 'entry.1380447704',
    real_estate_goals: 'entry.21922786', contact_preference: 'entry.686903170',
    skool_interest: 'entry.2120816330', community_must_have: 'entry.922802930',
    ricky_feedback: 'entry.549558920',
  });
  const form = document.getElementById('f');
  const button = document.getElementById('go');
  const error = document.getElementById('err');
  let pending = null;
  let busy = false;
  let started = false;
  const track = name => { try { window.VolnayTracking?.track(name); } catch {} };

  form.addEventListener('input', () => {
    if (!started) { started = true; track('form started'); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const raw = new FormData(form);
    const fields = Object.fromEntries(Object.entries(FIELD_MAP).map(([label, entry]) => [label, String(raw.get(entry) || '').trim() || null]));
    const digits = (fields.phone || '').replace(/\D/g, '');
    error.hidden = true;
    if (raw.get('website')) { showError('Please leave the website field empty.'); return; }
    if (!fields.full_name || digits.length < 7 || digits.length > 15 || !form.reportValidity()) {
      showError('Please check your name, phone number and email address.'); return;
    }
    const config = window.VOLNAY_CONFIG;
    if (!config?.supabaseUrl || !config?.supabasePublishableKey) {
      showError('The secure sign-up connection is not ready. Please use the Google Form link below.'); return;
    }
    const fingerprint = JSON.stringify(fields);
    // A failed retry reuses the same ID and payload, so timeouts cannot duplicate a record.
    if (!pending || pending.fingerprint !== fingerprint) {
      const consent = window.VolnayTracking?.getConsent() || { analytics:false, advertising:false };
      pending = { fingerprint, payload: {
        id: crypto.randomUUID(), ...fields,
        event_code: window.VolnayTracking?.eventCode || 'unattributed',
        page_path: '/volnayacademy/',
        analytics_consent: !!consent.analytics, advertising_consent: !!consent.advertising,
        consent_version: '1',
      }};
    }
    busy = true;
    button.disabled = true;
    button.textContent = 'Saving...';
    form.setAttribute('aria-busy', 'true');
    track('form submission attempted');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(config.supabaseUrl + '/rest/v1/form_submissions', {
        method:'POST', credentials:'omit', referrerPolicy:'no-referrer', signal:controller.signal,
        headers:{ 'Content-Type':'application/json', apikey:config.supabasePublishableKey, Prefer:'return=minimal' },
        body:JSON.stringify(pending.payload),
      });
      let duplicate = false;
      if (response.status === 409) {
        const detail = await response.json().catch(() => ({}));
        duplicate = detail.code === '23505';
      }
      if (response.status !== 201 && !duplicate) throw new Error('save_not_confirmed');
      clearTimeout(timeout);
      track('form submitted');
      form.hidden = true;
      const thanks = document.getElementById('thanks');
      thanks.hidden = false;
      thanks.focus();
      // Google Forms remains a secondary copy. An opaque response is NOT a confirmed save.
      // Do not automatically mirror duplicate retries, which could create Google duplicates.
      if (!duplicate) {
        fetch(FORM_URL, { method:'POST', mode:'no-cors', credentials:'omit', referrerPolicy:'no-referrer', body:raw, keepalive:true })
          .then(() => track('google form request completed'))
          .catch(() => track('google form request failed'));
      }
    } catch {
      track('form submission failed');
      showError('We could not confirm your sign-up was saved. Your answers are still here. Please try again, or use the Google Form link below.');
    } finally {
      clearTimeout(timeout);
      busy = false;
      button.disabled = false;
      button.textContent = 'Join the list';
      form.setAttribute('aria-busy', 'false');
    }
  });
  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    error.focus();
  }
})();

