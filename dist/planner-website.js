const types = ['seminar', 'symposium', 'workshop', 'webinar', 'conference', 'other'];
const modes = ['inPerson', 'online', 'hybrid'];
const limits = { title: 200, summary: 4000, organizer: 180, startDate: 10, endDate: 10, timezone: 80, venue: 280, registrationUrl: 2048, contactEmail: 254, mode: 12 };
const rowLimits = { speakers: 50, agenda: 100 };
const rowFields = { speakers: { name: 160, role: 200 }, agenda: { time: 5, title: 200, speaker: 160, duration: 4 } };
const storagePrefix = 'open-research-commons:event-website:v1:';
const draftCache = new Map();
const copy = Object.fromEntries(`
intro|Build a page attendees can use to find event details, view the programme and register.|प्रतिभागियों के लिए ऐसा पेज बनाएं जहाँ वे आयोजन का विवरण, कार्यक्रम और पंजीकरण देख सकें।
back|Back to event plan|आयोजन योजना पर वापस जाएँ
details|Public event details|सार्वजनिक आयोजन विवरण
title|Event title|आयोजन का शीर्षक
summary|About the event|आयोजन के बारे में
organizer|Organizer or institution|आयोजक या संस्था
startDate|Start date|प्रारंभ तिथि
endDate|End date|समापन तिथि
timezone|Time zone|समय क्षेत्र
venue|Venue or public platform name|स्थल या सार्वजनिक प्लेटफ़ॉर्म का नाम
mode|Participation mode|भागीदारी का तरीका
inPerson|In person|प्रत्यक्ष
online|Online|ऑनलाइन
hybrid|Hybrid|हाइब्रिड
choose|Select a mode|तरीका चुनें
registrationUrl|Public registration link|सार्वजनिक पंजीकरण लिंक
contactEmail|Contact email|संपर्क ईमेल
contactOptIn|Show the contact email on the public page and in the download.|सार्वजनिक पेज और डाउनलोड में संपर्क ईमेल दिखाएँ।
contact|Contact the organizer|आयोजक से संपर्क करें
speakers|Speakers|वक्ता
name|Name|नाम
speaker|Speaker or lead|वक्ता या प्रभारी
role|Role or affiliation|भूमिका या संबद्धता
agenda|Programme|कार्यक्रम
time|Start time|प्रारंभ समय
session|Session title|सत्र का शीर्षक
duration|Duration in minutes|अवधि मिनटों में
minutes|min|मिनट
addSpeaker|Add speaker|वक्ता जोड़ें
addSession|Add session|सत्र जोड़ें
remove|Remove|हटाएँ
removeSpeaker|Remove speaker {n}|वक्ता {n} हटाएँ
removeSession|Remove session {n}|सत्र {n} हटाएँ
register|Register for this event|इस आयोजन के लिए पंजीकरण करें
preview|Live website preview|वेबसाइट का लाइव पूर्वावलोकन
previewTitle|Your event title|आपके आयोजन का शीर्षक
previewHelp|Edit the public details to see the page as attendees will see it.|प्रतिभागियों को पेज कैसा दिखेगा, यह देखने के लिए सार्वजनिक विवरण संपादित करें।
classification|Research classification|शोध वर्गीकरण
subject|Subject|विषय
stream|Research stream|शोध की शाखा
keywords|Keywords|कीवर्ड
country|Country|देश
callingCodes|Country calling codes|देश के डायलिंग कोड
setClassification|Set research classification and country in the event plan.|आयोजन योजना में शोध वर्गीकरण और देश चुनें।
editClassification|Edit classification in event plan|आयोजन योजना में वर्गीकरण संपादित करें
importPlan|Fill blanks from event plan|आयोजन योजना से खाली फ़ील्ड भरें
imported|Event plan details added where the website draft was blank.|वेबसाइट के खाली फ़ील्ड में आयोजन योजना का विवरण जोड़ा गया।
download|Download website HTML|वेबसाइट HTML डाउनलोड करें
downloaded|Website HTML downloaded. It can be opened in a browser or uploaded to a static host.|वेबसाइट HTML डाउनलोड हो गया। इसे ब्राउज़र में खोल सकते हैं या स्टैटिक होस्ट पर अपलोड कर सकते हैं।
draft|Draft edits are saved in this browser.|मसौदे के बदलाव इसी ब्राउज़र में सहेजे जाते हैं।
storageUnavailable|This browser cannot save the draft. Keep this tab open or download the website HTML.|यह ब्राउज़र मसौदा सहेज नहीं सका। टैब खुला रखें या वेबसाइट HTML डाउनलोड करें।
review|Review names and links before sharing. The website uses the public details in this editor.|साझा करने से पहले नाम और लिंक जाँचें। वेबसाइट इस संपादक के सार्वजनिक विवरण लेती है।
consent|I have reviewed this page and want to make these details public.|मैंने पेज की समीक्षा कर ली है और ये विवरण सार्वजनिक करना चाहता/चाहती हूँ।
confirm|Confirm the public details before publishing.|प्रकाशित करने से पहले सार्वजनिक विवरण की पुष्टि करें।
publish|Publish website|वेबसाइट प्रकाशित करें
update|Update public website|सार्वजनिक वेबसाइट अपडेट करें
publishing|Publishing website…|वेबसाइट प्रकाशित हो रही है…
published|Your website is public. Share the link with attendees.|आपकी वेबसाइट सार्वजनिक है। इसका लिंक प्रतिभागियों के साथ साझा करें।
unpublish|Unpublish website|वेबसाइट का प्रकाशन हटाएँ
unpublishConfirm|Unpublish this page? Its public URL will stop working until you publish it again.|इस पेज का प्रकाशन हटाएँ? फिर से प्रकाशित करने तक इसका सार्वजनिक URL काम नहीं करेगा।
unpublishing|Unpublishing website…|वेबसाइट का प्रकाशन हटाया जा रहा है…
unpublished|The website is unpublished. The draft is still available in this editor.|वेबसाइट का प्रकाशन हट गया। मसौदा अब भी इस संपादक में उपलब्ध है।
viewPublished|Open public website|सार्वजनिक वेबसाइट खोलें
signIn|Sign in to publish|प्रकाशित करने के लिए साइन इन करें
signInToPublish|Sign in to share a website link. You can download the HTML from this editor.|वेबसाइट का लिंक साझा करने के लिए साइन इन करें। HTML इस संपादक से डाउनलोड कर सकते हैं।
downloadOnly|Download the HTML to open the site or publish it on a static host.|साइट खोलने या स्टैटिक होस्ट पर प्रकाशित करने के लिए HTML डाउनलोड करें।
primaryPublish|Open primary site to publish|प्रकाशन के लिए मुख्य साइट खोलें
primaryPublishHelp|This draft is saved in this browser for this site address. Download it as HTML or use the primary site to publish a shareable event page.|यह मसौदा इस साइट के पते के लिए इसी ब्राउज़र में सहेजा जाता है। इसे HTML के रूप में डाउनलोड करें या साझा करने योग्य पेज प्रकाशित करने के लिए मुख्य साइट का उपयोग करें।
publishError|Publishing did not finish. Keep this editor open and try again.|प्रकाशन पूरा नहीं हुआ। संपादक खुला रखें और फिर कोशिश करें।
unpublishError|The page could not be unpublished. Try again.|पेज का प्रकाशन नहीं हट सका। फिर कोशिश करें।
titleError|Enter the event title.|आयोजन का शीर्षक दर्ज करें।
dateError|The end date must be on or after the start date.|समापन तिथि प्रारंभ तिथि के समान या उसके बाद होनी चाहिए।
urlError|Enter a complete HTTPS registration link.|पूरा HTTPS पंजीकरण लिंक दर्ज करें।
emailError|Enter a valid email to show publicly.|सार्वजनिक रूप से दिखाने के लिए सही ईमेल दर्ज करें।
myPages|My published websites|मेरी प्रकाशित वेबसाइटें
loadPages|Load my websites|मेरी वेबसाइटें लोड करें
loadingPages|Loading published websites…|प्रकाशित वेबसाइटें लोड हो रही हैं…
noPages|You have no published websites for this event type.|इस प्रकार के आयोजन के लिए आपकी कोई प्रकाशित वेबसाइट नहीं है।
openEditor|Edit this website|इस वेबसाइट को संपादित करें
restoreConfirm|Replace the website draft in this browser with the published version?|इस ब्राउज़र के वेबसाइट मसौदे को प्रकाशित संस्करण से बदलें?
loadError|Could not load your published websites. Try again.|आपकी प्रकाशित वेबसाइटें लोड नहीं हुईं। फिर कोशिश करें।
loaded|Published details loaded into the editor.|प्रकाशित विवरण संपादक में लोड हो गए।
newWebsite|New website|नई वेबसाइट
newWebsiteConfirm|Start a new website and replace the current draft edits? Any published page stays available.|नई वेबसाइट शुरू करके मौजूदा मसौदे के बदलाव बदलें? प्रकाशित पेज उपलब्ध रहेगा।
newWebsiteReady|A new website draft is ready. Publish it to get a separate public link.|नई वेबसाइट का मसौदा तैयार है। अलग सार्वजनिक लिंक पाने के लिए इसे प्रकाशित करें।
seminar|Seminar|सेमिनार
symposium|Symposium|संगोष्ठी
workshop|Workshop|कार्यशाला
webinar|Webinar|वेबिनार
conference|Conference|सम्मेलन
other|Event|आयोजन
`.trim().split('\n').map(line => {
  const [key, en, hi] = line.split('|');
  return [key, { en, hi }];
}));

