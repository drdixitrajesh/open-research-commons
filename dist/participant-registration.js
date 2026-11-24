const eventTypes = new Set(['seminar', 'symposium', 'workshop', 'webinar', 'conference', 'other']);
const attendanceModes = ['inPerson', 'online'];
const copy = Object.fromEntries(`
loading|Loading event registration…|आयोजन पंजीकरण लोड हो रहा है…
invalidLink|This registration link is unavailable.|यह पंजीकरण लिंक उपलब्ध नहीं है।
missing|This registration form could not be found. Check the link from the organizer.|यह पंजीकरण फ़ॉर्म नहीं मिला। आयोजक द्वारा दिया गया लिंक जाँचें।
loadError|The registration form could not load. Try again.|पंजीकरण फ़ॉर्म लोड नहीं हुआ। फिर कोशिश करें।
retry|Try again|फिर कोशिश करें
closedTitle|Registration is closed|पंजीकरण बंद है
closed|The organizer is not accepting registrations for this event.|आयोजक इस आयोजन के लिए पंजीकरण स्वीकार नहीं कर रहे हैं।
intro|Your response goes to the event organizer. You can register without signing in.|आपका जवाब आयोजन के आयोजक को जाएगा। आप बिना साइन इन किए पंजीकरण कर सकते हैं।
name|Full name|पूरा नाम
email|Email address|ईमेल पता
organization|Organization (optional)|संस्था (वैकल्पिक)
country|Country (optional)|देश (वैकल्पिक)
chooseCountry|Select a country|देश चुनें
mode|How will you attend? (optional)|आप कैसे भाग लेंगे? (वैकल्पिक)
modeRequired|How will you attend?|आप कैसे भाग लेंगे?
chooseMode|Select how you’ll attend|भागीदारी का तरीका चुनें
register|Submit registration|पंजीकरण भेजें
submitting|Sending registration…|पंजीकरण भेजा जा रहा है…
receivedTitle|Registration received|पंजीकरण मिल गया
received|Your response is on file with the organizer. Earlier registrations using the same email stay on file.|आपका जवाब आयोजक के पास दर्ज है। इस ईमेल से पहले भेजे गए पंजीकरण भी दर्ज रहते हैं।
nameRequired|Enter your full name.|अपना पूरा नाम दर्ज करें।
emailInvalid|Enter a valid email address.|सही ईमेल पता दर्ज करें।
chooseModeError|Choose how you will attend.|भागीदारी का तरीका चुनें।
fieldError|Check the details you entered and try again.|दर्ज किए गए विवरण जाँचें और फिर कोशिश करें।
busyError|Too many attempts. Wait a moment before trying again.|बहुत अधिक कोशिशें हुई हैं। थोड़ा रुककर फिर कोशिश करें।
submitError|Your registration could not be sent. Your details are still here so you can try again.|आपका पंजीकरण भेजा नहीं जा सका। फिर कोशिश करने के लिए आपके विवरण यहीं हैं।
seminar|Seminar|सेमिनार
symposium|Symposium|संगोष्ठी
workshop|Workshop|कार्यशाला
webinar|Webinar|वेबिनार
conference|Conference|सम्मेलन
other|Event|आयोजन
inPerson|In person|प्रत्यक्ष
online|Online|ऑनलाइन
hybrid|Hybrid|हाइब्रिड
`.trim().split('\n').map(line => {
  const [key, en, hi] = line.split('|');
  return [key, { en, hi }];
}));

const languageOf = language => language === 'hi' ? 'hi' : 'en';
const labels = locale => key => copy[key]?.[locale] ?? '';
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function countriesMarkup(countries, locale) {
  if (!countries.length) return '';
  const regions = typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames([locale === 'hi' ? 'hi-IN' : 'en'], { type: 'region' }) : null;
  return countries.filter(({ iso }) => /^[A-Z]{2}$/.test(iso)).map(({ iso, name }) => {
    const label = regions?.of(iso) || name || iso;
    return { iso, label };
  }).sort((left, right) => left.label.localeCompare(right.label, locale)).map(({ iso, label }) =>
    `<option value="${iso}">${escape(label)} · ${iso}</option>`).join('');
}

function eventHeader(form, t) {
  const info = [eventTypes.has(form.type) && t(form.type), t(form.mode)].filter(Boolean);
  return `<h2 class="participant-registration-event" dir="auto">${escape(form.title)}</h2>
    ${info.length ? `<p class="page-description participant-registration-meta">${info.join(' · ')}</p>` : ''}`;
}

function attendanceField(mode, t) {
  if (attendanceModes.includes(mode)) return `<input type="hidden" name="mode" value="${mode}">`;
  const required = mode === 'hybrid';
  return `<label class="field">${t(required ? 'modeRequired' : 'mode')}
    <select name="mode"${required ? ' required' : ''}>
      <option value="">${t('chooseMode')}</option>
      ${attendanceModes.map(value => `<option value="${value}">${t(value)}</option>`).join('')}
    </select></label>`;
}

