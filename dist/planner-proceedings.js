const storagePrefix = 'open-research-commons:proceedings:v1:';
const supportedTypes = new Set(['seminar', 'symposium', 'workshop', 'webinar', 'conference', 'other']);
const statuses = ['draft', 'inReview', 'accepted'];
const kinds = ['paper', 'abstract', 'poster', 'sessionSummary', 'chapter'];
const maxEntries = 100;
const volumeLimits = {
  title: 240, eventTitle: 240, date: 120, venue: 200, editors: 500, publisher: 240,
  year: 12, identifier: 200, license: 200, keywords: 500, introduction: 10000,
};
const entryLimits = {
  title: 240, authors: 500, affiliations: 750, stream: 240, keywords: 500, abstract: 8000, body: 40000, link: 2048,
};
const unsaved = new Map();
const words = `
intro|Assemble a book of abstracts or full proceedings with an ordered table of contents. Review the contributions, then download or print the edition.|सारांशों या पूर्ण कार्यवाही का संकलन बनाएं। योगदानों को क्रम में रखें, उनकी समीक्षा करें, फिर संस्करण डाउनलोड या प्रिंट करें।
volume|Volume details|संकलन का विवरण
title|Proceedings title|कार्यवाही का शीर्षक
titleTemplate|Proceedings of {title}|{title} की कार्यवाही
untitled|Event proceedings|आयोजन की कार्यवाही
eventTitle|Event name|आयोजन का नाम
date|Event dates|आयोजन की तारीखें
venue|Venue or platform|स्थान या प्लेटफ़ॉर्म
editors|Editors|संपादक
publisher|Publisher or organizing institution|प्रकाशक या आयोजन संस्था
year|Publication year|प्रकाशन वर्ष
identifier|Existing DOI or ISBN|मौजूदा DOI या ISBN
license|Rights or license statement|अधिकार या लाइसेंस विवरण
introduction|Preface or acknowledgements|प्रस्तावना या आभार
eventClassification|Event classification|आयोजन का वर्गीकरण
subject|Subject (ANZSRC 2020 FoR)|विषय (ANZSRC 2020 FoR)
stream|Stream of research (FoR)|शोध की शाखा (FoR)
country|Country and ISO code|देश और ISO कोड
callingCodes|International calling codes|अंतरराष्ट्रीय डायलिंग कोड
keywords|Keywords|कीवर्ड
entryStream|Contribution stream (FoR code or name)|योगदान की शोध शाखा (FoR कोड या नाम)
applyEvent|Use current event details|मौजूदा आयोजन का विवरण लें
appliedEvent|Available event details copied from the planner.|आयोजन का उपलब्ध विवरण प्लानर से ले लिया गया।
contributions|Contributions|योगदान
addEntry|Add contribution|योगदान जोड़ें
entryHeading|Contribution {number}|योगदान {number}
entryCount|{count} contributions · {accepted} accepted|{count} योगदान · {accepted} स्वीकृत
entryTitle|Contribution title|योगदान का शीर्षक
kind|Contribution type|योगदान का प्रकार
paper|Paper|शोधपत्र
abstract|Abstract|सारांश
poster|Poster|पोस्टर
sessionSummary|Session summary|सत्र सारांश
chapter|Chapter|अध्याय
authors|Authors, in publication order|लेखक, प्रकाशन क्रम में
affiliations|Author affiliations|लेखकों की संस्थाएं
abstractText|Abstract text|सारांश का पाठ
body|Main text or session notes|मुख्य पाठ या सत्र के नोट्स
link|Online version URL|ऑनलाइन संस्करण का URL
viewOnline|View online version|ऑनलाइन संस्करण देखें
status|Editorial status|संपादकीय स्थिति
draft|Draft|मसौदा
inReview|In review|समीक्षाधीन
accepted|Accepted|स्वीकृत
moveEarlier|Move earlier|पहले ले जाएं
moveLater|Move later|बाद में ले जाएं
remove|Remove contribution|योगदान हटाएं
empty|Add papers, abstracts, posters, or session summaries in publication order.|शोधपत्र, सारांश, पोस्टर या सत्र सारांश प्रकाशन क्रम में जोड़ें।
limit|This volume has reached 100 contributions.|इस संकलन में 100 योगदान पूरे हो गए हैं।
acceptOnly|Include only accepted contributions in this edition|इस संस्करण में केवल स्वीकृत योगदान शामिल करें
preview|Edition preview|संस्करण का पूर्वावलोकन
toc|Table of contents|विषय सूची
noContents|No titled contributions match this edition.|इस संस्करण में शामिल करने योग्य शीर्षक वाले योगदान नहीं हैं।
suggestedCitation|Suggested citation|सुझाया गया उद्धरण
download|Download HTML|HTML डाउनलोड करें
printView|Open print view|प्रिंट दृश्य खोलें
print|Print or save as PDF|प्रिंट करें या PDF में सहेजें
saved|This draft is saved in this browser as you work.|बदलाव इसी ब्राउज़र में अपने आप सहेजे जाते हैं।
temporary|Browser storage is unavailable. Download the edition before leaving.|ब्राउज़र में सहेजने की सुविधा उपलब्ध नहीं है। जाने से पहले संस्करण डाउनलोड करें।
downloadReady|Proceedings HTML downloaded.|कार्यवाही की HTML फ़ाइल डाउनलोड हो गई।
printReady|Look for the print view in a new tab.|प्रिंट दृश्य नया टैब खोलकर देखें।
exportError|The edition could not be opened. Check that your browser permits downloads and new tabs.|संस्करण नहीं खुल सका। जांचें कि ब्राउज़र डाउनलोड और नए टैब खोलने देता है।
confirmRemove|Remove this contribution from the draft?|इस योगदान को मसौदे से हटाएं?
deposit|Deposit proceedings in the repository|कार्यवाही रिपॉज़िटरी में जमा करें
depositHelp|Save a PDF from the print view, then submit it through the repository form for review and DOI verification or registration.|प्रिंट दृश्य से PDF सहेजें, फिर समीक्षा और DOI सत्यापन या पंजीकरण के लिए उसे रिपॉज़िटरी फ़ॉर्म से जमा करें।
`.trim().split('\n');
const copy = Object.fromEntries(words.map(line => {
  const [key, en, hi] = line.split('|');
  return [key, { en, hi }];
}));

