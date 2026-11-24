const storageKey = 'open-research-commons:event-planner:v1';
const conferencingUrl = 'https://conferencesdirectory.com/conferencing-app/';
const rowLimit = 100;
const eventTypes = ['seminar', 'symposium', 'conference', 'workshop', 'webinar', 'other'];
const eventModes = ['inPerson', 'online', 'hybrid'];
const sections = ['brief', 'timeline', 'onlineMeeting', 'agenda', 'budget'];
const briefFields = ['title', 'eventType', 'mode', 'startDate', 'endDate', 'timezone', 'venue', 'audience', 'registration', 'notes', 'meetingLink'];
const agendaFields = ['time', 'duration', 'session', 'lead'];
const budgetFields = ['item', 'estimate', 'actual'];
const phases = [
  { id: 'scope', days: -56, timing: 'eightWeeks', tasks: ['goals', 'team', 'format'] },
  { id: 'programme', days: -28, timing: 'fourWeeks', tasks: ['speakers', 'programmeDraft', 'access'] },
  { id: 'outreach', days: -7, timing: 'oneWeek', tasks: ['registrationTest', 'announce', 'logistics'] },
  { id: 'delivery', days: 0, timing: 'eventDay', tasks: ['rehearse', 'briefing', 'recording'] },
  { id: 'followup', days: 7, timing: 'oneWeekAfter', tasks: ['thanks', 'share', 'close'] },
];
const taskIds = phases.flatMap(phase => phase.tasks);
const words = `
intro|Plan a seminar, symposium, conference, workshop or webinar. Set the brief, organize the programme and track costs in one draft.|सेमिनार, संगोष्ठी, सम्मेलन, कार्यशाला या वेबिनार की योजना बनाएं। आयोजन का विवरण, कार्यक्रम और खर्च एक ही मसौदे में रखें।
brief|Event brief|आयोजन का विवरण
timeline|Planning timeline|योजना की समयरेखा
agenda|Agenda|कार्यक्रम
budget|Budget|बजट
sections|Planner sections|योजना के भाग
download|Download plan|योजना डाउनलोड करें
post|Post an event listing|आयोजन की सूची प्रकाशित करने के लिए भेजें
browserDraft|Your draft is saved in this browser as you edit.|बदलाव इसी ब्राउज़र में अपने आप सहेजे जाते हैं।
temporaryDraft|Browser storage is unavailable. Download your plan before closing this tab.|ब्राउज़र में सहेजना उपलब्ध नहीं है। टैब बंद करने से पहले योजना डाउनलोड करें।
downloaded|Plan downloaded.|योजना डाउनलोड हो गई।
progress|{done} of {total} tasks complete|{total} में से {done} कार्य पूरे
title|Event title|आयोजन का शीर्षक
eventType|Event type|आयोजन का प्रकार
mode|Participation mode|भागीदारी का तरीका
startDate|Start date|शुरू होने की तारीख
endDate|End date|समाप्ति की तारीख
timezone|Time zone|समय क्षेत्र
timezoneExample|e.g. Asia/Kolkata|जैसे Asia/Kolkata
venue|Venue or meeting platform|स्थान या ऑनलाइन प्लेटफ़ॉर्म
audience|Intended audience|लक्षित प्रतिभागी
registration|Registration link|पंजीकरण लिंक
notes|Goals and organizer notes|लक्ष्य और आयोजन के नोट्स
choose|Choose an option|एक विकल्प चुनें
seminar|Seminar|सेमिनार
symposium|Symposium|संगोष्ठी
conference|Conference|सम्मेलन
workshop|Workshop|कार्यशाला
webinar|Webinar|वेबिनार
other|Other|अन्य
inPerson|In person|प्रत्यक्ष
online|Online|ऑनलाइन
hybrid|Hybrid|मिश्रित
dateOrder|The end date precedes the start date.|समाप्ति की तारीख शुरुआत से पहले है।
timelineHelp|Use these suggested milestones as a starting point. Add a start date to see target dates.|इन सुझाए गए चरणों से शुरुआत करें। लक्ष्य की तारीखें देखने के लिए शुरू होने की तारीख जोड़ें।
scope|Set the scope|रूपरेखा तय करें
programme|Build the programme|कार्यक्रम तैयार करें
outreach|Prepare for participants|प्रतिभागियों के लिए तैयारी करें
delivery|Run the event|आयोजन संचालित करें
followup|Follow up|आयोजन के बाद की कार्रवाई
eightWeeks|About 8 weeks before|लगभग 8 सप्ताह पहले
fourWeeks|About 4 weeks before|लगभग 4 सप्ताह पहले
oneWeek|About 1 week before|लगभग 1 सप्ताह पहले
eventDay|Event day|आयोजन का दिन
oneWeekAfter|About 1 week after|लगभग 1 सप्ताह बाद
goals|Define the goal, audience and expected attendance.|लक्ष्य, प्रतिभागी और उनकी अनुमानित संख्या तय करें।
team|Assign an event lead and agree on the budget and approvals.|आयोजन का प्रभारी तय करें और बजट व मंज़ूरी पर सहमति लें।
format|Reserve the date and check room, platform and staffing availability.|तारीख तय करें और कक्ष, प्लेटफ़ॉर्म व कर्मचारियों की उपलब्धता देखें।
speakers|Confirm speakers and chairs. Collect bios, titles and presentation needs.|वक्ता और सत्र अध्यक्ष तय करें। परिचय, शीर्षक और प्रस्तुति की ज़रूरतें लें।
programmeDraft|Draft the agenda with introductions, breaks and time for questions.|परिचय, विराम और सवालों के लिए समय रखते हुए कार्यक्रम बनाएं।
access|Check accessibility, captioning and recording permissions.|सुगम्यता, कैप्शन और रिकॉर्डिंग की अनुमति की जाँच करें।
registrationTest|Test the registration form, confirmation message and attendance limits.|पंजीकरण फ़ॉर्म, पुष्टि संदेश और प्रतिभागी सीमा की जाँच करें।
announce|Share the programme and registration link with the intended audience.|कार्यक्रम और पंजीकरण लिंक लक्षित प्रतिभागियों से साझा करें।
logistics|Confirm AV, connectivity, signage, catering and participant instructions as applicable.|ज़रूरत के अनुसार एवी उपकरण, इंटरनेट, संकेत, खानपान और प्रतिभागियों के निर्देश तय करें।
rehearse|Rehearse presentations, access links and a backup plan.|प्रस्तुति, लिंक और वैकल्पिक योजना का अभ्यास करें।
briefing|Brief hosts on check-in, timekeeping, questions and technical support.|मेज़बानों को चेक-इन, समय प्रबंधन, सवालों और तकनीकी सहायता के बारे में बताएं।
recording|Check consent before recording or distributing participant information.|रिकॉर्डिंग या प्रतिभागियों की जानकारी साझा करने से पहले सहमति लें।
thanks|Thank speakers and participants and collect feedback.|वक्ताओं और प्रतिभागियों को धन्यवाद दें और प्रतिक्रिया लें।
share|Share approved materials, recordings or proceedings.|मंज़ूर सामग्री, रिकॉर्डिंग या कार्यवाही साझा करें।
close|Reconcile costs and record improvements for the next event.|खर्चों का मिलान करें और अगले आयोजन के लिए सुधार लिखें।
agendaHelp|List sessions in running order. Include breaks, transitions and questions.|सत्रों को क्रम से लिखें। विराम, बदलाव और सवालों के लिए समय रखें।
time|Start time|शुरू होने का समय
duration|Minutes|मिनट
session|Session or activity|सत्र या गतिविधि
lead|Speaker or lead|वक्ता या प्रभारी
addSession|Add session|सत्र जोड़ें
budgetHelp|Use one currency for all items. Track estimated and actual costs for space, AV, travel, catering and other needs.|सभी मदों के लिए एक मुद्रा चुनें। स्थान, एवी, यात्रा, खानपान और अन्य ज़रूरतों का अनुमानित और वास्तविक खर्च लिखें।
currency|Currency|मुद्रा
item|Cost item|खर्च की मद
estimate|Estimated cost|अनुमानित खर्च
actual|Actual cost|वास्तविक खर्च
addItem|Add cost item|खर्च की मद जोड़ें
estimatedTotal|Estimated total|कुल अनुमानित खर्च
actualTotal|Actual total|कुल वास्तविक खर्च
remove|Remove|हटाएं
removeAgenda|Remove session {number}|सत्र {number} हटाएं
removeBudget|Remove cost item {number}|खर्च की मद {number} हटाएं
exportTitle|Event plan|आयोजन की योजना
listed|Post an event listing when the public details are ready.|सार्वजनिक विवरण तैयार होने पर आयोजन की सूची भेजें।
conferencing|Open conferencing app|कॉन्फ़्रेंसिंग ऐप खोलें
conferencingHelp|Use the conferencing app to set up or run an online or hybrid session. A sign-in prompt may appear. Copy the meeting link back into your plan when it is ready.|ऑनलाइन या मिश्रित सत्र सेट करने या चलाने के लिए कॉन्फ़्रेंसिंग ऐप का उपयोग करें। साइन इन करने का संदेश आ सकता है। मीटिंग लिंक तैयार होने पर उसे अपनी योजना में कॉपी करें।
onlineMeeting|Online meeting|ऑनलाइन बैठक
meetingLink|Meeting link|मीटिंग लिंक
newTab|Opens in a new tab.|नए टैब में खुलेगा।
`.trim().split('\n');
const copy = Object.fromEntries(words.map(line => {
  const [key, en, hi] = line.split('|');
  return [key, { en, hi }];
}));

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'AED', 'BDT', 'BRL', 'CHF', 'CNY', 'JPY', 'KES', 'KRW', 'MXN', 'NPR', 'NZD', 'PKR', 'RUB', 'SAR', 'SGD', 'ZAR'];
let memoryDraft;