function registrationForm(form, countries, locale, t) {
  const options = countriesMarkup(countries, locale);
  return `${eventHeader(form, t)}
    <p class="page-description" id="participant-registration-intro">${t('intro')}</p>
    <form data-participant-form aria-describedby="participant-registration-intro" novalidate>
      <div class="form-grid">
        <label class="field">${t('name')}<input type="text" name="name" autocomplete="name" dir="auto" maxlength="160" required></label>
        <label class="field">${t('email')}<input type="email" name="email" autocomplete="email" maxlength="254" required></label>
        <label class="field">${t('organization')}<input type="text" name="organization" autocomplete="organization" dir="auto" maxlength="240"></label>
        ${options ? `<label class="field">${t('country')}
          <select name="country" autocomplete="country"><option value="">${t('chooseCountry')}</option>${options}</select></label>` : ''}
        ${attendanceField(form.mode, t)}
        <div hidden aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      </div>
      <div class="participant-registration-actions">
        <button class="button" type="submit">${t('register')}</button>
        <p id="participant-registration-error" data-participant-error role="alert" hidden></p>
      </div>
    </form>`;
}

export function participantRegistrationContent(language, options = {}) {
  const locale = languageOf(language);
  const t = labels(locale);
  const status = options.id === '' ? 'invalidLink' : 'loading';
  return `<section class="participant-registration" data-participant-registration lang="${locale}">
    <p class="page-description" role="status">${t(status)}</p>
  </section>`;
}

export function bindParticipantRegistration(root, language, { id, loadForm, submitRegistration, countries = [] } = {}) {
  const panel = root?.matches?.('[data-participant-registration]') ? root : root?.querySelector?.('[data-participant-registration]');
  if (!panel || panel.dataset.bound) return;
  panel.dataset.bound = 'true';
  const locale = languageOf(language);
  const t = labels(locale);

  function showState(title, message, form) {
    panel.innerHTML = `<section class="participant-registration-status">
      <h2 tabindex="-1">${t(title)}</h2>
      ${form?.title ? `<p class="participant-registration-status-event" dir="auto">${escape(form.title)}</p>` : ''}
      <p class="page-description">${t(message)}</p>
    </section>`;
    panel.querySelector('h2').focus();
  }

  function showForm(form) {
    panel.innerHTML = registrationForm(form, countries, locale, t);
    const element = panel.querySelector('[data-participant-form]');
    const submit = element.querySelector('button[type="submit"]');
    const feedback = element.querySelector('[data-participant-error]');
    let busy = false;

    function clearError() {
      feedback.hidden = true;
      for (const field of element.querySelectorAll('[aria-invalid]')) {
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
      }
    }

    function showError(key, field) {
      clearError();
      feedback.textContent = t(key);
      feedback.hidden = false;
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', feedback.id);
      }
      (field || submit).focus();
    }

    element.addEventListener('input', clearError);
    element.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      clearError();
      const value = key => element.elements.namedItem(key)?.value.trim() || '';
      const data = {
        name: value('name'), email: value('email'), organization: value('organization'),
        country: value('country'), mode: value('mode'), website: value('website'),
      };
      if (!data.name) return showError('nameRequired', element.elements.namedItem('name'));
      const email = element.elements.namedItem('email');
      if (!email.validity.valid) return showError('emailInvalid', email);
      if (form.mode === 'hybrid' && !data.mode) return showError('chooseModeError', element.elements.namedItem('mode'));

      busy = true;
      submit.disabled = true;
      submit.textContent = t('submitting');
      element.setAttribute('aria-busy', 'true');
      try {
        await submitRegistration(id, data);
        if (panel.isConnected) showState('receivedTitle', 'received', form);
      } catch (error) {
        if (!panel.isConnected) return;
        submit.disabled = false;
        if (error.status === 409 || error.code === 'registration_closed') showState('closedTitle', 'closed', form);
        else if (error.status === 404) showState('invalidLink', 'missing');
        else if (error.status === 429) showError('busyError');
        else if (error.status === 422 || error.status === 400) {
          const field = ['name', 'email', 'organization', 'country', 'mode'].includes(error.field)
            ? element.elements.namedItem(error.field) : null;
          showError('fieldError', field?.type === 'hidden' ? null : field);
        } else showError('submitError');
      } finally {
        busy = false;
        submit.disabled = false;
        submit.textContent = t('register');
        element.removeAttribute('aria-busy');
      }
    });
  }

  async function load() {
    if (!id) {
      showState('invalidLink', 'missing');
      return;
    }
    panel.innerHTML = `<p class="page-description" role="status">${t('loading')}</p>`;
    try {
      const { form } = await loadForm(id);
      if (!panel.isConnected) return;
      if (!form?.title) showState('invalidLink', 'missing');
      else if (form.open !== true) showState('closedTitle', 'closed', form);
      else showForm(form);
    } catch (error) {
      if (!panel.isConnected) return;
      if (error.status === 404) {
        showState('invalidLink', 'missing');
      } else {
        panel.innerHTML = `<p class="page-description" role="alert">${t('loadError')}</p>
          <button type="button" class="button secondary">${t('retry')}</button>`;
        const retry = panel.querySelector('button');
        retry.addEventListener('click', load, { once: true });
        retry.focus();
      }
    }
  }

  load();
}
