const labels = {
  en: { title:'Research and location', subject:'Subject (ANZSRC 2020 FoR)', stream:'Research stream (FoR)',
    keywords:'Keywords', keywordHelp:'Separate keywords with commas.', country:'Country and code',
    chooseSubject:'Choose a subject', chooseStream:'Choose a stream', chooseCountry:'Choose a country',
    dialing:'International dialing code' },
  hi: { title:'शोध और स्थान', subject:'विषय (ANZSRC 2020 FoR)', stream:'शोध की शाखा (FoR)',
    keywords:'कीवर्ड', keywordHelp:'कीवर्ड को कॉमा से अलग करें।', country:'देश और कोड',
    chooseSubject:'विषय चुनें', chooseStream:'शोध की शाखा चुनें', chooseCountry:'देश चुनें',
    dialing:'अंतरराष्ट्रीय डायलिंग कोड' },
};

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
})[char]);
const labelFor = (entry, language) => entry?.translations?.[language] || entry?.label || '';

export function normalizePlannerClassification(value) {
  const code = (field, pattern) => typeof value?.[field] === 'string' && pattern.test(value[field]) ? value[field] : '';
  const subjectCode = code('subjectCode', /^\d{2}$/);
  const streamCode = code('streamCode', /^(?:\d{4}|\d{6})$/);
  const keywords = Array.isArray(value?.keywords) ? value.keywords.filter(item => typeof item === 'string').join(', ') : value?.keywords;
  return {
    subjectCode, streamCode: subjectCode && streamCode.startsWith(subjectCode) ? streamCode : '',
    keywords: typeof keywords === 'string' ? keywords.slice(0, 1200) : '',
    countryCode: code('countryCode', /^[A-Z]{2}$/),
  };
}

function countryLabel(country, language) {
  if (!country) return '';
  try { return new Intl.DisplayNames([language], {type:'region'}).of(country.iso) || country.name; }
  catch { return country.name; }
}

export function plannerClassificationSnapshot(value, { subjects = [], countries = [], language = 'en' } = {}) {
  const input = normalizePlannerClassification(value);
  const subject = subjects.find(item => item.code === input.subjectCode && item.parent === null);
  const stream = subject && subjects.find(item => item.code === input.streamCode);
  const country = countries.find(item => item.iso === input.countryCode);
  const keywords = [...new Map(input.keywords.split(/[,;\n]+/u).map(item => item.trim().slice(0,100))
    .filter(Boolean).map(item => [item.toLowerCase(),item])).values()].slice(0,12);
  return {
    subjectCode: subject?.code || '', streamCode: stream?.code || '',
    subject: labelFor(subject,language), stream: labelFor(stream,language), keywords,
    countryCode: country?.iso || '', country: countryLabel(country,language),
    callingCodes: (country?.callingCodes || []).slice(0,12).map(code => '+' + code),
  };
}

const option = (value, label, selected) => `<option value="${escape(value)}"${value === selected ? ' selected' : ''}>${escape(label)}</option>`;

function streamOptions(subjects, value, language, text) {
  return option('', text.chooseStream, value.streamCode) + subjects
    .filter(item => value.subjectCode && item.parent !== null && item.code.startsWith(value.subjectCode))
    .map(item => option(item.code, `${item.code} ${labelFor(item,language)}`, value.streamCode)).join('');
}

export function classificationContent(language, { subjects = [], countries = [], value } = {}) {
  const text = labels[language] || labels.en;
  const current = normalizePlannerClassification(value);
  const countryOptions = countries.map(country => ({ ...country, label:countryLabel(country,language) }))
    .sort((a,b) => a.label.localeCompare(b.label,language)).map(country => {
      const codes = (country.callingCodes || []).slice(0,3).map(code => '+' + code).join(', ');
      return option(country.iso,[country.iso,country.label,codes].filter(Boolean).join(' · '),current.countryCode);
    }).join('');
  const dialing = plannerClassificationSnapshot(current,{subjects,countries,language}).callingCodes;
  return `<section id="planner-classification" class="planner-section" data-planner-classification aria-labelledby="planner-classification-title">
    <h2 id="planner-classification-title">${text.title}</h2>
    <div class="planner-brief">
      <label class="field">${text.subject}<select name="subjectCode">${option('',text.chooseSubject,current.subjectCode)}${subjects.filter(item=>item.parent === null).map(item=>option(item.code,`${item.code} ${labelFor(item,language)}`,current.subjectCode)).join('')}</select></label>
      <label class="field">${text.stream}<select name="streamCode"${current.subjectCode ? '' : ' disabled'}>${streamOptions(subjects,current,language,text)}</select></label>
      <label class="field">${text.keywords}<input name="keywords" dir="auto" value="${escape(current.keywords)}" maxlength="1200" aria-describedby="planner-keywords-help"><small id="planner-keywords-help">${text.keywordHelp}</small></label>
      <label class="field">${text.country}<select name="countryCode">${option('',text.chooseCountry,current.countryCode)}${countryOptions}</select></label>
    </div>
    <p class="page-description" data-planner-dialing role="status"${dialing.length ? '' : ' hidden'}>${text.dialing} <bdi>${escape(dialing.join(', '))}</bdi></p>
  </section>`;
}

export function bindClassification(root, language, { subjects = [], countries = [], value, onChange } = {}) {
  const section = root.querySelector('[data-planner-classification]');
  if (!section) return;
  const text = labels[language] || labels.en;
  const state = normalizePlannerClassification(value);
  const stream = section.querySelector('[name="streamCode"]');
  const dialing = section.querySelector('[data-planner-dialing]');
  section.addEventListener('input', ({target}) => {
    if (!Object.hasOwn(state,target.name)) return;
    state[target.name] = target.value;
    if (target.name === 'subjectCode') {
      state.streamCode = '';
      stream.innerHTML = streamOptions(subjects,state,language,text);
      stream.disabled = !state.subjectCode;
    }
    if (target.name === 'countryCode') {
      const codes = plannerClassificationSnapshot(state,{subjects,countries,language}).callingCodes;
      dialing.querySelector('bdi').textContent = codes.join(', ');
      dialing.hidden = !codes.length;
    }
    onChange?.(normalizePlannerClassification(state));
  });
}
