// AURA FormPilot filler. Injected on demand (popup button or Alt+Shift+F), in every frame.
// It fills what the vault knows, highlights what still needs you, and never submits.
(async function auraFormPilot() {
  const { profile, resume } = await chrome.storage.local.get(['profile', 'resume']);
  if (!profile) return report({ error: 'no-profile' });

  const NOT_A_PERSON = /company|employer|organi[sz]ation|college|school|university|institute|reference|referr|father|mother|spouse|manager|supervisor|user ?name|project|course|board/;

  // First match wins, so specific rules come before generic ones.
  const RULES = [
    ['firstName', /first name|given name|\bfname\b/],
    ['lastName', /last name|surname|family name|\blname\b/],
    ['email', /e ?mail/],
    ['phone', /phone|mobile|\btel\b|contact (no|number)|whats ?app/],
    ['linkedin', /linked ?in/],
    ['github', /git ?hub/],
    ['portfolio', /portfolio|personal (site|website)|website|web ?site/],
    ['dob', /date of birth|\bdob\b|birth ?date|\bbday\b/],
    ['gender', /gender|\bsex\b/],
    ['pincode', /pin ?code|zip|postal/],
    ['state', /\bstate\b|province/],
    ['country', /country/],
    ['city', /\bcity\b|town/],
    ['address', /address|street/],
    ['currentCtc', /current (ctc|salary|compensation|annual|package)|present (ctc|salary)|\bcctc\b/],
    ['expectedCtc', /expected (ctc|salary|compensation|package)|desired salary|salary expectation|\bectc\b/],
    ['noticePeriod', /notice period|joining time|how soon|available to (join|start)|earliest (start|join)/],
    ['experienceYears', /(total|overall|years? of|relevant) experience|\bexperience\b.*(year|yrs)|\byears? of exp/],
    ['currentCompany', /current (company|employer|organi[sz]ation)|present (company|employer)|\bemployer\b|company name|name of (the )?company|\borgani[sz]ation\b/],
    ['currentTitle', /current (job )?(title|designation|role|position)|\bdesignation\b|job title/],
    ['graduationYear', /graduation year|year of (passing|graduation)|passing year/],
    ['percentage', /percentage|\bcgpa\b|\bgpa\b|marks/],
    ['degree', /degree|qualification/],
    ['university', /college|university|institute|school/],
    ['skills', /\bskills?\b|technologies|tech stack/],
    ['whyJoin', /why (do you|are you|should|would you|join)|motivation|interest in (this|the)/],
    ['summary', /summary|about (you|yourself)|cover letter|introduce|\bbio\b|additional information/],
    ['location', /current location|\blocation\b|where are you (based|located)/],
    ['fullName', /full name|your name|candidate name|applicant name|^name$|\bname\b/],
  ];

  const norm = (s) => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[_\-.*:()\[\]]+/g, ' ').replace(/\s+/g, ' ').trim();
  const txt = (n) => (n ? n.textContent || '' : '').trim().slice(0, 120);

  const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';

  function describe(el) {
    const parts = [];
    if (el.labels) el.labels.forEach((l) => parts.push(txt(l)));
    parts.push(el.getAttribute('aria-label'), el.placeholder, el.name, el.id, el.title, el.autocomplete);
    const by = el.getAttribute('aria-labelledby');
    if (by) by.split(/\s+/).forEach((id) => parts.push(txt(document.getElementById(id))));
    const wrap = el.closest('label');
    if (wrap) parts.push(txt(wrap));
    // Sites without proper <label>s: look at the text just before the field.
    let n = el;
    for (let i = 0; i < 3 && n; i++) {
      const prev = n.previousElementSibling;
      if (prev && !prev.querySelector?.('input,select,textarea')) parts.push(txt(prev));
      n = n.parentElement;
    }
    const fs = el.closest('fieldset');
    if (fs) parts.push(txt(fs.querySelector('legend')));
    return norm(parts.filter(Boolean).join(' | '));
  }

  function valueFor(key) {
    const p = profile;
    const [first = '', ...rest] = (p.fullName || '').trim().split(/\s+/);
    const map = {
      firstName: first, lastName: rest.join(' ') || first, fullName: p.fullName, email: p.email, phone: p.phone,
      linkedin: p.linkedin, github: p.github, portfolio: p.portfolio || p.github || p.linkedin, dob: p.dob, gender: p.gender,
      pincode: p.pincode, state: p.state, country: p.country, city: p.city || p.location, address: p.address || p.location,
      currentCtc: p.currentCtc, expectedCtc: p.expectedCtc, noticePeriod: p.noticePeriod, experienceYears: p.experienceYears,
      currentCompany: p.currentCompany, currentTitle: p.currentTitle, graduationYear: p.graduationYear,
      percentage: p.percentage, degree: p.degree || p.education, university: p.university, skills: p.skills,
      whyJoin: p.whyJoin, summary: p.summary, location: p.location || p.city,
    };
    return String(map[key] ?? '').trim();
  }

  function match(desc, el) {
    for (const [key, re] of RULES) {
      if (!re.test(desc)) continue;
      if (key === 'fullName' && NOT_A_PERSON.test(desc)) continue;
      if ((key === 'university' || key === 'degree') && el.tagName === 'TEXTAREA') continue;
      return key;
    }
    return null;
  }

  function setNative(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function toIsoDate(v) {
    const m = v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : v;
  }

  function fillSelect(el, value) {
    const want = norm(value);
    const opts = [...el.options].filter((o) => o.value !== '');
    const hit = opts.find((o) => norm(o.text) === want || norm(o.value) === want)
      || opts.find((o) => norm(o.text).includes(want) || (norm(o.text).length > 1 && want.includes(norm(o.text))));
    if (!hit) return false;
    el.value = hit.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function fillRadioGroup(radios, value) {
    const want = norm(value);
    for (const r of radios) {
      const label = norm((r.labels && r.labels[0] ? txt(r.labels[0]) : '') || r.value);
      if (label === want || label.startsWith(want) || norm(r.value) === want) { r.click(); return true; }
    }
    return false;
  }

  function mark(el, kind) {
    el.style.outline = kind === 'ok' ? '2px solid #d4af37' : '2px solid #ff5d73';
    el.style.outlineOffset = '2px';
    el.dataset.auraMark = kind;
  }

  const stats = { filled: 0, skipped: 0, needs: [] };
  const radioGroups = new Map();

  const fields = [...document.querySelectorAll('input, textarea, select')].filter((el) => {
    if (el.disabled || el.readOnly) return false;
    if (['hidden', 'submit', 'button', 'reset', 'image', 'password', 'checkbox'].includes(el.type)) return false;
    return visible(el) || el.type === 'file';
  });

  for (const el of fields) {
    if (el.type === 'radio') {
      const g = radioGroups.get(el.name) || [];
      g.push(el); radioGroups.set(el.name, g);
      continue;
    }

    if (el.type === 'file') {
      const d = describe(el);
      const wantsResume = /resume|\bcv\b|curriculum/.test(d) || /pdf|doc/.test(el.accept || '');
      if (wantsResume && resume?.dataUrl && !el.files.length) {
        try {
          const blob = await (await fetch(resume.dataUrl)).blob();
          const dt = new DataTransfer();
          dt.items.add(new File([blob], resume.name, { type: resume.type || blob.type }));
          el.files = dt.files;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          stats.filled++; mark(el, 'ok');
        } catch (_) { stats.needs.push('Resume upload'); }
      } else if (wantsResume && !resume) {
        stats.needs.push('Resume upload (add resume in AURA FormPilot popup)');
      }
      continue;
    }

    if (el.value && el.value.trim() && el.tagName !== 'SELECT') { stats.skipped++; continue; }
    const desc = describe(el);
    const key = match(desc, el);
    const value = key ? valueFor(key) : '';
    let done = false;

    if (value) {
      if (el.tagName === 'SELECT') done = fillSelect(el, value);
      else { setNative(el, el.type === 'date' ? toIsoDate(value) : value); done = true; }
    }

    if (done) { stats.filled++; mark(el, 'ok'); }
    else if (el.required || el.getAttribute('aria-required') === 'true') {
      mark(el, 'need');
      stats.needs.push((desc.split(' | ')[0] || 'Required field').slice(0, 60));
    }
  }

  for (const radios of radioGroups.values()) {
    const desc = describe(radios[0]) + ' ' + norm(radios[0].name);
    if (match(desc, radios[0]) === 'gender' && valueFor('gender') && !radios.some((r) => r.checked)) {
      if (fillRadioGroup(radios, valueFor('gender'))) stats.filled++;
    }
  }

  banner(stats);
  report(stats);

  function report(s) { try { chrome.runtime.sendMessage({ type: 'AURA_FILL_RESULT', stats: s }); } catch (_) {} }

  function banner(s) {
    if (window.top !== window) return; // one banner per tab
    // A second pass (late-rendered forms) adds to the first pass's count instead of resetting it.
    const previous = document.getElementById('aura-formpilot-banner');
    const total = s.filled + Number(previous?.dataset.filled || 0);
    previous?.remove();
    const b = document.createElement('div');
    b.id = 'aura-formpilot-banner';
    b.dataset.filled = String(total);
    b.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;width:300px;padding:14px 16px;border-radius:14px;'
      + 'background:linear-gradient(145deg,#0b0f1a,#161b2e);color:#f5e9c8;font:13px/1.45 system-ui,sans-serif;'
      + 'border:1px solid #d4af37;box-shadow:0 12px 40px rgba(0,0,0,.55),0 0 24px rgba(212,175,55,.25)';
    const needs = s.needs.slice(0, 6).map((n) => `<li>${n.replace(/[<>&]/g, '')}</li>`).join('');
    b.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <b style="letter-spacing:.12em;color:#d4af37;font-size:11px">AURA FORMPILOT</b>
      <span id="aura-x" style="cursor:pointer;opacity:.6">✕</span></div>
      <div style="margin-top:6px;font-size:15px"><b>${total}</b> fields filled${s.skipped ? ` · ${s.skipped} already had values` : ''}</div>
      ${needs ? `<div style="margin-top:8px;color:#ff8a9a">Needs your answer:</div><ul style="margin:4px 0 0 16px;padding:0">${needs}</ul>` : '<div style="margin-top:8px;color:#7ee0a8">No required field left empty.</div>'}
      <div style="margin-top:8px;opacity:.65;font-size:11px">Gold = filled by AURA · Red = yours to answer. Review, then submit yourself.</div>`;
    document.body.appendChild(b);
    b.querySelector('#aura-x').onclick = () => b.remove();
    const firstNeed = document.querySelector('[data-aura-mark="need"]');
    if (firstNeed) firstNeed.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