function textFor(language) {
  const locale = language === 'hi' ? 'hi' : 'en';
  const number = new Intl.NumberFormat(locale);
  return {
    locale,
    t: (key, values = {}) => copy[key][locale].replace(/\{(\w+)\}/g, (match, name) => {
      const value = values[name];
      return typeof value === 'number' ? number.format(value) : value ?? match;
    }),
  };
}

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function short(value, limit) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function eventDetails(event) {
  if (!event || typeof event !== 'object') return {};
  const brief = event.brief ?? event;
  const eventTitle = short(brief.title, volumeLimits.eventTitle).trim();
  const start = short(brief.startDate, 32).trim();
  const end = short(brief.endDate, 32).trim();
  const date = start && end && start !== end ? start + ' – ' + end : start || end;
  return { eventTitle, date, venue: short(brief.venue, volumeLimits.venue).trim() };
}

function classificationDetails(value) {
  if (!value || typeof value !== 'object') return {};
  const combine = (parts, separator) => parts.map(part => short(part, 240).trim()).filter(Boolean).join(separator);
  return {
    subject: combine([value.subjectCode, value.subject], ' · '),
    stream: combine([value.streamCode, value.stream], ' · '),
    country: combine([value.country, value.countryCode], ' · '),
    callingCodes: Array.isArray(value.callingCodes) ? combine(value.callingCodes, ', ') : '',
  };
}

function eventKeywords(classification) {
  const keywords = classification?.keywords;
  return Array.isArray(keywords)
    ? short(keywords.map(value => short(value, 100).trim()).filter(Boolean).join(', '), volumeLimits.keywords)
    : '';
}

function keyOf(eventType) {
  return storagePrefix + (supportedTypes.has(eventType) ? eventType : 'event');
}

function cleanFields(value, limits) {
  return Object.fromEntries(Object.entries(limits).map(([field, limit]) => [field, short(value?.[field], limit)]));
}

function entryOf(value) {
  return {
    ...cleanFields(value, entryLimits),
    kind: kinds.includes(value?.kind) ? value.kind : 'paper',
    status: statuses.includes(value?.status) ? value.status : 'draft',
  };
}

function draftOf(raw, event, classification, t) {
  const inherited = eventDetails(event);
  return {
    volume: cleanFields(raw?.volume ?? {
      ...inherited,
      title: inherited.eventTitle ? t('titleTemplate', { title: inherited.eventTitle }) : t('untitled'),
      editors: event?.type === 'symposium' ? short(event.details?.proceedingsEditor, volumeLimits.editors).trim() : '',
      keywords: eventKeywords(classification),
    }, volumeLimits),
    entries: Array.isArray(raw?.entries) ? raw.entries.slice(0, maxEntries).map(entryOf) : [],
    acceptOnly: raw?.acceptOnly === true,
  };
}

