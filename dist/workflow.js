import {
  activeRecords, announce, api, catalogKindLabel, countryOptions, esc, go, icon, lang, languageOptions, layout,
  link, normalize, options, participationModes, recordUrl, refresh, showPreview, signIn, state, subjectLabel,
  subSubjectOptions, subjectGroupOptions, subjectMatches, t, txt, types, url
} from './app.js';

const editable = new Set(['draft','changes_requested']);
const fields = new Map([
  ['eventType','eventForm'],['materialType','materialsForm'],['thesisType','thesisForm'],['language','languageTag'],
  ['subjectCodes','primarySubject'],['attachmentIds','attachments'],['note','reviewNote'],['mode','format'],['countryCode','country']
]);
const eventStates = ['scheduled','held','postponed','cancelled'];
const uploadErrors = new Set(['file_too_large','unsupported_file','invalid_upload']);
const otherChoice = '__custom__';
const isoLanguages = ('aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu').split(' ');
const languageOptionCache = new Map();
const fallbackZones = ['Africa/Cairo','Africa/Johannesburg','America/Chicago','America/Los_Angeles','America/New_York','America/Sao_Paulo','Asia/Dubai','Asia/Shanghai','Asia/Singapore','Asia/Tokyo','Australia/Sydney','Europe/London','Europe/Paris','Pacific/Auckland'];
const zones = ['UTC',...new Set(['Asia/Kolkata',...(Intl.supportedValuesOf?.('timeZone') || fallbackZones)].sort())];
const roleChoices = { Organizer:'roleOrganizer', Author:'roleAuthor', Editor:'roleEditor', Presenter:'rolePresenter',
  Supervisor:'roleSupervisor', Contributor:'roleContributor' };
const feeChoices = { Free:'feeFree', Paid:'feePaid', 'Not announced':'notAnnounced' };
const academicChoices = { 'In progress':'academicInProgress', Submitted:'submitted', Approved:'academicApproved',
  Awarded:'academicAwarded', Published:'published' };
const standardLicenses = ['CC0 1.0','CC BY 4.0','CC BY-SA 4.0','CC BY-ND 4.0','CC BY-NC 4.0','CC BY-NC-SA 4.0','CC BY-NC-ND 4.0'];
const commonDegrees = ['PhD','DPhil','EdD','EngD','MA','MSc','MPhil','MRes','MBA','MEng'];
let draft;
const editing = (params) => (params.get('id') || params.get('type') || '');
const keyOptions = (names) => names.map(key=>[key,txt(key)]);
const labeledOptions = (labels) => Object.entries(labels).map(([value,key])=>[value,txt(key)]);
const val = (record,name) => Array.isArray(record[name]) ? record[name].join(', ') : record[name] ?? '';
const typeHeading = (type) => ({event:'eventForm',material:'materialsForm',thesis:'thesisForm'})[type];
const languageList = (value='') => value.split(/[,\n;]+/).map(tag=>tag.trim()).filter(Boolean);

