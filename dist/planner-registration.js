const eventTypes = ['seminar', 'symposium', 'workshop', 'webinar', 'conference', 'other'];
const modes = ['inPerson', 'online', 'hybrid'];
const titleLimit = 160;
const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const labels = {
  en: {
    intro: 'Create a registration form, share its link, and view the attendee list when people sign up.',
    planner: 'Back to event plan', planTitle: 'Current plan', forms: 'Registration forms',
    typeNav: 'Registration forms by event type',
    seminar: 'Seminar', symposium: 'Symposium', workshop: 'Workshop', webinar: 'Webinar', conference: 'Conference', other: 'Other',
    signIn: 'Sign in to manage registrations', primary: 'Manage registrations on the main site',
    signInHelp: 'Sign in to create registration forms or view participant details.',
    primaryHelp: 'Use the main site to create registration forms and view participant details.',
    unavailableHelp: 'Registration storage is unavailable right now. Try opening this page again later.',
    new: 'New registration form', retry: 'Try again', loadingForms: 'Loading registration forms…',
    formsError: 'Registration forms could not be loaded.', noForms: 'No registration forms for this event type yet.',
    moreForms: 'Load more forms',
    noSelection: 'Choose a registration form to edit it or view its attendee list.',
    edit: 'Form settings', title: 'Event title', mode: 'Participation mode', noMode: 'Choose a mode',
    inPerson: 'In person', online: 'Online', hybrid: 'Hybrid',
    open: 'Open', closed: 'Closed', accept: 'Accept registrations',
    save: 'Save form', saving: 'Saving registration form…', saved: 'Registration form saved.',
    cancel: 'Close editor', titleNeeded: 'Enter an event title.',
    saveError: 'The form could not be saved. Your changes are still here.',
    shareLink: 'Participant registration link', copy: 'Copy link', copied: 'Registration link copied.',
    copyFallback: 'The link is selected. Copy it to share.',
    openLink: 'Open registration page', website: 'Use on event website',
    notOpen: 'Registration is closed. Select Accept registrations and save to allow sign-ups.',
    list: 'Participant list', privateList: 'Only the form owner can view this list.',
    loadingAttendees: 'Loading participants…', attendeesError: 'Participants could not be loaded.',
    noAttendees: 'No participants have registered yet.', more: 'Load more participants',
    name: 'Name', email: 'Email', organization: 'Organization', country: 'Country', registered: 'Registered',
    participantCount: count => count === 1 ? '1 participant' : `${count} participants`,
  },
  hi: {
    intro: 'पंजीकरण फ़ॉर्म बनाएं, उसका लिंक साझा करें और पंजीकरण होने पर प्रतिभागियों की सूची देखें।',
    planner: 'आयोजन योजना पर लौटें', planTitle: 'वर्तमान योजना', forms: 'पंजीकरण फ़ॉर्म',
    typeNav: 'आयोजन के प्रकार के अनुसार पंजीकरण फ़ॉर्म',
    seminar: 'सेमिनार', symposium: 'संगोष्ठी', workshop: 'कार्यशाला', webinar: 'वेबिनार', conference: 'सम्मेलन', other: 'अन्य',
    signIn: 'पंजीकरण प्रबंधित करने के लिए साइन इन करें', primary: 'मुख्य साइट पर पंजीकरण प्रबंधित करें',
    signInHelp: 'पंजीकरण फ़ॉर्म बनाने या प्रतिभागियों का विवरण देखने के लिए साइन इन करें।',
    primaryHelp: 'पंजीकरण फ़ॉर्म बनाने और प्रतिभागियों का विवरण देखने के लिए मुख्य साइट का उपयोग करें।',
    unavailableHelp: 'पंजीकरण सहेजने की सुविधा अभी उपलब्ध नहीं है। बाद में यह पेज फिर खोलें।',
    new: 'नया पंजीकरण फ़ॉर्म', retry: 'फिर से कोशिश करें', loadingForms: 'पंजीकरण फ़ॉर्म लोड हो रहे हैं…',
    formsError: 'पंजीकरण फ़ॉर्म लोड नहीं हो सके।', noForms: 'इस आयोजन प्रकार के लिए अभी कोई पंजीकरण फ़ॉर्म नहीं है।',
    moreForms: 'और फ़ॉर्म देखें',
    noSelection: 'फ़ॉर्म बदलने या उसके प्रतिभागियों की सूची देखने के लिए उसे चुनें।',
    edit: 'फ़ॉर्म की सेटिंग', title: 'आयोजन का शीर्षक', mode: 'भागीदारी का तरीका', noMode: 'तरीका चुनें',
    inPerson: 'प्रत्यक्ष', online: 'ऑनलाइन', hybrid: 'हाइब्रिड',
    open: 'खुला', closed: 'बंद', accept: 'पंजीकरण स्वीकार करें',
    save: 'फ़ॉर्म सेव करें', saving: 'पंजीकरण फ़ॉर्म सेव हो रहा है…', saved: 'पंजीकरण फ़ॉर्म सेव हो गया।',
    cancel: 'संपादक बंद करें', titleNeeded: 'आयोजन का शीर्षक लिखें।',
    saveError: 'फ़ॉर्म सेव नहीं हो सका। आपके बदलाव अभी इसी पेज पर हैं।',
    shareLink: 'प्रतिभागी पंजीकरण लिंक', copy: 'लिंक कॉपी करें', copied: 'पंजीकरण लिंक कॉपी हो गया।',
    copyFallback: 'लिंक चुन लिया गया है। साझा करने के लिए इसे कॉपी करें।',
    openLink: 'पंजीकरण पेज खोलें', website: 'आयोजन वेबसाइट पर उपयोग करें',
    notOpen: 'पंजीकरण बंद है। पंजीकरण शुरू करने के लिए पंजीकरण स्वीकार करें चुनें और फ़ॉर्म सेव करें।',
    list: 'प्रतिभागियों की सूची', privateList: 'केवल फ़ॉर्म के मालिक को यह सूची दिखती है।',
    loadingAttendees: 'प्रतिभागियों की सूची लोड हो रही है…', attendeesError: 'प्रतिभागियों की सूची लोड नहीं हो सकी।',
    noAttendees: 'अभी किसी प्रतिभागी ने पंजीकरण नहीं किया है।', more: 'और प्रतिभागी देखें',
    name: 'नाम', email: 'ईमेल', organization: 'संस्था', country: 'देश', registered: 'पंजीकरण तारीख',
    participantCount: count => `${new Intl.NumberFormat('hi').format(count)} प्रतिभागी`,
  },
};

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const validMode = value => modes.includes(value) ? value : '';