function readDraft({ eventType, event, classification }, t) {
  const key = keyOf(eventType);
  try {
    const stored = localStorage.getItem(key);
    return { key, draft: draftOf(unsaved.get(key) ?? (stored ? JSON.parse(stored) : null), event, classification, t), available: true };
  } catch {
    return { key, draft: draftOf(unsaved.get(key), event, classification, t), available: false };
  }
}

function writeDraft(key, draft) {
  unsaved.set(key, draft);
  try {
    localStorage.setItem(key, JSON.stringify(draft));
    unsaved.delete(key);
    return true;
  } catch {
    return false;
  }
}

function textField(key, label, value, limit, { multiline = false, wide = false } = {}) {
  const attrs = `data-pro-field="${key}" maxlength="${limit}" dir="auto"`;
  const control = multiline
    ? `<textarea ${attrs} rows="${key === 'body' ? 6 : 3}">${escape(value)}</textarea>`
    : `<input ${attrs} type="${key === 'link' ? 'url' : 'text'}"${key === 'year' ? ' inputmode="numeric"' : ''} value="${escape(value)}">`;
  return `<label class="field${wide ? ' proceedings-wide' : ''}">${escape(label)}${control}</label>`;
}

function selectField(key, value, choices, t) {
  return `<label class="field">${t(key)}<select data-pro-field="${key}">${choices.map(choice =>
    `<option value="${choice}"${choice === value ? ' selected' : ''}>${t(choice)}</option>`
  ).join('')}</select></label>`;
}

function volumeFields(volume, t) {
  return Object.keys(volumeLimits).map(key => textField(
    key, t(key), volume[key], volumeLimits[key],
    { multiline: key === 'introduction', wide: ['title', 'keywords', 'introduction'].includes(key) },
  )).join('');
}

function contributions(entries, t) {
  if (!entries.length) return `<p class="page-description proceedings-empty">${t('empty')}</p>`;
  return entries.map((entry, index) => `<article class="proceedings-contribution" data-pro-entry="${index}"
    aria-labelledby="proceedings-entry-${index}">
    <div class="proceedings-heading">
      <h3 id="proceedings-entry-${index}" tabindex="-1">${t('entryHeading', { number: index + 1 })}</h3>
      <div class="proceedings-actions">
        <button type="button" class="text-button" data-pro-action="earlier"${index === 0 ? ' disabled' : ''}>${t('moveEarlier')}</button>
        <button type="button" class="text-button" data-pro-action="later"${index === entries.length - 1 ? ' disabled' : ''}>${t('moveLater')}</button>
        <button type="button" class="text-button" data-pro-action="remove">${t('remove')}</button>
      </div>
    </div>
    <div class="proceedings-grid">
      ${textField('title', t('entryTitle'), entry.title, entryLimits.title, { wide: true })}
      ${selectField('kind', entry.kind, kinds, t)}
      ${selectField('status', entry.status, statuses, t)}
      ${textField('authors', t('authors'), entry.authors, entryLimits.authors)}
      ${textField('affiliations', t('affiliations'), entry.affiliations, entryLimits.affiliations)}
      ${textField('stream', t('entryStream'), entry.stream, entryLimits.stream)}
      ${textField('keywords', t('keywords'), entry.keywords, entryLimits.keywords)}
      ${textField('abstract', t('abstractText'), entry.abstract, entryLimits.abstract, { multiline: true, wide: true })}
      ${textField('body', t('body'), entry.body, entryLimits.body, { multiline: true, wide: true })}
      ${textField('link', t('link'), entry.link, entryLimits.link, { wide: true })}
    </div>
  </article>`).join('');
}

function externalUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function catalogLink(value) {
  // Only navigate to a normal URL on deliberate user action.
  return typeof value === 'string' && (value.startsWith('/?') || externalUrl(value))
    ? escape(value) : '/?view=submit&type=material';
}

function editionTitle(draft, t) {
  return draft.volume.title.trim() || t('untitled');
}

function detailsList(values, labels, t) {
  const rows = labels.filter(key => values[key]?.trim()).map(key =>
    `<div><dt>${t(key)}</dt><dd dir="auto">${escape(values[key].trim())}</dd></div>`);
  return rows.length ? `<dl class="proceedings-edition-meta">${rows.join('')}</dl>` : '';
}