function textFor(language) {
  const locale = language === 'hi' ? 'hi' : 'en';
  const number = new Intl.NumberFormat(locale);
  const t = (key, values = {}) => copy[key]?.[locale].replace(/\{(\w+)\}/g, (match, name) => {
    const value = values[name];
    return typeof value === 'number' ? number.format(value) : value ?? match;
  }) ?? '';
  return { locale, number, t };
}

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function draftText(value, max = 240) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function cleanDraft(value, locale) {
  const brief = Object.fromEntries(briefFields.map(field => [
    field, draftText(value?.brief?.[field], field === 'notes' ? 3000 : 240),
  ]));
  if (!eventTypes.includes(brief.eventType)) brief.eventType = '';
  if (!eventModes.includes(brief.mode)) brief.mode = '';
  const rows = (key, fields) => (Array.isArray(value?.[key]) ? value[key] : []).slice(0, rowLimit)
    .map(row => Object.fromEntries(fields.map(field => [field, draftText(row?.[field])])));
  return {
    brief,
    agenda: rows('agenda', agendaFields),
    budget: rows('budget', budgetFields),
    checked: new Set((Array.isArray(value?.checked) ? value.checked : []).filter(id => taskIds.includes(id))),
    currency: currencies.includes(value?.currency) ? value.currency : locale === 'hi' ? 'INR' : 'USD',
  };
}