function languageOf(language) {
  return language === 'hi' ? 'hi' : 'en';
}

function labels(language) {
  return (key, n) => (copy[key]?.[language] ?? '').replace('{n}', n ?? '');
}

function text(value, limit) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function escape(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function httpsUrl(value) {
  const raw = text(value, 2048).trim();
  if (!/^https:\/\//i.test(raw)) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function emailAddress(value) {
  const email = text(value, 254).trim();
  return /^[^\s@<>"]+@[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,63}$/i.test(email) ? email : '';
}

function dateValue(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? value : '';
}

function websiteType(value) {
  return types.includes(value) ? value : 'other';
}

function cleanClassification(value) {
  const strings = (list, limit) => Array.isArray(list)
    ? [...new Set(list.slice(0, 12).map(item => text(item, limit).trim()).filter(Boolean))]
    : [];
  const subjectCode = text(value?.subjectCode, 8);
  const streamCode = text(value?.streamCode, 8);
  const countryCode = text(value?.countryCode, 2).toUpperCase();
  return {
    subjectCode: /^\d{2}$/.test(subjectCode) ? subjectCode : '',
    streamCode: /^\d{4}(?:\d{2})?$/.test(streamCode) ? streamCode : '',
    subject: text(value?.subject, 220).trim(),
    stream: text(value?.stream, 260).trim(),
    keywords: strings(value?.keywords, 100),
    countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : '',
    country: text(value?.country, 160).trim(),
    callingCodes: strings(value?.callingCodes, 16).filter(code => /^\+\d(?:[\d -]*\d)?$/.test(code)),
  };
}

function fieldValues(fields, value) {
  return Object.fromEntries(Object.entries(fields).map(([key, limit]) => [key, text(value?.[key], limit)]));
}

function cleanRows(group, value) {
  return Array.isArray(value) ? value.slice(0, rowLimits[group]).map(row => fieldValues(rowFields[group], row)) : [];
}

export function normalizeEventWebsite(value) {
  const details = Object.fromEntries(Object.entries(fieldValues(limits, value)).map(([key, item]) => [key, item.trim()]));
  const startDate = dateValue(details.startDate);
  const endDate = dateValue(details.endDate);
  const speakers = cleanRows('speakers', value?.speakers).map(({ name, role }) => ({
    name: name.trim(), role: role.trim(),
  })).filter(({ name }) => name);
  const agenda = cleanRows('agenda', value?.agenda).map(({ time, title, speaker, duration }) => ({
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '',
    title: title.trim(),
    speaker: speaker.trim(),
    duration: /^\d{1,4}$/.test(duration) && Number(duration) > 0 && Number(duration) <= 1440 ? String(Number(duration)) : '',
  })).filter(({ title }) => title);
  return {
    ...details,
    language: languageOf(value?.language),
    eventType: websiteType(value?.eventType),
    mode: modes.includes(details.mode) ? details.mode : '',
    startDate,
    endDate: startDate && endDate && endDate < startDate ? '' : endDate,
    registrationUrl: httpsUrl(details.registrationUrl),
    contactEmail: emailAddress(details.contactEmail),
    classification: cleanClassification(value?.classification),
    speakers,
    agenda,
  };
}

const publicStyle = `
:root{color-scheme:light;--ink:#111e43;--paper:#fbfaf7;--link:#263bc9;--rule:#dcdfea;--muted:#46516a;--coral:#f9a16c}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.58 system-ui,sans-serif}
::selection{background:#dde2ff;color:var(--ink)}
:focus-visible{outline:3px solid #758bff;outline-offset:4px}
a{color:var(--link);text-underline-offset:.2em}
.event-wrap{inline-size:min(100% - 2rem,61rem);margin-inline:auto;overflow-wrap:anywhere}
.event-cover{background:var(--ink);color:white;padding-block:clamp(2rem,8vw,5rem)}
.event-cover h1{max-inline-size:20ch;margin:.3rem 0 .85rem;font:400 clamp(2.4rem,6.5vw,5rem)/1.02 Georgia,serif;letter-spacing:-.025em}
.event-cover p{margin:0;color:#e5eaff}
.event-kicker{font-size:.95rem;font-weight:700}
.event-registration{display:inline-block;max-inline-size:100%;margin-block-start:1.45rem;background:var(--coral);color:var(--ink);padding:.62rem 1.08rem;border-radius:5px;font-weight:700;text-decoration:none}
.event-registration:hover{background:#ffc49f}
.event-facts{display:flex;flex-wrap:wrap;gap:.85rem 2rem;margin:0;padding-block:1.15rem;border-block-end:1px solid var(--rule)}
.event-facts div{min-inline-size:min(100%,8rem)}
.event-facts dt,.event-subdued{color:var(--muted)}
.event-facts dd{margin:0;font-weight:700}
.event-nav{display:flex;flex-wrap:wrap;gap:.45rem 1.2rem;margin-block-start:1rem}
.event-nav a{display:flex;align-items:center;min-block-size:2.75rem;font-weight:700}
.event-content{padding-block:1.45rem 3rem}
.event-content section + section{border-block-start:1px solid var(--rule);margin-block-start:2.45rem;padding-block-start:1.85rem}
.event-content h2{margin:0 0 .85rem;font:400 clamp(1.8rem,4vw,2.55rem)/1.12 Georgia,serif}
.event-content p{max-inline-size:72ch}
.event-about{white-space:pre-wrap;margin-block:.35rem 0}
.event-items{list-style:none;padding:0;margin:0}
.event-items li{padding-block:.72rem;border-block-end:1px solid var(--rule)}
.event-session{display:grid;grid-template-columns:6rem 1fr;gap:.15rem .8rem}
.event-session--undated{grid-template-columns:minmax(0,1fr)}
.event-session time{color:var(--link);font-variant-numeric:tabular-nums;font-weight:700}
.event-session p,.event-speakers p{margin:0}
.event-taxonomy{display:flex;flex-wrap:wrap;gap:.65rem 1.4rem;margin:0}
.event-taxonomy dt{color:var(--muted);font-size:.9rem}
.event-taxonomy dd{margin:0}
@media(max-width:430px){.event-session{grid-template-columns:minmax(0,1fr)}}
`;

function dateLabel(start, end, language) {
  const format = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en', { dateStyle: 'medium', timeZone: 'UTC' });
  const day = value => format.format(new Date(`${value}T00:00:00Z`));
  if (start && end && start !== end) return `${day(start)} – ${day(end)}`;
  return start || end ? day(start || end) : '';
}

function classificationMarkup(classification, t) {
  const subject = [classification.subject, classification.subjectCode].filter(Boolean).join(' · ');
  const stream = [classification.stream, classification.streamCode].filter(Boolean).join(' · ');
  const country = [classification.country, classification.countryCode].filter(Boolean).join(' · ');
  const lines = [
    ['subject', subject], ['stream', stream], ['keywords', classification.keywords.join(', ')],
    ['country', country], ['callingCodes', classification.callingCodes.join(', ')],
  ];
  return lines.some(([, value]) => value) ? `<dl class="event-taxonomy">${lines.map(([key, value]) =>
    value ? `<div><dt>${t(key)}</dt><dd dir="auto">${escape(value)}</dd></div>` : '').join('')}</dl>` : '';
}

function renderWebsite(value, preview = false) {
  const site = normalizeEventWebsite(value);
  const t = labels(site.language);
  const heading = site.title || (preview ? t('previewTitle') : t(site.eventType));
  const timing = [dateLabel(site.startDate, site.endDate, site.language), site.timezone].filter(Boolean).join(' · ');
  const facts = [
    ['startDate', timing], ['mode', t(site.mode)], ['venue', site.venue],
  ].filter(([, text]) => text);
  const taxonomy = classificationMarkup(site.classification, t);
  const sections = [
    ['summary', site.summary ? `<p class="event-about" dir="auto">${escape(site.summary)}</p>` : ''],
    ['agenda', site.agenda.length ? `<ol class="event-items">${site.agenda.map(item => {
      const extra = [item.speaker, item.duration && `${item.duration} ${t('minutes')}`].filter(Boolean).join(' · ');
      return `<li class="event-session${item.time ? '' : ' event-session--undated'}">${item.time ? `<time datetime="${item.time}">${item.time}</time>` : ''}<div><strong dir="auto">${escape(item.title)}</strong>${extra ? `<p class="event-subdued" dir="auto">${escape(extra)}</p>` : ''}</div></li>`;
    }).join('')}</ol>` : ''],
    ['speakers', site.speakers.length ? `<ul class="event-items event-speakers">${site.speakers.map(speaker =>
      `<li><strong dir="auto">${escape(speaker.name)}</strong>${speaker.role ? `<p class="event-subdued" dir="auto">${escape(speaker.role)}</p>` : ''}</li>`).join('')}</ul>` : ''],
    ['classification', taxonomy],
    ['contact', site.contactEmail ? `<p>${preview ? escape(site.contactEmail) : `<a href="mailto:${escape(encodeURIComponent(site.contactEmail).replace('%40', '@'))}">${escape(site.contactEmail)}</a>`}</p>` : ''],
  ].filter(([, markup]) => markup);
  const registration = site.registrationUrl ? (preview
    ? `<span class="event-registration">${t('register')}</span>`
    : `<a class="event-registration" href="${escape(site.registrationUrl)}" rel="noreferrer">${t('register')}</a>`) : '';
  return `<!doctype html>
<html lang="${site.language}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escape(heading)}</title><style>${publicStyle}</style></head>
<body>
  <header class="event-cover"><div class="event-wrap">
    <p class="event-kicker">${t(site.eventType)}</p>
    <h1 dir="auto">${escape(heading)}</h1>
    ${site.organizer ? `<p dir="auto">${escape(site.organizer)}</p>` : ''}
    ${registration}
  </div></header>
  <main class="event-wrap">
    ${facts.length ? `<dl class="event-facts">${facts.map(([key, value]) =>
      `<div><dt>${t(key)}</dt><dd dir="auto">${escape(value)}</dd></div>`).join('')}</dl>` : ''}
    ${sections.length > 1 ? `<nav class="event-nav" aria-label="${t(site.eventType)}">${sections.map(([key]) => `<a href="#${key}">${t(key)}</a>`).join('')}</nav>` : ''}
    <div class="event-content">${sections.map(([key, markup]) =>
      `<section id="${key}"><h2>${t(key)}</h2>${markup}</section>`).join('')}</div>
  </main>
</body>
</html>`;
}

export function renderPublishedEventWebsite(record) {
  return renderWebsite(record);
}

function seededDetails(plannerDraft) {
  const brief = plannerDraft?.brief;
  return fieldValues(limits, {
    title: brief?.title, organizer: brief?.organizer, mode: brief?.mode,
    startDate: brief?.startDate, endDate: brief?.endDate, timezone: brief?.timezone,
    venue: brief?.venue, registrationUrl: brief?.registration,
  });
}

function seededAgenda(plannerDraft) {
  return Array.isArray(plannerDraft?.agenda) ? cleanRows('agenda', plannerDraft.agenda.map(row => ({
    time: row?.time, title: row?.session ?? row?.title, speaker: row?.lead ?? row?.speaker,
    duration: row?.duration,
  }))) : [];
}

function publicLink(value) {
  const href = text(value, 2048);
  return /^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(href) ? href : httpsUrl(href);
}

function siteIdentifier(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : '';
}

function publicSite(value) {
  const id = siteIdentifier(value?.id);
  const url = publicLink(value?.url);
  return id && url ? { id, url } : null;
}

function readDraft(options) {
  const eventType = websiteType(options.eventType);
  const storageKey = storagePrefix + eventType;
  let available = true;
  let saved = draftCache.get(storageKey);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!saved && raw) saved = JSON.parse(raw);
  } catch {
    available = false;
  }
  const source = saved?.record;
  const site = publicSite(saved?.site);
  const planClassification = cleanClassification(options.classification);
  return {
    storageKey, available, eventType,
    details: source ? fieldValues(limits, source) : seededDetails(options.plannerDraft),
    speakers: cleanRows('speakers', source?.speakers),
    agenda: source ? cleanRows('agenda', source.agenda) : seededAgenda(options.plannerDraft),
    contactPublic: Boolean(saved?.contactPublic),
    classification: Object.values(planClassification).some(value => value.length)
      ? planClassification : cleanClassification(source?.classification),
    site,
    siteId: siteIdentifier(saved?.siteId) || site?.id || '',
    hasPublishedSite: Boolean(saved?.hasPublishedSite || site),
    changedSincePublished: Boolean(saved?.changedSincePublished),
  };
}

function publicRecord(draft, language) {
  return normalizeEventWebsite({
    ...draft.details,
    language,
    eventType: draft.eventType,
    contactEmail: draft.contactPublic ? draft.details.contactEmail : '',
    classification: draft.classification,
    speakers: draft.speakers,
    agenda: draft.agenda,
  });
}

function field(key, value, t) {
  if (key === 'mode') {
    return `<label class="field">${t(key)}<select name="${key}"><option value="">${t('choose')}</option>${modes.map(mode =>
      `<option value="${mode}"${mode === value ? ' selected' : ''}>${t(mode)}</option>`).join('')}</select></label>`;
  }
  if (key === 'summary') {
    return `<label class="field full">${t(key)}<textarea name="${key}" maxlength="${limits[key]}" rows="4" dir="auto">${escape(value)}</textarea></label>`;
  }
  const type = key.endsWith('Date') ? 'date' : key === 'registrationUrl' ? 'url' : key === 'contactEmail' ? 'email' : 'text';
  return `<label class="field${key === 'title' || key === 'registrationUrl' ? ' full' : ''}">${t(key)}
    <input type="${type}" name="${key}" value="${escape(value)}" maxlength="${limits[key]}" dir="auto"${key === 'title' ? ' required' : ''}></label>`;
}

function rows(group, entries, t) {
  const heading = key => key === 'title' ? t('session') : t(key);
  return entries.map((entry, index) => `<div class="website-builder-row website-builder-row--${group}" data-website-row="${index}" data-website-group="${group}">
    ${Object.entries(rowFields[group]).map(([key, limit]) => {
      const type = key === 'time' ? 'time' : key === 'duration' ? 'number' : 'text';
      const bounds = key === 'duration' ? ' min="1" max="1440" step="1"' : ` maxlength="${limit}"`;
      return `<label class="field">${heading(key)}<input type="${type}"${bounds} data-website-field="${key}" value="${escape(entry[key])}" dir="auto"></label>`;
    }).join('')}
    <button type="button" class="text-button" data-website-remove aria-label="${t(group === 'speakers' ? 'removeSpeaker' : 'removeSession', index + 1)}">${t('remove')}</button>
  </div>`).join('');
}

function publishActions(draft, options, t) {
  if (typeof options.publish === 'function') {
    return `<label class="website-builder-consent"><input type="checkbox" data-website-consent>${t('consent')}</label>
      <button type="button" class="button" data-website-publish>${t(draft.site ? 'update' : 'publish')}</button>`;
  }
  const primary = httpsUrl(options.primaryWebsiteUrl);
  if (primary) {
    return `<p>${t('primaryPublishHelp')}</p><a class="button" href="${escape(primary)}">${t('primaryPublish')}</a>`;
  }
  return options.signInUrl
    ? `<p>${t('signInToPublish')}</p><a class="button" href="${escape(options.signInUrl)}">${t('signIn')}</a>`
    : `<p>${t('downloadOnly')}</p>`;
}

export function eventWebsiteContent(language, options = {}) {
  const locale = languageOf(language);
  const t = labels(locale);
  const draft = readDraft(options);
  const classification = classificationMarkup(draft.classification, t);
  const plannerUrl = escape(options.plannerUrl ?? '?view=planner');
  return `<div class="website-builder" data-event-website lang="${locale}" dir="ltr">
    <div class="website-builder-intro">
      <p class="page-description">${t('intro')}</p>
      <div><a class="text-link" href="${plannerUrl}">${t('back')}</a>
        <a class="text-link website-builder-preview-link" href="#event-website-preview">${t('preview')}</a></div>
    </div>
    <div class="website-builder-layout">
      <form class="website-builder-editor" data-website-editor novalidate>
        <section class="website-builder-section">
          <h2>${t('details')}</h2>
          <div class="form-grid">${Object.keys(limits).filter(key => key !== 'contactEmail').map(key => field(key, draft.details[key], t)).join('')}</div>
          <label class="website-builder-consent"><input type="checkbox" data-website-contact${draft.contactPublic ? ' checked' : ''}>${t('contactOptIn')}</label>
          <div data-website-contact-field${draft.contactPublic ? '' : ' hidden'}>${field('contactEmail', draft.details.contactEmail, t)}</div>
          <button class="text-button" type="button" data-website-import>${t('importPlan')}</button>
        </section>
        <section class="website-builder-section website-builder-classification">
          <h2>${t('classification')}</h2>
          <div data-website-classification>${classification || `<p class="page-description">${t('setClassification')}</p>`}</div>
          <a class="text-link" href="${plannerUrl}#planner-classification">${t('editClassification')}</a>
        </section>
        ${['speakers', 'agenda'].map(group => `<section class="website-builder-section">
          <h2>${t(group)}</h2>
          <div data-website-rows="${group}">${rows(group, draft[group], t)}</div>
          <button class="button secondary" type="button" data-website-add="${group}"${draft[group].length >= rowLimits[group] ? ' disabled' : ''}>${t(group === 'speakers' ? 'addSpeaker' : 'addSession')}</button>
        </section>`).join('')}
        <div class="website-builder-actions">
          <p class="page-description">${t('review')}</p>
          <button class="button secondary" type="button" data-website-download>${t('download')}</button>
          ${publishActions(draft, options, t)}
          ${typeof options.publish === 'function' ? `<button type="button" class="button secondary" data-website-new${draft.hasPublishedSite ? '' : ' hidden'}>${t('newWebsite')}</button>` : ''}
          <div class="website-builder-public" data-website-public${draft.site ? '' : ' hidden'}>
            <a class="text-link" target="_blank" rel="noopener noreferrer" data-website-public-link${draft.site ? ` href="${escape(draft.site.url)}"` : ''}>${t('viewPublished')}</a>
            ${typeof options.unpublish === 'function' ? `<button class="text-button" type="button" data-website-unpublish>${t('unpublish')}</button>` : ''}
          </div>
          <p data-website-error class="website-builder-error" role="alert" hidden></p>
          <p data-website-status role="status">${t(draft.available ? 'draft' : 'storageUnavailable')}</p>
        </div>
        ${typeof options.listPublished === 'function' ? `<details class="website-builder-section website-builder-existing">
          <summary>${t('myPages')}</summary>
          <button class="button secondary" type="button" data-website-list>${t('loadPages')}</button>
          <p data-website-list-status role="status"></p><ul data-website-list-results></ul>
        </details>` : ''}
      </form>
      <section class="website-builder-preview" id="event-website-preview" aria-label="${t('preview')}">
        <h2>${t('preview')}</h2>
        <p class="page-description">${t('previewHelp')}</p>
        <iframe sandbox title="${t('preview')}" data-website-preview></iframe>
      </section>
    </div>
  </div>`;
}

function downloadHtml(record) {
  const file = new Blob([renderPublishedEventWebsite(record)], { type: 'text/html;charset=utf-8' });
  const href = URL.createObjectURL(file);
  const link = document.createElement('a');
  const filename = record.title.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 90);
  link.href = href;
  link.download = `${filename || 'event-website'}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30_000);
}

export function bindEventWebsite(root, language, options = {}) {
  const editor = root?.matches?.('[data-event-website]') ? root : root?.querySelector?.('[data-event-website]');
  if (!editor || editor.dataset.bound) return;
  editor.dataset.bound = 'true';
  const locale = languageOf(language);
  const t = labels(locale);
  const draft = readDraft(options);
  const get = selector => editor.querySelector(selector);
  const form = get('[data-website-editor]');
  const status = get('[data-website-status]');
  const feedback = get('[data-website-error]');
  const consent = get('[data-website-consent]');
  const publish = get('[data-website-publish]');
  const unpublish = get('[data-website-unpublish]');
  const newWebsite = get('[data-website-new]');
  const frame = get('[data-website-preview]');
  let busy = false;
  let pages = [];

  function persist(current = draft) {
    const value = {
      record: { ...current.details, speakers: current.speakers, agenda: current.agenda, classification: current.classification },
      contactPublic: current.contactPublic,
      site: current.site,
      siteId: current.siteId,
      hasPublishedSite: current.hasPublishedSite,
      changedSincePublished: current.changedSincePublished,
    };
    draftCache.set(current.storageKey, value);
    try {
      localStorage.setItem(current.storageKey, JSON.stringify(value));
      return true;
    } catch {
      status.textContent = t('storageUnavailable');
      return false;
    }
  }

  const revision = ({ details, speakers, agenda, contactPublic, classification }) =>
    JSON.stringify({ details, speakers, agenda, contactPublic, classification });

  function persistPublication(site, publishedRevision) {
    const latest = readDraft(options);
    if (latest.siteId !== draft.siteId) return;
    draft.site = site;
    draft.siteId = site?.id || draft.siteId;
    draft.hasPublishedSite = Boolean(site) || latest.hasPublishedSite;
    draft.changedSincePublished = site ? revision(latest) !== publishedRevision : latest.changedSincePublished;
    persist({ ...latest, site, siteId: draft.siteId, hasPublishedSite: draft.hasPublishedSite, changedSincePublished: draft.changedSincePublished });
  }

  function showError(key, fieldName) {
    feedback.textContent = key ? t(key) : '';
    feedback.hidden = !key;
    form.querySelector('[aria-invalid="true"]')?.removeAttribute('aria-invalid');
    if (fieldName) {
      form.elements.namedItem(fieldName)?.setAttribute('aria-invalid', 'true');
      form.elements.namedItem(fieldName)?.focus();
    }
  }

  function updatePreview() {
    frame.srcdoc = renderWebsite(publicRecord(draft, locale), true);
  }

  function saveEdits(markDirty = true) {
    if (markDirty && draft.hasPublishedSite) draft.changedSincePublished = true;
    if (consent) consent.checked = false;
    showError('');
    const saved = persist();
    if (saved) status.textContent = t('draft');
    updatePreview();
    return saved;
  }

  function updatePublishState() {
    const group = get('[data-website-public]');
    const link = get('[data-website-public-link]');
    group.hidden = !draft.site;
    if (draft.site) link.href = draft.site.url;
    else link.removeAttribute('href');
    if (publish) {
      publish.disabled = busy;
      publish.textContent = t(draft.site ? 'update' : 'publish');
    }
    if (unpublish) unpublish.disabled = busy;
    if (newWebsite) {
      newWebsite.hidden = !draft.hasPublishedSite;
      newWebsite.disabled = busy;
    }
  }

  function validPublicRecord() {
    const record = publicRecord(draft, locale);
    if (!record.title) showError('titleError', 'title');
    else if (draft.details.startDate && draft.details.endDate && draft.details.endDate < draft.details.startDate) showError('dateError', 'endDate');
    else if (draft.details.registrationUrl.trim() && !record.registrationUrl) showError('urlError', 'registrationUrl');
    else if (draft.contactPublic && !record.contactEmail) showError('emailError', 'contactEmail');
    else return record;
    return null;
  }

  function renderRows(group, index) {
    const container = get(`[data-website-rows="${group}"]`);
    const button = get(`[data-website-add="${group}"]`);
    container.innerHTML = rows(group, draft[group], t);
    button.disabled = draft[group].length >= rowLimits[group];
    if (index !== undefined) (container.querySelector(`[data-website-row="${index}"] input`) || button).focus();
  }

  function updateForm() {
    for (const [key, value] of Object.entries(draft.details)) form.elements.namedItem(key).value = value;
    get('[data-website-contact]').checked = draft.contactPublic;
    get('[data-website-contact-field]').hidden = !draft.contactPublic;
    get('[data-website-classification]').innerHTML = classificationMarkup(draft.classification, t) ||
      `<p class="page-description">${t('setClassification')}</p>`;
    for (const group of ['speakers', 'agenda']) renderRows(group);
    updatePublishState();
  }

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    const input = event.target;
    if (input.matches('[data-website-contact]')) {
      draft.contactPublic = input.checked;
      get('[data-website-contact-field]').hidden = !draft.contactPublic;
    } else if (Object.hasOwn(limits, input.name)) {
      draft.details[input.name] = text(input.value, limits[input.name]);
    } else if (input.dataset.websiteField) {
      const row = input.closest('[data-website-row]').dataset;
      const key = input.dataset.websiteField;
      draft[row.websiteGroup][Number(row.websiteRow)][key] = text(input.value, rowFields[row.websiteGroup][key]);
    } else return;
    saveEdits();
  });

  form.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const group = button.dataset.websiteAdd;
    if (group && draft[group].length < rowLimits[group]) {
      draft[group].push(fieldValues(rowFields[group]));
      renderRows(group, draft[group].length - 1);
      saveEdits();
    } else if (button.matches('[data-website-remove]')) {
      const row = button.closest('[data-website-row]').dataset;
      const index = Number(row.websiteRow);
      draft[row.websiteGroup].splice(index, 1);
      renderRows(row.websiteGroup, Math.min(index, draft[row.websiteGroup].length - 1));
      saveEdits();
    } else if (button.matches('[data-website-import]')) {
      const defaults = seededDetails(options.plannerDraft);
      for (const [key, value] of Object.entries(defaults)) if (!draft.details[key]) draft.details[key] = value;
      if (!draft.agenda.length) draft.agenda = seededAgenda(options.plannerDraft);
      updateForm();
      saveEdits();
      status.textContent = t('imported');
    } else if (button.matches('[data-website-download]')) {
      const record = validPublicRecord();
      if (!record) return;
      downloadHtml(record);
      status.textContent = t('downloaded');
    } else if (button === publish && !busy) {
      if (!consent.checked) {
        showError('confirm');
        consent.focus();
        return;
      }
      const record = validPublicRecord();
      if (!record) return;
      const publishedRevision = revision(draft);
      showError('');
      busy = true;
      updatePublishState();
      status.textContent = t('publishing');
      try {
        if (!draft.siteId) {
          draft.siteId = crypto.randomUUID();
          persist();
        }
        const site = publicSite(await options.publish(record, { siteId: draft.siteId }));
        if (!site || site.id !== draft.siteId) throw new Error('Invalid publication response');
        persistPublication(site, publishedRevision);
        consent.checked = false;
        status.textContent = t('published');
      } catch {
        status.textContent = '';
        showError('publishError');
      } finally {
        busy = false;
        updatePublishState();
      }
    } else if (button === unpublish && !busy && draft.site && confirm(t('unpublishConfirm'))) {
      busy = true;
      updatePublishState();
      status.textContent = t('unpublishing');
      try {
        await options.unpublish(draft.site.id);
        persistPublication(null);
        if (consent) consent.checked = false;
        status.textContent = t('unpublished');
      } catch {
        status.textContent = '';
        showError('unpublishError');
      } finally {
        busy = false;
        updatePublishState();
      }
    } else if (button === newWebsite && !busy && draft.hasPublishedSite) {
      if (draft.changedSincePublished && !confirm(t('newWebsiteConfirm'))) return;
      draft.details = seededDetails(options.plannerDraft);
      draft.speakers = [];
      draft.agenda = seededAgenda(options.plannerDraft);
      draft.contactPublic = false;
      draft.classification = cleanClassification(options.classification);
      draft.site = null;
      draft.siteId = '';
      draft.hasPublishedSite = false;
      draft.changedSincePublished = false;
      updateForm();
      if (saveEdits(false)) status.textContent = t('newWebsiteReady');
      form.elements.namedItem('title').focus();
    } else if (button.matches('[data-website-list]')) {
      const listStatus = get('[data-website-list-status]');
      const list = get('[data-website-list-results]');
      listStatus.textContent = t('loadingPages');
      button.disabled = true;
      try {
        const result = await options.listPublished();
        pages = (Array.isArray(result) ? result : result.sites).filter(page => publicSite(page) && page.published !== false && page.record?.eventType === draft.eventType);
        list.innerHTML = pages.map((page, index) => `<li><a class="text-link" href="${escape(publicSite(page).url)}" target="_blank" rel="noopener noreferrer" dir="auto">${escape(normalizeEventWebsite(page.record).title)}</a>
          <button class="text-button" type="button" data-website-load="${index}">${t('openEditor')}</button></li>`).join('');
        listStatus.textContent = pages.length ? '' : t('noPages');
      } catch {
        listStatus.textContent = t('loadError');
      } finally {
        button.disabled = false;
      }
    } else if (button.hasAttribute('data-website-load') && !busy) {
      const page = pages[Number(button.dataset.websiteLoad)];
      if (!page || !confirm(t('restoreConfirm'))) return;
      const record = normalizeEventWebsite(page.record);
      draft.details = fieldValues(limits, record);
      draft.speakers = record.speakers;
      draft.agenda = record.agenda;
      draft.contactPublic = Boolean(record.contactEmail);
      draft.classification = record.classification;
      draft.site = publicSite(page);
      draft.siteId = draft.site.id;
      draft.hasPublishedSite = true;
      draft.changedSincePublished = false;
      updateForm();
      saveEdits(false);
      status.textContent = t('loaded');
      form.elements.namedItem('title').focus();
    }
  });

  updatePublishState();
  updatePreview();
}