function edition(draft, t, classification, standalone = false) {
  const { volume } = draft;
  const items = draft.entries.filter(entry => entry.title.trim() && (!draft.acceptOnly || entry.status === 'accepted'));
  const titleTag = standalone ? 'h1' : 'h2';
  const itemLink = (entry, index) => `<li><a href="#proceedings-paper-${index + 1}" dir="auto">${escape(entry.title.trim())}</a>
    ${entry.authors.trim() ? `<span dir="auto"> · ${escape(entry.authors.trim())}</span>` : ''}</li>`;
  const itemContent = (entry, index) => {
    const url = externalUrl(entry.link);
    return `<article class="proceedings-paper" id="proceedings-paper-${index + 1}">
      <p class="proceedings-edition-kind">${t(entry.kind)}</p>
      <h3 dir="auto">${escape(entry.title.trim())}</h3>
      ${entry.authors.trim() ? `<p class="proceedings-edition-authors" dir="auto">${escape(entry.authors.trim())}</p>` : ''}
      ${entry.affiliations.trim() ? `<p class="proceedings-edition-affiliations" dir="auto">${escape(entry.affiliations.trim())}</p>` : ''}
      ${detailsList(entry, ['stream', 'keywords'], t)}
      ${entry.abstract.trim() ? `<h4>${t('abstract')}</h4><p class="proceedings-manuscript" dir="auto">${escape(entry.abstract.trim())}</p>` : ''}
      ${entry.body.trim() ? `<h4>${t('body')}</h4><p class="proceedings-manuscript" dir="auto">${escape(entry.body.trim())}</p>` : ''}
      ${url ? `<p><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${t('viewOnline')}</a></p>` : ''}
    </article>`;
  };
  const title = editionTitle(draft, t);
  const citation = [volume.editors.trim(), volume.year.trim() ? '(' + volume.year.trim() + ')' : '',
    title, volume.publisher.trim(), volume.identifier.trim()].filter(Boolean).join('. ');
  return `<div class="proceedings-edition">
    <header class="proceedings-cover">
      <${titleTag} dir="auto">${escape(title)}</${titleTag}>
      ${detailsList(volume, ['eventTitle', 'date', 'venue', 'editors', 'publisher', 'year', 'identifier', 'license', 'keywords'], t)}
      ${detailsList(classification, ['subject', 'stream', 'country', 'callingCodes'], t)}
    </header>
    ${volume.introduction.trim() ? `<section><h3>${t('introduction')}</h3><p class="proceedings-manuscript" dir="auto">${escape(volume.introduction.trim())}</p></section>` : ''}
    <nav class="proceedings-toc" aria-label="${t('toc')}">
      <h3>${t('toc')}</h3>
      ${items.length ? `<ol>${items.map(itemLink).join('')}</ol>` : `<p>${t('noContents')}</p>`}
    </nav>
    ${items.map(itemContent).join('')}
    <section class="proceedings-citation"><h3>${t('suggestedCitation')}</h3><p dir="auto">${escape(citation)}</p></section>
  </div>`;
}

const documentStyles = `
  :root{color-scheme:light;color:#12213f;background:#f6f5f0;font:1rem/1.58 system-ui,sans-serif}
  body{max-width:50rem;margin:2rem auto;padding:0 1.3rem}
  button{font:inherit;padding:.52rem .85rem;cursor:pointer;border:1px solid #2336aa;border-radius:.3rem;color:#172783;background:#fff}
  a{color:#172783}
  a:focus-visible,button:focus-visible{outline:2px solid #293ec9;outline-offset:3px}
  .proceedings-edition{padding:clamp(1rem,5vw,3rem);margin:1rem 0 2rem;background:#fff;border:1px solid #dcdfea}
  .proceedings-cover{padding:1.2rem 0;border-block:1px solid #dcdfea}
  section,nav,.proceedings-paper{padding-block-start:1rem}
  .proceedings-paper{border-block-start:1px solid #dcdfea;margin-block-start:1.4rem}
  h1,h2,h3,h4,p{margin:0 0 .7rem;overflow-wrap:anywhere}
  h1,h2,h3{font-family:Georgia,serif;line-height:1.15}
  h1{font-size:clamp(1.7rem,7vw,3.1rem)}
  h3{font-size:1.4rem}
  dl{margin:1rem 0 0}
  dl div{display:grid;grid-template-columns:minmax(7rem,1fr) 2fr;gap:.55rem;padding:.28rem 0}
  dt{font-weight:700}
  dd{margin:0;overflow-wrap:anywhere}
  .proceedings-edition-kind,.proceedings-edition-affiliations{color:#4a5770}
  .proceedings-edition-authors{font-weight:700}
  .proceedings-manuscript{white-space:pre-wrap}
  .proceedings-toc li{margin:.35rem 0;overflow-wrap:anywhere}
  @media(max-width:460px){dl div{grid-template-columns:1fr;gap:.08rem}}
  @page{margin:16mm}
  @media print{
    :root{background:#fff;color:#111;font-size:10.5pt}
    body{max-width:none;margin:0;padding:0}
    button{display:none}
    .proceedings-edition{padding:0;margin:0;border:0}
    .proceedings-paper{break-before:page}
    h1,h2,h3,h4{break-after:avoid}
    p{orphans:3;widows:3}
  }`;