function readDraft(locale) {
  let available = true;
  let value = memoryDraft;
  try {
    const raw = globalThis.localStorage.getItem(storageKey);
    if (raw && !value) value = JSON.parse(raw);
  } catch {
    available = false;
  }
  return { draft: cleanDraft(value, locale), available };
}

function briefInput(field, t, value) {
  if (field === 'eventType' || field === 'mode') {
    const options = field === 'eventType' ? eventTypes : eventModes;
    return `<label class="field">${t(field)}<select data-brief="${field}">
      <option value="">${t('choose')}</option>${options.map(option =>
        `<option value="${option}"${value === option ? ' selected' : ''}>${t(option)}</option>`).join('')}
    </select></label>`;
  }
  if (field === 'notes') {
    return `<label class="field full">${t(field)}<textarea data-brief="${field}" maxlength="3000" dir="auto">${safeText(value)}</textarea></label>`;
  }
  const type = field.endsWith('Date') ? 'date' : ['registration', 'meetingLink'].includes(field) ? 'url' : 'text';
  const hint = field === 'timezone' ? ` placeholder="${safeText(t('timezoneExample'))}"` : '';
  return `<label class="field${field === 'title' ? ' full' : ''}">${t(field)}<input data-brief="${field}" type="${type}" value="${safeText(value)}" maxlength="240" dir="auto"${hint}></label>`;
}