function safeLink(value) {
  if (typeof value !== 'string' || !value) return '';
  if (/^\/(?![/\\])[^\\\r\n]*$/.test(value)) return value;
  try {
    const url = new URL(value);
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return (url.protocol === 'https:' || local) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function formOf(value, type) {
  if (!uuidPattern.test(value?.id ?? '') || value.type !== type || typeof value.title !== 'string' || !value.title.trim()) return null;
  return { ...value, mode: validMode(value.mode), open: Boolean(value.open),
    participantCount: Math.max(0, Math.trunc(Number(value.participantCount) || 0)) };
}

function participantRows(participants, t, locale) {
  const calendar = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  return participants.map(participant => {
    const registered = new Date(participant.createdAt ?? '');
    return `<tr><th scope="row" dir="auto">${escape(participant.name)}</th><td dir="auto">${escape(participant.email)}</td>
      <td dir="auto">${escape(participant.organization || '—')}</td><td dir="auto">${escape(participant.country || '—')}</td>
      <td>${escape(t[validMode(participant.mode)] || '—')}</td><td>${Number.isNaN(registered.getTime()) ? '—' : escape(calendar.format(registered))}</td></tr>`;
  }).join('');
}

export function registrationManagerContent(language, {
  eventType, plannerDraft, plannerUrl, signInUrl, primaryUrl, managerUrl, unavailable,
} = {}) {
  const locale = language === 'hi' ? 'hi' : 'en';
  const t = labels[locale];
  const back = safeLink(plannerUrl);
  const planTitle = typeof plannerDraft?.brief?.title === 'string' ? plannerDraft.brief.title.trim() : '';
  const gated = Boolean(primaryUrl || signInUrl || unavailable);
  const cta = safeLink(primaryUrl || signInUrl);
  const access = primaryUrl ? 'primary' : signInUrl ? 'signIn' : 'unavailable';
  const typeLinks = typeof managerUrl === 'function' ? eventTypes.map(type => {
    const href = safeLink(managerUrl(type));
    return href ? `<a href="${escape(href)}"${type === eventType ? ' aria-current="page"' : ''}>${t[type]}</a>` : '';
  }).join('') : '';
  return `<section class="registration-manager" data-registration-manager lang="${locale}" dir="ltr">
    <div class="registration-intro">
      <p class="page-description">${t.intro}</p>
      ${back ? `<a class="text-link" href="${escape(back)}">${t.planner}</a>` : ''}
    </div>
    ${typeLinks ? `<nav class="planner-types" aria-label="${t.typeNav}">${typeLinks}</nav>` : ''}
    ${planTitle ? `<p class="registration-plan">${t.planTitle} <bdi>${escape(planTitle)}</bdi></p>` : ''}
    ${gated ? `<div class="notice"><p>${t[access + 'Help']}</p>${cta ? `<a class="button" href="${escape(cta)}">${t[access]}</a>` : ''}</div>` : `
    <div class="registration-layout">
      <section class="registration-pane" aria-labelledby="registration-forms-heading">
        <h2 id="registration-forms-heading">${t.forms}</h2>
        <button type="button" class="button" data-reg-new>${t.new}</button>
        <p class="page-description" role="status" data-reg-forms-status>${t.loadingForms}</p>
        <button type="button" class="text-button" data-reg-retry hidden>${t.retry}</button>
        <ul class="registration-forms" data-reg-forms></ul>
        <button type="button" class="button secondary" data-reg-more-forms hidden>${t.moreForms}</button>
      </section>
      <section class="registration-pane" aria-labelledby="registration-settings-heading">
        <h2 id="registration-settings-heading">${t.edit}</h2>
        <p class="page-description" data-reg-no-selection>${t.noSelection}</p>
        <form data-registration-form hidden>
          <fieldset data-reg-fields>
            <label class="field">${t.title}<input name="title" required maxlength="${titleLimit}" dir="auto"></label>
            <label class="field">${t.mode}<select name="mode"><option value="">${t.noMode}</option>
              ${modes.map(mode => `<option value="${mode}">${t[mode]}</option>`).join('')}</select></label>
            <label class="registration-accept"><input name="open" type="checkbox">${t.accept}</label>
            <div class="registration-actions"><button type="submit" class="button">${t.save}</button>
              <button type="button" class="text-button" data-reg-cancel>${t.cancel}</button></div>
          </fieldset>
          <p class="registration-error" data-reg-error role="alert" hidden></p>
          <p class="page-description" data-reg-status role="status"></p>
        </form>
        <div class="registration-share" data-reg-share hidden>
          <p class="page-description" data-reg-closed hidden>${t.notOpen}</p>
          <label class="field">${t.shareLink}<input data-reg-link readonly dir="ltr"></label>
          <div class="registration-actions">
            <button type="button" class="button secondary" data-reg-copy>${t.copy}</button>
            <a class="text-link" data-reg-open target="_blank" rel="noopener noreferrer">${t.openLink}</a>
            <a class="text-link" data-reg-website hidden>${t.website}</a>
          </div>
          <p class="page-description" data-reg-copy-status role="status"></p>
        </div>
      </section>
    </div>
    <section class="registration-pane registration-attendees" aria-labelledby="registration-attendees-heading" data-reg-attendees hidden>
      <h2 id="registration-attendees-heading">${t.list}</h2>
      <p class="page-description">${t.privateList}</p>
      <p class="page-description" data-reg-attendee-status role="status"></p>
      <div class="registration-table-wrap" role="region" tabindex="0" aria-labelledby="registration-attendees-heading" data-reg-table hidden>
        <table class="registration-table">
          <thead><tr>${['name', 'email', 'organization', 'country', 'mode', 'registered'].map(key => `<th scope="col">${t[key]}</th>`).join('')}</tr></thead>
          <tbody data-reg-participant-rows></tbody>
        </table>
      </div>
      <button type="button" class="button secondary" data-reg-more hidden>${t.more}</button>
    </section>`}
  </section>`;
}

export function bindRegistrationManager(root, language, {
  eventType, plannerDraft, listForms, saveForm, listParticipants, websiteUrl, publicUrl,
} = {}) {
  const manager = root?.matches?.('[data-registration-manager]') ? root : root?.querySelector?.('[data-registration-manager]');
  const get = selector => manager?.querySelector(selector);
  const form = get('[data-registration-form]');
  if (!form || manager.dataset.bound || !eventTypes.includes(eventType)) return;
  manager.dataset.bound = 'true';
  const locale = language === 'hi' ? 'hi' : 'en';
  const t = labels[locale];
  const titleInput = form.elements.title;
  const modeInput = form.elements.mode;
  const openInput = form.elements.open;
  const fields = get('[data-reg-fields]');
  const newButton = get('[data-reg-new]');
  const formsList = get('[data-reg-forms]');
  const formsStatus = get('[data-reg-forms-status]');
  const retry = get('[data-reg-retry]');
  const moreForms = get('[data-reg-more-forms]');
  const status = get('[data-reg-status]');
  const error = get('[data-reg-error]');
  const link = get('[data-reg-link]');
  const copyStatus = get('[data-reg-copy-status]');
  const attendees = get('[data-reg-attendees]');
  const attendeeStatus = get('[data-reg-attendee-status]');
  const participantBody = get('[data-reg-participant-rows]');
  const more = get('[data-reg-more]');
  let forms = [];
  let active;
  let newDraft;
  let saving = false;
  let formsLoading = false;
  let formsCursor;
  let participantLoading = false;
  let participantVersion = 0;
  let participantCursor;
  let participantError = false;
  const participants = new Map();
  const savesDuringLoad = new Map();

  function showForms() {
    formsList.innerHTML = forms.map(item => `<li><button type="button" class="registration-form-choice" data-reg-select="${escape(item.id)}"
      ${active?.id === item.id ? 'aria-current="true"' : ''}${saving ? ' disabled' : ''}>
      <bdi>${escape(item.title)}</bdi><small>${item.open ? t.open : t.closed} · ${t.participantCount(item.participantCount)}</small>
    </button></li>`).join('');
  }

  async function loadForms() {
    if (formsLoading) return;
    formsLoading = true;
    const cursor = formsCursor;
    moreForms.disabled = true;
    formsStatus.textContent = t.loadingForms;
    retry.hidden = true;
    try {
      const result = await listForms(eventType, cursor);
      if (!Array.isArray(result?.forms)) throw new Error();
      if (!manager.isConnected) return;
      const listed = result.forms.map(item => formOf(item, eventType)).filter(Boolean);
      const combined = cursor ? [...forms, ...listed] : listed;
      forms = [...new Map([...combined.map(item => [item.id, item]), ...savesDuringLoad]).values()];
      formsCursor = typeof result.nextCursor === 'string' && result.nextCursor !== cursor ? result.nextCursor : undefined;
      showForms();
      formsStatus.textContent = forms.length ? '' : t.noForms;
    } catch {
      formsStatus.textContent = t.formsError;
      retry.hidden = false;
    } finally {
      formsLoading = false;
      savesDuringLoad.clear();
      moreForms.hidden = !formsCursor || !retry.hidden;
      moreForms.disabled = false;
    }
  }

  function showParticipants() {
    const seen = [...participants.values()];
    participantBody.innerHTML = participantRows(seen, t, locale);
    get('[data-reg-table]').hidden = !seen.length;
    more.hidden = !participantCursor && !participantError;
    more.disabled = participantLoading;
    more.textContent = participantError ? t.retry : t.more;
    attendeeStatus.textContent = participantLoading ? t.loadingAttendees : participantError ? t.attendeesError
      : seen.length ? '' : t.noAttendees;
  }

  async function loadParticipants() {
    if (participantLoading || !active?.saved) return;
    const request = ++participantVersion;
    const cursor = participantCursor;
    participantLoading = true;
    participantError = false;
    showParticipants();
    try {
      const result = await listParticipants(active.id, cursor);
      if (!Array.isArray(result?.participants)) throw new Error();
      if (request !== participantVersion || !manager.isConnected) return;
      for (const item of result.participants) {
        if (typeof item?.id === 'string' && item.id) participants.set(item.id, item);
      }
      participantCursor = typeof result.nextCursor === 'string' && result.nextCursor !== cursor ? result.nextCursor : undefined;
    } catch {
      if (request === participantVersion) participantError = true;
    } finally {
      if (request === participantVersion && manager.isConnected) {
        participantLoading = false;
        showParticipants();
      }
    }
  }

  function showShare() {
    const saved = active?.saved;
    get('[data-reg-share]').hidden = !saved;
    copyStatus.textContent = '';
    if (!saved) return;
    const fallback = '/?' + new URLSearchParams({ view: 'participant-registration', id: active.id });
    const publicHref = safeLink(publicUrl?.(active.id)) || fallback;
    link.value = new URL(publicHref, location.origin).href;
    get('[data-reg-open]').href = link.value;
    get('[data-reg-closed]').hidden = active.open;
    const website = get('[data-reg-website]');
    const websiteHref = safeLink(websiteUrl?.(active.id));
    website.hidden = !websiteHref;
    if (websiteHref) website.href = websiteHref;
    else website.removeAttribute('href');
  }

  function selectForm(item, saved, focus = true) {
    active = item && { ...item, saved };
    form.hidden = !active;
    get('[data-reg-no-selection]').hidden = Boolean(active);
    status.textContent = '';
    error.textContent = '';
    error.hidden = true;
    attendeeStatus.textContent = '';
    attendees.hidden = !saved;
    participants.clear();
    participantCursor = undefined;
    participantLoading = false;
    participantError = false;
    participantVersion += 1;
    showShare();
    showForms();
    if (!active) return;
    titleInput.value = active.title;
    modeInput.value = active.mode;
    openInput.checked = active.open;
    if (focus) titleInput.focus();
    if (saved) loadParticipants();
  }

  function readDraft() {
    return { id: active.id, title: titleInput.value.trim(), mode: validMode(modeInput.value), open: openInput.checked };
  }

  function showSaving(value) {
    saving = value;
    fields.disabled = value;
    newButton.disabled = value;
    showForms();
  }

  newButton.addEventListener('click', () => {
    if (!newDraft) {
      newDraft = { id: crypto.randomUUID(), title: String(plannerDraft?.brief?.title ?? '').slice(0, titleLimit),
        mode: validMode(plannerDraft?.brief?.mode), open: false };
    }
    selectForm(newDraft, false);
  });
  formsList.addEventListener('click', event => {
    const choice = event.target.closest('[data-reg-select]');
    const item = forms.find(entry => entry.id === choice?.dataset.regSelect);
    if (item && !saving) selectForm(item, true);
  });
  retry.addEventListener('click', loadForms);
  moreForms.addEventListener('click', loadForms);
  form.addEventListener('input', () => {
    status.textContent = '';
    if (!active?.saved && active) newDraft = readDraft();
  });
  get('[data-reg-cancel]').addEventListener('click', () => {
    if (!active?.saved) newDraft = undefined;
    selectForm(undefined, false);
    newButton.focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || !active) return;
    const draft = readDraft();
    error.hidden = true;
    if (!draft.title) {
      error.textContent = t.titleNeeded;
      error.hidden = false;
      titleInput.focus();
      return;
    }
    if (!active.saved) newDraft = draft;
    showSaving(true);
    status.textContent = t.saving;
    try {
      const result = await saveForm({ action: 'save', type: eventType, ...draft });
      const saved = formOf(result?.form, eventType);
      if (saved?.id !== draft.id) throw new Error();
      if (!manager.isConnected) return;
      const previous = forms.findIndex(item => item.id === saved.id);
      if (previous === -1) forms.unshift(saved);
      else forms[previous] = saved;
      if (formsLoading) savesDuringLoad.set(saved.id, saved);
      if (newDraft?.id === saved.id) newDraft = undefined;
      formsStatus.textContent = '';
      selectForm(saved, true, false);
      status.textContent = t.saved;
    } catch {
      error.textContent = t.saveError;
      error.hidden = false;
      status.textContent = '';
    } finally {
      if (manager.isConnected) showSaving(false);
    }
  });
  get('[data-reg-copy]').addEventListener('click', async () => {
    if (!active?.saved || !link.value) return;
    const id = active.id;
    try {
      await navigator.clipboard.writeText(link.value);
      if (manager.isConnected && active?.id === id) copyStatus.textContent = t.copied;
    } catch {
      if (!manager.isConnected || active?.id !== id) return;
      link.focus();
      link.select();
      copyStatus.textContent = t.copyFallback;
    }
  });
  more.addEventListener('click', loadParticipants);
  loadForms();
}