function field(record,name,{label=name,labelText=txt(label),kind='text',required=false,wide=false,help,choices,placeholder}={}) {
  const value = val(record,name);
  const common = `name="${name}" id="field-${name}"${required ? ' required' : ''}${help ? ` aria-describedby="help-${name}"` : ''}`;
  let html;
  if (choices) html=`<select ${common}>${options([['',txt('choose')],...choices],String(value))}</select>`;
  else if (kind==='textarea') html=`<textarea ${common} maxlength="8000" dir="auto">${esc(value)}</textarea>`;
  else html=`<input type="${kind}" ${common} value="${esc(value)}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${kind==='number' ? ' min="1000" max="2999"' : ''} dir="auto">`;
  return `<label class="field${wide?' full':''}" for="field-${name}"><span>${esc(labelText)}${required?' *':''}</span>${html}${help ? `<small id="help-${name}">${t(help)}</small>` : ''}</label>`;
}
function formLanguageOptions() {
  if (!languageOptionCache.has(lang)) {
    const display = typeof Intl.DisplayNames==='function' ? new Intl.DisplayNames([lang],{type:'language'}) : null;
    const entries = isoLanguages.map(code=>[code,(display?.of(code) || code)+' ('+code+')']);
    languageOptionCache.set(lang,entries.sort((a,b)=>a[1].localeCompare(b[1],lang)));
  }
  return languageOptionCache.get(lang);
}
function choiceField(record,name,{label=name,required=false,wide=false,help,choices,otherLabel='specifyOther',placeholder='',translation=false}) {
  const value = String(val(record,name));
  const custom = value!=='' && !choices.some(([code])=>code===value);
  const selectAttrs = translation ? ' data-meta="lang"' : ` name="${name}" id="field-${name}"`;
  return `<div data-choice-field${wide?' class="full"':''}>
    <label class="field"><span>${t(label)}${required?' *':''}</span>
      <select data-choice-select${selectAttrs}${required?' required':''}${help?` aria-describedby="help-${name}"`:''}>
        ${options([['',txt('choose')],...choices,[otherChoice,txt('otherChoice')]],custom?otherChoice:value)}
      </select>${help?`<small id="help-${name}">${t(help)}</small>`:''}
    </label>
    <div data-custom-choice${custom?'':' hidden'}><label class="field"><span>${t(otherLabel)}</span>
      <input type="text" data-custom-value value="${esc(custom?value:'')}"${placeholder?` placeholder="${esc(placeholder)}"`:''}${custom?' required':' disabled'} dir="auto">
    </label></div>
  </div>`;
}
function languageField(record,name,config={}) {
  return choiceField(record,name,{choices:formLanguageOptions(),otherLabel:'languageTag',placeholder:'en',...config});
}
function extraLanguages(record) {
  return `<label class="field">${t('addEventLanguage')}<select data-extra-language>
    ${options([['',txt('choose')],...formLanguageOptions()],'')}
  </select></label>` + field(record,'languages',{label:'eventExtraLanguages',placeholder:'hi, en'});
}
function choiceValue(select) {
  return (select.value===otherChoice ? select.closest('[data-choice-field]').querySelector('[data-custom-value]').value : select.value).trim();
}
function section(key,content) {
  return `<fieldset class="form-section"><legend>${t(key)}</legend><div class="form-grid">${content}</div></fieldset>`;
}
function links(type,record) {
  if (type==='event') return field(record,'sourceUrl',{kind:'url'}) + field(record,'registrationUrl',{kind:'url'})
    + field(record,'programmeUrl',{kind:'url'}) + field(record,'verificationNotes',{kind:'textarea',wide:true});
  const licenses = [...standardLicenses.map(value=>[value,value]),['All rights reserved',txt('rightsReserved')]];
  return field(record,'sourceUrl',{kind:'url',wide:true}) + choiceField(record,'license',{choices:licenses,required:true}) + field(record,'rightsHolder')
    + field(record,'access',{choices:keyOptions(['open','embargoed','external']),required:true}) + field(record,'embargoUntil',{kind:'date'});
}
function metadataFields(record) {
  return field(record,'title',{required:true,wide:true}) + field(record,'description',{kind:'textarea',required:true,wide:true})
    + field(record,'keywords',{wide:true});
}
function countryField(r, required) {
  const code=r.countryCode || state.countries.find(c=>normalize(c.name)===normalize(r.country))?.iso;
  return field({...r,countryCode:code},'countryCode',{label:'country',choices:countryOptions(),required});
}
function searchableFields(type,r) {
  const isEvent = type==='event';
  const common = field(r,type+'Type',{labelText:catalogKindLabel(type),choices:keyOptions(types[type]),required:true,wide:true})
    + subjectPicker(r)
    + countryField(r,type==='thesis')
    + languageField(r,'language',{label:isEvent?'eventLanguage':'documentLanguage',required:true})
    + languageField(r,'metadataLanguage',{help:'metadataLanguageHelp'});
  return common + (isEvent
    ? field(r,'mode',{label:'format',choices:keyOptions(participationModes),required:true})
      + field(r,'startDate',{kind:'date',required:true}) + field(r,'endDate',{kind:'date',required:true})
      + extraLanguages(r)
    : '');
}
const associated = (value) => {
  const raw = String(value || '').trim();
  try { return new URL(raw,location.origin).searchParams.get('record') || raw; } catch { return raw; }
};
function typeFields(type,r) {
  const roles = labeledOptions(roleChoices);
  if (type==='event') return field(r,'eventStatus',{choices:keyOptions(eventStates),required:true})
    + field(r,'institution',{required:true})
    + field(r,'startTime',{kind:'time'}) + field(r,'endTime',{kind:'time'})
    + choiceField(r,'timezone',{choices:zones.map(zone=>[zone,zone.replaceAll('_',' ')]),placeholder:'Asia/Kolkata'})
    + field(r,'city') + field(r,'venue',{wide:true})
    + field(r,'deadline',{kind:'date'}) + field(r,'paperDeadline',{kind:'date'}) + field(r,'registrationDeadline',{kind:'date'})
    + choiceField(r,'attendanceFee',{choices:labeledOptions(feeChoices)}) + field(r,'publicContact')
    + choiceField(r,'contributorRole',{choices:roles})
    + field(r,'speakers',{kind:'textarea',wide:true}) + field(r,'programme',{kind:'textarea',wide:true});
  const shared = field(r,'authors',{required:true,wide:true}) + choiceField(r,'contributorRole',{choices:roles})
    + field(r,'institution',{required:type==='thesis'})
    + field(r,'year',{kind:'number',help:'yearOrReleaseDate'}) + field(r,'releaseDate',{kind:'date'});
  if (type==='material') {
    const events = activeRecords().filter(r=>r.type==='event'&&!r.example&&!r.directory);
    const related = events.length
      ? choiceField(r,'relatedId',{choices:events.map(event=>[event.id,event.title]),help:'relatedHelp',wide:true,otherLabel:'relatedOther'})
      : field(r,'relatedId',{help:'relatedHelp',wide:true});
    return related + field(r,'relatedEventTitle',{wide:true}) + shared + field(r,'publisher');
  }
  return choiceField(r,'degree',{required:true,choices:commonDegrees.map(value=>[value,value])})
    + shared + field(r,'department') + field(r,'supervisors')
    + choiceField(r,'academicStatus',{choices:labeledOptions(academicChoices)});
}
function selectedSubjects(codes) {
  return (codes || []).map((code,index)=>{
    const item = state.index.get(code);
    return `<button type="button" class="tag" data-drop-subject="${esc(code)}" title="${t('remove')}">${index===0?t('primarySubject')+' · ':''}<bdi>${esc(code)}</bdi> ${esc(subjectLabel(item))} ×</button>`;
  }).join('');
}
function subjectPicker(r) {
  return `<div class="full subject-picker" role="group" aria-label="${t('classification')}">
    <p class="subject-summary">${t('primarySubject')} * · ${t('additionalSubjects')}</p>
    <div class="subject-browse">
      <label class="field">${t('topic')}<select id="subject-group">${options([['',txt('choose')]],'')}${subjectGroupOptions()}</select></label>
      <label class="field">${t('subSubject')}<select id="subject-field" disabled>${subSubjectOptions('','',txt('choose'))}</select></label>
    </div>
    <button class="button secondary subject-add" type="button" id="subject-add" disabled>${t('addSubject')}</button>
    <label for="subject-picker-input" class="field">${t('subjectSearch')}
      <input type="search" id="subject-picker-input" autocomplete="off"></label>
    <div id="subject-options" class="subject-options"></div>
    <div id="picked-subjects" class="pills" aria-live="polite">${selectedSubjects(r.subjectCodes)}</div>
  </div>`;
}
function translationRows(entries, offset=0) {
  return entries.map(([code,m],i)=>`<fieldset class="form-section full" data-translation>
    <legend>${t('translations')} ${offset+i+1}</legend>
    <div class="form-grid">
      ${languageField({lang:code},'lang',{label:'metadataLanguage',required:true,translation:true})}
      <label class="field">${t('translationStatus')}<select data-meta="status">${options(keyOptions(['authorTranslation','machineTranslation']),m.status || 'authorTranslation')}</select></label>
      <label class="field full">${t('translatedTitle')}<input data-meta="title" value="${esc(m.title)}" dir="auto"></label>
      <label class="field full">${t('translatedDescription')}<textarea data-meta="description" dir="auto">${esc(m.description)}</textarea></label>
      <label class="field full">${t('translatedKeywords')}<input data-meta="keywords" value="${esc(Array.isArray(m.keywords) ? m.keywords.join(', ') : m.keywords)}" dir="auto"></label>
      <div class="full"><button type="button" class="text-button" data-drop-translation>${t('remove')}</button></div>
    </div>
  </fieldset>`).join('');
}
function fileRows(files) {
  return files.map(f=>`<li><bdi>${esc(f.name)}</bdi> <button type="button" class="text-button" data-drop-file="${esc(f.id)}">${t('remove')}</button></li>`).join('');
}
function filePicker(r) {
  const label = state.session.user ? (state.session.files ? 'attachmentHint' : 'serviceUnavailable') : 'uploadSignIn';
  return `<div class="full"><label class="field">${t('upload')}<input id="attachment" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.mp3,.mp4,.txt" multiple${!state.session.user || !state.session.files || draft.uploading?' disabled':''}><small>${t(label)} ${state.session.files?t('smallFile'):''}</small></label>
    <p id="upload-status" role="status" class="muted"${draft.uploading?'':' hidden'}>${t('uploadInProgress')}</p>
    <ul id="attachment-list">${fileRows(r.files || [])}</ul></div>`;
}
function choices(params) {
  const entries = params.get('research') ? ['material','thesis','event'] : ['event','material','thesis'];
  const labels = {event:'eventHelp',material:'materialsHelp',thesis:'thesisHelp'};
  return layout(txt('startSubmission'),`<div class="event-grid">${entries.map(type=>`<article class="event-card">
    <h3>${link('submit',typeHeading(type),'',{type})}</h3><p>${t(labels[type])}</p>
  </article>`).join('')}</div>`,txt('submissionIntro'));
}
function blank(type) {
  return {type,access:'open',eventStatus:'scheduled',subjectCodes:[],metadata:{},files:[],attachmentIds:[]};
}
export async function submissionPage(params) {
  const type = params.get('type');
  const id = params.get('id');
  const key = editing(params);
  let note;
  if (id && draft?.key!==key) {
    if (!state.session.user) return layout(txt('startSubmission'),`<p>${t('signedOut')}</p>${signIn()}`);
    try {
      const {submissions} = await api('submissions');
      const target = submissions.find(s=>s.id===id && editable.has(s.status));
      if (!target) return layout(txt('startSubmission'),`<p class="empty">${t('noSubmissions')}</p>`);
      draft = {key,id,record:target.record,note:target.note,status:target.status,revision:target.revision};
    } catch { return layout(txt('startSubmission'),`<p class="empty">${t('serviceUnavailable')}</p>`); }
  }
  if (!id && !types[type]) return choices(params);
  if (draft?.key!==key) draft={key,record:blank(type)};
  const r = draft.record;
  note = draft.note;
  const canWrite = state.session.user && state.session.persistent;
  const canSave = canWrite && !draft.uploading;
  const title = txt(typeHeading(r.type));
  const heading = r.type==='event' ? txt('eventSubmitHeading').replace('{event}',catalogKindLabel(r.type)) : title;
  return layout(title,`<div class="form-panel">
    ${state.session.user && !canWrite ? `<p class="empty">${t('serviceUnavailable')}</p>` : ''}
    ${note ? `<div class="notice"><span>${t('reviewNote')} · <bdi>${esc(note)}</bdi></span></div>` : ''}
    <form id="submission-form" novalidate>
    ${section('original',metadataFields(r))}
    ${section('searchableDetails',searchableFields(r.type,r))}
    ${section('details',typeFields(r.type,r))}
    ${section('translations',`<div class="full" id="translation-list">${translationRows(draft.translations ?? Object.entries(r.metadata || {}))}</div><div class="full"><button class="button secondary" type="button" data-add-translation>${icon('plus',15)}${t('addTranslation')}</button></div>`)}
    ${section('files',filePicker(r)+links(r.type,r))}
    ${section('doi',`<p class="full">${t('doiPolicy')}</p>${field(r,'doi')}${r.type!=='event'?field(r,'translationOf'):''}
    <label class="full"><input name="authority" type="checkbox"${r.authority?' checked':''} required> ${t('authority')} *</label>`)}
    <output class="form-feedback" id="submission-feedback" role="alert"></output>
    ${!state.session.user ? `<p>${signIn({label:'signedOut',className:'text-link'})}</p>` : ''}
    <div class="form-actions"><button class="button secondary" name="action" value="draft"${canSave?'':' disabled'}>${t('saveDraft')}</button>
      <button class="button secondary" type="button" data-preview${draft.uploading?' disabled':''}>${t('preview')}</button>
      <button class="button" name="action" value="submit"${canSave?'':' disabled'}>${t('sendForReview')}</button>
    </div></form></div>`, '', heading);
}
function collect(form) {
  const {record:previous} = draft;
  const data = Object.fromEntries(new FormData(form));
  delete data.action;
  for (const select of form.querySelectorAll('[data-choice-select][name]')) data[select.name] = choiceValue(select);
  data.authority = form.elements.namedItem('authority').checked;
  data.country = state.countryIndex.get(data.countryCode)?.name || '';
  data.languages = languageList(data.languages);
  data.relatedId = associated(data.relatedId);
  data.translationOf = associated(data.translationOf);
  draft.translations = [...form.querySelectorAll('[data-translation]')].map(row=>{
    const parts = Object.fromEntries([...row.querySelectorAll('[data-meta]')].map(input=>[
      input.dataset.meta,input.hasAttribute('data-choice-select') ? choiceValue(input) : input.value.trim()
    ]));
    const {lang,...metadata} = parts;
    return [lang,metadata];
  });
  return {...previous,...data};
}
function canonicalLanguage(value) {
  if (!value || value.length>63) return '';
  try { return Intl.getCanonicalLocales(value)[0] || ''; }
  catch { return ''; }
}
function prepareSubmission(form) {
  const record = collect(form);
  draft.record = record;
  const original = canonicalLanguage(record.metadataLanguage || record.language);
  const languageFields = form.querySelectorAll('[data-translation] [data-meta="lang"]');
  const translations = new Map();
  for (const [index,[value,metadata]] of draft.translations.entries()) {
    const hasContent = Boolean(metadata.title || metadata.description || metadata.keywords);
    if (!value && !hasContent) continue;
    const code = canonicalLanguage(value);
    let error;
    if (!value) error = 'translationLanguageRequired';
    else if (!code) error = 'translationLanguageInvalid';
    else if (code===original) error = 'translationLanguageOriginal';
    else if (translations.has(code)) error = 'translationLanguageDuplicate';
    if (error) {
      feedback(form,txt(error));
      const select = languageFields[index];
      const input = select.value===otherChoice
        ? select.closest('[data-choice-field]').querySelector('[data-custom-value]') : select;
      input.focus();
      return null;
    }
    translations.set(code,metadata);
  }
  draft.record = {...record,metadata:Object.fromEntries(translations)};
  return draft.record;
}
function errors(error) {
  const fieldName = error.field ? ' (' + txt(fields.get(error.field) || error.field) + ')' : '';
  if (error.status===401) return txt('signInError');
  if (uploadErrors.has(error.code)) return txt('smallFile');
  if (error.code==='invalid_doi') return txt('invalidDoi');
  if (error.code==='date_order') return txt('invalidDates') + fieldName;
  if (error.status===422 && error.field) return txt('required') + fieldName;
  if (error.status>=500 && !error.error) return txt('serviceUnavailable');
  return lang==='en' && error.error ? error.error : txt('unknownError');
}
function feedback(form,message) {
  form.querySelector('.form-feedback').textContent = message;
}
function bindChoiceFields(form) {
  form.addEventListener('change',event=>{
    const select = event.target;
    if (select.matches('[data-extra-language]') && select.value) {
      const input = form.elements.namedItem('languages');
      input.value = [...new Set([...languageList(input.value),select.value])].join(', ');
      select.value = '';
      draft.record=collect(form);
      return;
    }
    if (!select.matches('[data-choice-select]')) return;
    const custom = select.closest('[data-choice-field]').querySelector('[data-custom-choice]');
    const input = custom.querySelector('[data-custom-value]');
    const show = select.value===otherChoice;
    custom.hidden = !show;
    input.disabled = !show;
    input.required = show;
    draft.record=collect(form);
    if (show) input.focus();
  });
}
function bindSubmission() {
  const form = document.getElementById('submission-form');
  if (!form || !draft) return;
  bindChoiceFields(form);
  const pick = form.querySelector('#subject-picker-input');
  const picked = form.querySelector('#picked-subjects');
  const candidates = form.querySelector('#subject-options');
  const group = form.querySelector('#subject-group');
  const field = form.querySelector('#subject-field');
  const add = form.querySelector('#subject-add');
  const uploads = form.querySelector('#attachment');
  const attachments = form.querySelector('#attachment-list');
  const selection = () => field.value ? field : group;
  const canAdd = (code) => state.index.has(code) && draft.record.subjectCodes.length<8 && !draft.record.subjectCodes.includes(code);
  function updateAdd() { add.disabled=!canAdd(selection().value); }
  function renderMatches() {
    const word=normalize(pick.value.trim());
    candidates.innerHTML = word && draft.record.subjectCodes.length<8 ? state.subjects.filter(s=>subjectMatches(s,word) && !draft.record.subjectCodes.includes(s.code)).slice(0,18)
      .map(s=>`<button type="button" data-pick-subject="${s.code}"><bdi class="code">${s.code}</bdi> ${esc(subjectLabel(s))}</button>`).join('') : '';
  }
  function reselect() {
    picked.innerHTML=selectedSubjects(draft.record.subjectCodes);
    updateAdd();
    renderMatches();
  }
  function addSubject(code) {
    if (!canAdd(code)) return false;
    draft.record.subjectCodes.push(code);
    reselect();
    return true;
  }
  form.addEventListener('input', ()=>{ draft.record=collect(form); });
  group.addEventListener('change',()=>{
    field.innerHTML=subSubjectOptions(group.value,'',txt('choose'));
    field.disabled=field.options.length===1;
    updateAdd();
  });
  field.addEventListener('change',updateAdd);
  add.addEventListener('click',()=>{
    const selected=selection();
    if (addSubject(selected.value)) selected.focus();
  });
  pick.addEventListener('input',renderMatches);
  form.addEventListener('click',(e)=>{
    const button=e.target.closest('button');
    if (!button) return;
    if (button.dataset.pickSubject) {
      if (addSubject(button.dataset.pickSubject)) {
        pick.value='';
        renderMatches();
        pick.focus();
      }
    }
    if (button.dataset.dropSubject) {
      draft.record.subjectCodes=draft.record.subjectCodes.filter(code=>code!==button.dataset.dropSubject); reselect(); pick.focus();
    }
    if (button.hasAttribute('data-add-translation')) {
      const entries = draft.translations ?? Object.entries(draft.record.metadata || {});
      const used = new Set(entries.map(([code])=>canonicalLanguage(code)));
      const original = canonicalLanguage(draft.record.metadataLanguage || draft.record.language);
      const next = languageOptions.find(([code])=>!used.has(code) && code!==original)?.[0] || '';
      const list = form.querySelector('#translation-list');
      list.insertAdjacentHTML('beforeend',translationRows([[next,{}]],list.children.length));
      draft.record=collect(form);
      list.lastElementChild.querySelector('[data-meta="lang"]').focus();
    }
    if (button.hasAttribute('data-drop-translation')) {
      button.closest('[data-translation]').remove();
      draft.record=collect(form);
      form.querySelector('[data-add-translation]').focus();
    }
    if (button.dataset.dropFile) {
      draft.record.files=draft.record.files.filter(f=>f.id!==button.dataset.dropFile);
      draft.record.attachmentIds=draft.record.files.map(f=>f.id);
      attachments.innerHTML=fileRows(draft.record.files);
    }
    if (button.hasAttribute('data-preview')) {
      if (draft.uploading) return;
      const record = prepareSubmission(form);
      if (record) showPreview(record);
    }
  });
  uploads.addEventListener('change',async ()=>{
    const queue = [...uploads.files];
    if (!queue.length || draft.uploading) return;
    const original = draft;
    const syncUploadState = () => {
      const activeForm = draft === original && document.getElementById('submission-form');
      if (!activeForm) return;
      activeForm.querySelector('#attachment').disabled = original.uploading || !state.session.user || !state.session.files;
      activeForm.querySelector('#attachment-list').innerHTML = fileRows(original.record.files);
      activeForm.querySelector('#upload-status').hidden = !original.uploading;
      activeForm.querySelector('[data-preview]').disabled = original.uploading;
      for (const button of activeForm.querySelectorAll('button[name=action]')) {
        button.disabled = original.uploading || !state.session.user || !state.session.persistent;
      }
      return activeForm;
    };
    original.uploading=true;
    syncUploadState();
    feedback(form,'');
    const warnings = new Set();
    try {
      for (const file of queue) {
        if (original.record.files.length>=10) { warnings.add(txt('attachmentLimit')); break; }
        if (file.size>20*1024*1024) { warnings.add(txt('smallFile')); continue; }
        const body = new FormData();
        body.set('file',file);
        try {
          const result=await api('uploads',{method:'POST',body});
          original.record.files.push(result);
          original.record.attachmentIds=original.record.files.map(f=>f.id);
          syncUploadState();
        } catch(error) { warnings.add(errors(error)); }
      }
    } finally {
      original.uploading=false;
      uploads.value='';
      const activeForm = syncUploadState();
      if (activeForm && warnings.size) feedback(activeForm,[...warnings].join(' '));
    }
  });
  form.addEventListener('submit',async (e)=>{
    e.preventDefault();
    if (!state.session.user || !state.session.persistent || draft.uploading) return;
    const record = prepareSubmission(form);
    if (!record) return;
    const action=e.submitter?.value || 'draft';
    if (action==='submit' && (!form.checkValidity() || !draft.record.subjectCodes.length)) {
      feedback(form,txt('required'));
      (form.querySelector(':invalid') || group).focus();
      return;
    }
    const buttons = form.querySelectorAll('button[name=action]');
    buttons.forEach(b=>b.disabled=true);
    feedback(form,'');
    try {
      const {submission} = await api('submissions',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:draft.id,revision:draft.revision,action,record})});
      const key = action==='submit' ? 'sent' : 'saved';
      if (action==='submit') draft=undefined;
      else draft = {key:submission.id,id:submission.id,revision:submission.revision,record:submission.record,status:submission.status,note:submission.note};
      await go(url(action==='submit'?'account':'submit',action==='submit'?{}:{id:submission.id}));
      announce(key);
      const page = document.querySelector('.page h1');
      page?.insertAdjacentHTML('afterend',`<p class="notice" role="status">${t(key)}</p>`);
    } catch (error) {
      feedback(form,errors(error));
      const invalidInput = error.field==='subjectCodes' ? group : form.elements.namedItem(error.field==='country' ? 'countryCode' : error.field);
      const target = invalidInput?.matches?.('[data-choice-select]') && invalidInput.value===otherChoice
        ? invalidInput.closest('[data-choice-field]').querySelector('[data-custom-value]') : invalidInput;
      target?.focus?.();
    } finally { buttons.forEach(b=>b.disabled=false); }
  });
}
function dashboardItem(item,review) {
  const r=item.record;
  const published=item.status==='published';
  const note = `<label class="field">${t('reviewNote')}<input name="note" maxlength="1500"></label>`;
  const mod = (action,label,className='secondary') => `<button name="action" value="${action}" class="button ${className}">${t(label)}</button>`;
  return `<article class="dashboard-row"><div class="pills"><span class="kind">${t(item.status)}</span><span class="muted"><bdi>${esc(item.updatedAt?.slice(0,10))}</bdi></span></div>
   <h3 dir="auto">${published?`<a href="${esc(recordUrl(item.id))}">${esc(r.title)}</a>`:esc(r.title || txt('draft'))}</h3>
   ${item.note?`<p dir="auto"><strong>${t('reviewNote')}</strong> · ${esc(item.note)}</p>`:''}
   ${review?`<p dir="auto">${esc(r.description)}</p><p><bdi>${esc(r.doi || '')}</bdi></p>
      ${r.files?.length?`<ul>${r.files.map(f=>`<li><a href="/api/files/${encodeURIComponent(f.id)}">${esc(f.name)}</a></li>`).join('')}</ul>`:''}
      <form data-moderate="${esc(item.id)}">${note}
      ${published && r.type==='event'?`<label class="field">${t('eventStatus')}<select name="eventStatus">${options(keyOptions(eventStates),r.eventStatus)}</select></label>`:''}
      <output class="form-feedback" role="alert"></output><div class="form-actions">
      ${!published?mod('approve',item.status==='doi_failed'?'retryDoi':'approve','') : mod('withdraw','withdraw')}
      ${!published && item.status!=='registering'?mod('changes','requestChanges')+mod('reject','reject'):''}
      ${published && r.type==='event'?mod('updateEventStatus','updateEventStatus'):''}
      </div></form>`:editable.has(item.status)?link('submit','edit','class="text-link"',{id:item.id}):''}
  </article>`;
}
export async function dashboardPage(page) {
  const review = page==='review';
  const name=txt(review?'review':'account');
  if (!state.session.user) return layout(name,`<p>${t('signedOut')}</p>${signIn()}`);
  if (review && !state.session.user.isModerator) return layout(name,`<p>${t('noAccess')}</p>`);
  let list, problem=false;
  try { ({submissions:list}=await api(review?'submissions?queue=1':'submissions')); }
  catch { problem=true; list=[]; }
  return layout(name,`<div class="form-panel"><p>${t('signedIn')} · <bdi>${esc(state.session.user.name)}</bdi> · <a href="/signout-with-chatgpt?return_to=%2F" target="_top">${t('signOut')}</a></p>
    <div class="form-actions">${link('submit','startSubmission','class="button"')}${!review && state.session.user.isModerator?link('review','review','class="button secondary"'):''}</div>
    <div class="section">${problem?`<p class="empty">${t('serviceUnavailable')}</p>`:list.length?list.map(i=>dashboardItem(i,review)).join(''):`<p class="empty">${t('noSubmissions')}</p>`}</div>
  </div>`);
}
export function bindWorkflow(page) {
  if (page==='submit') bindSubmission();
  if (page!=='review') return;
  document.querySelectorAll('[data-moderate]').forEach(form=>form.addEventListener('submit',async e=>{
    e.preventDefault();
    const action = e.submitter?.value;
    const data = Object.fromEntries(new FormData(form));
    const buttons = form.querySelectorAll('button');
    buttons.forEach(b=>b.disabled=true);
    feedback(form,'');
    try {
      const response = await api('moderate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:form.dataset.moderate,action,...data})});
      if (response.submission.status==='published' || response.submission.status==='withdrawn') {
        const {records,next} = await api('records');
        state.records=records;
        state.next=next;
        state.countryPages.clear();
        state.resolution.delete(response.submission.id);
      }
      await refresh();
      announce(response.submission.status);
    } catch (error) { feedback(form,errors(error)); }
    finally { buttons.forEach(b=>b.disabled=false); }
  }));
}