function rowInput(field, value, label) {
  const kind = field === 'time' ? 'time' : ['duration', 'estimate', 'actual'].includes(field) ? 'number' : 'text';
  const rules = field === 'duration' ? ' min="0" max="1440" step="1"'
    : kind === 'number' ? ' min="0" max="1000000000" step="any"' : ' maxlength="240"';
  return `<label class="field">${label}<input type="${kind}"${rules} value="${safeText(value)}" data-row-field="${field}" dir="auto"></label>`;
}

function rowMarkup(group, t, rows) {
  const fields = group === 'agenda' ? agendaFields : budgetFields;
  return rows.map((row, index) =>
    `<div class="planner-row planner-row--${group}" data-row="${index}" data-row-group="${group}">
      ${fields.map(field => rowInput(field, row[field], t(field))).join('')}
      <button class="text-button planner-remove" type="button" data-remove="${group}" aria-label="${safeText(t(group === 'agenda' ? 'removeAgenda' : 'removeBudget', { number: index + 1 }))}">${t('remove')}</button>
    </div>`,
  ).join('');
}

function milestoneDate(brief, phase) {
  const start = Date.parse(brief.startDate + 'T00:00:00Z');
  const end = Date.parse(brief.endDate + 'T00:00:00Z');
  const base = phase.id === 'followup' && Number.isFinite(end) && end >= start ? end : start;
  return Number.isFinite(base) ? new Date(base + phase.days * 86_400_000) : null;
}

function phaseMarkup(phase, draft, t) {
  return `<details class="planner-phase"${phase.id === 'scope' ? ' open' : ''}>
      <summary><span>${t(phase.id)}</span><span class="planner-milestone" data-milestone="${phase.id}">${t(phase.timing)}</span></summary>
      <ul class="planner-tasks">
      ${phase.tasks.map(id => `<li><label><input type="checkbox" data-task="${id}"${draft.checked.has(id) ? ' checked' : ''}><span>${t(id)}</span></label></li>`).join('')}
      </ul>
    </details>`;
}

function currencyOptions(draft, locale) {
  const names = new Intl.DisplayNames([locale], { type: 'currency' });
  return currencies.map(code => `<option value="${code}"${code === draft.currency ? ' selected' : ''}>${code} · ${safeText(names.of(code))}</option>`).join('');
}

