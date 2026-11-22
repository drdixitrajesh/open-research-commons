import { locales, messages } from './i18n.js';
import { buildCatalogIndex } from './catalog-search.js';
import { groupedSubjects, subjectFields } from './catalog-subjects.js';
import { callDeadline, countEvents, eventFacets, eventPeriods, indexEvents,
  languageKeys, languageSelection, matchesLanguage, notSpecified, recordLanguageTags } from './event-filters.js';
import { examples } from './examples.js';
import { submissionPage, dashboardPage, bindWorkflow } from './workflow.js';

const el = (id) => document.getElementById(id);
const icons = {
  search:'<circle cx="10.8" cy="10.8" r="5.7"/><path d="m15 15 4 4"/>',
  globe:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16m-8-8c2 2.2 3.2 4.9 3.2 8s-1.2 5.8-3.2 8c-2-2.2-3.2-4.9-3.2-8S10 6.2 12 4Z"/>',
  user:'<circle cx="12" cy="8.5" r="3.1"/><path d="M5.5 20v-1.1a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5V20"/>',
  calendar:'<rect x="4.5" y="6" width="15" height="14" rx="1.7"/><path d="M8.5 4v4m7-4v4m-11 2h15"/>',
  file:'<path d="M7 3.5h7l4 4V20H7zM14 3.5v4.4h4M10 12h5m-5 3h5"/>',
  cap:'<path d="m2.5 9.5 9.5-5 9.5 5-9.5 5-9.5-5Zm4.1 2.3v4.3c3.2 2.4 7.6 2.4 10.8 0v-4.3m4.1-2.3v6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  rss:'<path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14"/><circle cx="5.5" cy="18.5" r="1.1"/>'
};
export function icon(name, size = 19) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.file}</svg>`;
}

const keyLanguage = 'orc-language';
const keyExamples = 'orc-examples';
function preference(key, value) {
  try {
    if (value !== undefined) localStorage.setItem(key, value);
    else return localStorage.getItem(key);
  } catch {}
  return null;
}

export let lang = 'en';
export const state = {
  subjects: [], index: new Map(), records: [], resolution: new Map(),
  classifications: {toa:[], seo:[]},
  countries: [], countryIndex: new Map(), countryPages: new Map(),
  directory: [], directoryFailed:false,
  session: {user:null,persistent:false,files:false}, failed:false,
  examples: preference(keyExamples) !== 'hide', next:null, nav:0
};
const nav = [['home','home'],['events','events'],['proceedings','proceedings'],['theses','theses'],['subjects','subjects'],['countries','countries']];
export const types = {
  event:['seminar','symposium','conference','workshop','webinar'],
  material:['proceedingsVolume','paper','abstractBook','abstract','presentation','poster','report','recording','supportingMaterial'],
  thesis:['doctoralThesis','mastersThesis','dissertation']
};
export const participationModes = ['online','inPerson','hybrid'];
export const families = { event:'events', material:'proceedings', thesis:'theses' };
export const txt = (key) => messages[lang]?.[key] ?? messages.en?.[key] ?? key;
export const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
export const t = (key) => esc(txt(key));
export const subjectLabel = (s) => s?.translations?.[lang] ?? s?.label ?? '';
export const codedSubjectLabel = (subject) => subject.code+' '+subjectLabel(subject);
const classificationKeys = {toa:'activityType', for:'fieldsOfResearch', seo:'objectives'};
const anzsrcSource = 'https://www.abs.gov.au/statistics/classifications/australian-and-new-zealand-standard-research-classification-anzsrc/2020';
let classificationsRequest;
let definitionsRequest;
let classificationsIndex = {toa:new Map(), seo:new Map()};
export function anzsrcItem(scheme, code) {
  return scheme === 'for' ? state.index.get(code) : classificationsIndex[scheme]?.get(code);
}
const anzsrcLabel = (scheme, item) => scheme === 'toa' ? item.label : codedSubjectLabel(item);
function loadDefinitions() {
  return definitionsRequest ??= catalogData('anzsrc-definitions').catch(() => {
    definitionsRequest = undefined;
    return {};
  });
}
function loadClassifications() {
  return classificationsRequest ??= catalogData('anzsrc-classifications').then(data => {
    classificationsIndex = Object.fromEntries(['toa','seo'].map(scheme =>
      [scheme,new Map(data[scheme].map(item=>[item.code,item]))]));
    state.classifications = data;
  }).catch(() => { classificationsRequest = undefined; });
}
export const languageName = (code) => {
  if (!code) return '';
  if (locales[code]?.name) return locales[code].name;
  try { return new Intl.DisplayNames([lang],{type:'language'}).of(code) || code; }
  catch { return code; }
};
export function countryName(country) {
  if (!country) return '';
  try { return new Intl.DisplayNames([lang],{type:'region'}).of(country.iso) || country.name; }
  catch { return country.name; }
}
export function countryCodes(country) {
  const codes=country?.callingCodes || [];
  const visible=codes.length>8 ? codes.slice(0,1) : codes;
  return visible.map(code=>code.startsWith('1') && code.length===4 ? '+1 '+code.slice(1) : '+'+code).join(', ');
}
export const sortedCountries = () => [...state.countries].sort((a,b)=>countryName(a).localeCompare(countryName(b),lang));
export const countryOptions = () => sortedCountries().map(country => [
  country.iso, country.iso + ' · ' + countryName(country),
]);
function countryFor(record) {
  const country = state.countryIndex.get(record.countryCode?.toUpperCase());
  if (country) return country;
  const name = normalize(record.country);
  return state.countries.find(c=>normalize(c.name)===name);
}
function dialNumber(value) {
  const input=String(value || '').trim().replace(/[\s()-]/g,'');
  if (!/^(?:\+|00)?\d{1,5}$/.test(input)) return '';
  return input.replace(/^(?:\+|00)/,'');
}
function searchDial(query) {
  const number = dialNumber(query);
  if (!number || state.index.has(query) || /^(?:19|20)\d{2}$/.test(query)) return '';
  return /^(?:\+|00)/.test(query) || state.countries.some(country=>country.callingCodes.includes(number)) ? number : '';
}
export const normalize = (value) => String(value ?? '').normalize('NFD').toLowerCase()
  .replace(/(\p{Script=Latin})\p{M}+/gu,'$1').normalize('NFC');
export const validLink = (value) => {
  try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
};
const day = (value) => {
  if (!value) return '';
  const date = new Date(value.length === 10 ? value + 'T00:00Z' : value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat(locales[lang]?.locale || lang,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(date);
};
function eventDate(r) {
  const start = day(r.startDate), end = day(r.endDate);
  return end && start && start !== end ? start + ' – ' + end : start || end;
}
export const recordKind = (r) => r.eventType || r.materialType || r.thesisType || families[r.type] || 'details';
function mergeCatalog(records) {
  const seen = new Set(records.map(eventIdentity));
  return [...records,...state.directory.filter(event=>!seen.has(eventIdentity(event))),...(state.examples?examples:[])];
}
function eventIdentity(event) {
  if (event.sourceUrl) {
    try {
      const source=new URL(event.sourceUrl);
      return source.hostname.replace(/^www\./,'') + source.pathname.replace(/\/+$/,'') + ' ' + (event.startDate || '');
    } catch {}
  }
  return normalize(event.title) + ' ' + (event.startDate || '');
}
export const activeRecords = () => mergeCatalog(state.records);
export function selectedMetadata(r, code = lang) {
  const original = r.metadataLanguage || r.language || 'en';
  if (code !== original && r.metadata?.[code]) {
    const translation=r.metadata[code];
    return {title:translation.title || r.title, description:translation.description || r.description,
      keywords:translation.keywords?.length ? translation.keywords : r.keywords, lang:code,
      titleLang:translation.title ? code : original, descriptionLang:translation.description ? code : original,
      status:translation.status};
  }
  return {title:r.title,description:r.description,keywords:r.keywords,lang:original};
}

export function url(page = 'home', params = {}) {
  const query = new URLSearchParams();
  if (page !== 'home' && page !== 'record') query.set('view', page);
  if (lang !== 'en') query.set('lang', lang);
  for (const [name, value] of Object.entries(params)) if (value !== '' && value != null) query.set(name, value);
  return '/' + (query.size ? '?' + query.toString() : '');
}
export const recordUrl = (id) => url('record',{record:id});
export const link = (page,key,attrs='',params) => `<a ${attrs} href="${esc(url(page,params))}">${t(key)}</a>`;
const current = () => {
  const params = new URLSearchParams(location.search);
  return { page:params.has('record') ? 'record' : params.get('view') || 'home', params };
};
const returnPath = () => window.location.pathname + window.location.search;
const primary = document.querySelector('meta[name="repository-primary"]')?.content;
const protectedViews = new Set(['submit','account','review']);
export const signIn = ({label='signIn',className='button'}={}) => `<a class="${esc(className)}" href="/signin-with-chatgpt?return_to=${encodeURIComponent(returnPath())}" target="_top">${t(label)}</a>`;

export async function api(path, options = {}) {
  const response = await fetch('/api/' + path, {
    ...options, headers:{Accept:'application/json',...options.headers}
  });
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw Object.assign(new Error(data.error || 'serviceUnavailable'),{status:response.status,code:data.code,error:data.error,field:data.field});
  return data;
}

function brand() {
  return `<a class="brand" href="${esc(url())}"><img width="36" height="36" src="/mark.svg" alt=""><span>${t('brand')}</span></a>`;
}
export const options = (entries, selected) => entries.map(([key,label]) => `<option value="${esc(key)}"${key === selected ? ' selected' : ''}>${esc(label)}</option>`).join('');
export const languageOptions = Object.keys(locales).map(code => [code,languageName(code)]);
const typeOptions = () => [['',txt('all')],...Object.entries(families).map(([key,value]) => [key,txt(value)])];
function searchbox(page='search', query='', type='') {
  return `<form class="searchbox" data-search="${page}">
    ${icon('search',23)}<label class="visually-hidden" for="query">${t('search')}</label>
    <input id="query" name="q" type="search" placeholder="${t('searchPlaceholder')}" value="${esc(query)}">
    <label class="visually-hidden" for="search-type">${t('recordType')}</label>
    <select id="search-type" name="type">${options(typeOptions(),type)}</select>
    <button type="submit" class="button">${t('search')}</button>
  </form>`;
}

function chrome(page) {
  document.documentElement.lang = lang;
  document.documentElement.dir = locales[lang]?.dir || 'ltr';
  document.querySelector('.skip').textContent = txt('skip');
  const navigation = nav.map(([p, key]) => link(p, key, p === page ? 'aria-current="page"' : '')).join('');
  const header = el('header');
  header.innerHTML = `<div class="wrap masthead">${brand()}
    <nav class="primary-navigation" aria-label="${t('browseRecords')}">${navigation}</nav>
    <details class="mobile-navigation">
      <summary>${icon('menu', 20)} ${t('mobileMenu')}</summary>
      <nav aria-label="${t('browseRecords')}">${navigation}</nav>
    </details>
    <div class="header-actions">
      <label class="language">${icon('globe')}<span class="visually-hidden">${t('interfaceLanguage')}</span><select id="interface-language">${options(languageOptions,lang)}</select></label>
      <a class="icon-link" href="${esc(url('account'))}" aria-label="${t('account')}" title="${t('account')}">${icon('user')}</a>
      ${link('submit','submit','class="button"')}
    </div>
  </div>`;
  const mobileNavigation = header.querySelector('.mobile-navigation');
  mobileNavigation.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !mobileNavigation.open) return;
    event.preventDefault();
    mobileNavigation.open = false;
    mobileNavigation.querySelector('summary').focus();
  });
  mobileNavigation.addEventListener('focusout', event => {
    if (event.relatedTarget && !mobileNavigation.contains(event.relatedTarget)) mobileNavigation.open = false;
  });
  el('footer').innerHTML = `<div class="wrap footer-inner">${brand()}<p>${t('free')}</p><div class="footer-links">
    ${link('about','about')} ${link('subjects','subjects')} ${link('institutions','institutions')} ${link('account','account')}
    ${state.session.user?.isModerator ? link('review','review') : ''}
  </div></div>`;
}

export const breadcrumb = (label) => `<nav class="breadcrumb" aria-label="${t('details')}">${link('home','home')}<span aria-hidden="true">/</span><span>${esc(label)}</span></nav>`;
export function layout(title, body, description = '', heading = title) {
  return `<section class="wrap page">${breadcrumb(title)}<h1${heading !== title ? ' class="catalog-heading"' : ''}>${esc(heading)}</h1>${description ? `<p class="page-description">${esc(description)}</p>` : ''}${body}</section>`;
}
const empty = (key = 'noResults') => `<p class="empty">${t(key)}</p>`;
function exampleNotice() {
  return `<div class="notice"><span>${t(state.examples ? 'demoNote' : 'examplesEmpty')}</span><button type="button" class="text-button" data-examples>${t(state.examples ? 'hideExamples' : 'showExamples')}</button></div>`;
}
function withExamples(records) {
  return records.some(r=>r.example) || (!records.length && !state.records.length) ? exampleNotice() : '';
}
const sortDates = (a,b) => (a.startDate || '9999').localeCompare(b.startDate || '9999');
function tag(key) { return `<span class="kind">${t(key)}</span>`; }
function exampleTag(r) { return r.example ? `<span class="tag">${t('example')}</span>` : ''; }
function sourceTag(r) { return r.directory ? `<span class="tag source-tag">${t('organizerListing')}</span>` : exampleTag(r); }
function eventSourceLink(record) {
  if (record.type !== 'event' || record.example) return '';
  const source = validLink(record.sourceUrl || record.externalUrl);
  if (!source) return '';
  const label = record.directory ? 'organizerPage' : 'eventSourcePage';
  const title = selectedMetadata(record).title || record.title;
  return `<a class="text-link event-source-link" href="${esc(source)}" rel="noopener noreferrer" aria-label="${t(label)} · ${esc(title)}">${t(label)}</a>`;
}
function aboutTitle(r) {
  const meta = selectedMetadata(r);
  return `<a href="${esc(recordUrl(r.id))}" lang="${esc(meta.titleLang || meta.lang)}" dir="auto">${esc(meta.title || txt('details'))}</a>`;
}
function eventCard(r) {
  const location = [r.city,countryName(countryFor(r)) || r.country].filter(Boolean).map(esc).join(', ');
  return `<article class="event-card">
    <div class="card-top">${tag(recordKind(r))}${sourceTag(r)}</div>
    <p class="card-date">${icon('calendar',16)} <bdi>${esc(eventDate(r))}</bdi></p>
    <h3>${aboutTitle(r)}</h3>
    <p class="card-meta">${[location,r.mode ? t(r.mode) : ''].filter(Boolean).join(' · ')}</p>
    ${r.institution ? `<p class="card-meta" dir="auto">${esc(r.institution)}</p>` : ''}
    ${eventSourceLink(r)}
  </article>`;
}
function itemRow(r, deadline=false) {
  const info = deadline ? day(callDeadline(r)) : r.type === 'event' ? eventDate(r) : [r.authors,r.institution,r.year || day(r.releaseDate)].filter(Boolean).join(' · ');
  return `<article class="item-row">
    <span class="row-icon">${icon(r.type === 'thesis' ? 'cap' : r.type === 'event' ? 'calendar' : 'file')}</span>
    <div>${tag(recordKind(r))} ${sourceTag(r)}<h3>${aboutTitle(r)}</h3><p dir="auto">${esc(info)}${r.language ? ' · ' + esc(languageName(r.language)) : ''}</p>${eventSourceLink(r)}</div>
  </article>`;
}
function subjectMini(codes) {
  return `<ul class="subject-list">${codes.map(code=>state.index.get(code)).filter(Boolean).map(s=>`<li><a href="${esc(url('subjects',{subject:s.code}))}"><bdi class="code">${s.code}</bdi> ${esc(subjectLabel(s))}</a></li>`).join('')}</ul>`;
}
function heading(title,page,params) {
  return `<div class="section-heading"><h2>${t(title)}</h2>${link(page,'viewAll','class="text-link"',params)}</div>`;
}
function homeGuide() {
  const guideLink = (page,label,params) => link(page,label,'class="text-link"',params);
  return `<section class="section home-guide" aria-labelledby="home-guide-heading">
    <h2 id="home-guide-heading">${t('homeGuideTitle')}</h2>
    <p class="page-description">${t('homeGuideIntro')}</p>
    <div class="home-guide-grid">
      <section>
        <h3>${t('homeGuideEventsTitle')}</h3>
        <p>${t('homeGuideEventsText')}</p>
        <div class="home-guide-links">${guideLink('events','upcoming')} ${guideLink('events','deadlines',{period:'deadlines'})}</div>
      </section>
      <section>
        <h3>${t('homeGuideResearchTitle')}</h3>
        <p>${t('homeGuideResearchText')}</p>
        <div class="home-guide-links">${guideLink('proceedings','proceedings')} ${guideLink('theses','theses')} ${guideLink('subjects','subjects')}</div>
      </section>
      <section>
        <h3>${t('homeGuideSubmitTitle')}</h3>
        <p>${t('homeGuideSubmitText')}</p>
        <div class="home-guide-links">${guideLink('submit','startSubmission')}</div>
      </section>
    </div>
  </section>`;
}
function homePage() {
  const records = activeRecords();
  const events = indexEvents(records.filter(r=>r.type==='event'), r=>countryFor(r)?.iso);
  const dated = events.filter(row=>row.period==='upcoming').map(row=>row.record).sort(sortDates);
  const countries = new Set();
  const featured = dated.filter(r=>{
    const country=r.countryCode || r.country || r.id;
    if (countries.has(country)) return false;
    countries.add(country);
    return true;
  }).slice(0,3);
  const upcoming = [...featured,...dated.filter(r=>!featured.includes(r)).slice(0,3-featured.length)].sort(sortDates);
  const research = records.filter(r=>r.type !== 'event').slice(0,3);
  const deadlines = events.filter(row=>row.openCall).map(row=>row.record)
    .sort((a,b)=>callDeadline(a).localeCompare(callDeadline(b))).slice(0,3);
  return `<section class="hero"><div class="wrap hero-grid">
    <div class="hero-copy"><h1>${t('heroTitle')}</h1><p>${t('heroText')}</p><div class="hero-actions">
    ${link('submit','postEvent','class="button"',{type:'event'})} ${link('submit','deposit','class="button secondary"',{research:1})}</div></div>
    <div class="hero-image"><img src="/images/field-notes.jpg" alt="" width="1200" height="800" fetchpriority="high"></div>
  </div></section>
  <div class="wrap search-dock">${searchbox()}</div>
  <div class="wrap">
    <section class="section">
      ${heading('upcoming','events')}
      ${upcoming.some(event=>event.directory) ? `<p class="page-description">${t('organizerDirectory')}</p>` : ''}
      ${withExamples(upcoming)}
      ${state.failed ? empty('serviceUnavailable') : ''}
      ${upcoming.length ? `<div class="event-grid">${upcoming.map(eventCard).join('')}</div>` : empty()}
    </section>
    ${homeGuide()}
    <section class="section lower-home"><section>${heading('latestResearch','search',{type:'research'})}${research.length ? research.map(r=>itemRow(r)).join('') : empty()}</section>
    <section>${heading('featuredSubjects','subjects')}${subjectMini(['31','41','42','46','39'])}</section></section>
    ${deadlines.length ? `<section class="section">${heading('deadlines','events',{period:'deadlines'})}${deadlines.map(r=>itemRow(r,true)).join('')}</section>` : ''}
  </div>`;
}
export function subjectMatches(s, query) {
  return [s.code,s.label,...Object.values(s.translations || {})].some(v=>normalize(v).includes(query));
}
const catalogTypes = {events:'event',proceedings:'material',theses:'thesis'};
const kindsFor = (type) => types[type] || (type==='research' ? [...types.material,...types.thesis] : Object.values(types).flat());
export function catalogKindLabel(type) {
  if (type==='material') return txt('proceedings');
  const title = {event:'eventKind',thesis:'theses'}[type];
  if (!title) return txt(type==='research'?'researchType':'contentType');
  const names = new Intl.ListFormat(lang,{style:'short',type:'unit'}).format(types[type].map(txt));
  return lang==='zh' ? txt(title)+'（'+names+'）' : txt(title)+' ('+names+')';
}
const subjectIncludes = (record,code) => (record.subjectCodes || []).some(subject=>subject.startsWith(code));
const catalogFilterKeys = ['q','type','subject','kind','country','dial','el','dl','ml','mode','from','to','inst','toa','seo'];
function classificationSubjectNames(r) {
  const activity = anzsrcItem('toa',r.activityType);
  const objectives = (r.objectives || []).flatMap(code => {
    const terms = [];
    for (let length = 2; length <= code.length; length += 2) {
      const item = anzsrcItem('seo',code.slice(0,length));
      if (item) terms.push(item.code,item.label);
    }
    return terms;
  });
  return activity ? [activity.label,...objectives] : objectives;
}
let indexedCatalog;
function describeRecord(r) {
  const country = countryFor(r);
  const subjects = (r.subjectCodes || []).flatMap((code)=>{
    const names = [];
    for (let size = 2; size <= code.length; size += 2) {
      const item = state.index.get(code.slice(0,size));
      if (item) names.push(item.code, item.label, ...Object.values(item.translations || {}));
    }
    return names;
  });
  const translations = Object.values(r.metadata || {});
  return {
    titles: [r.title,...translations.map(m=>m?.title)],
    subjects: [...subjects,...classificationSubjectNames(r)],
    keywords: [r.keywords,...translations.map(m=>m?.keywords)].flat(),
    contributors: [r.authors,r.institution].flat(),
    details: [r.description,r.country,r.city,r.startDate,r.endDate,r.year,r.releaseDate,recordKind(r),txt(recordKind(r)),
      r.mode,r.mode && txt(r.mode),r.language && languageName(r.language),...(r.languages || []).map(languageName),
      r.metadataLanguage && languageName(r.metadataLanguage),
      country?.iso,countryName(country),country?.name,countryCodes(country),...translations.map(m=>m?.description)],
    identifiers: [r.doi]
  };
}
function catalogIndex(records) {
  const cached = indexedCatalog;
  if (cached?.lang===lang && cached.records.length===records.length && records.every((r,i)=>r===cached.records[i])) {
    return cached.index;
  }
  const index = buildCatalogIndex(records,describeRecord);
  indexedCatalog = {lang,records,index};
  return index;
}
function catalogScope(params) {
  const country = params.get('country') || '';
  if (state.countryIndex.has(country)) return country;
  const query = (params.get('q') || '').trim();
  const dial = dialNumber(params.get('dial')) || searchDial(query);
  return dial ? state.countries.filter(c=>c.callingCodes.includes(dial)).map(c=>c.iso).sort().join(',') : '';
}
const subjectOption = subject => [subject.code,codedSubjectLabel(subject)];
export function subSubjectOptions(parent, selected='', placeholder=txt('allSubSubjects')) {
  return options([['',placeholder],...subjectFields(state.subjects,parent).map(subjectOption)],selected);
}
export function subjectGroupOptions(selected='') {
  return groupedSubjects(state.subjects).map(({division,groups})=>{
    const entries = [[division.code,division.code+' '+txt('allSubjects')],...groups.map(subjectOption)];
    return `<optgroup label="${esc(codedSubjectLabel(division))}" data-division="${division.code}">${options(entries,selected)}</optgroup>`;
  }).join('');
}
function researchStreamOptions(division, selected = '') {
  const groups = groupedSubjects(state.subjects).find(entry=>entry.division.code===division)?.groups;
  if (!groups?.length) return options([['',txt('selectSubjectFirst')]],'');
  return options([['',txt('allSubSubjects')]],selected) + groups.map(group => {
    const groupLabel = codedSubjectLabel(group);
    const entries = [[group.code,`${groupLabel} · ${txt('allResearchFields')}`],
      ...subjectFields(state.subjects,group.code).map(subjectOption)];
    return `<optgroup label="${esc(groupLabel)}">${options(entries,selected)}</optgroup>`;
  }).join('');
}
function subjectMenus(selected, eventFilter, filterCode) {
  const division = selected?.code.slice(0,2) || '';
  const stream = selected?.code.length > 2 ? selected.code : '';
  const entries = [['',txt('allSubjects')],...state.subjects.filter(item=>item.parent===null).map(subjectOption)];
  if (eventFilter) entries.push([notSpecified,txt('notSpecified')]);
  const selectedDivision = division || (eventFilter && filterCode===notSpecified ? notSpecified : '');
  return `<label class="field"><span>${t('topic')} <small dir="ltr">(ANZSRC 2020 FoR)</small></span><select name="subject">${options(entries,selectedDivision)}</select></label>
    <label class="field">${t('subSubject')}<select name="subsubject"${division ? '' : ' disabled'}>${researchStreamOptions(division,stream)}</select></label>`;
}
function seoOptions(division, selected) {
  const seo = state.classifications.seo;
  const groups = seo.filter(item=>item.parent===division);
  return options([['',txt('all')]],selected) + groups.map(group => {
    const children = seo.filter(item=>item.parent===group.code);
    return `<optgroup label="${esc(anzsrcLabel('seo',group))}">${options([group,...children].map(subjectOption),selected)}</optgroup>`;
  }).join('');
}
function classificationFilters(params) {
  const {toa,seo} = state.classifications;
  if (!toa.length || !seo.length) return '';
  const selected = anzsrcItem('seo',params.get('seo'))?.code || '';
  const division = selected.slice(0,2);
  const activityType = params.get('toa') || '';
  return `<details class="event-disclosure full"${division || activityType ? ' open' : ''}>
    <summary>${t('researchFilters')}</summary>
    <div class="event-disclosure-content form-grid">
      <label class="field full">${t('activityType')}<select name="toa">${options([['',txt('all')],...toa.map(item=>[item.code,item.label])],activityType)}</select></label>
      <label class="field">${t('objectiveDivision')}<select name="seoDivision">${options([['',txt('all')],...seo.filter(item=>!item.parent).map(subjectOption)],division)}</select></label>
      <label class="field">${t('objectives')}<select name="seo"${division ? '' : ' disabled'}>${seoOptions(division,selected)}</select></label>
    </div></details>`;
}
function bindCatalogFilters(form, eventIndex, period) {
  const subject = form.elements.namedItem('subject');
  const subSubject = form.elements.namedItem('subsubject');
  const seo = form.elements.namedItem('seo');
  const format = new Intl.NumberFormat(lang);
  function updateCounts() {
    const filters = new URLSearchParams(new FormData(form));
    filters.set('subject', filters.get('subsubject') || filters.get('subject') || '');
    filters.set('seo', filters.get('seo') || filters.get('seoDivision') || '');
    const {counts, dates} = countEvents(eventIndex, filters, period);
    const setCount = (element, count) => {
      const label = element.dataset.label ??= element.textContent;
      element.textContent = label + ' (' + format.format(count) + ')';
    };
    for (const name of eventFacets) {
      const select = form.elements.namedItem(name);
      if (!select) continue;
      for (const option of select.options) {
        const value = name==='seo' && !option.value ? filters.get('seoDivision') || '' : option.value;
        setCount(option, counts[name].get(value) || 0);
      }
    }
    for (const option of form.elements.namedItem('seoDivision')?.options || []) {
      setCount(option, counts.seo.get(option.value) || 0);
    }
    if (!subSubject.disabled) {
      for (const option of subSubject.options) {
        setCount(option, counts.subject.get(option.value || subject.value) || 0);
      }
    }
    for (const label of form.querySelectorAll('[data-date-count]')) {
      label.textContent = '(' + format.format(dates[label.dataset.dateCount]) + ')';
    }
  }
  form.addEventListener('change', ({target})=>{
    if (target===subject) {
      subSubject.innerHTML = researchStreamOptions(subject.value);
      subSubject.disabled = subSubject.options.length === 1;
    }
    if (target.name==='seoDivision' && seo) {
      seo.innerHTML = seoOptions(target.value,'');
      seo.disabled = !target.value;
    }
    if (eventIndex) updateCounts();
  });
  if (eventIndex) updateCounts();
}
function organizerSources() {
  const sources = [
    ['Stanford University', [['sourceCalendar', 'https://events.stanford.edu/']]],
    ['Massachusetts Institute of Technology (MIT)', [['sourceCalendar', 'https://calendar.mit.edu/']]],
    ['CERN Indico', [
      ['sourceConferencesCalendar', 'https://indico.cern.ch/category/6741/'],
      ['sourceSeminarsCalendar', 'https://indico.cern.ch/category/6745/'],
    ], 'sourceReferenceOnly'],
    ['University of Central Florida', [
      ['sourceSeminarsRss', 'https://events.ucf.edu/category/23/speakerlectureseminar/feed.rss'],
      ['sourceWorkshopsRss', 'https://events.ucf.edu/category/29/workshopconference/feed.rss'],
    ]],
    ['Max Planck Institute for Solar System Research', [['sourceSeminarsRss', 'https://www.mps.mpg.de/news/seminars.rss']]],
  ];
  return `<details class="event-sources" id="event-sources">
    <summary>${t('eventSources')}</summary>
    <div><p>${t('eventSourcesNote')}</p><ul>${sources.map(([name, urls, note]) =>
      `<li><strong dir="auto">${esc(name)}</strong><span>${urls.map(([key, href]) =>
        `<a class="text-link" href="${esc(href)}" rel="noopener noreferrer" aria-label="${t(key)} · ${esc(name)}">${t(key)}</a>`).join('')}</span>${note ? `<small class="muted">${t(note)}</small>` : ''}</li>`
    ).join('')}</ul></div>
  </details>`;
}

function recordList(page, params, scope, loadFailed) {
  const scoped = state.countryPages.get(scope);
  const all = scoped ? mergeCatalog(scoped.records) : activeRecords();
  const fixed = catalogTypes[page];
  const type = fixed || params.get('type') || '';
  const eventFilter = type === 'event';
  const requestedPeriod = params.get('period');
  const period = page === 'events' ? (eventPeriods.includes(requestedPeriod) ? requestedPeriod : 'upcoming') : null;
  const query = params.get('q')?.trim() || '';
  const filters = params;
  const subject = filters.get('subject');
  const exactSubject = state.index.has(query) ? query : '';
  const dial = searchDial(query);
  const dialFilter = dialNumber(filters.get('dial'));
  const scores = query && !dial && !exactSubject ? catalogIndex(all).search(query) : null;
  const eventLanguage = filters.get('el');
  const documentLanguage = filters.get('dl');
  const metadataLanguage = filters.get('ml');
  const from = filters.get('from'), to = filters.get('to');
  const candidates = all.filter(r => {
    if (type && (type==='research' ? r.type==='event' : type!==r.type)) return false;
    if (exactSubject && !subjectIncludes(r,exactSubject)) return false;
    const country = countryFor(r);
    if (dial && !country?.callingCodes.includes(dial)) return false;
    if (dialFilter && !country?.callingCodes.includes(dialFilter)) return false;
    if (filters.get('inst') && filters.get('inst') !== r.institution) return false;
    return !scores || scores.has(r);
  });
  const eventIndex = eventFilter ? indexEvents(candidates, record => countryFor(record)?.iso) : null;
  const eventCounts = eventIndex ? countEvents(eventIndex, filters, period) : null;
  const matches = eventCounts?.matches ?? candidates.filter(r => {
    if (subject && !subjectIncludes(r,subject)) return false;
    if (filters.get('toa') && filters.get('toa') !== r.activityType) return false;
    if (filters.get('seo') && !(r.objectives || []).some(code=>code.startsWith(filters.get('seo')))) return false;
    if (eventLanguage || documentLanguage) {
      if (r.type==='event' ? !(eventLanguage && matchesLanguage(r,'el',eventLanguage))
        : !(documentLanguage && matchesLanguage(r,'dl',documentLanguage))) return false;
    }
    if (!matchesLanguage(r,'ml',metadataLanguage)) return false;
    const country = countryFor(r);
    if (filters.get('country') && (country?.iso || r.country) !== filters.get('country')) return false;
    for (const [param,field] of Object.entries({mode:'mode',kind:null})) {
      if (filters.get(param) && filters.get(param) !== (field ? r[field] : recordKind(r))) return false;
    }
    if (from && (!r.startDate || (r.endDate || r.startDate).slice(0,10)<from)) return false;
    if (to && (!r.startDate || r.startDate.slice(0,10)>to)) return false;
    return true;
  });
  if (page==='events') matches.sort(period==='deadlines' ? (a,b)=>callDeadline(a).localeCompare(callDeadline(b))
    : period==='past' ? (a,b)=>sortDates(b,a) : sortDates);
  if (scores) matches.sort((a,b)=>scores.get(b)-scores.get(a));
  if (exactSubject) matches.sort((a,b)=>Number(b.subjectCodes.includes(exactSubject))-Number(a.subjectCodes.includes(exactSubject)));

  const menu = (label, name, entries, selected = params.get(name) || '') => `<label class="field">${esc(label)}<select name="${name}">${options([['',txt('all')],...entries],selected)}</select></label>`;
  const withUnspecified = entries => eventFilter ? [...entries,[notSpecified,txt('notSpecified')]] : entries;
  const kindLabel = catalogKindLabel(type);
  const kinds = kindsFor(type).map(k=>[k,txt(k)]);
  function languageMenu(label, facet) {
    const selected = languageSelection(filters.get(facet));
    const values = candidates.flatMap(record => recordLanguageTags(record,facet));
    const available = languageKeys([...values, selected]);
    const entries = available.map(code=>[code,languageName(code)]).sort((a,b)=>a[1].localeCompare(b[1],lang));
    return menu(txt(label),facet,withUnspecified(entries),selected);
  }
  const number = new Intl.NumberFormat(lang);
  const tabs = page==='events' ? `<nav class="tabs event-periods" aria-label="${t('events')}">${eventPeriods.map(p =>
    `<a class="tab"${p===period?' aria-current="page"':''} href="${esc(url(page,{...Object.fromEntries(params),period:p,view:''}))}">${t(p)} (${number.format(eventCounts.periods[p])})</a>`).join('')}
    <a class="text-link events-rss" href="/events.rss" type="application/rss+xml">${icon('rss',16)} ${t('eventsRss')}</a></nav>` : '';
  const selectedSubject = state.index.get(params.get('subject'));
  const dateField = (name, label) => `<label class="field"><span>${t(label)} <small data-date-count="${name}"></small></span><input name="${name}" type="date" value="${esc(params.get(name) || '')}"></label>`;
  const controls = `<form data-filter="${page}"><div class="filter-grid">
    ${menu(kindLabel,'kind',kinds)}${subjectMenus(selectedSubject,eventFilter,subject)}${menu(txt('country'),'country',withUnspecified(countryOptions()))}
    ${type==='event' || !type ? languageMenu('eventLanguage','el') : ''}
    ${type!=='event' ? languageMenu('documentLanguage','dl') : ''}
    ${languageMenu('metadataLanguage','ml')}
    ${type==='event' || !type ? menu(txt('format'),'mode',withUnspecified(participationModes.map(v=>[v,txt(v)]))) : ''}
    ${eventFilter ? dateField('from','startDate') + dateField('to','endDate') : ''}
    ${classificationFilters(params)}
    </div><div class="form-actions"><button class="button secondary">${t('filter')}</button>${link(page,'clear','class="text-link"',{type:page==='search'?type:'',period:requestedPeriod && period,q:query})}
    ${selectedSubject ? `<a class="tag" href="${esc(url('subjects',{subject:selectedSubject.code}))}">${esc(codedSubjectLabel(selectedSubject))}</a>` : ''}
  </div><output class="form-feedback" role="alert"></output></form>`;
  const title = fixed ? txt(page) : txt('browseRecords');
  const heading = page === 'events' ? catalogKindLabel('event') : title;
  const html = layout(title, searchbox(page,query,type) + tabs + (page === 'events' ? organizerSources() : '') + controls + `<div class="section">
    <p id="catalog-results" class="muted" tabindex="-1">${number.format(matches.length)} ${t('results')}</p>
    ${matches.some(event=>event.directory) ? `<p class="page-description">${t('organizerDirectory')}</p>` : ''}
    ${withExamples(matches)}${loadFailed ? empty('partialResults') : ''}
    ${matches.length ? matches.map(r=>itemRow(r,period==='deadlines')).join('') : loadFailed ? '' : empty()}
    ${(scoped ? scoped.next : state.next) ? `<button class="button secondary" type="button" data-next data-scope="${esc(scope)}">${t('next')}</button>` : ''}
  </div>`, '', heading);
  return {html, bind:()=>bindCatalogFilters(document.querySelector('form[data-filter]'),eventIndex,period)};
}
const subjectScheme = params => ['toa','seo'].includes(params.get('scheme')) ? params.get('scheme') : 'for';
const schemeItems = scheme => scheme === 'for' ? state.subjects : state.classifications[scheme];
function schemeParams(scheme, code) {
  return scheme === 'for' ? {subject:code} : {scheme,code};
}
const officialWorkbook = scheme => anzsrcSource + '/anzsrc2020_' + scheme + '.xlsx';
const frascatiManual = 'https://doi.org/10.1787/9789264239012-en';
function classificationSources(scheme) {
  const schemes = scheme ? [scheme] : Object.keys(classificationKeys);
  return `<details class="event-sources classification-sources">
    <summary>${t('classificationSources')}</summary>
    <div><p>${t('classificationCredit')}</p><ul>
      <li><a class="text-link" href="${anzsrcSource}" rel="noopener noreferrer">Australian Bureau of Statistics · ANZSRC 2020</a></li>
      <li><a class="text-link" href="https://www.arc.gov.au/funding-research/applying-grant/classification-codes-rfcd-seo-and-anzsic-codes" rel="noopener noreferrer">Australian Research Council</a></li>
      ${schemes.map(key=>`<li><a class="text-link" href="${officialWorkbook(key)}" rel="noopener noreferrer">${t(classificationKeys[key])} · ${t('classificationWorkbook')}</a></li>`).join('')}
      ${schemes.includes('toa') ? `<li><a class="text-link" href="${frascatiManual}" rel="noopener noreferrer">OECD · Frascati Manual 2015</a></li>` : ''}
      <li><a class="text-link" href="/data/subjects-license.txt">CC BY 4.0 · ${t('classificationSources')}</a></li>
    </ul></div>
  </details>`;
}
function classificationDefinition(data) {
  if (!data) return '';
  const {summary,definition,exclusions} = data;
  return `<dl class="metadata classification-definition">
    ${summary ? `<div><dt>${t('repositorySummary')}</dt><dd lang="en" dir="ltr">${esc(summary)}</dd>
      <dd><a class="text-link" href="${officialWorkbook('toa')}" rel="noopener noreferrer">${t('classificationWorkbook')}</a></dd></div>` : ''}
    ${definition ? `<div><dt>${t('classificationDefinition')}</dt><dd lang="en" dir="ltr">${esc(definition)}</dd></div>` : ''}
    ${exclusions ? `<div><dt>${t('classificationExclusions')}</dt><dd lang="en" dir="ltr">${esc(exclusions)}</dd></div>` : ''}
  </dl>`;
}
async function subjectsPage(params) {
  const scheme = subjectScheme(params);
  const item = anzsrcItem(scheme,params.get(scheme==='for'?'subject':'code'));
  const parent = anzsrcItem(scheme,item?.parent);
  const title = item ? subjectLabel(item) : txt('subjects');
  const children = schemeItems(scheme).filter(entry=>entry.parent === (item?.code || null));
  const definitions = await loadDefinitions();
  const notes = definitions.notes?.[scheme];
  const filters = item ? {[scheme==='for'?'subject':scheme]:item.code} : {};
  const browseTabs = `<nav class="tabs" aria-label="${t('anzsrc2020')}">${Object.entries(classificationKeys).map(([key,label]) =>
    link('subjects',label,`class="tab"${key===scheme?' aria-current="page"':''}`,schemeParams(key))).join('')}</nav>`;
  const itemDetails = item ? `<p>${scheme==='toa' ? '' : `<bdi class="code">${item.code}</bdi> `}${t(classificationKeys[scheme])}${item.translations?.[lang] ? `<br>${t('officialLabel')} · <span lang="en">${esc(item.label)}</span> · ${t('platformTranslation')}` : ''}</p>
    ${classificationDefinition(definitions[scheme]?.[item.code])}
    <nav class="tabs" aria-label="${t('browseRecords')}">${[['events','upcoming',{period:'upcoming'}],['events','past',{period:'past'}],['proceedings','proceedings',{}],['theses','theses',{}]].map(([p,k,v])=>link(p,k,'class="tab"',{...filters,...v})).join('')}</nav>
    ${parent ? `<p><a class="text-link" href="${esc(url('subjects',schemeParams(scheme,parent.code)))}">${esc(anzsrcLabel(scheme,parent))}</a></p>` : ''}` : '';
  const search = scheme === 'toa' ? 'activitySearch' : scheme === 'seo' ? 'objectiveSearch' : 'subjectSearch';
  return layout(title, `${browseTabs}${itemDetails}
    <label class="field subject-filter">${t(search)}<input id="subject-query" type="search" autocomplete="off"></label>
    <div id="subject-results">${subjectTree(children,scheme,item)}</div>
    ${notes?.length ? `<details class="event-sources classification-notes"><summary>${t('classificationNotes')}</summary><div lang="en" dir="ltr">${notes.map(note=>`<p>${esc(note)}</p>`).join('')}</div></details>` : ''}
    ${classificationSources(scheme)}`, item ? '' : txt('classificationIntro'));
}
function subjectTree(records, scheme, item) {
  if (!records.length) return item ? '' : empty();
  return `<ul class="tree">${records.map(entry=>`<li><a href="${esc(url('subjects',schemeParams(scheme,entry.code)))}">${scheme==='toa'?'':`<bdi class="code">${entry.code}</bdi> `}${esc(subjectLabel(entry))}</a></li>`).join('')}</ul>`;
}
function institutionsPage(params) {
  const query = params.get('country') || '';
  const rows = new Map();
  for (const r of activeRecords()) if (r.institution && (!query || query===r.country)) rows.set(r.institution,r.country);
  const countries = [...new Set(activeRecords().map(r=>r.country).filter(Boolean))].sort().map(v=>[v,v]);
  return layout(txt('institutions'),`<form data-institution>
      <label class="field subject-filter">${t('country')}<select name="country">${options([['',txt('all')],...countries],query)}</select></label>
      <button class="button secondary">${t('filter')}</button></form>
      <div class="section">${withExamples(activeRecords())}${rows.size ? `<ul class="subject-list">${[...rows].sort().map(([name,country])=>`<li><a href="${esc(url('search',{inst:name}))}"><strong dir="auto">${esc(name)}</strong> <span class="muted" dir="auto">${esc(country || '')}</span></a></li>`).join('')}</ul>` : empty('noInstitutions')}</div>`);
}
function countryTree(rows) {
  return rows.length ? `<ul class="tree country-tree">${rows.map(country=>`<li>
    <a href="${esc(url('search',{country:country.iso}))}"><bdi class="code">${esc(country.iso)}</bdi> <span>${esc(countryName(country))}</span> <bdi class="muted">${esc(countryCodes(country))}</bdi></a>
  </li>`).join('')}</ul>` : empty();
}
function countriesPage() {
  return layout(txt('countries'),`<label class="field subject-filter">${t('dialingSearch')}<input id="country-query" type="search" autocomplete="off"></label>
    <div id="country-results">${countryTree(sortedCountries())}</div><p><a class="text-link" href="/data/countries-license.txt">${t('dialingCode')}</a></p>`,txt('dialingHelp'));
}

function relatedRows(r) {
  return activeRecords().filter(other=>other.id !== r.id && (other.relatedId === r.id || other.id === r.relatedId));
}
const doiHref = (doi) => doi ? 'https://doi.org/' + doi.split('/').map(encodeURIComponent).join('/') : '';
function citations(r,meta) {
  return [r.authors || r.institution,r.year || (r.releaseDate || r.startDate)?.slice(0,4),meta.title,r.doi ? doiHref(r.doi) : null].filter(Boolean).join('. ');
}
function classificationLinks(scheme, codes, preview) {
  return codes.map(code=>anzsrcItem(scheme,code)).filter(Boolean).map(item=>{
    const label = esc(anzsrcLabel(scheme,item));
    return preview ? label : `<a href="${esc(url('subjects',schemeParams(scheme,item.code)))}">${label}</a>`;
  }).join(' · ');
}
function detailsView(r, params, preview = false) {
  const selection = params.get('metadata') || lang;
  const originalLanguage = r.metadataLanguage || r.language;
  const meta = selectedMetadata(r,selection);
  const metadataLanguages = [...new Set([originalLanguage,...Object.keys(r.metadata || {})].filter(Boolean))];
  const country = countryFor(r);
  const facts = [
    [r.type==='event'?'eventLanguage':'documentLanguage', [...new Set([r.language,...(r.languages || [])])].filter(Boolean).map(languageName).map(esc).join(' · ')],
    ['metadataLanguage',metadataLanguages.map(languageName).map(esc).join(' · ')],
    ['institution',esc(r.institution)],['authors',esc(r.authors)],['date',esc(r.type==='event'?eventDate(r) : r.year)],['releaseDate',r.type!=='event' ? esc(day(r.releaseDate)) : ''],['timezone',esc(r.timezone)],['venue',esc(r.venue)],['city',esc(r.city)],
    ['country',country ? `<a href="${esc(url('search',{country:country.iso}))}">${esc(countryName(country))}</a>` : esc(r.country)],['dialingCode',esc(countryCodes(country))],['format',r.mode ? t(r.mode) : ''],['eventStatus',r.type==='event' && r.eventStatus ? t(r.eventStatus) : ''],['deadline',esc(day(r.deadline))],
    ['startTime',esc(r.startTime)],['endTime',esc(r.endTime)],['callOpens',esc(day(r.callOpens))],['paperDeadline',esc(day(r.paperDeadline))],['registrationDeadline',esc(day(r.registrationDeadline))],['attendanceFee',esc(r.attendanceFee)],
    ['degree',esc(r.degree)],['department',esc(r.department)],['supervisors',esc(r.supervisors)],['access',r.access ? t(r.access) : ''],['embargoUntil',esc(day(r.embargoUntil))],['license',esc(r.license)],['rightsHolder',esc(r.rightsHolder)],
    ['activityType',classificationLinks('toa',[r.activityType],preview)], ['objectives',classificationLinks('seo',r.objectives || [],preview)],
    ['publicContact',esc(r.publicContact)],['doi',r.doi && !preview ? `<a href="${esc(doiHref(r.doi))}" rel="noopener"><bdi>${esc(r.doi)}</bdi></a>` : '']
  ];
  const files = r.files || [];
  const related = relatedRows(r);
  const summary = r.status==='withdrawn' ? `<p class="empty">${t('withdrawn')} · <bdi>${esc(r.description)}</bdi></p>
  ${r.doi ? `<p><a href="${esc(doiHref(r.doi))}"><bdi>${esc(r.doi)}</bdi></a></p>` : ''}` : `<div class="record-content">
    <article class="record-pane">${metadataLanguages.length > 1 && !preview ? `<nav class="tabs" aria-label="${t('metadataLanguage')}">${metadataLanguages.map(code=>`<a class="tab"${meta.lang===code?' aria-current="page"':''} href="${esc(url('record',{record:r.id,metadata:code}))}">${esc(languageName(code))}</a>`).join('')}</nav>` : ''}
      <h2>${t(r.type==='event'?'description':'abstract')}</h2>
      ${meta.status ? `<p class="muted">${t('translationStatus')} · ${t(meta.status)}</p>` : ''}
      <p lang="${esc(meta.descriptionLang || meta.lang)}" dir="auto">${esc(meta.description)}</p>
      ${meta.keywords ? `<p lang="${esc(meta.lang)}" dir="auto"><strong>${t('keywords')}</strong> · ${esc(meta.keywords)}</p>` : ''}
      ${r.programme || r.speakers ? `<p dir="auto">${esc([r.programme,r.speakers].filter(Boolean).join('\n'))}</p>` : ''}
      ${!preview ? `${r.directory ? '' : `<h2>${t('files')}</h2>${files.length ? `<ul>${files.filter(f=>f.url === '/api/files/' + f.id || validLink(f.url)).map(f=>`<li><a href="${esc(f.url)}" dir="auto">${esc(f.name)}</a></li>`).join('')}</ul>` : `<p>${t('noFiles')}</p>`}`}
      <div class="pills">${[['registrationUrl',r.registrationUrl],[r.directory?'organizerPage':'sourceUrl',r.sourceUrl || r.externalUrl],['programmeUrl',r.programmeUrl]].filter(([,v])=>validLink(v)).map(([k,v])=>`<a class="button secondary" href="${esc(validLink(v))}" rel="noopener noreferrer">${t(k)}</a>`).join('')}</div>
      ${r.doi || r.example ? `<h2>${t('citation')}</h2><p id="citation" dir="auto">${esc(citations(r,meta))}</p><button type="button" data-citation class="button secondary">${t('copyCitation')}</button>` : ''}` : ''}
    </article>
    <aside class="record-pane"><h2>${t('details')}</h2><dl class="metadata">${facts.filter(([,v])=>v).map(([k,v])=>`<div><dt>${t(k)}</dt><dd dir="auto">${v}</dd></div>`).join('')}</dl>
    ${subjectMini(r.subjectCodes || [])}${!preview ? `<h2>${t('related')}</h2>${related.length ? related.map(item=>itemRow(item)).join('') : empty('noRelated')}` : ''}</aside>
  </div>`;
  return `<section class="wrap page">${breadcrumb(txt(families[r.type] || 'details'))}<div class="pills">${tag(recordKind(r))}${sourceTag(r)}${r.status==='withdrawn'?tag('withdrawn'):''}</div>
    <h1 lang="${esc(meta.titleLang || meta.lang)}" dir="auto">${esc(meta.title || txt('title'))}</h1>
    ${r.example ? `<p class="notice">${t('demoNote')}</p>` : r.directory ? `<p class="notice">${t('organizerDirectory')}</p>` : ''}${summary}</section>`;
}
function aboutPage() {
  return layout(txt('about'), `<div class="help"><p>${t('aboutText')}</p>
    <details open><summary>${t('doi')}</summary><p>${t('doiPolicy')}</p></details>
    <details id="account-privacy"><summary>${t('accountPrivacy')}</summary><p>${t('accountPrivacyNote')}</p>
    ${state.session.emailAuth ? `<p>${t('accountEmailProvider')}</p><p>${t('loginMobilePrivacy')}</p>` : ''}</details>
    <p>${link('subjects','anzsrc2020','class="text-link"')}</p>
    ${classificationSources()}
    <details><summary>${t('startSubmission')}</summary><p>${t('submissionIntro')}</p><p>${link('submit','submit','class="button"')}</p></details>
    <details><summary>${t('examples')}</summary><p>${t('sampleContent')}</p></details>
  </div>`);
}
const exactRecord = (id) => examples.find(r=>r.id===id) || state.directory.find(r=>r.id===id) || state.records.find(r=>r.id===id) || state.resolution.get(id);
export function announce(key) { el('announcement').textContent = txt(key); }
export function refresh() { return render(); }
export function go(destination, focus=true) {
  const target = new URL(destination,location.href);
  if (primary && protectedViews.has(target.searchParams.get('view'))) {
    window.location.assign(new URL(target.pathname + target.search + target.hash,primary));
    return;
  }
  if (target.pathname + target.search !== returnPath()) history.pushState(null,'',target);
  return render(focus);
}
export function showPreview(r) {
  el('main').innerHTML = detailsView(r,new URLSearchParams(),true) + `<div class="wrap section"><button class="button secondary" type="button" data-edit>${t('edit')}</button></div>`;
  window.scrollTo(0,0);
  el('main').focus();
}
async function render(focus=false) {
  const {page,params} = current();
  const seq = ++state.nav;
  const requestedLang = params.get('lang') || (params.has('lang') ? 'en' : preference(keyLanguage));
  lang = Object.hasOwn(locales,requestedLang) ? requestedLang : 'en';
  chrome(page);
  document.title = txt('brand') + (page === 'home' ? '' : ' · ' + txt(nav.find(([p])=>p===page)?.[1] || (page==='record'?'details':page)));
  let html, bindFilters;
  if (!['home','countries','institutions','about'].includes(page)) {
    await loadClassifications();
    if (seq!==state.nav) return;
  }
  if (page === 'record') {
    const id = params.get('record');
    if (!exactRecord(id) && !state.resolution.has(id) && !id.startsWith('directory-')) {
      el('main').innerHTML = layout(txt('details'), '<p aria-busy="true"></p>');
      try { const data = await api('records/' + encodeURIComponent(id)); state.resolution.set(id,data.record || null); }
      catch { state.resolution.set(id,null); }
    }
    if (seq!==state.nav) return;
    const r = exactRecord(id);
    html = r?.status==='publication_pending' ? layout(txt('details'),empty('publication_pending')) : r ? detailsView(r,params) : layout(txt('details'),empty('recordMissing'));
    if (r?.title) document.title = selectedMetadata(r,params.get('metadata') || lang).title + ' · ' + txt('brand');
  } else if (page === 'home') html = homePage();
  else if (page === 'subjects') html = await subjectsPage(params);
  else if (page === 'countries') html = countriesPage();
  else if (page === 'institutions') html = institutionsPage(params);
  else if (['events','proceedings','theses','search'].includes(page)) {
    const eventFilter = (catalogTypes[page] || params.get('type')) === 'event';
    const scope = eventFilter ? '' : catalogScope(params);
    const comprehensive = eventFilter || catalogFilterKeys.some(key=>params.get(key));
    const loadPending = scope && !state.countryPages.has(scope) ||
      comprehensive && (scope ? state.countryPages.get(scope)?.next : state.next || state.failed);
    let loadFailed = state.failed && !scope;
    if (loadPending) {
      const results = el('catalog-results');
      if (results) {
        results.textContent = txt('loadingResults');
        results.setAttribute('aria-busy','true');
      }
      announce('loadingResults');
      try {
        await prepareCatalog(scope,comprehensive,()=>seq===state.nav);
        loadFailed=state.failed && !scope;
      }
      catch { loadFailed=true; }
      if (seq!==state.nav) return;
      el('announcement').textContent='';
    }
    const catalog = recordList(page,params,scope,loadFailed || (eventFilter && state.directoryFailed));
    html = catalog.html;
    bindFilters = catalog.bind;
  }
  else if (page === 'submit') html = await submissionPage(params);
  else if (page === 'account' || page === 'review') html = await dashboardPage(page);
  else html = aboutPage();
  if (seq!==state.nav) return;
  el('main').innerHTML = html;
  bindFilters?.();
  bindWorkflow(page,params);
  if (focus) {
    const results = focus==='results' ? el('catalog-results') : null;
    if (results) results.scrollIntoView({block:'start'});
    else window.scrollTo(0,0);
    (results || el('main')).focus({preventScroll:true});
  }
}
document.addEventListener('click',async (e)=>{
  const button = e.target.closest('button');
  if (button?.matches('[data-examples]')) {
    state.examples = !state.examples;
    preference(keyExamples,state.examples?'show':'hide');
    await refresh();
    document.querySelector('[data-examples]')?.focus();
    return;
  }
  if (button?.matches('[data-citation]')) {
    try { await navigator.clipboard.writeText(el('citation').textContent); announce('copied'); button.textContent=txt('copied'); }
    catch { const range=document.createRange(); range.selectNodeContents(el('citation')); const selection=getSelection(); selection.removeAllRanges(); selection.addRange(range); }
    return;
  }
  if (button?.matches('[data-next]')) {
    button.disabled=true;
    try {
      const scope=button.dataset.scope;
      if (scope && state.countryPages.has(scope)) await fetchCatalog(scope,state.countryPages.get(scope).next);
      else await fetchRecords(state.next);
      await refresh();
    } catch { button.disabled=false; announce('serviceUnavailable'); }
    return;
  }
  if (button?.matches('[data-edit]')) { await refresh(); return; }
  const anchor = e.target.closest('a');
  if (!anchor || anchor.target || anchor.download || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const destination = new URL(anchor.href,location.href);
  if (destination.origin !== location.origin || destination.pathname !== '/' || destination.hash) return;
  e.preventDefault();
  await go(destination);
});
document.addEventListener('change',(e)=>{
  if (e.target.id!=='interface-language') return;
  const destination=new URL(location.href);
  preference(keyLanguage,e.target.value);
  destination.searchParams.set('lang',e.target.value);
  if (destination.searchParams.has('record')) destination.searchParams.delete('metadata');
  go(destination,false).then(()=>el('interface-language')?.focus());
});
document.addEventListener('input',(e)=>{
  if (e.target.id==='country-query') {
    const word = normalize(e.target.value.trim());
    const dialing = dialNumber(word);
    const rows = sortedCountries().filter(country=>!word || (dialing ? country.callingCodes.includes(dialing) : [country.name,countryName(country),country.iso].some(label=>normalize(label).includes(word))));
    el('country-results').innerHTML=countryTree(rows);
  }
  if (e.target.id!=='subject-query') return;
  const query = normalize(e.target.value.trim());
  const {params} = current();
  const scheme = subjectScheme(params);
  const items = schemeItems(scheme);
  const item = anzsrcItem(scheme,params.get(scheme==='for'?'subject':'code'));
  const rows = query ? items.filter(entry=>subjectMatches(entry,query)).slice(0,80)
    : items.filter(entry=>entry.parent===(item?.code || null));
  el('subject-results').innerHTML=subjectTree(rows,scheme,query ? null : item);
});
document.addEventListener('submit',(e)=>{
  const form = e.target;
  if (form.dataset.search || form.dataset.filter) {
    e.preventDefault();
    const searching = Boolean(form.dataset.search);
    const searchType = el('search-type').value;
    const keepEvents = form.dataset.search === 'events' && searchType === 'event';
    const page = searching ? (keepEvents ? 'events' : 'search') : form.dataset.filter;
    const filters = document.querySelector('form[data-filter]');
    const chosen = filters ? Object.fromEntries(new FormData(filters)) : {};
    const values = {...Object.fromEntries(current().params),...chosen};
    if (filters) {
      values.subject = chosen.subsubject || chosen.subject;
      if (filters.elements.namedItem('seo')) values.seo = chosen.seo || chosen.seoDivision;
    }
    delete values.subsubject; delete values.seoDivision;
    values.q = el('query')?.value.trim() || '';
    if (page==='search') values.type = searchType;
    if (searching && !keepEvents) delete values.period;
    delete values.view; delete values.lang; delete values.dial;
    const type = catalogTypes[page] || values.type || '';
    if (type==='event') delete values.dl;
    if (type && type!=='event') { delete values.el; delete values.mode; }
    if (type!=='event') { delete values.from; delete values.to; }
    if (values.kind && !kindsFor(type).includes(values.kind)) delete values.kind;
    if (filters && values.from && values.to && values.to<values.from) {
      filters.querySelector('output').textContent=txt('invalidDates');
      filters.elements.namedItem('to').focus();
      return;
    }
    go(url(page,values),'results');
    return;
  }
  if (form.hasAttribute('data-institution')) { e.preventDefault(); go(url('institutions',Object.fromEntries(new FormData(form)))); }
});
window.addEventListener('popstate',()=>render());
const catalogRequests = new Map();
function fetchCatalogPage(scope,cursor) {
  const params = new URLSearchParams();
  if (scope) params.set('country',scope);
  if (cursor) params.set('cursor',cursor);
  const path = 'records' + (params.size ? '?' + params : '');
  if (catalogRequests.has(path)) return catalogRequests.get(path);

  const request = api(path).then(data=>{
    const previous = scope ? state.countryPages.get(scope) : state;
    // A newer request may already have moved this cursor forward.
    if (cursor && previous?.next!==cursor) return;
    const next = data.next || null;
    if (!Array.isArray(data.records) || (next && (typeof next!=='string' || next===cursor))) {
      throw new Error('Invalid catalog page');
    }
    const records = new Map((cursor ? previous.records : []).map(record=>[record.id,record]));
    for (const record of data.records) records.set(record.id,record);
    const page = {records:[...records.values()],next};
    if (scope) state.countryPages.set(scope,page);
    else Object.assign(state,page);
  }).finally(()=>catalogRequests.delete(path));
  catalogRequests.set(path,request);
  return request;
}
function fetchRecords(cursor) { return fetchCatalogPage('',cursor); }
function fetchCatalog(scope,cursor) { return fetchCatalogPage(scope,cursor); }
async function prepareCatalog(scope,full,stillCurrent=()=>true) {
  if (!stillCurrent()) return;
  const load = (cursor) => scope ? fetchCatalog(scope,cursor) : fetchRecords(cursor);
  if (scope ? !state.countryPages.has(scope) : state.failed) {
    await load();
    if (!scope) state.failed = false;
  }
  if (!full) return;

  const seen = new Set();
  while (stillCurrent()) {
    const cursor = scope ? state.countryPages.get(scope)?.next : state.next;
    if (!cursor) return;
    if (seen.has(cursor)) throw new Error('Repeated catalog cursor');
    seen.add(cursor);
    await load(cursor);
  }
}
async function fetchDirectory() {
  const results = await Promise.allSettled(['events-directory','events-feed'].map(catalogData));
  const seen = new Set();
  for (const result of results) {
    if (result.status!=='fulfilled') { state.directoryFailed=true; continue; }
    const entries = Array.isArray(result.value) ? result.value : result.value.events;
    for (const item of entries || []) {
      const key=eventIdentity(item);
      if (item.directory===true && item.id?.startsWith('directory-') && validLink(item.sourceUrl) && !seen.has(key)) {
        seen.add(key);
        state.directory.push(item);
      }
    }
  }
}
function catalogData(name) {
  const path = name==='events-feed' ? '/data/events-feed.json' : new URL('./data/'+name+'.json', import.meta.url);
  return fetch(path).then(response=>{
    if (!response.ok) throw new Error(name);
    return response.json();
  });
}
const [subjects, session, records, countries] = await Promise.allSettled([
  catalogData('subjects'),
  api('session'),
  fetchRecords(),
  catalogData('countries'),
  fetchDirectory()
]);
if (subjects.status==='fulfilled') {
  state.subjects=subjects.value;
  state.index=new Map(state.subjects.map(item=>[item.code,item]));
}
if (session.status==='fulfilled') state.session=session.value;
if (countries.status==='fulfilled') {
  state.countries=countries.value;
  state.countryIndex=new Map(state.countries.map(item=>[item.iso,item]));
}
state.failed=records.status==='rejected';
if ((state.records.length || state.directory.length) && !preference(keyExamples)) state.examples=false;
await refresh();