function downloadableEdition(draft, locale, t, classification) {
  // Exported scripts are fixed text. All organizer content is escaped.
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(editionTitle(draft, t))}</title><style>${documentStyles}</style></head>
  <body><button type="button" onclick="window.print()">${t('print')}</button>
  <main aria-label="${t('preview')}">${edition(draft, t, classification, true)}</main></body></html>`;
}

function fileName(title) {
  const part = title.normalize('NFKC').replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 90);
  return (part || 'event-proceedings') + '.html';
}

function openEdition(draft, locale, t, classification, printable) {
  const objectUrl = URL.createObjectURL(new Blob([downloadableEdition(draft, locale, t, classification)], { type: 'text/html;charset=utf-8' }));
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    if (printable) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.download = fileName(editionTitle(draft, t));
    }
    document.body.append(link);
    try { link.click(); }
    finally { link.remove(); }
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }
}

export function renderProceedings({ language, eventType, event, classification, depositUrl } = {}) {
  const { locale, t } = textFor(language);
  const { draft, available } = readDraft({ eventType, event, classification }, t);
  const shared = classificationDetails(classification);
  const hasEvent = Object.values(eventDetails(event)).some(Boolean) || Boolean(eventKeywords(classification));
  return `<section class="proceedings-builder" data-proceedings lang="${locale}" dir="ltr">
    <p class="page-description">${t('intro')}</p>
    <div class="proceedings-toolbar">
      <p class="page-description" data-pro-storage>${t(available ? 'saved' : 'temporary')}</p>
      <div class="proceedings-actions">
        <button type="button" class="button" data-pro-action="download">${t('download')}</button>
        <button type="button" class="button secondary" data-pro-action="print">${t('printView')}</button>
      </div>
    </div>
    <p class="visually-hidden" role="status" data-pro-feedback></p>

    <section class="proceedings-section" aria-labelledby="proceedings-volume">
      <div class="proceedings-heading">
        <h2 id="proceedings-volume">${t('volume')}</h2>
        ${hasEvent ? `<button type="button" class="text-button" data-pro-action="use-event">${t('applyEvent')}</button>` : ''}
      </div>
      <div class="proceedings-grid" data-pro-volume>${volumeFields(draft.volume, t)}</div>
      ${Object.values(shared).some(Boolean) ? `<section class="proceedings-classification" aria-labelledby="proceedings-shared">
        <h3 id="proceedings-shared">${t('eventClassification')}</h3>${detailsList(shared, ['subject', 'stream', 'country', 'callingCodes'], t)}
      </section>` : ''}
    </section>
    <section class="proceedings-section" aria-labelledby="proceedings-contributions">
      <div class="proceedings-heading">
        <h2 id="proceedings-contributions">${t('contributions')}</h2>
        <button type="button" class="button secondary" data-pro-action="add"${draft.entries.length >= maxEntries ? ' disabled' : ''}>${t('addEntry')}</button>
      </div>
      <p class="page-description" data-pro-count role="status"></p>
      <div data-pro-entries>${contributions(draft.entries, t)}</div>
      <label class="proceedings-include"><input type="checkbox" data-pro-accepted${draft.acceptOnly ? ' checked' : ''}>
        ${t('acceptOnly')}</label>
    </section>
    <details class="proceedings-preview" data-pro-preview>
      <summary>${t('preview')}</summary>
      <div data-pro-edition></div>
    </details>
    <div class="proceedings-deposit">
      <p>${t('depositHelp')}</p>
      <a class="button secondary" href="${catalogLink(depositUrl)}">${t('deposit')}</a>
    </div>
  </section>`;
}

export function bindProceedings(root, { language, eventType, event, classification } = {}) {
  const builder = root?.matches?.('[data-proceedings]') ? root : root?.querySelector?.('[data-proceedings]');
  if (!builder || builder.dataset.bound) return;
  builder.dataset.bound = 'true';
  const { locale, t } = textFor(language);
  const { key, draft } = readDraft({ eventType, event, classification }, t);
  const shared = classificationDetails(classification);
  const find = query => builder.querySelector(query);
  const feedback = find('[data-pro-feedback]');
  const storage = find('[data-pro-storage]');
  const count = find('[data-pro-count]');
  const preview = find('[data-pro-preview]');
  const entries = find('[data-pro-entries]');
  const addButton = find('[data-pro-action="add"]');
  const updatePreview = () => {
    if (preview.open) find('[data-pro-edition]').innerHTML = edition(draft, t, shared);
  };
  const updateCount = () => {
    const accepted = draft.entries.filter(entry => entry.status === 'accepted').length;
    const summary = t('entryCount', { count: draft.entries.length, accepted });
    const atLimit = draft.entries.length >= maxEntries;
    const message = atLimit ? summary + '. ' + t('limit') : summary;
    if (count.textContent !== message) count.textContent = message;
    addButton.disabled = atLimit;
  };
  const save = () => {
    storage.textContent = t(writeDraft(key, draft) ? 'saved' : 'temporary');
    updateCount();
    updatePreview();
  };
  const redrawEntries = (index, focusField) => {
    entries.innerHTML = contributions(draft.entries, t);
    const current = entries.querySelector(`[data-pro-entry="${index}"]`);
    (current?.querySelector(focusField) ?? addButton).focus();
  };

  updateCount();
  preview.addEventListener('toggle', updatePreview);
  preview.addEventListener('click', event => {
    const link = event.target.closest('.proceedings-toc a');
    if (!link) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target || !preview.contains(target)) return;
    event.preventDefault();
    target.scrollIntoView({ block: 'start' });
  });
  builder.addEventListener('input', event => {
    const target = event.target;
    const field = target.dataset.proField;
    if (target.matches('[data-pro-accepted]')) {
      draft.acceptOnly = target.checked;
    } else if (field && target.closest('[data-pro-volume]') && Object.hasOwn(volumeLimits, field)) {
      draft.volume[field] = short(target.value, volumeLimits[field]);
    } else if (field) {
      const container = target.closest('[data-pro-entry]');
      if (!container) return;
      const item = draft.entries[Number(container.dataset.proEntry)];
      if (!item || !Object.hasOwn(item, field)) return;
      item[field] = short(target.value, entryLimits[field] ?? 24);
    } else return;
    save();
  });

  builder.addEventListener('click', event => {
    const button = event.target.closest('button[data-pro-action]');
    if (!button) return;
    const action = button.dataset.proAction;
    if (action === 'download' || action === 'print') {
      try {
        openEdition(draft, locale, t, shared, action === 'print');
        feedback.textContent = t(action === 'print' ? 'printReady' : 'downloadReady');
      } catch {
        feedback.textContent = t('exportError');
      }
      return;
    }
    if (action === 'use-event') {
      const currentEvent = { ...eventDetails(event), keywords: eventKeywords(classification) };
      for (const [field, value] of Object.entries(currentEvent)) {
        if (!value) continue;
        draft.volume[field] = value;
        find(`[data-pro-volume] [data-pro-field="${field}"]`).value = value;
      }
      feedback.textContent = t('appliedEvent');
    } else if (action === 'add' && draft.entries.length < maxEntries) {
      draft.entries.push(entryOf());
      redrawEntries(draft.entries.length - 1, '[data-pro-field="title"]');
    } else {
      const container = button.closest('[data-pro-entry]');
      if (!container) return;
      const index = Number(container.dataset.proEntry);
      if (action === 'remove' && window.confirm(t('confirmRemove'))) {
        draft.entries.splice(index, 1);
        redrawEntries(Math.min(index, draft.entries.length - 1), 'h3');
      } else if (action === 'earlier' || action === 'later') {
        const destination = index + (action === 'earlier' ? -1 : 1);
        if (destination < 0 || destination >= draft.entries.length) return;
        [draft.entries[index], draft.entries[destination]] = [draft.entries[destination], draft.entries[index]];
        redrawEntries(destination, 'h3');
      } else return;
    }
    save();
  });
}