export function eventPlannerContent(language, submitUrl) {
  const { locale, t } = textFor(language);
  const { draft, available } = readDraft(locale);
  const submit = safeText(submitUrl);
  return `<section class="event-planner" data-event-planner lang="${locale}" dir="ltr">
    <p class="page-description planner-intro">${t('intro')}</p>
    <div class="planner-toolbar">
      <p class="planner-draft" data-planner-storage>${t(available ? 'browserDraft' : 'temporaryDraft')}</p>
      <button type="button" class="button secondary" data-planner-download>${t('download')}</button>
    </div>
    <nav class="planner-nav" aria-label="${t('sections')}">
      ${sections.map(section => `<a href="#planner-${section}" class="text-link">${t(section)}</a>`).join('')}
    </nav>
    <section id="planner-brief" class="planner-section" aria-labelledby="planner-brief-title">
      <h2 id="planner-brief-title">${t('brief')}</h2>
      <div class="planner-brief">${briefFields.filter(field => field !== 'meetingLink').map(field => briefInput(field, t, draft.brief[field])).join('')}</div>
      <p class="planner-feedback" data-planner-dates role="status" hidden>${t('dateOrder')}</p>
    </section>
    <section id="planner-timeline" class="planner-section" aria-labelledby="planner-timeline-title">
      <div class="planner-section-heading">
        <h2 id="planner-timeline-title">${t('timeline')}</h2>
        <p data-planner-progress aria-live="polite"></p>
      </div>
      <p class="page-description">${t('timelineHelp')}</p>
      <div class="planner-phases">${phases.map(phase => phaseMarkup(phase, draft, t)).join('')}</div>
      <section class="planner-conference" id="planner-onlineMeeting" aria-labelledby="planner-conference-title">
        <div>
          <h3 id="planner-conference-title">${t('onlineMeeting')}</h3>
          <p>${t('conferencingHelp')}</p>
        </div>
        <a class="button secondary" href="${conferencingUrl}" target="_blank" rel="noopener noreferrer">${t('conferencing')}<span class="visually-hidden">. ${t('newTab')}</span></a>
        ${briefInput('meetingLink', t, draft.brief.meetingLink)}
      </section>
    </section>
    <section id="planner-agenda" class="planner-section" aria-labelledby="planner-agenda-title">
      <h2 id="planner-agenda-title">${t('agenda')}</h2>
      <p class="page-description">${t('agendaHelp')}</p>
      <div data-planner-rows="agenda">${rowMarkup('agenda', t, draft.agenda)}</div>
      <button type="button" class="button secondary" data-add="agenda">${t('addSession')}</button>
    </section>
    <section id="planner-budget" class="planner-section" aria-labelledby="planner-budget-title">
      <h2 id="planner-budget-title">${t('budget')}</h2>
      <p class="page-description">${t('budgetHelp')}</p>
      <label class="field planner-currency">${t('currency')}<select data-planner-currency>${currencyOptions(draft, locale)}</select></label>
      <div data-planner-rows="budget">${rowMarkup('budget', t, draft.budget)}</div>
      <button type="button" class="button secondary" data-add="budget">${t('addItem')}</button>
      <dl class="planner-totals">
        <div><dt>${t('estimatedTotal')}</dt><dd data-planner-total="estimate"></dd></div>
        <div><dt>${t('actualTotal')}</dt><dd data-planner-total="actual"></dd></div>
      </dl>
    </section>
    <div class="planner-listing"><p>${t('listed')}</p><a class="button" href="${submit}">${t('post')}</a></div>
    <p class="visually-hidden" role="status" data-planner-download-status></p>
  </section>`;
}

function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000_000 ? number : 0;
}

function budgetTotals(draft, locale) {
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: draft.currency });
  const precision = 10 ** money.resolvedOptions().maximumFractionDigits;
  const formatSum = field => money.format(draft.budget.reduce(
    (sum, row) => sum + Math.round(amount(row[field]) * precision), 0,
  ) / precision);
  return { format: value => money.format(amount(value)), estimate: formatSum('estimate'), actual: formatSum('actual') };
}

