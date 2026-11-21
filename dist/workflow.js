import {
  activeRecords, announce, api, countryCodes, countryName, esc, go, icon, lang, languageOptions, layout,
  link, normalize, options, recordUrl, refresh, showPreview, signIn, sortedCountries, state, subjectLabel,
  subjectMatches, t, txt, types, url
} from './app.js';

const editable = new Set(['draft','changes_requested']);
const fields = new Map([
  ['eventType','eventForm'],['materialType','materialsForm'],['thesisType','thesisForm'],['language','languageTag'],
  ['subjectCodes','primarySubject'],['attachmentIds','attachments'],['note','reviewNote'],['mode','format'],['countryCode','country']
]);
const eventStates = ['scheduled','held','postponed','cancelled'];
const uploadErrors = new Set(['file_too_large','unsupported_file','invalid_upload']);
let draft;
let pendingFiles = 0;
const editing = (params) => (params.get('id') || params.get('type') || '');
const keyOptions = (names) => names.map(key=>[key,txt(key)]);
const val = (record,name) => Array.isArray(record[name]) ? record[name].join(', ') : record[name] ?? '';
const typeHeading = (type) => ({event:'eventForm',material:'materialsForm',thesis:'thesisForm'})[type];

function field(record,name,{label=name,kind='text',required=false,wide=false,help,choices,placeholder, list}={}) {
  const value = val(record,name);
  const common = `name="${name}" id="field-${name}"${required ? ' required' : ''}${help ? ` aria-describedby="help-${name}"` : ''}`;
  let html;
  if (choices) html=`<select ${common}>${options([['',txt('choose')],...choices],String(value))}</select>`;
  else if (kind==='textarea') html=`<textarea ${common} maxlength="8000" dir="auto">${esc(value)}</textarea>`;
  else html=`<input type="${kind}" ${common} value="${esc(value)}"${list ? ` list="${list}"` : ''}${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${kind==='number' ? ' min="1000" max="2999"' : ''} dir="auto">`;
  return `<label class="field${wide?' full':''}" for="field-${name}"><span>${t(label)}${required?' *':''}</span>${html}${help ? `<small id="help-${name}">${t(help)}</small>` : ''}</label>`;
}
function section(key,content) {
  return `<fieldset class="form-section"><legend>${t(key)}</legend><div class="form-grid">${content}</div></fieldset>`;
}
function links(type,record) {
  if (type==='event') return field(record,'sourceUrl',{kind:'url'}) + field(record,'registrationUrl',{kind:'url'})
    + field(record,'programmeUrl',{kind:'url'}) + field(record,'verificationNotes',{kind:'textarea',wide:true});
  return field(record,'sourceUrl',{kind:'url',wide:true}) + field(record,'license',{required:true}) + field(record,'rightsHolder')
    + field(record,'access',{choices:keyOptions(['open','embargoed','external']),required:true}) + field(record,'embargoUntil',{kind:'date'});
}
function metadataFields(type,record) {
  return field(record,'title',{required:true,wide:true}) + field(record,'description',{kind:'textarea',required:true,wide:true})
    + field(record,'keywords',{wide:true})
    + field(record,'language',{label:type==='event'?'eventLanguage':'documentLanguage',required:true,list:'language-codes',placeholder:'en'})
    + field(record,'metadataLanguage',{label:'originalLanguage',list:'language-codes',placeholder:'en'})
    + `<datalist id="language-codes">${languageOptions.map(([code,name])=>`<option value="${esc(code)}">${esc(name)}</option>`).join('')}</datalist>`;
}
function countryField(r, required) {
  const rows = sortedCountries().map(country=>[country.iso,[countryName(country),countryCodes(country)].filter(Boolean).join(' · ')]);
  const code=r.countryCode || state.countries.find(c=>normalize(c.name)===normalize(r.country))?.iso;
  return field({...r,countryCode:code},'countryCode',{label:'country',choices:rows,required});
}
const associated = (value) => {
  const raw = String(value || '').trim();
  try { return new URL(raw,location.origin).searchParams.get('record') || raw; } catch { return raw; }
};
function typeFields(type,r) {
  if (type==='event') return field(r,'eventType',{label:'eventForm',required:true,choices:keyOptions(types.event)})
    + field(r,'eventStatus',{choices:keyOptions(eventStates),required:true})
    + field(r,'institution',{required:true}) + field(r,'mode',{label:'format',choices:keyOptions(['online','inPerson','hybrid']),required:true})
    + field(r,'startDate',{kind:'date',required:true}) + field(r,'endDate',{kind:'date',required:true})
    + field(r,'startTime',{kind:'time'}) + field(r,'endTime',{kind:'time'})
    + field(r,'timezone',{placeholder:'Asia/Kolkata'}) + field(r,'languages',{label:'eventExtraLanguages',placeholder:'hi, en'})
    + field(r,'city') + countryField(r,false) + field(r,'venue',{wide:true})
    + field(r,'deadline',{kind:'date'}) + field(r,'paperDeadline',{kind:'date'}) + field(r,'registrationDeadline',{kind:'date'})
    + field(r,'attendanceFee') + field(r,'publicContact') + field(r,'contributorRole')
    + field(r,'speakers',{kind:'textarea',wide:true}) + field(r,'programme',{kind:'textarea',wide:true});
  const shared = field(r,'authors',{required:true,wide:true}) + field(r,'contributorRole')
    + field(r,'institution',{required:type==='thesis'}) + countryField(r,type==='thesis')
    + field(r,'year',{kind:'number',required:type==='thesis'}) + field(r,'releaseDate',{kind:'date'});
  if (type==='material') {
    const events = activeRecords().filter(r=>r.type==='event'&&!r.example&&!r.directory);
    return field(r,'materialType',{label:'recordType',choices:keyOptions(types.material),required:true,wide:true})
      + field(r,'relatedId',{help:'relatedHelp',wide:true,list:'event-records'})
      + `<datalist id="event-records">${events.map(event=>`<option value="${esc(event.id)}">${esc(event.title)}</option>`).join('')}</datalist>`
      + field(r,'relatedEventTitle',{wide:true}) + shared + field(r,'publisher');
  }
  return field(r,'thesisType',{label:'recordType',choices:keyOptions(types.thesis),required:true,wide:true}) + field(r,'degree',{required:true})
    + shared + field(r,'department') + field(r,'supervisors') + field(r,'academicStatus');
}
function selectedSubjects(codes) {
  return (codes || []).map(code=>{
    const item = state.index.get(code);
    return `<button type="button" class="tag" data-drop-subject="${esc(code)}" title="${t('remove')}"><bdi>${esc(code)}</bdi> ${esc(subjectLabel(item))} ×</button>`;
  }).join('');
}
function subjectPicker(r) {
  return `<div class="full subject-picker">
    <label for="subject-picker-input" class="field"><span>${t('primarySubject')} * · ${t('additionalSubjects')}</span>
    <input type="search" id="subject-picker-input" placeholder="${t('subjectSearch')}" autocomplete="off"></label>
    <div id="picked-subjects" class="pills">${selectedSubjects(r.subjectCodes)}</div>
    <div id="subject-options" class="subject-options"></div>
  </div>`;
}
function translationRows(metadata={}) {
  return Object.entries(metadata).map(([code,m],i)=>`<fieldset class="form-section full" data-translation>
    <legend>${t('translations')} ${i+1}</legend>
    <div class="form-grid">
      <label class="field">${t('metadataLanguage')}<input data-meta="lang" list="language-codes" value="${esc(code)}" placeholder="fr" required></label>
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
  return `<div class="full"><label class="field">${t('upload')}<input id="attachment" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.mp3,.mp4,.txt" multiple${!state.session.user || !state.session.files?' disabled':''}><small>${t(label)} ${state.session.files?t('smallFile'):''}</small></label>
    <ul id="attachment-list">${fileRows(r.files || [])}</ul></div>`;
}
function choices(params) {
  const entries = params.get('research') ? ['material','thesis'] : ['event','material','thesis'];
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
  return layout(txt(typeHeading(r.type)),`<div class="form-panel">
    ${!state.session.user ? `<p>${t('signedOut')}</p>${signIn()}` : !canWrite ? `<p class="empty">${t('serviceUnavailable')}</p>` : ''}
    ${note ? `<div class="notice"><span>${t('reviewNote')} · <bdi>${esc(note)}</bdi></span></div>` : ''}
    <form id="submission-form" novalidate>
    ${section('original',metadataFields(r.type,r))}
    ${section(typeHeading(r.type),typeFields(r.type,r))}
    ${section('classification',subjectPicker(r))}
    ${section('translations',`<div class="full" id="translation-list">${translationRows(r.metadata)}</div><div class="full"><button class="button secondary" type="button" data-add-translation>${icon('plus',15)}${t('addTranslation')}</button></div>`)}
    ${section('files',filePicker(r)+links(r.type,r))}
    ${section('doi',`<p class="full">${t('doiPolicy')}</p>${field(r,'doi')}${r.type!=='event'?field(r,'translationOf'):''}
    <label class="full"><input name="authority" type="checkbox"${r.authority?' checked':''} required> ${t('authority')} *</label>`)}
    <output class="form-feedback" id="submission-feedback" role="alert"></output>
    <div class="form-actions"><button class="button secondary" name="action" value="draft"${canWrite?'':' disabled'}>${t('saveDraft')}</button>
      <button class="button secondary" type="button" data-preview>${t('preview')}</button>
      <button class="button" name="action" value="submit"${canWrite?'':' disabled'}>${t('sendForReview')}</button>
    </div></form></div>`);
}
function collect(form) {
  const {record:previous} = draft;
  const data = Object.fromEntries(new FormData(form));
  delete data.action;
  data.authority = form.elements.namedItem('authority').checked;
  data.country = state.countryIndex.get(data.countryCode)?.name || '';
  data.languages = (data.languages || '').split(/[,\n;]+/).map(value=>value.trim()).filter(Boolean);
  data.relatedId = associated(data.relatedId);
  data.translationOf = associated(data.translationOf);
  const entries = [...form.querySelectorAll('[data-translation]')].map(row=>{
    const parts = Object.fromEntries([...row.querySelectorAll('[data-meta]')].map(input=>[input.dataset.meta,input.value.trim()]));
    const {lang,...metadata} = parts;
    return [lang,metadata];
  });
  return {...previous,...data,metadata:Object.fromEntries(entries.filter(([code])=>code))};
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
function bindSubmission() {
  const form = document.getElementById('submission-form');
  if (!form || !draft) return;
  const pick = form.querySelector('#subject-picker-input');
  const picked = form.querySelector('#picked-subjects');
  const candidates = form.querySelector('#subject-options');
  const uploads = form.querySelector('#attachment');
  const attachments = form.querySelector('#attachment-list');
  function reselect() { picked.innerHTML=selectedSubjects(draft.record.subjectCodes); }
  form.addEventListener('input', ()=>{ draft.record=collect(form); });
  pick.addEventListener('input', ()=>{
    const word=normalize(pick.value.trim());
    candidates.innerHTML = word ? state.subjects.filter(s=>subjectMatches(s,word) && !draft.record.subjectCodes.includes(s.code)).slice(0,18)
      .map(s=>`<button type="button" data-pick-subject="${s.code}"><bdi class="code">${s.code}</bdi> ${esc(subjectLabel(s))}</button>`).join('') : '';
  });
  form.addEventListener('click',(e)=>{
    const button=e.target.closest('button');
    if (!button) return;
    if (button.dataset.pickSubject) {
      if (draft.record.subjectCodes.length<8) draft.record.subjectCodes.push(button.dataset.pickSubject);
      reselect(); pick.value=''; candidates.innerHTML=''; pick.focus();
    }
    if (button.dataset.dropSubject) {
      draft.record.subjectCodes=draft.record.subjectCodes.filter(code=>code!==button.dataset.dropSubject); reselect(); pick.focus();
    }
    if (button.hasAttribute('data-add-translation')) {
      const next = Object.keys(Object.fromEntries(languageOptions)).find(code=>!Object.hasOwn(draft.record.metadata,code) && code!==(draft.record.metadataLanguage || draft.record.language)) || '';
      const list = form.querySelector('#translation-list');
      list.insertAdjacentHTML('beforeend',translationRows({[next]:{}}));
      draft.record=collect(form);
      list.lastElementChild.querySelector('input').focus();
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
      draft.record=collect(form); showPreview(draft.record);
    }
  });
  uploads.addEventListener('change',async ()=>{
    const queue = [...uploads.files];
    if (!queue.length) return;
    const original = draft;
    uploads.disabled=true;
    pendingFiles++;
    feedback(form,'');
    for (const file of queue) {
      if (original.record.files.length>=10 || file.size>20*1024*1024) { feedback(form,txt('smallFile')); break; }
      const body = new FormData();
      body.set('file',file);
      try {
        const result=await api('uploads',{method:'POST',body});
        original.record.files.push(result);
        original.record.attachmentIds=original.record.files.map(f=>f.id);
        attachments.innerHTML=fileRows(original.record.files);
      } catch(error) { feedback(form,errors(error)); }
    }
    pendingFiles--;
    uploads.disabled=false;
    uploads.value='';
  });
  form.addEventListener('submit',async (e)=>{
    e.preventDefault();
    if (!state.session.user || !state.session.persistent || pendingFiles) return;
    draft.record=collect(form);
    const action=e.submitter?.value || 'draft';
    if (action==='submit' && (!form.checkValidity() || !draft.record.subjectCodes.length)) {
      feedback(form,txt('required'));
      (form.querySelector(':invalid') || pick).focus();
      return;
    }
    const buttons = form.querySelectorAll('button[name=action]');
    buttons.forEach(b=>b.disabled=true);
    feedback(form,'');
    try {
      const {submission} = await api('submissions',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:draft.id,revision:draft.revision,action,record:draft.record})});
      const key = action==='submit' ? 'sent' : 'saved';
      if (action==='submit') draft=undefined;
      else draft = {key:submission.id,id:submission.id,revision:submission.revision,record:submission.record,status:submission.status,note:submission.note};
      await go(url(action==='submit'?'account':'submit',action==='submit'?{}:{id:submission.id}));
      announce(key);
      const page = document.querySelector('.page h1');
      page?.insertAdjacentHTML('afterend',`<p class="notice" role="status">${t(key)}</p>`);
    } catch (error) {
      feedback(form,errors(error));
      const field = error.field==='subjectCodes' ? pick : form.elements.namedItem(error.field);
      field?.focus?.();
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