function downloadPlan(draft, t, locale, submitUrl) {
  const money = budgetTotals(draft, locale);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const lines = [t('exportTitle'), '', t('brief')];
  for (const field of briefFields) {
    const value = draft.brief[field];
    if (value) lines.push(t(field) + ': ' + (['eventType', 'mode'].includes(field) ? t(value) : value));
  }
  lines.push('', t('timeline'));
  for (const phase of phases) {
    const date = milestoneDate(draft.brief, phase);
    lines.push(t(phase.id) + ' — ' + (date ? dateFormat.format(date) : t(phase.timing)));
    for (const id of phase.tasks) lines.push((draft.checked.has(id) ? '[x] ' : '[ ] ') + t(id));
  }
  lines.push('', t('agenda'));
  for (const row of draft.agenda) {
    const values = agendaFields.filter(field => row[field]).map(field => t(field) + ': ' + row[field]);
    if (values.length) lines.push(values.join(' · '));
  }
  lines.push('', t('budget') + ' (' + draft.currency + ')');
  for (const row of draft.budget) {
    if (budgetFields.some(field => row[field])) lines.push([
      row.item || t('item'), ...['estimate', 'actual'].filter(field => row[field] !== '')
        .map(field => t(field) + ': ' + money.format(row[field])),
    ].join(' · '));
  }
  lines.push(t('estimatedTotal') + ': ' + money.estimate, t('actualTotal') + ': ' + money.actual, '',
    t('conferencing') + ': ' + conferencingUrl, t('post') + ': ' + new URL(submitUrl, location.href).href, '');
  const url = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = (draft.brief.title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .slice(0, 80).replace(/^-|-$/g, '') || 'event') + '-plan.txt';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function bindEventPlanner(root, language, submitUrl) {
  const planner = root?.matches?.('[data-event-planner]') ? root : root?.querySelector?.('[data-event-planner]');
  if (!planner || planner.dataset.bound) return;
  planner.dataset.bound = 'true';
  const { locale, t } = textFor(language);
  const { draft } = readDraft(locale);
  const get = selector => planner.querySelector(selector);
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });

  function save() {
    const value = { ...draft, checked: [...draft.checked] };
    memoryDraft = value;
    let available = true;
    try { globalThis.localStorage.setItem(storageKey, JSON.stringify(value)); }
    catch { available = false; }
    get('[data-planner-storage]').textContent = t(available ? 'browserDraft' : 'temporaryDraft');
  }

  function updateDates() {
    const { startDate, endDate } = draft.brief;
    const invalid = !!(startDate && endDate && endDate < startDate);
    get('[data-planner-dates]').hidden = !invalid;
    if (invalid) get('[data-brief="endDate"]').setAttribute('aria-invalid', 'true');
    else get('[data-brief="endDate"]').removeAttribute('aria-invalid');
    for (const phase of phases) {
      const date = milestoneDate(draft.brief, phase);
      const target = get(`[data-milestone="${phase.id}"]`);
      target.textContent = date ? dates.format(date) : t(phase.timing);
    }
  }

  function updateProgress() {
    get('[data-planner-progress]').textContent = t('progress', { done: draft.checked.size, total: taskIds.length });
  }

  function updateBudget() {
    const totals = budgetTotals(draft, locale);
    for (const field of ['estimate', 'actual']) get(`[data-planner-total="${field}"]`).textContent = totals[field];
  }

  function updateRows(group, focusIndex) {
    const container = get(`[data-planner-rows="${group}"]`);
    container.innerHTML = rowMarkup(group, t, draft[group]);
    const add = get(`[data-add="${group}"]`);
    add.disabled = draft[group].length >= rowLimit;
    (container.querySelector(`[data-row="${focusIndex}"] input`) || add).focus();
    if (group === 'budget') updateBudget();
  }

  updateDates();
  updateProgress();
  updateBudget();
  for (const group of ['agenda', 'budget']) get(`[data-add="${group}"]`).disabled = draft[group].length >= rowLimit;

  planner.addEventListener('input', event => {
    const field = event.target;
    if (field.dataset.brief) {
      draft.brief[field.dataset.brief] = field.value;
      if (field.type === 'date') updateDates();
    } else if (field.dataset.task) {
      if (field.checked) draft.checked.add(field.dataset.task);
      else draft.checked.delete(field.dataset.task);
      updateProgress();
    } else if (field.matches('[data-planner-currency]')) {
      draft.currency = field.value;
      updateBudget();
    } else if (field.dataset.rowField) {
      const { row, rowGroup } = field.closest('[data-row]').dataset;
      draft[rowGroup][row][field.dataset.rowField] = field.value;
      if (rowGroup === 'budget') updateBudget();
    } else return;
    save();
  });

  planner.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const { add, remove } = button.dataset;
    if (add && draft[add].length < rowLimit) {
      const fields = add === 'agenda' ? agendaFields : budgetFields;
      draft[add].push(Object.fromEntries(fields.map(field => [field, ''])));
      updateRows(add, draft[add].length - 1);
      save();
    } else if (remove) {
      const index = Number(button.closest('[data-row]').dataset.row);
      draft[remove].splice(index, 1);
      updateRows(remove, Math.min(index, draft[remove].length - 1));
      save();
    } else if (button.matches('[data-planner-download]')) {
      downloadPlan(draft, t, locale, submitUrl);
      get('[data-planner-download-status]').textContent = t('downloaded');
    }
  });
}
